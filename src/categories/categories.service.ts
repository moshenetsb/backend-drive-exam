import { Injectable } from "@nestjs/common";
import { db } from "../prisma/db";

@Injectable()
export class CategoriesService {
  async findAvailable() {
    const assignments =
      await db.orm.public.CategoryAssignment.distinct("category").all();

    return assignments.map((a) => a.category);
  }
}
