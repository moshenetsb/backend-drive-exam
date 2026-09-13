import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { Answer, Category, Level } from "../questions.enums";

export class CreateQuestionDto {
  @IsInt()
  @Min(1)
  nr!: number;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsOptional()
  @IsString()
  answerA?: string;

  @IsOptional()
  @IsString()
  answerB?: string;

  @IsOptional()
  @IsString()
  answerC?: string;

  @IsEnum(Answer)
  correctAnswer!: Answer;

  @IsOptional()
  @IsString()
  media?: string;

  @IsEnum(Level)
  level!: Level;

  @IsInt()
  @Min(1)
  points!: number;

  @IsArray()
  @IsEnum(Category, { each: true })
  categories!: Category[];
}
