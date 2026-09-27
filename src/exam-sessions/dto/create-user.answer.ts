import { IsEnum, IsUUID } from "class-validator";
import { Answer } from "../../questions/enums/questions.enum";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserAnswerDto {
  @ApiProperty({
    description: "UUID of the answered question",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @IsUUID()
  questionUuid!: string;

  @ApiProperty({
    enum: Answer,
    description: "Answer selected by the user",
    example: Answer.A,
  })
  @IsEnum(Answer)
  givenAnswer!: Answer;
}
