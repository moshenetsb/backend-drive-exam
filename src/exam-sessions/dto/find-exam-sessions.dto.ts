import { Type } from 'class-transformer';
import { IsOptional, IsEnum, IsBoolean, IsInt, Min } from 'class-validator';
import { Category } from '../../questions/enums/questions.enum';

export class FindExamSessionsDto {
  @IsOptional()
  @IsEnum(Category)
  category?: Category;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPassed?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}