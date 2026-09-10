import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  app.setGlobalPrefix("api");
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });

  const corsEntries = configService
    .getOrThrow<string>("CORS_ORIGINS")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const allowAll = corsEntries.includes("*");
  const exactOrigins = new Set(corsEntries.filter((o) => !o.startsWith("*.")));
  const wildcardDomains = corsEntries
    .filter((o) => o.startsWith("*."))
    .map((o) => o.slice(1));

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (origin === undefined) {
        callback(null, true);
        return;
      }

      if (allowAll) {
        callback(null, true);
        return;
      }

      if (exactOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      if (wildcardDomains.some((domain) => origin.endsWith(domain))) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
  });

  await app.listen(configService.getOrThrow<number>("APP_PORT"));
}
bootstrap();
