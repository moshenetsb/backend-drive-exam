import { IsEnum, IsUUID } from "class-validator";
import { Answer } from "../../questions/questions.enums";

export class CreateUserAnswerDto {
  @IsUUID()
  questionUuid!: string;

  @IsEnum(Answer)
  givenAnswer!: Answer;
}
