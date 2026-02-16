import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("password123", 12);
  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      password: hash,
      name: "Alice",
    },
  });
  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      email: "bob@example.com",
      password: hash,
      name: "Bob",
    },
  });
  await prisma.friendship.upsert({
    where: {
      user1Id_user2Id: {
        user1Id: alice.id < bob.id ? alice.id : bob.id,
        user2Id: alice.id < bob.id ? bob.id : alice.id,
      },
    },
    update: {},
    create: {
      user1Id: alice.id < bob.id ? alice.id : bob.id,
      user2Id: alice.id < bob.id ? bob.id : alice.id,
    },
  });
  console.log("Seed done. Login with alice@example.com / password123 or bob@example.com / password123");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
