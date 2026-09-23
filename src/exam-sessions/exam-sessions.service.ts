import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateExamSessionDto } from "./dto/create-exam-session.dto";
import { UpdateExamSessionDto } from "./dto/update-exam-session.dto";
import { Category, Level, Answer } from "../questions/enums/questions.enum";
import { db } from "../prisma/db";
import { ExamSession } from "./entities/exam-session.entity";

const PLAN = [
  { level: Level.PODSTAWOWY, points: 3, count: 10 },
  { level: Level.PODSTAWOWY, points: 3, count: 6 },
  { level: Level.PODSTAWOWY, points: 3, count: 4 },
  { level: Level.SPECJALISTYCZNY, points: 3, count: 6 },
  { level: Level.SPECJALISTYCZNY, points: 2, count: 4 },
  { level: Level.SPECJALISTYCZNY, points: 1, count: 2 },
];

const PASS_THRESHOLD = 68;
const SESSION_LIMIT_MINUTES = 25;

const TIME_LIMITS_SECONDS: Record<Level, number> = {
  [Level.PODSTAWOWY]: 35,
  [Level.SPECJALISTYCZNY]: 50,
};

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

@Injectable()
export class ExamSessionsService {
  async create(userUuid: string, category: Category) {
    const selectedQuestions: {
      uuid: string;
    }[] = [];

    for (const bucket of PLAN) {
      const assignments = await db.orm.public.CategoryAssignment.where({
        category,
      })
        .select("questionUuid")
        .all();

      const candidateUuids = assignments.map((a) => a.questionUuid);

      const candidates = await db.orm.public.Question.where({
        level: bucket.level,
        points: bucket.points,
      }).all();

      const matching = candidates.filter((q) =>
        candidateUuids.includes(q.uuid),
      );

      if (matching.length < bucket.count) {
        throw new BadRequestException("Too few questions.");
      }

      selectedQuestions.push(...shuffle(matching).slice(0, bucket.count));
    }

    const session = await db.orm.public.ExamSession.create({
      userUuid,
      category,
    });

    await db.orm.public.ExamSessionQuestion.createAll(
      selectedQuestions.map((q, index) => ({
        examSessionUuid: session.uuid,
        questionUuid: q.uuid,
        order: index,
      })),
    );

    return session;
  }

  async getCurrentQuestion(examSessionUuid: string) {
    await this.assertSessionActive(examSessionUuid);
    await this.handleExpiredQuestions(examSessionUuid);
    await this.maybeFinalizeSession(examSessionUuid);

    const allQuestions = await db.orm.public.ExamSessionQuestion.where({
      examSessionUuid,
    }).all();

    const answered = await db.orm.public.UserAnswer.where({
      examSessionUuid,
    }).all();

    const answeredUuids = new Set(answered.map((a) => a.questionUuid));

    const next = allQuestions
      .sort((a, b) => a.order - b.order)
      .find((q) => !answeredUuids.has(q.questionUuid));

    if (!next) {
      return { completed: true };
    }

    if (!next.presentedAt) {
      await db.orm.public.ExamSessionQuestion.where({
        uuid: next.uuid,
      }).update({
        presentedAt: new Date(),
      });
    }

    const question = await db.orm.public.Question.where({
      uuid: next.questionUuid,
    }).first();
    const { correctAnswer, ...safeQuestion } = question!;

    return {
      ...safeQuestion,
      timeLimitSeconds: TIME_LIMITS_SECONDS[question!.level],
      presentedAt: next.presentedAt ?? new Date(),
    };
  }

  async addAnswer(
    examSessionUuid: string,
    questionUuid: string,
    givenAnswer: Answer,
  ) {
    await this.assertSessionActive(examSessionUuid);

    const link = await db.orm.public.ExamSessionQuestion.where({
      examSessionUuid,
      questionUuid,
    }).first();

    if (!link || !link.presentedAt) {
      throw new BadRequestException("Question was not presented yet");
    }

    const question = await db.orm.public.Question.where({
      uuid: questionUuid,
    }).first();

    const limit = TIME_LIMITS_SECONDS[question!.level];
    const elapsedSeconds = (Date.now() - link.presentedAt.getTime()) / 1000;

    if (elapsedSeconds > limit) {
      throw new BadRequestException("Time limit for this question exceeded");
    }

    const isCorrect = question!.correctAnswer === givenAnswer;

    await db.orm.public.UserAnswer.create({
      examSessionUuid,
      questionUuid,
      givenAnswer,
      isCorrect,
    });

    await this.maybeFinalizeSession(examSessionUuid);

    return { isCorrect };
  }

  findAll() {
    return `This action returns all examSessions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} examSession`;
  }

  update(id: number, updateExamSessionDto: UpdateExamSessionDto) {
    return `This action updates a #${id} examSession`;
  }

  remove(id: number) {
    return `This action removes a #${id} examSession`;
  }

  private async assertSessionActive(examSessionUuid: string) {
    const session = await db.orm.public.ExamSession.where({
      uuid: examSessionUuid,
    }).first();

    if (!session) {
      throw new NotFoundException("Exam session not found");
    }

    if (session.completedAt) {
      throw new BadRequestException("Exam session already completed");
    }

    const elapsedMinutes =
      (Date.now() - session.createdAt.getTime()) / 1000 / 60;

    if (elapsedMinutes > SESSION_LIMIT_MINUTES) {
      await this.maybeFinalizeSession(examSessionUuid);
      throw new BadRequestException("Session time limit exceeded");
    }

    return session;
  }

  private async maybeFinalizeSession(examSessionUuid: string) {
    const totalQuestions = await db.orm.public.ExamSessionQuestion.where({
      examSessionUuid,
    }).all();

    const givenAnswers = await db.orm.public.UserAnswer.where({
      examSessionUuid,
    }).all();

    if (givenAnswers.length < totalQuestions.length) return;

    const questions = await db.orm.public.Question.all();
    const pointsByUuid = new Map(questions.map((q) => [q.uuid, q.points]));

    const score = givenAnswers
      .filter((a) => a.isCorrect)
      .reduce((sum, a) => sum + (pointsByUuid.get(a.questionUuid) ?? 0), 0);

    await db.orm.public.ExamSession.where({
      uuid: examSessionUuid,
    }).update({
      score,
      isPassed: score >= PASS_THRESHOLD,
      completedAt: new Date(),
    });
  }

  private async handleExpiredQuestions(examSessionUuid: string) {
    const allLinks = await db.orm.public.ExamSessionQuestion.where({
      examSessionUuid,
    }).all();

    const answered = await db.orm.public.UserAnswer.where({
      examSessionUuid,
    }).all();

    const answeredUuids = new Set(answered.map((a) => a.questionUuid));

    const pending = allLinks
      .filter((l) => l.presentedAt && !answeredUuids.has(l.questionUuid))
      .sort((a, b) => a.order - b.order)[0];

    if (!pending) return;

    const question = await db.orm.public.Question.where({
      uuid: pending.questionUuid,
    }).first();
    const limit = TIME_LIMITS_SECONDS[question!.level];
    const elapsedSeconds = (Date.now() - pending.presentedAt!.getTime()) / 1000;

    if (elapsedSeconds > limit) {
      await db.orm.public.UserAnswer.create({
        examSessionUuid,
        questionUuid: pending.questionUuid,
        givenAnswer: null,
        isCorrect: false,
      });
    }
  }
}
