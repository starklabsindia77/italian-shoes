import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { fetchShopifyProducts } from '@/services/shopifyService';

const prisma = new PrismaClient();

export async function GET() {
    try {
        console.log('Starting Shopify product sync...');

        // Fetch products from Shopify API
        const products = await fetchShopifyProducts();

        for (const product of products) {
            const productId = product.id.toString();
            const title = product.title || 'No title';
            const description = product.body_html || null;
            const vendor = product.vendor || 'Unknown Vendor';
            const productType = product.product_type || 'Uncategorized';
            const handle = product.handle || '';
            const status = product.status || 'draft';
            const tags = product.tags || null;
            const templateSuffix = product.template_suffix || null;
            const publishedAt = product.published_at ? new Date(product.published_at) : null;
            const adminGraphqlApiId = product.admin_graphql_api_id || null;

            // Image Details
            const defaultImage = product.image || {};
            const imageUrl = defaultImage.src || null;
            const imageId = defaultImage.id?.toString() || null;
            const imageWidth = defaultImage.width || null;
            const imageHeight = defaultImage.height || null;

            // Upsert Shopify Product
            await prisma.shopifyProduct.upsert({
                where: { productId }, // Use productId as the unique identifier
                update: {
                    title,
                    description,
                    vendor,
                    productType,
                    handle,
                    status,
                    tags,
                    templateSuffix,
                    publishedAt,
                    adminGraphqlApiId,
                    imageId,
                    imageUrl,
                    imageWidth,
                    imageHeight,
                },
                create: {
                    productId,
                    title,
                    description,
                    vendor,
                    productType,
                    handle,
                    status,
                    tags,
                    templateSuffix,
                    publishedAt,
                    adminGraphqlApiId,
                    imageId,
                    imageUrl,
                    imageWidth,
                    imageHeight,
                },
            });
        }

        console.log('Shopify product sync completed successfully.');
        return NextResponse.json({ message: 'Product sync completed' });
    } catch (error) {
        console.error('Error during product sync:', (error as Error).message);
        return NextResponse.json({ message: 'Error syncing products' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
