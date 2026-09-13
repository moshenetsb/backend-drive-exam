import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { QuestionsModule } from './questions/questions.module';
import { CategoriesModule } from './categories/categories.module';
import { ExamSessionsModule } from './exam-sessions/exam-sessions.module';
import Joi from "joi";

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        APP_PORT: Joi.number().default(3000),

        CORS_ORIGINS: Joi.string().required(),
        DATABASE_URL: Joi.string().required(),

        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().default("60m"),
      }),
      isGlobal: true,
    }),
    AuthModule,
    UsersModule,
    QuestionsModule,
    CategoriesModule,
    ExamSessionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
