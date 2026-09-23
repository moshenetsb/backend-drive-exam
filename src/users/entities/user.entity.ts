import { ApiProperty } from "@nestjs/swagger";
import { Role } from "../users.enums";

export class User {
  @ApiProperty()
  uuid!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ nullable: true, example: "Jan" })
  name?: string | null;

  @ApiProperty({ nullable: true, example: "Abacki" })
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
