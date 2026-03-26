
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Fetching sizes...');
    const sizes = await prisma.size.findMany({
      orderBy: [{ sortOrder: 'asc' }, { value: 'asc' }]
    });
    console.log('Sizes found:', sizes.length);
    console.log('First size:', sizes[0]);
  } catch (error) {
    console.error('Error fetching sizes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
