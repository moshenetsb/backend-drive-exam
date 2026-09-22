import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createValidationPipe } from "./config/validation.config";
import { createCorsOptions } from "./config/cors.config";
import { setupSwagger } from "./config/swagger.config";
import { Temporal } from '@js-temporal/polyfill';

if (!globalThis.Temporal) {
  (globalThis as any).Temporal = Temporal;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  app.setGlobalPrefix("api");
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });

  app.useGlobalPipes(createValidationPipe());

  app.enableCors(createCorsOptions(configService));

  setupSwagger(app);

  await app.listen(configService.getOrThrow<number>("APP_PORT"));
}
bootstrap();
