import { OmitType } from "@nestjs/swagger";
import { CreateUserDto } from "./create-user.dto";

export class RegisterDto extends OmitType(CreateUserDto, [
  "role",
  "isActive",
] as const) {}
