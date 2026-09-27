import "temporal-polyfill/full/global";

import { db } from "./db";
import bcrypt from "bcrypt";

async function main() {
  await db.orm.public.User.where({}).delete();
  await db.orm.public.Question.where({}).delete();

  const email = "admin@example.com";
  const defaultPassword = "change-me";
  const hashedPassword = await bcrypt.hash(defaultPassword, 12);

  await db.orm.public.User.create({
    email: email,
    name: "AdminName",
    surname: "AdminSurname",
    password: hashedPassword,
    role: "ADMIN",
  });

  console.log(
    `Admin user created with email: '${email}' and password: '${defaultPassword}'`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    throw error;
  })
  .finally(async () => {
    await db.runtime().close();
  });
