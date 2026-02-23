import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
    console.log('🚀 Starting asset migration...');
    const products = await prisma.product.findMany();

    for (const p of products) {
        const assets = p.assets as any;
        const glbUrl = assets?.glb?.url;
        const thumbnailUrl = assets?.thumbnail;

        if (glbUrl || thumbnailUrl) {
            console.log(`Updating product ${p.productId}...`);
            await prisma.product.update({
                where: { id: p.id },
                data: {
                    glbUrl: glbUrl || p.glbUrl,
                    thumbnailUrl: thumbnailUrl || p.thumbnailUrl
                }
            });
        }
    }

    console.log('✅ Migration complete!');
    await prisma.$disconnect();
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
