import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateQuestionDto } from "./dto/create-question.dto";
import { UpdateQuestionDto } from "./dto/update-question.dto";
import { db } from "../prisma/db";
import { User } from "../users/entities/user.entity";
import { isActiveAdmin } from "../utils";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

@Injectable()
export class QuestionsService {
  async create(createQuestionDto: CreateQuestionDto, currentUser: User) {
    if (!isActiveAdmin(currentUser)) {
      throw new ForbiddenException(
        "Access denied. Administrator privileges required.",
      );
    }

    const { categories, ...questionData } = createQuestionDto;

    return await db.transaction(async (tx) => {
      try {
        const question = await tx.orm.public.Question.create(questionData);

        if (categories.length > 0) {
          await tx.orm.public.CategoryAssignment.createAll(
            categories.map((category) => ({
              questionUuid: question.uuid,
              category,
            })),
          );
        }

        return await tx.orm.public.Question.where({ uuid: question.uuid })
          .include("categories")
          .first();
      } catch (error) {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          throw new ConflictException("Question with this nr already exists");
        }
        throw error;
      }
    });
  }

  async findAll() {
    return await db.orm.public.Question.include("categories").all();
  }

  async findOne(uuid: string) {
    const question = await db.orm.public.Question.where({
      uuid,
    })
      .include("categories")
      .first();

    if (!question) {
      throw new NotFoundException("Question not found");
    }

    return question;
  }

  async update(
    uuid: string,
    updateQuestionDto: UpdateQuestionDto,
    currentUser: User,
  ) {
    if (!isActiveAdmin(currentUser)) {
      throw new ForbiddenException(
        "Access denied. Administrator privileges required.",
      );
    }

    try {
      const { categories, ...questionData } = updateQuestionDto;

      return await db.transaction(async (tx) => {
        await tx.orm.public.Question.where({ uuid }).update(questionData);

        if (categories !== undefined) {
          const existing = await db.orm.public.CategoryAssignment.where({
            questionUuid: uuid,
          }).all();

          const existingCategories = existing.map((item) => item.category);

          const categoriesToAdd = categories.filter(
            (category) => !existingCategories.includes(category),
          );

          const categoriesToRemove = existingCategories.filter(
            (category) => !categories.includes(category),
          );

          for (const category of categoriesToRemove) {
            await db.orm.public.CategoryAssignment.where({
              questionUuid: uuid,
              category,
            }).delete();
          }

          if (categoriesToAdd.length > 0) {
            await db.orm.public.CategoryAssignment.createAll(
              categoriesToAdd.map((category) => ({
                questionUuid: uuid,
                category,
              })),
            );
          }
        }

        return await tx.orm.public.Question.where({ uuid })
          .include("categories")
          .first();
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundException("Question not found");
      }
      throw error;
    }
  }

  async remove(uuid: string, currentUser: User) {
    if (!isActiveAdmin(currentUser)) {
      throw new ForbiddenException(
        "Access denied. Administrator privileges required.",
      );
    }

    try {
      return await db.orm.public.Question.where({ uuid }).delete();
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundException("Question not found");
      }
      throw error;
    }
  }
}
