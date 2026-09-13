import { ApiProperty } from "@nestjs/swagger";
import { Role } from "../users.enums";

export class User {
  @ApiProperty()
  uuid!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ required: false, nullable: true })
  name?: string | null;

  @ApiProperty({ required: false, nullable: true })
  surname?: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ default: true })
  isActive!: boolean;

  @ApiProperty({ enum: Role, default: Role.USER })
  role!: Role;
}
