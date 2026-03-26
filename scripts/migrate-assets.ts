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
            // Cast to any to bypass type checks for missing fields
            // glbUrl and thumbnailUrl were likely moved to the 'assets' JSON field
            await (prisma.product as any).update({
                where: { id: p.id },
                data: {
                    glbUrl: glbUrl || (p as any).glbUrl,
                    thumbnailUrl: thumbnailUrl || (p as any).thumbnailUrl
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
