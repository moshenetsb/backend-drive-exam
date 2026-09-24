import "temporal-polyfill/full/global";
import "dotenv/config";
import * as fs from "fs";
import * as fsp from "fs/promises";
import * as path from "path";
import { Readable, Transform } from "stream";
import { pipeline } from "stream/promises";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import * as XLSX from "xlsx";
import extract from "extract-zip";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";
import cliProgress from "cli-progress";
import { db } from "../src/prisma/db";
import { Answer, Category, Level } from "../src/questions/enums/questions.enum";

ffmpeg.setFfmpegPath(ffmpegPath.path);

const CATALOG_URL = process.env.CATALOG_URL;
const MEDIA_ZIP_URL = process.env.MEDIA_ZIP_URL;

const DOWNLOAD_IMPORT_FILES =
  process.env.DOWNLOAD_IMPORT_FILES?.toLowerCase() !== "false" &&
  process.env.DOWNLOAD_IMPORT_FILES !== "0";

if (DOWNLOAD_IMPORT_FILES && (!CATALOG_URL || !MEDIA_ZIP_URL)) {
  throw new Error("Missing CATALOG_URL or MEDIA_ZIP_URL in .env");
}

const WORK_DIR = path.join(process.cwd(), "tmp-import");
const MEDIA_OUTPUT_DIR = path.join(process.cwd(), "media");

const LEVEL_MAP: Record<string, Level> = {
  PODSTAWOWY: Level.PODSTAWOWY,
  SPECJALISTYCZNY: Level.SPECJALISTYCZNY,
  SPECAJLISTYCZNY: Level.SPECJALISTYCZNY,
};

const VIDEO_EXTENSIONS = new Set([".wmv", ".mp4", ".avi", ".mov"]);
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);

interface CatalogRow {
  "Numer pytania": number;
  Pytanie: string;
  "Odpowiedź A": string;
  "Odpowiedź B": string;
  "Odpowiedź C": string;
  "Poprawna odp": string;
  Media: string;
  "Zakres struktury": string;
  "Liczba punktów": number;
  Kategorie: string;
}

function normalizeLevel(raw: string): Level {
  const level = LEVEL_MAP[raw.trim().toUpperCase()];
  if (!level) {
    throw new Error(`Unknown level: "${raw}"`);
  }
  return level;
}

async function downloadFile(url: string, destination: string): Promise<void> {
  const response = await fetch(url);

  if (!response.ok || !response.body) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }

  const total = Number(response.headers.get("content-length"));

  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar.start(total, 0);

  let downloaded = 0;

  const progress = new Transform({
    transform(chunk: Buffer, encoding, callback) {
      downloaded += chunk.length;
      bar.update(downloaded);
      callback(null, chunk);
    },
  });

  const webStream = response.body as unknown as NodeReadableStream<Uint8Array>;

  await pipeline(
    Readable.fromWeb(webStream),
    progress,
    fs.createWriteStream(destination),
  );

  bar.stop();
}

async function buildMediaIndex(mediaDir: string): Promise<Map<string, string>> {
  const index = new Map<string, string>();

  const walk = async (dir: string): Promise<void> => {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        index.set(entry.name.toLowerCase(), fullPath);
      }
    }
  };

  await walk(mediaDir);
  return index;
}

async function processMedia(
  filename: string,
  mediaIndex: Map<string, string>,
  questionUuid: string,
): Promise<string | null> {
  const sourcePath = mediaIndex.get(filename.toLowerCase());
  if (!sourcePath) {
    console.warn(`Media file not found: ${filename}`);
    return null;
  }

  const ext = path.extname(filename).toLowerCase();
  const outputDir = path.join(MEDIA_OUTPUT_DIR, questionUuid);
  await fsp.mkdir(outputDir, { recursive: true });

  if (IMAGE_EXTENSIONS.has(ext)) {
    const destPath = path.join(outputDir, `image${ext}`);
    await fsp.copyFile(sourcePath, destPath);
    return `/media/${questionUuid}/image${ext}`;
  }

  if (VIDEO_EXTENSIONS.has(ext)) {
    const manifestPath = path.join(outputDir, "playlist.m3u8");
    await new Promise<void>((resolve, reject) => {
      ffmpeg(sourcePath)
        .videoCodec("libx264")
        .audioCodec("aac")
        .outputOptions(["-movflags +faststart", "-pix_fmt yuv420p"])
        .output(manifestPath)
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(err))
        .run();
    });
    return `/media/${questionUuid}/playlist.m3u8`;
  }

  console.warn(`Unknown media file extension: ${filename}`);
  return null;
}

async function main(): Promise<void> {
  await fsp.mkdir(WORK_DIR, { recursive: true });

  const catalogPath = path.join(WORK_DIR, "catalog.xlsx");
  const zipPath = path.join(WORK_DIR, "media.zip");
  const mediaExtractDir = path.join(WORK_DIR, "media-extracted");

  if (DOWNLOAD_IMPORT_FILES) {
    console.log("Downloading question catalog...");
    await downloadFile(CATALOG_URL!, catalogPath);

    console.log("Downloading media archive...");
    await downloadFile(MEDIA_ZIP_URL!, zipPath);

    console.log("Extracting archive...");
    await extract(zipPath, { dir: mediaExtractDir });
  } else {
    console.log(
      "DOWNLOAD_IMPORT_FILES=false. Skipping download and extraction, using existing files in WORK_DIR.",
    );

    if (!fs.existsSync(catalogPath)) {
      throw new Error(`Catalog file missing at ${catalogPath}`);
    }
    if (!fs.existsSync(mediaExtractDir)) {
      throw new Error(
        `Extracted media directory missing at ${mediaExtractDir}`,
      );
    }
  }

  const mediaIndex = await buildMediaIndex(mediaExtractDir);

  console.log("Parsing spreadsheet...");
  const workbook = XLSX.readFile(catalogPath);
  const sheet = workbook.Sheets["katalog"];
  const rows = XLSX.utils.sheet_to_json<CatalogRow>(sheet, { defval: "" });

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const nr = Number(row["Numer pytania"]);
    if (!nr) {
      skipped++;
      continue;
    }

    const existing = await db.orm.public.Question.where({ nr }).first();
    if (existing) {
      skipped++;
      continue;
    }

    try {
      await db.transaction(async (tx) => {
        const level = normalizeLevel(row["Zakres struktury"]);
        const points = Number(row["Liczba punktów"]);
        const correctAnswer = row["Poprawna odp"].trim() as Answer;

        const question = await tx.orm.public.Question.create({
          nr,
          content: row.Pytanie.trim(),
          answerA: row["Odpowiedź A"] || null,
          answerB: row["Odpowiedź B"] || null,
          answerC: row["Odpowiedź C"] || null,
          correctAnswer,
          level,
          points,
          media: null,
        });

        const mediaFilename = row.Media.trim();
        if (mediaFilename) {
          const mediaUrl = await processMedia(
            mediaFilename,
            mediaIndex,
            question.uuid,
          );
          if (mediaUrl) {
            await tx.orm.public.Question.where({ uuid: question.uuid }).update({
              media: mediaUrl,
            });
          }
        }

        const categories = row.Kategorie.split(",")
          .map((c) => c.trim())
          .filter(Boolean) as Category[];

        if (categories.length) {
          await tx.orm.public.CategoryAssignment.createAll(
            categories.map((category) => ({
              questionUuid: question.uuid,
              category,
            })),
          );
        }
      });

      imported++;
      if (imported % 100 === 0) {
        console.log(`Imported ${imported} questions so far...`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error at question no. ${nr}: ${message}`);
      skipped++;
    }
  }

  console.log(`Done. Imported: ${imported}, skipped: ${skipped}`);

  if (DOWNLOAD_IMPORT_FILES) {
    await fsp.rm(WORK_DIR, { recursive: true, force: true });
  }

  await db.close();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
