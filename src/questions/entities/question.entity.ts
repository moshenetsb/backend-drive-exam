import { ApiProperty } from "@nestjs/swagger";
import { Answer, Category, Level } from "../enums/questions.enum";

export class Question {
  @ApiProperty()
  uuid!: string;

  @ApiProperty({ example: 101 })
  nr!: number;

  @ApiProperty({
    example:
      "Jaką odległość należy zachować między jadącymi kolumnami samochodów ciężarowych?",
  })
  content!: string;

  @ApiProperty({ nullable: true, example: "Nie mniejszą niż 800 metrów." })
  answerA!: string | null;

  @ApiProperty({ nullable: true, example: "Nie mniejszą niż 500 metrów." })
  answerB!: string | null;

  @ApiProperty({ nullable: true, example: "Nie mniejszą niż 200 metrów." })
  answerC!: string | null;

  @ApiProperty({ enum: Answer, example: Answer.B })
  correctAnswer!: Answer;

  @ApiProperty({ nullable: true, example: null })
  media!: string | null;

  @ApiProperty({ enum: Level })
  level!: Level;

  @ApiProperty({ example: 1 })
  points!: number;

  @ApiProperty({
    enum: Category,
    isArray: true,
    uniqueItems: true,
    example: [Category.C],
  })
  categories!: Category[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
