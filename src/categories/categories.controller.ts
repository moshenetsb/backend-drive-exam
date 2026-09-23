import { Controller, Get } from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Category } from "../questions/enums/questions.enum";

@ApiTags("Categories")
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: "Get all available categories" })
  @ApiResponse({
    status: 200,
    description: "List of available categories successfully retrieved",
    schema: {
      type: "array",
      items: {
        type: "string",
        enum: Object.values(Category),
      },
    },
  })
  async findAvailable() {
    return await this.categoriesService.findAvailable();
  }
}
