import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User } from "./entities/user.entity";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new user (Admin only)" })
  @ApiResponse({ status: 201, description: "User successfully created" })
  @ApiResponse({
    status: 403,
    description: "Forbidden. Admin privileges required",
  })
  @ApiResponse({
    status: 409,
    description: "User with this email already exists",
  })
  async createByAdmin(
    @Body() createUserDto: CreateUserDto,
    @Req() req: { user: User },
  ) {
    return await this.usersService.createByAdmin(createUserDto, req.user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get list of all users" })
  @ApiResponse({ status: 200, description: "Returns an array of users" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  async findAll(@Req() req: { user: User }) {
    return await this.usersService.findAll(req.user);
  }

  @Get(":uuid")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user by UUID" })
  @ApiParam({
    name: "uuid",
    description: "User UUID",
  })
  @ApiResponse({ status: 200, description: "Returns user details" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "User not found" })
  async findOne(
    @Param("uuid", ParseUUIDPipe) uuid: string,
    @Req() req: { user: User },
  ) {
    return await this.usersService.findOne(uuid, req.user);
  }

  @Patch(":uuid")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update user data by UUID" })
  @ApiParam({ name: "uuid", description: "User UUID" })
  @ApiResponse({ status: 200, description: "User successfully updated" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "User not found" })
  async update(
    @Param("uuid", ParseUUIDPipe) uuid: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: { user: User },
  ) {
    return await this.usersService.update(uuid, updateUserDto, req.user);
  }

  @Delete(":uuid")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete user by UUID" })
  @ApiParam({ name: "uuid", description: "User UUID" })
  @ApiResponse({ status: 200, description: "User successfully deleted" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "User not found" })
  async remove(
    @Param("uuid", ParseUUIDPipe) uuid: string,
    @Req() req: { user: User },
  ) {
    return await this.usersService.remove(uuid, req.user);
  }
}
