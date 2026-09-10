import { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";
import { ConfigService } from "@nestjs/config";

export function createCorsOptions(configService: ConfigService): CorsOptions {
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

  return {
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
  };
}
