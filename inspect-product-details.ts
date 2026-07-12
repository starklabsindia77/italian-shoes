import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const products = await prisma.product.findMany();
    for (const p of products) {
      console.log(`\n=== Product: ${p.title} (ID: ${p.id}) ===`);
      console.log('Assets:', JSON.stringify(p.assets, null, 2));
      console.log('Selected Styles:', JSON.stringify(p.selectedStyles, null, 2));
      console.log('Selected Soles:', JSON.stringify(p.selectedSoles, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
