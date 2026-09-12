import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { db } from "../prisma/db";

@Injectable()
export class UsersService {
  async create(createUserDto: CreateUserDto) {
    const user = await db.orm.public.User.where({
      email: createUserDto.email
    }).first();

    if (user){
      throw new ConflictException('User with this email already exists');
    }

    return db.orm.public.User.create(createUserDto);
  }

  async findAll() {
    return await db.orm.public.User.all();
  }

  async findOne(uuid: string) {
    const user = await db.orm.public.User.where({ uuid }).first();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(uuid: string, updateUserDto: UpdateUserDto) {
    await this.findOne(uuid);

    return db.orm.public.User.where({ uuid }).update(updateUserDto);
  }

  async remove(uuid: string) {
    await this.findOne(uuid);

    return db.orm.public.User.where({ uuid }).update({ 
      isActive: false 
    });
  }
}
