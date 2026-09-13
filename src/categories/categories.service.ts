import { Injectable } from "@nestjs/common";
import { db } from "../prisma/db";

@Injectable()
export class CategoriesService {
  async findAvailable() {
    const assignments =
      await db.orm.public.CategoryAssignment.select("category").all();

    return Array.from(new Set(assignments.map((a) => a.category)));
  }
}
