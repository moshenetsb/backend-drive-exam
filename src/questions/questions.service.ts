import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { db } from "../prisma/db";
import { quoteIdentifier } from '@prisma/orm-postgres/adapter';

@Injectable()
export class QuestionsService {
  async create(createQuestionDto: CreateQuestionDto) {
    return 'This action adds a new question';
  }

  async findAll() {
    return await db.orm.public.Question.all();
  }

  async findOne(uuid: string) {
    const question = await db.orm.public.Question.where({
        uuid
    }).first()

    if (!question){
      throw new NotFoundException("Question not found");
    }

    return question;
  }

  async update(uuid: string, updateQuestionDto: UpdateQuestionDto) {
  await this.findOne(uuid);

  const { categories, ...questionData } = updateQuestionDto;

  const question = await db.orm.public.Question.where({ uuid }).update(questionData);

  if (categories) {
    await db.orm.public.CategoryAssignment.where({ 
      questionUuid: uuid }
    ).delete();

    if (categories.length) {
      await db.orm.public.CategoryAssignment.createAll(
        categories.map((category) => (
          { questionUuid: uuid, category }
        )),
      );
    }
  }

  return question;
}

  async remove(uuid: string) {
    await this.findOne(uuid);
    await db.orm.public.CategoryAssignment.where({
      questionUuid: uuid
    }).delete()

    return db.orm.public.Question.where({
      uuid
    }).delete()
  }
}
