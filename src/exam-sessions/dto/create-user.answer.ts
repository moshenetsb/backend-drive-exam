import { IsEnum, IsUUID } from "class-validator";
import { Answer } from "../../questions/enums/questions.enum";

export class CreateUserAnswerDto {
  @IsUUID()
  questionUuid!: string;

  @IsEnum(Answer)
  givenAnswer!: Answer;
}
