import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { Role } from "../users.enums";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty({
    example: "jan.kowalski@example.com",
    description: "User email address (must be unique)",
  })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({
    example: "Jan",
    description: "User first name",
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: "Kowalski",
    description: "User last name",
  })
  @IsOptional()
  @IsString()
  surname?: string;

  @ApiProperty({
    example: "SuperSecretPassword123",
    description: "User password (minimum 8 characters)",
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({
    enum: Role,
    example: Role.USER,
    description: "User role in the system",
    default: Role.USER,
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({
    example: true,
    description: "Indicates whether the user account is active",
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
