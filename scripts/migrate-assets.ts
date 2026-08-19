import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type ProductAssets = {
    glb?: { url?: string | null } | null;
    thumbnail?: string | null;
} | null;

/**
 * `glbUrl` / `thumbnailUrl` are legacy columns that predate the `assets` JSON
 * field, so they are absent from the generated Prisma types. These narrow
 * shapes describe the legacy surface without falling back to `any`.
 */
type LegacyProductFields = { glbUrl?: string | null; thumbnailUrl?: string | null };
type LegacyProductDelegate = {
    update: (args: {
        where: { id: string };
        data: LegacyProductFields;
    }) => Promise<unknown>;
};

async function migrate() {
    console.log('🚀 Starting asset migration...');
    const products = await prisma.product.findMany();

    for (const p of products) {
        const assets = p.assets as ProductAssets;
        const glbUrl = assets?.glb?.url;
        const thumbnailUrl = assets?.thumbnail;

        if (glbUrl || thumbnailUrl) {
            console.log(`Updating product ${p.productId}...`);
            const legacy = p as typeof p & LegacyProductFields;
            await (prisma.product as unknown as LegacyProductDelegate).update({
                where: { id: p.id },
                data: {
                    glbUrl: glbUrl || legacy.glbUrl,
                    thumbnailUrl: thumbnailUrl || legacy.thumbnailUrl
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
