import { Injectable, UnauthorizedException } from "@nestjs/common";
import { LoginDto } from "./dto/login.dto";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { db } from "../prisma/db";
import { RegisterDto } from "../users/dto/register-user.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}

  async register(registerDto: RegisterDto) {
    await this.userService.register(registerDto);
    return await this.login({
      email: registerDto.email,
      password: registerDto.password,
    });
  }

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
