import { PrismaClient } from "@prisma/client";

// Add connection pool + keep-alive settings
const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
  log: ["error"],
});

async function main() {
  try {
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log("DB Version:", result);
    const count = await prisma.user.count();
    console.log("User count:", count);
    console.log("SUCCESS: Database is reachable!");
  } catch (err) {
    console.error("FAILURE:", err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
