
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Querying Size table columns...');
    const columns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Size';
    `;
    console.log('Columns in Size table:', JSON.stringify(columns, null, 2));
  } catch (error) {
    console.error('Error querying columns:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
