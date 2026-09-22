import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { pipeline } from 'stream/promises';
import * as XLSX from 'xlsx';
import extract from 'extract-zip';
import ffmpeg from 'fluent-ffmpeg';
import { db } from '../prisma/db';
import { Answer, Category, Level } from '../questions/questions.enums';

const MEDIA_ZIP_URL = 'https://www.gov.pl/pliki/mi/multimedia_do_pytan.zip';
const CATALOG_URL = 'https://www.gov.pl/attachment/a5c6c329-28a5-4274-a1a8-e2813f0a51bd';

const WORK_DIR = path.join(process.cwd(), 'tmp-import');
const MEDIA_OUTPUT_DIR = path.join(process.cwd(), 'media');

const LEVEL_MAP: Record<string, Level> = {
  PODSTAWOWY: Level.PODSTAWOWY,
  SPECJALISTYCZNY: Level.SPECJALISTYCZNY,
  SPECAJLISTYCZNY: Level.SPECJALISTYCZNY,
}; 

const VIDEO_EXTENSIONS = new Set(['.wmv', '.mp4', '.avi', '.mov']);
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png']);

@Injectable()
export class ImportService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ImportService.name);

  onApplicationBootstrap() {
    if (process.env.RUN_IMPORT_ON_STARTUP !== 'true') {
      return;
    }

    this.runIfNeeded().catch((error) => {
      this.logger.error('Questions import was not performed.', error);
    });
  }

  private async runIfNeeded() {
    this.logger.log('Starting questions import...');
    await this.importQuestions();
    this.logger.log('Questions import has been completed.');
  }

  private async importQuestions() {
    await fsp.mkdir(WORK_DIR, { recursive: true });

    const shouldDownload = process.env.DOWNLOAD_IMPORT_FILES === 'true';
    const shouldImportMedia = process.env.IMPORT_MEDIA === 'true';

    const zipPath = path.join(WORK_DIR, 'media.zip');
    const mediaExtractDir = path.join(WORK_DIR, 'media-extracted');

    if (shouldDownload && shouldImportMedia) {
      this.logger.log('Downloading archives with media...');
      await this.downloadFile(MEDIA_ZIP_URL, zipPath);

      this.logger.log('Unpacking archive...');
      await extract(zipPath, { dir: mediaExtractDir });
    }

    const mediaIndex = shouldImportMedia
      ? await this.buildMediaIndex(mediaExtractDir)
      : new Map<string, string>();

    const catalogPath = path.join(WORK_DIR, 'catalog.xlsx');
    if (shouldDownload) {
      this.logger.log('Downloading worksheet with questions...');
      await this.downloadFile(CATALOG_URL, catalogPath);
    }

    this.logger.log('Parsing questions...');
    const workbook = XLSX.readFile(catalogPath);
    const sheet = workbook.Sheets['katalog'];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    delete workbook.Sheets['katalog'];

    let imported = 0;
    let skipped = 0;

    for (const row of rows) {
      const nr = Number(row['Numer pytania']);
      if (!nr) {
        skipped++;
        continue;
      }

      try {
        const level = this.normalizeLevel(row['Zakres struktury']);
        const points = Number(row['Liczba punktów']);
        const correctAnswer = String(row['Poprawna odp']).trim() as Answer;

        const question = await db.orm.public.Question.create({
          nr,
          content: String(row['Pytanie']).trim(),
          answerA: row['Odpowiedź A'] || null,
          answerB: row['Odpowiedź B'] || null,
          answerC: row['Odpowiedź C'] || null,
          correctAnswer,
          level,
          points,
          media: null,
        });

        const mediaFilename = String(row['Media'] || '').trim();
        if (shouldImportMedia && mediaFilename) {
          const mediaUrl = await this.processMedia(mediaFilename, mediaIndex, question.uuid);
          if (mediaUrl) {
            await db.orm.public.Question.where({ uuid: question.uuid }).update({ media: mediaUrl });
          }
        }

        const categoriesRaw = String(row['Kategorie'] || '').trim();
        const categories = categoriesRaw
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean) as Category[];

        if (categories.length) {
          await db.orm.public.CategoryAssignment.createAll(
            categories.map((category) => ({ questionUuid: question.uuid, category })),
          );
        }

        imported++;
        if (imported % 100 === 0) {
          this.logger.log(`Zaimportowano ${imported} pytań...`);
        }
      } catch (error) {
        this.logger.error(`Błąd przy pytaniu nr ${nr}`, error);
        skipped++;
      }
    }

    this.logger.log(`Done. Imported: ${imported}, skipped: ${skipped}`);

    if (shouldDownload) {
      await fsp.rm(WORK_DIR, { recursive: true, force: true });
    }
  }

  private normalizeLevel(raw: string): Level {
    const level = LEVEL_MAP[raw.trim().toUpperCase()];
    if (!level) throw new Error(`Unknown level: "${raw}"`);
    return level;
  }

  private async downloadFile(url: string, destination: string) {
    const response = await fetch(url);
    if (!response.ok || !response.body) {
      throw new Error(`Nie udało się pobrać ${url}: ${response.status}`);
    }
    await pipeline(response.body as any, fs.createWriteStream(destination));
  }

  private async buildMediaIndex(mediaDir: string): Promise<Map<string, string>> {
    const index = new Map<string, string>();

    const walk = async (dir: string) => {
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

  private async processMedia(
    filename: string,
    mediaIndex: Map<string, string>,
    questionUuid: string,
  ): Promise<string | null> {
    const sourcePath = mediaIndex.get(filename.toLowerCase());
    if (!sourcePath) {
      this.logger.warn(`Media file not found: ${filename}`);
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
      const destPath = path.join(outputDir, 'video.mp4');

      if (ext === '.mp4') {
        await fsp.copyFile(sourcePath, destPath);
        return `/media/${questionUuid}/video.mp4`;
      }

      await new Promise<void>((resolve, reject) => {
        ffmpeg(sourcePath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .outputOptions([
            '-movflags +faststart', 
            '-pix_fmt yuv420p',      
          ])
          .output(destPath)
          .on('end', () => resolve())
          .on('error', (err, _stdout, stderr) => {
            this.logger.error(`FFmpeg error dla ${filename}: ${err.message}`);
            this.logger.error(`FFmpeg stderr: ${stderr}`);
            reject(err);
          })
          .run();
      });

      return `/media/${questionUuid}/video.mp4`;
    }

    this.logger.warn(`Unsupported media file extension: ${filename}`);
    return null;
  }
}