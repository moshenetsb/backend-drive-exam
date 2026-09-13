import { Controller, Get, Post, Body, Param, UseGuards, Req, } from '@nestjs/common';
import { ExamSessionsService } from './exam-sessions.service';
import { CreateExamSessionDto } from './dto/create-exam-session.dto';
import { CreateUserAnswerDto } from './dto/create-user.answer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('exam-sessions')
export class ExamSessionsController {
  constructor(private readonly examSessionsService: ExamSessionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateExamSessionDto, @Req() req) {
    return this.examSessionsService.create(req.user.userUuid, dto.category);
  }

  @Get(':uuid/current-question')
  getCurrentQuestion(@Param('uuid') uuid: string) {
    return this.examSessionsService.getCurrentQuestion(uuid);
  }

  @Post(':uuid/answers')
  addAnswer(@Param('uuid') uuid: string, @Body() dto: CreateUserAnswerDto) {
    return this.examSessionsService.addAnswer(uuid, dto.questionUuid, dto.givenAnswer);
  }
}
