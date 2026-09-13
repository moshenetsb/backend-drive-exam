import { User } from "./users/entities/user.entity";
import { Role } from "./users/users.enums";

export function isActiveAdmin(user: User): boolean {
  return user.role === Role.ADMIN && user.isActive;
}
