
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Attempting to add sizeId column to Size table...');
    // We use a transaction or just execute one by one
    // First, add the column as nullable to avoid errors if there's data
    await prisma.$executeRawUnsafe('ALTER TABLE "Size" ADD COLUMN IF NOT EXISTS "sizeId" TEXT;');
    
    // Update sizeId with id values for existing records
    await prisma.$executeRawUnsafe('UPDATE "Size" SET "sizeId" = "id" WHERE "sizeId" IS NULL;');
    
    // Make it unique and not null if desired, but let's start with making it exist
    // await prisma.$executeRawUnsafe('ALTER TABLE "Size" ALTER COLUMN "sizeId" SET NOT NULL;');
    // await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "Size_sizeId_key" ON "Size"("sizeId");');
    
    console.log('Successfully added sizeId column.');
  } catch (error) {
    console.error('Error adding column:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
