import { Injectable, UnauthorizedException } from "@nestjs/common";
import { LoginDto } from "./dto/login.dto";
//import { UserService } from "../user/user.service";
//import { CreateUserDto } from "../user/dto/create-user.dto";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { db } from "../prisma/db";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    //private readonly userService: UserService,
  ) {}

  //   async register(createUserDto: CreateUserDto) {
  //     await this.userService.create(createUserDto);
  //     return await this.login({
  //       email: createUserDto.email,
  //       password: createUserDto.password,
  //     });
  //   }

  async login(loginDto: LoginDto) {
    const user = await db.orm.public.User.where({
      email: loginDto.email,
    }).first();

    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const payload = {
      sub: user.uuid,
      email: user.email,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
