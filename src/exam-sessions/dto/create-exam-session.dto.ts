import { IsEnum } from "class-validator";
import { Category } from "../../questions/questions.enums";

export class CreateExamSessionDto {
  @IsEnum(Category)
  category!: Category;
}
