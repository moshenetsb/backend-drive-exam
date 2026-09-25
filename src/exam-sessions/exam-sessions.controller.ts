import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  ParseUUIDPipe,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
} from "@nestjs/common";
import { ExamSessionsService } from "./exam-sessions.service";
import { CreateExamSessionDto } from "./dto/create-exam-session.dto";
import { CreateUserAnswerDto } from "./dto/create-user.answer";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { User } from "../users/entities/user.entity";
import { ExamSession } from "./entities/exam-session.entity";
import { FindExamSessionsDto } from "./dto/find-exam-sessions.dto";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("Exam Sessions")
@ApiBearerAuth()
@Controller("exam-sessions")
@UseGuards(JwtAuthGuard)
export class ExamSessionsController {
  constructor(private readonly examSessionsService: ExamSessionsService) {}

  @Post()
  @ApiOperation({ summary: "Start a new exam session" })
  @ApiResponse({
    status: 201,
    description: "Exam session successfully created",
    type: ExamSession,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid category or not enough questions available",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  create(@Body() dto: CreateExamSessionDto, @Req() req: { user: User }) {
    return this.examSessionsService.create(req.user.uuid, dto.category);
  }

  @Get()
  @ApiOperation({ summary: "Get exam sessions for the logged-in user" })
  @ApiResponse({
    status: 200,
    description: "Paginated list of exam sessions",
    type: ExamSession,
    isArray: true,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  findAll(
    @Query() query: FindExamSessionsDto, 
    @Req() req: { user: User }){
    return this.examSessionsService.findAllForUser(req.user.uuid, query);
  }

  @Get(":uuid")
  @ApiOperation({ summary: "Get a single exam session with its questions" })
  @ApiResponse({
    status: 200,
    description: "Exam session successfully retrieved",
    type: ExamSession,
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
    description: "This exam session does not belong to you",
  })
  @ApiResponse({
    status: 404,
    description: "Exam session not found",
  })
  findOne(
  @Param("uuid", ParseUUIDPipe) uuid: string, 
  @Req() req: {user: User}
) {
    return this.examSessionsService.findOne(uuid, req.user.uuid);
  }

  @Get(":uuid/current-question")
  @ApiOperation({ summary: "Get the next unanswered question in the session" })
  @ApiResponse({
    status: 200,
    description: "Current question (or { completed: true } if none remain)",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid UUID, session already completed, or time limit exceeded",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "This exam session does not belong to you",
  })
  @ApiResponse({
    status: 404,
    description: "Exam session not found",
  })
  getCurrentQuestion(
    @Param("uuid", ParseUUIDPipe) uuid: string,
    @Req() req: { user: User }
  ) {
    return this.examSessionsService.getCurrentQuestion(uuid, req.user.uuid);
  }

  @Post(":uuid/answers")
  @ApiOperation({ summary: "Submit an answer to the current question" })
  @ApiResponse({
    status: 201,
    description: "Answer recorded",
  })
  @ApiResponse({
    status: 400,
    description:
      "Invalid UUID, question not presented yet, or time limit exceeded",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "This exam session does not belong to you",
  })
  @ApiResponse({
    status: 404,
    description: "Exam session not found",
  })
  addAnswer(
    @Param("uuid", ParseUUIDPipe) uuid: string,
    @Req() req: { user: User },
    @Body() dto: CreateUserAnswerDto,
  ) {
    return this.examSessionsService.addAnswer(
      uuid,
      req.user.uuid,
      dto.questionUuid,
      dto.givenAnswer,
    );
  }

  @Delete(":uuid")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete an exam session" })
  @ApiResponse({
    status: 204,
    description: "Exam session successfully deleted",
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
    description: "This exam session does not belong to you",
  })
  @ApiResponse({
    status: 404,
    description: "Exam session not found",
  })
  async remove(
    @Param("uuid", ParseUUIDPipe) uuid: string, 
    @Req() req: { user: User }
  ) {
    await this.examSessionsService.remove(uuid, req.user.uuid);
  }
}
