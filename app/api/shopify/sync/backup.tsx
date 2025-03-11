import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  fetchShopifyProducts,
  fetchShopifyCollections,
  fetchShopifyCollects,
  fetchShopifyCustomCollections,
} from "@/services/shopifyService";

export const dynamic = 'force-dynamic'; // Ensure this is dynamic

const prisma = new PrismaClient();

async function syncShopifyData() {
  try {
    console.log("Starting Shopify data sync...");

    // Sync Products, Variants, and Images
    const products = await fetchShopifyProducts();
    for (const product of products) {
      const productId = product.id.toString();

      await prisma.shopifyProduct.upsert({
        where: { productId },
        update: {
          title: product.title,
          description: product.body_html,
          vendor: product.vendor,
          productType: product.product_type,
          handle: product.handle,
          status: product.status,
          tags: product.tags,
          templateSuffix: product.template_suffix,
          publishedAt: product.published_at ? new Date(product.published_at) : null,
          adminGraphqlApiId: product.admin_graphql_api_id,
          imageUrl: product.image?.src || null,
          imageId: product.image?.id?.toString() || null,
          imageWidth: product.image?.width || null,
          imageHeight: product.image?.height || null,
        },
        create: {
          productId,
          title: product.title,
          description: product.body_html,
          vendor: product.vendor,
          productType: product.product_type,
          handle: product.handle,
          status: product.status,
          tags: product.tags,
          templateSuffix: product.template_suffix,
          publishedAt: product.published_at ? new Date(product.published_at) : null,
          adminGraphqlApiId: product.admin_graphql_api_id,
          imageUrl: product.image?.src || null,
          imageId: product.image?.id?.toString() || null,
          imageWidth: product.image?.width || null,
          imageHeight: product.image?.height || null,
        },
      });

      for (const variant of product.variants || []) {
        await prisma.shopifyVariant.upsert({
          where: { variantId: variant.id.toString() },
          update: {
            productId,
            title: variant.title,
            price: parseFloat(variant.price || "0"),
            sku: variant.sku || "",
            position: variant.position,
            inventoryQuantity: variant.inventory_quantity || 0,
            inventoryPolicy: variant.inventory_policy || "",
            barcode: variant.barcode || null,
            weight: variant.weight || 0,
            weightUnit: variant.weight_unit || "",
            fulfillmentService: variant.fulfillment_service || null,
            inventoryManagement: variant.inventory_management || null,
          },
          create: {
            variantId: variant.id.toString(),
            productId,
            title: variant.title,
            price: parseFloat(variant.price || "0"),
            sku: variant.sku || "",
            position: variant.position,
            inventoryQuantity: variant.inventory_quantity || 0,
            inventoryPolicy: variant.inventory_policy || "",
            barcode: variant.barcode || null,
            weight: variant.weight || 0,
            weightUnit: variant.weight_unit || "",
            fulfillmentService: variant.fulfillment_service || null,
            inventoryManagement: variant.inventory_management || null,
          },
        });
      }
    }

    // Sync Collects and Collections
    const collects = await fetchShopifyCollects();
    for (const collect of collects) {
      await prisma.shopifyCollect.upsert({
        where: { collectId: collect.id.toString() },
        update: {
          collectionId: collect.collection_id.toString(),
          productId: collect.product_id.toString(),
          position: collect.position || 0,
          sortValue: collect.sort_value || "",
        },
        create: {
          collectId: collect.id.toString(),
          collectionId: collect.collection_id.toString(),
          productId: collect.product_id.toString(),
          position: collect.position || 0,
          sortValue: collect.sort_value || "",
        },
      });

      const collection = await fetchShopifyCollections(collect.collection_id);
      const collectionId = collection.id.toString();

      await prisma.shopifyCollection.upsert({
        where: { collectionId },
        update: {
          title: collection.title,
          description: collection.body_html || null,
          handle: collection.handle,
          publishedAt: collection.published_at ? new Date(collection.published_at) : null,
          sortOrder: collection.sort_order || "",
          templateSuffix: collection.template_suffix || null,
          productsCount: collection.products_count || 0,
          collectionType: collection.collection_type || "",
          publishedScope: collection.published_scope || "",
          adminGraphqlApiId: collection.admin_graphql_api_id || "",
          imageUrl: collection.image?.src || null,
          imageAlt: collection.image?.alt || null,
          imageWidth: collection.image?.width || null,
          imageHeight: collection.image?.height || null,
        },
        create: {
          collectionId,
          title: collection.title,
          description: collection.body_html || null,
          handle: collection.handle,
          publishedAt: collection.published_at ? new Date(collection.published_at) : null,
          sortOrder: collection.sort_order || "",
          templateSuffix: collection.template_suffix || null,
          productsCount: collection.products_count || 0,
          collectionType: collection.collection_type || "",
          publishedScope: collection.published_scope || "",
          adminGraphqlApiId: collection.admin_graphql_api_id || "",
          imageUrl: collection.image?.src || null,
          imageAlt: collection.image?.alt || null,
          imageWidth: collection.image?.width || null,
          imageHeight: collection.image?.height || null,
        },
      });
    }

    // Sync Custom Collections
    const customCollections = await fetchShopifyCustomCollections();
    for (const customCollection of customCollections) {
      const commonFields = {
        title: customCollection.title || "",
        description: customCollection.body_html || null,
        handle: customCollection.handle || "",
        publishedAt: customCollection.published_at ? new Date(customCollection.published_at) : null,
        sortOrder: customCollection.sort_order || "",
        templateSuffix: customCollection.template_suffix || null,
        publishedScope: customCollection.published_scope || "",
        adminGraphqlApiId: customCollection.admin_graphql_api_id || "",
        imageUrl: customCollection.image?.src || null,
        imageAlt: customCollection.image?.alt || null,
        imageWidth: customCollection.image?.width || null,
        imageHeight: customCollection.image?.height || null,
      };

      await prisma.shopify_Custom_Collection.upsert({
        where: { collectionId: customCollection.id.toString() },
        update: { ...commonFields },
        create: {
          collectionId: customCollection.id.toString(),
          ...commonFields,
        },
      });
    }

    console.log("Shopify data sync completed successfully.");
  } catch (error) {
    console.error("Error syncing Shopify data:", (error as Error).message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  // Start sync in the background
  syncShopifyData().catch((err) => {
    console.error("Background sync failed:", err);
  });

  // Return immediately
  return NextResponse.json({ message: "Shopify data sync started" });
}