import { Type } from "class-transformer";
import { IsOptional, IsEnum, IsBoolean, IsInt, Min } from "class-validator";
import { Category } from "../../questions/enums/questions.enum";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class FindExamSessionsDto {
  @ApiPropertyOptional({
    enum: Category,
    description: "Filter exam sessions by category",
  })
  @IsOptional()
  @IsEnum(Category)
  category?: Category;

  @ApiPropertyOptional({
    description: "Filter by whether the exam was passed",
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPassed?: boolean;

  @ApiPropertyOptional({
    description: "Filter by whether the exam is completed",
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  completed?: boolean;

  @ApiPropertyOptional({
    description: "Page number",
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Number of exam sessions per page",
    default: 20,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
