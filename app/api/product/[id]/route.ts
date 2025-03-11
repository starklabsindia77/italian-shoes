import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Create a single PrismaClient instance to be reused across requests
// This follows Prisma best practices for Next.js API routes
const prisma = new PrismaClient();

/**
 * Extracts unique option values from product variants
 * @param variants - Array of variant objects
 * @returns Record containing arrays of unique option values
 */
const extractOptions = (variants: any[]): Record<string, any[]> => {
  const optionKeys = ["size", "style", "sole", "material", "color", "panel"] as const;
  
  // Use Map objects to store unique options by ID
  const options: Record<string, Map<number, any>> = Object.fromEntries(
    optionKeys.map((key) => [key + "s", new Map<number, any>()])
  );

  // Collect unique options from all variants
  for (const variant of variants) {
    for (const key of optionKeys) {
      if (variant[key] && variant[key].id) {
        options[key + "s"].set(variant[key].id, variant[key]);
      }
    }
  }

  // Convert Maps to arrays for the response
  return Object.fromEntries(
    Object.entries(options).map(([key, map]) => [key, Array.from(map.values())])
  );
};

/**
 * GET handler for fetching product details with variants and options
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // Extract and validate the product ID
  const productId = params.id;
  
  if (!productId) {
    return NextResponse.json({ message: "Product ID is required" }, { status: 400 });
  }

  try {
    // Optimize the query by selecting only required fields
    const product = await prisma.shopifyProduct.findUnique({
      where: { productId },
      select: {
        id: true,
        title: true,
        description: true,
        vendor: true,
        productType: true,
        handle: true,
        status: true,
        tags: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
        // Include Shopify variants
        variants: {
          select: {
            variantId: true,
            title: true,
            price: true,
            sku: true,
            inventoryQuantity: true,
            inventoryPolicy: true,
            barcode: true,
            weight: true,
            weightUnit: true,
            position: true,
          }
        },
        // Include Shopify images
        images: {
          select: {
            imageId: true,
            src: true,
            alt: true,
            position: true,
            width: true,
            height: true,
          }
        },
        ProductVariant: {
          select: {
            id: true,
            title: true,
            price: true,
            inventoryQuantity: true,
            seoMetadata: true,
            images: {
              select: {
                url: true,
                altText: true,
              },
            },
            variant: {
              select: {
                size: true,
                style: true,
                sole: true,
                material: true,
                color: true,
                panel: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }
    
    // Extract unique options from variants for the customization UI
    const options = extractOptions(product.ProductVariant.map((v) => v.variant));
    
    // Construct optimized response
    const response = {
      id: product.id,
      title: product.title,
      description: product.description,
      vendor: product.vendor,
      productType: product.productType,
      handle: product.handle,
      status: product.status,
      tags: product.tags?.split(",") || [],
      imageUrl: product.imageUrl,
      // Calculate price array once rather than mapping each time
      price: product.variants.map(variant => variant.price ?? 0),
      // Include Shopify variants data
      shopifyVariants: product.variants.map((variant) => ({
        id: variant.variantId,
        title: variant.title,
        price: variant.price,
        sku: variant.sku,
        inventoryQuantity: variant.inventoryQuantity,
        inventoryPolicy: variant.inventoryPolicy,
        barcode: variant.barcode,
        weight: variant.weight,
        weightUnit: variant.weightUnit,
        position: variant.position,
      })),
      // Include Shopify images data
      shopifyImages: product.images.map((image) => ({
        id: image.imageId,
        src: image.src,
        alt: image.alt,
        position: image.position,
        width: image.width,
        height: image.height,
      })),
      // Custom product variants with customization options
      variants: product.ProductVariant.map((variant) => ({
        id: variant.id,
        title: variant.title,
        price: variant.price,
        inventoryQuantity: variant.inventoryQuantity,
        seo: variant.seoMetadata,
        images: variant.images,
        options: variant.variant,
      })),
      variantsOptions: options,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}