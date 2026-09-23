import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { QuestionsService } from "./questions.service";
import { CreateQuestionDto } from "./dto/create-question.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { User } from "../users/entities/user.entity";
import { Question } from "./entities/question.entity";

@ApiTags("Questions")
@Controller("questions")
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new question (Admin only)" })
  @ApiResponse({
    status: 201,
    description: "Question successfully created",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid question data",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden. Admin privileges required",
  })
  @ApiResponse({
    status: 409,
    description: "Question with this nr already exists",
  })
  async create(
    @Body() createQuestionDto: CreateQuestionDto,
    @Req() req: { user: User },
  ) {
    return await this.questionsService.create(createQuestionDto, req.user);
  }

  @Get()
  @ApiOperation({
    summary: "Get all questions",
  })
  @ApiResponse({
    status: 200,
    description: "Questions successfully retrieved",
    type: Question,
    isArray: true,
  })
  async findAll() {
    return await this.questionsService.findAll();
  }

  @Get(":uuid")
  @ApiOperation({ summary: "Get a question by UUID" })
  @ApiResponse({
    status: 200,
    description: "Question successfully retrieved",
    type: Question,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid UUID",
  })
  @ApiResponse({
    status: 404,
    description: "Question not found",
  })
  async findOne(@Param("uuid", ParseUUIDPipe) uuid: string) {
    return await this.questionsService.findOne(uuid);
  }

  @Patch(":uuid")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a question (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Question successfully updated",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid UUID or question data",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden. Admin privileges required",
  })
  @ApiResponse({
    status: 404,
    description: "Question not found",
  })
  async update(
    @Param("uuid", ParseUUIDPipe) uuid: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
    @Req() req: { user: User },
  ) {
    return await this.questionsService.update(
      uuid,
      updateQuestionDto,
      req.user,
    );
  }

  @Delete(":uuid")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a question (Admin only)" })
  @ApiResponse({
    status: 204,
    description: "Question successfully deleted",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid UUID",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden. Admin privileges required",
  })
  @ApiResponse({
    status: 404,
    description: "Question not found",
  })
  async remove(
    @Param("uuid", ParseUUIDPipe) uuid: string,
    @Req() req: { user: User },
  ) {
    await this.questionsService.remove(uuid, req.user);
  }
}
