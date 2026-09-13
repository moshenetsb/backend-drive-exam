import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from "@nestjs/common";
import { ExamSessionsService } from "./exam-sessions.service";
import { CreateExamSessionDto } from "./dto/create-exam-session.dto";
import { CreateUserAnswerDto } from "./dto/create-user.answer";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { User } from "../users/entities/user.entity";

@Controller("exam-sessions")
export class ExamSessionsController {
  constructor(private readonly examSessionsService: ExamSessionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateExamSessionDto, @Req() req: { user: User }) {
    return this.examSessionsService.create(req.user.uuid, dto.category);
  }

  @Get(":uuid/current-question")
  getCurrentQuestion(@Param("uuid", ParseUUIDPipe) uuid: string) {
    return this.examSessionsService.getCurrentQuestion(uuid);
  }

  @Post(":uuid/answers")
  addAnswer(
    @Param("uuid", ParseUUIDPipe) uuid: string,
    @Body() dto: CreateUserAnswerDto,
  ) {
    return this.examSessionsService.addAnswer(
      uuid,
      dto.questionUuid,
      dto.givenAnswer,
    );
  }
}
