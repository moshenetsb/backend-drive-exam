import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Category } from "../../questions/enums/questions.enum";

export class ExamSession {
  @ApiProperty({
    description: "Unique identifier of the exam session",
    format: "uuid",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  uuid!: string;

  @ApiProperty({
    description: "UUID of the user who created the exam session",
    format: "uuid",
    example: "550e8400-e29b-41d4-a716-446655440001",
  })
  userUuid!: string;

  @ApiProperty({
    enum: Category,
    description: "Category of the exam session",
    example: Category.B,
  })
  category!: Category;

  @ApiPropertyOptional({
    description: "Score achieved in the exam session",
    example: 68,
    nullable: true,
  })
  score!: number | null;

  @ApiPropertyOptional({
    description: "Whether the exam session was passed",
    example: true,
    nullable: true,
  })
  isPassed!: boolean | null;

  @ApiProperty({
    description: "Date and time when the exam session was created",
    example: "2026-09-27T14:30:00.000Z",
  })
  createdAt!: Date;

  @ApiPropertyOptional({
    description: "Date and time when the exam session was completed",
    example: "2026-09-27T15:15:00.000Z",
    nullable: true,
  })
  completedAt!: Date | null;
}
