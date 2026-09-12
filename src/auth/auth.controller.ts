import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // @Post("register")
  // @ApiOperation({
  //   summary: "Register a new user and automatically log them in",
  // })
  // @ApiResponse({
  //   status: 201,
  //   description:
  //     "User successfully registered and automatically logged in, returns access token",
  // })
  // @ApiResponse({
  //   status: 400,
  //   description: "Bad Request - Validation failed",
  // })
  // @ApiResponse({
  //   status: 409,
  //   description: "Conflict - User with this email already exists",
  // })
  // @HttpCode(HttpStatus.CREATED)
  // async register(@Body() createUserDto: CreateUserDto) {
  //   return await this.authService.register(createUserDto);
  // }

  @Post("login")
  @ApiOperation({ summary: "Authenticate user and return JWT token" })
  @ApiResponse({
    status: 200,
    description: "User successfully logged in, returns JWT access token.",
  })
  @ApiResponse({
    status: 400,
    description: "Bad Request - Validation failed",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid email or password",
  })
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  // @Get("me")
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @ApiOperation({
  //   summary: "Get current logged-in user profile",
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: "Profile successfully retrieved",
  //   type: User,
  // })
  // @ApiResponse({
  //   status: 401,
  //   description: "Unauthorized - the token is invalid, expired, or missing",
  // })
  // updateProfile(@Req() req: { user: User }) {
  //   return req.user;
  // }
}
