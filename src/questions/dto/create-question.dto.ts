import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { Answer, Category, Level } from "../enums/questions.enum";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateQuestionDto {
  @ApiProperty({
    description: "Question number",
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  nr!: number;

  @ApiProperty({
    description: "Question content",
    example:
      "Jaką odległość należy zachować między jadącymi kolumnami samochodów ciężarowych?",
  })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({
    description: "Answer option A",
    example: "Nie mniejszą niż 800 metrów.",
  })
  @IsOptional()
  @IsString()
  answerA?: string;

  @ApiPropertyOptional({
    description: "Answer option B",
    example: "Nie mniejszą niż 500 metrów.",
  })
  @IsOptional()
  @IsString()
  answerB?: string;

  @ApiPropertyOptional({
    description: "Answer option C",
    example: "Nie mniejszą niż 200 metrów.",
  })
  @IsOptional()
  @IsString()
  answerC?: string;

  @ApiProperty({
    description: "Correct answer option",
    enum: Answer,
    example: Answer.B,
  })
  @IsEnum(Answer)
  correctAnswer!: Answer;

  @ApiPropertyOptional({
    description: "URL or path to the question media file",
    example: null,
  })
  @IsOptional()
  @IsString()
  media?: string;

  @ApiProperty({
    description: "Difficulty level of the question",
    enum: Level,
    example: Level.PODSTAWOWY,
  })
  @IsEnum(Level)
  level!: Level;

  @ApiProperty({
    description: "Number of points awarded for the correct answer",
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  points!: number;

  @ApiProperty({
    description: "Driving licence categories for which the question applies",
    enum: Category,
    isArray: true,
    example: [Category.C],
  })
  @IsArray()
  @IsEnum(Category, { each: true })
  categories!: Category[];
}
