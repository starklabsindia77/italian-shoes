import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();



const extractOptions = (variants: any[]): Record<string, any[]> => {
  const optionKeys = ["size", "style", "sole", "material", "color", "panel"] as const;

  const options: Record<string, Map<number, any>> = Object.fromEntries(
    optionKeys.map((key) => [key + "s", new Map<number, any>()])
  );

  for (const variant of variants) {
    for (const key of optionKeys) {
      if (variant[key] && variant[key].id) {
        options[key + "s"].set(variant[key].id, variant[key]); // Store unique objects by ID
      }
    }
  }

  return Object.fromEntries(
    Object.entries(options).map(([key, map]) => [key, Array.from(map.values())])
  );
};



export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const productId = parseInt(params.id, 10);

  if (isNaN(productId)) {
    return NextResponse.json({ message: "Invalid product ID" }, { status: 400 });
  }

  try {
    // Fetch the product details with all variants and related information
    const product = await prisma.shopifyProduct.findUnique({
      where: { productId: productId.toString() },
      include: {
        ProductVariant: {
          include: {
            variant: {
              include: {
                size: true,
                style: true,
                sole: true,
                material: true,
                color: true,
                panel: true,
              },
            },
            images: true,
            seoMetadata: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }
    
    // Extract options from variants
    const options = extractOptions(product.ProductVariant.map((v) => v.variant));
    const response = {
        id: product.id,
        title: product.title,
        description: product.description,
        vendor: product.vendor,
        productType: product.productType,
        handle: product.handle,
        status: product.status,
        tags: product.tags?.split(",") || [],
        price: product.ProductVariant?.map((variant) => variant.price) || [],
        variants: product.ProductVariant.map((variant) => ({
          id: variant.id,
          title: variant.title,
          price: variant.price,
          inventoryQuantity: variant.inventoryQuantity,
          seo: variant.seoMetadata,
          images: variant.images.map((image) => ({
            url: image.url,
            altText: image.altText,
          })),
          options: {
            size: variant.variant.size,
            style: variant.variant.style,
            sole: variant.variant.sole,
            material: variant.variant.material,
            color: variant.variant.color,
            panel: variant.variant.panel,
          },
        })),
        variantsOptions: options,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
