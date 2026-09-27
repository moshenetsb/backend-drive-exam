import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Category, Level, Answer } from "../questions/enums/questions.enum";
import { db } from "../prisma/db";
import { FindExamSessionsDto } from "./dto/find-exam-sessions.dto";

const PLAN = [
  { level: Level.PODSTAWOWY, points: 3, count: 10 },
  { level: Level.PODSTAWOWY, points: 2, count: 6 },
  { level: Level.PODSTAWOWY, points: 1, count: 4 },
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

    const assignments = await db.orm.public.CategoryAssignment.where({
      category,
    })
      .select("questionUuid")
      .all();

    const candidateUuids = assignments.map((a) => a.questionUuid);

    for (const bucket of PLAN) {
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

    return db.transaction(async (tx) => {
      const session = await tx.orm.public.ExamSession.create({
        userUuid,
        category,
      });

      await tx.orm.public.ExamSessionQuestion.createAll(
        selectedQuestions.map((q, index) => ({
          examSessionUuid: session.uuid,
          questionUuid: q.uuid,
          order: index,
        })),
      );

      return session;
    });
  }

  async getCurrentQuestion(examSessionUuid: string, userUuid: string) {
    await this.assertSessionActive(examSessionUuid, userUuid);
    await this.handleExpiredQuestions(examSessionUuid);
    await this.maybeFinalizeSession(examSessionUuid);

    const [allQuestions, answered] = await Promise.all([
      db.orm.public.ExamSessionQuestion.where({
        examSessionUuid,
      })
        .orderBy((q) => q.order.asc())
        .all(),
      db.orm.public.UserAnswer.where({
        examSessionUuid,
      }).all(),
    ]);

    const answeredUuids = new Set(answered.map((a) => a.questionUuid));

    const next = allQuestions.find((q) => !answeredUuids.has(q.questionUuid));

    if (!next) {
      return { completed: true };
    }

    const currentPresentedAt = next.presentedAt as Date | null | undefined;
    let presentedAt: Date;

    if (currentPresentedAt) {
      presentedAt = currentPresentedAt;
    } else {
      presentedAt = new Date();

      await db.orm.public.ExamSessionQuestion.where({
        uuid: next.uuid,
      }).update({
        presentedAt,
      });
    }

    const question = await db.orm.public.Question.where({
      uuid: next.questionUuid,
    }).first();

    if (!question) {
      throw new NotFoundException("Next question not found");
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { correctAnswer, ...safeQuestion } = question;

    return {
      ...safeQuestion,
      timeLimitSeconds: TIME_LIMITS_SECONDS[question.level],
      presentedAt,
    };
  }

  async addAnswer(
    examSessionUuid: string,
    userUuid: string,
    questionUuid: string,
    givenAnswer: Answer,
  ) {
    await this.assertSessionActive(examSessionUuid, userUuid);

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

    if (!question) {
      throw new NotFoundException("Question not found");
    }

    const limit = TIME_LIMITS_SECONDS[question.level];
    const elapsedSeconds = (Date.now() - link.presentedAt.getTime()) / 1000;

    if (elapsedSeconds > limit) {
      throw new BadRequestException("Time limit for this question exceeded");
    }

    const isCorrect = question.correctAnswer === givenAnswer;

    await db.orm.public.UserAnswer.create({
      examSessionUuid,
      questionUuid,
      givenAnswer,
      isCorrect,
    });

    await this.maybeFinalizeSession(examSessionUuid);

    return { isCorrect };
  }

  async findAllForUser(userUuid: string, query: FindExamSessionsDto) {
    const where = {
      userUuid,
      ...(query.category !== undefined && {
        category: query.category,
      }),
      ...(query.isPassed !== undefined && {
        isPassed: query.isPassed,
      }),
      ...(query.completed !== undefined && {
        completedAt: query.completed ? { not: null } : null,
      }),
    };

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const start = (page - 1) * limit;

    const sessions = await db.orm.public.ExamSession.where(where)
      .orderBy((session) => session.createdAt.desc())
      .offset(start)
      .limit(limit)
      .all();

    const total = db.orm.public.ExamSession.where(where).count();

    return {
      data: sessions,
      meta: {
        total: sessions.length,
        page,
        limit,
        totalPages: Math.ceil(Number(total) / limit),
      },
    };
  }

  async findOne(examSessionUuid: string, userUuid: string) {
    const session = await this.assertOwnership(examSessionUuid, userUuid);

    const [links, answers] = await Promise.all([
      db.orm.public.ExamSessionQuestion.where({
        examSessionUuid,
      })
        .include("question")
        .all(),
      db.orm.public.UserAnswer.where({
        examSessionUuid,
      }).all(),
    ]);

    const answerByQuestion = new Map(answers.map((a) => [a.questionUuid, a]));

    const questions = links
      .sort((a, b) => a.order - b.order)
      .map((link) => {
        const question = link.question;

        const answer = answerByQuestion.get(link.questionUuid);

        return {
          uuid: question.uuid,
          content: question.content,
          correctAnswer: session.completedAt
            ? question.correctAnswer
            : undefined,
          givenAnswer: answer?.givenAnswer ?? null,
          isCorrect: answer?.isCorrect ?? null,
        };
      });

    return { ...session, questions };
  }

  async remove(examSessionUuid: string, userUuid: string) {
    await this.assertOwnership(examSessionUuid, userUuid);

    return db.orm.public.ExamSession.where({
      uuid: examSessionUuid,
    }).delete();
  }

  private async assertSessionActive(examSessionUuid: string, userUuid: string) {
    const session = await this.assertOwnership(examSessionUuid, userUuid);

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

  private async assertOwnership(examSessionUuid: string, userUuid: string) {
    const session = await db.orm.public.ExamSession.where({
      uuid: examSessionUuid,
    }).first();

    if (!session) {
      throw new NotFoundException("Exam session not found");
    }
    if (session.userUuid !== userUuid) {
      throw new ForbiddenException("This exam session does not belong to you");
    }

    return session;
  }

  private async maybeFinalizeSession(examSessionUuid: string) {
    const totalQuestions = await db.orm.public.ExamSessionQuestion.where({
      examSessionUuid,
    })
      .include("question")
      .all();

    const givenAnswers = await db.orm.public.UserAnswer.where({
      examSessionUuid,
    }).all();

    if (givenAnswers.length < totalQuestions.length) return;

    const pointsByUuid = new Map(
      totalQuestions.map((link) => [link.questionUuid, link.question.points]),
    );

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
    const [allLinks, answered] = await Promise.all([
      db.orm.public.ExamSessionQuestion.where({
        examSessionUuid,
      }).all(),
      db.orm.public.UserAnswer.where({
        examSessionUuid,
      }).all(),
    ]);

    const answeredUuids = new Set(answered.map((a) => a.questionUuid));

    const pending = allLinks
      .filter((l) => l.presentedAt && !answeredUuids.has(l.questionUuid))
      .sort((a, b) => a.order - b.order)[0];

    if (!pending) return;

    const question = await db.orm.public.Question.where({
      uuid: pending.questionUuid,
    }).first();

    if (!question) return;

    const limit = TIME_LIMITS_SECONDS[question.level];
    const elapsedSeconds = (Date.now() - pending.presentedAt.getTime()) / 1000;

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
