import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { db } from "../prisma/db";
import { User } from "./entities/user.entity";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import * as bcrypt from "bcrypt";
import { Role } from "./users.enums";
import { RegisterDto } from "./dto/register-user.dto";
import { isActiveAdmin } from "../utils";

@Injectable()
export class UsersService {
  async register(registerDto: RegisterDto) {
    return this.createUserInDb({
      ...registerDto,
      role: Role.USER,
      isActive: true,
    });
  }

  async createByAdmin(createUserDto: CreateUserDto, currentUser: User) {
    if (!isActiveAdmin(currentUser)) {
      throw new ForbiddenException(
        "Access denied. Administrator privileges required.",
      );
    }

    return this.createUserInDb(createUserDto);
  }

  private async createUserInDb(data: CreateUserDto) {
    try {
      const hashedPassword = await bcrypt.hash(data.password, 12);

      return await db.orm.public.User.create({
        ...data,
        password: hashedPassword,
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("User with this email already exists");
      }
      throw error;
    }
  }

  async findAll(currentUser: User) {
    if (!isActiveAdmin(currentUser)) {
      throw new ForbiddenException(
        "Access denied. Administrator privileges required.",
      );
    }

    return await db.orm.public.User.all();
  }

  async findOne(uuid: string, currentUser: User) {
    if (!isActiveAdmin(currentUser) && currentUser.uuid !== uuid) {
      throw new ForbiddenException(
        "Access denied. You can only access your own data or you need administrator privileges.",
      );
    }

    const user = await db.orm.public.User.where({ uuid }).first();

    if (!user) {
      throw new NotFoundException("User was not found");
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  async update(uuid: string, updateUserDto: UpdateUserDto, currentUser: User) {
    if (!isActiveAdmin(currentUser) && currentUser.uuid !== uuid) {
      throw new ForbiddenException(
        "Access denied. You can only update your own data or you need administrator privileges.",
      );
    }

    if (!isActiveAdmin(currentUser)) {
      if (
        updateUserDto.role !== undefined ||
        updateUserDto.isActive !== undefined
      ) {
        throw new ForbiddenException(
          "Access denied. Only administrators can change role or active status.",
        );
      }
    }

    try {
      return await db.orm.public.User.where({ uuid }).update(updateUserDto);
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundException("User not found");
      }
      throw error;
    }
  }

  async remove(uuid: string, currentUser: User) {
    if (currentUser.uuid === uuid && isActiveAdmin(currentUser)) {
      throw new ForbiddenException(
        "Administrators cannot delete their own account.",
      );
    }

    if (!isActiveAdmin(currentUser) && currentUser.uuid !== uuid) {
      throw new ForbiddenException(
        "Access denied. You can only delete your own account or you need administrator privileges.",
      );
    }

    try {
      return await db.orm.public.User.where({ uuid }).delete();
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundException("User not found");
      }
      throw error;
    }
  }
}
