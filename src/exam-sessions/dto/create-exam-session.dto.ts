import { IsEnum } from "class-validator";
import { Category } from "../../questions/enums/questions.enum";

export class CreateExamSessionDto {
  @IsEnum(Category)
  category!: Category;
}
