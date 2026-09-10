import { ValidationPipe } from "@nestjs/common";

export function createValidationPipe() {
  return new ValidationPipe({
    transform: true,
    forbidUnknownValues: true,
    whitelist: true,
  });
}
