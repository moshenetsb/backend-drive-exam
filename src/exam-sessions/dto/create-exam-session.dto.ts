import { IsEnum } from "class-validator";
import { Category } from "../../questions/enums/questions.enum";
import { ApiProperty } from "@nestjs/swagger";

export class CreateExamSessionDto {
  @ApiProperty({
    enum: Category,
    description: "Category of the exam session",
    example: Category.B,
  })
  @IsEnum(Category)
  category!: Category;
}
