import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@italianshoes.com";
  const name = process.env.ADMIN_NAME || "Admin";
  const password = process.env.ADMIN_PASSWORD || "admin123"; // change in production

  const passwordHash = await hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role: "ADMIN",
      passwordHash,
    },
    create: {
      email,
      name,
      role: "ADMIN",
      passwordHash,
    },
  });

  console.log("Seeded admin:", { id: admin.id, email: admin.email, role: admin.role });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
