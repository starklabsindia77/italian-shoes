import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

type ResponseData = {
  success: boolean;
  data?: any;
  message?: string;
  total?: number;
};

export async function GET(request: Request) {
  try {
    // Extract query parameters for pagination and sorting
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10); // Default to page 1
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10); // Default to 10 items per page
    const sortBy = searchParams.get("sortBy") || "createdAt"; // Default sort field
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc"; // Default to descending order
    const vendor = searchParams.get("vendor") || undefined;
    const productType = searchParams.get("productType") || undefined;
    const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;

    // Calculate offset for pagination
    const skip = (page - 1) * pageSize;

    // Build the where clause for filtering
    const where: any = {
      status: "active",
    };

    // Add optional filters if they exist
    if (vendor) {
      where.vendor = vendor;
    }

    if (productType) {
      where.productType = productType;
    }

    // Fetch products with pagination, sorting, and filtering
    const products = await prisma.shopifyProduct.findMany({
      skip,
      take: pageSize,
      orderBy: {
        [sortBy]: sortOrder,
      },
      where,
      include: {
        variants: true,
        images: true,
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
          },
        },
      },
    });

    // Get total count for pagination
    const total = await prisma.shopifyProduct.count({
      where,
    });

    // Transform the data to match the Product type from product.ts
    const formattedProducts = products.map((product) => {
      // Get price range from variants
      const prices = product.variants.map((variant) => variant.price);
      
      // Format product variants
      const productVariants = product.ProductVariant.map((pv) => {
        return {
          id: pv.id,
          title: pv.title || "",
          price: pv.price || 0,
          inventoryQuantity: pv.inventoryQuantity || 0,
          images: pv.images.map((img) => ({
            url: img.url,
            altText: img.altText,
          })),
          options: {
            size: pv.variant.size || null,
            style: pv.variant.style || null,
            sole: pv.variant.sole || null,
            material: pv.variant.material || null,
            color: pv.variant.color || null,
            panel: pv.variant.panel || null,
          },
        };
      });

      // Format shopify variants
      const shopifyVariants = product.variants.map((variant) => ({
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
      }));

      // Format shopify images
      const shopifyImages = product.images.map((image) => ({
        id: image.imageId,
        src: image.src,
        alt: image.alt,
        position: image.position || 0,
        width: image.width,
        height: image.height,
      }));

      // Collect all unique options from variants
      const sizes = Array.from(
        new Set(
          product.ProductVariant
            .filter(pv => pv.variant.size)
            .map(pv => pv.variant.size)
        )
      );
      
      const styles = Array.from(
        new Set(
          product.ProductVariant
            .filter(pv => pv.variant.style)
            .map(pv => pv.variant.style)
        )
      );
      
      const soles = Array.from(
        new Set(
          product.ProductVariant
            .filter(pv => pv.variant.sole)
            .map(pv => pv.variant.sole)
        )
      );
      
      const materials = Array.from(
        new Set(
          product.ProductVariant
            .filter(pv => pv.variant.material)
            .map(pv => pv.variant.material)
        )
      );
      
      const colors = Array.from(
        new Set(
          product.ProductVariant
            .filter(pv => pv.variant.color)
            .map(pv => pv.variant.color)
        )
      );
      
      const panels = Array.from(
        new Set(
          product.ProductVariant
            .filter(pv => pv.variant.panel)
            .map(pv => pv.variant.panel)
        )
      );

      return {
        id: product.id,
        productId: product.productId,
        title: product.title,
        description: product.description || "",
        price: prices,
        variants: productVariants,
        vendor: product.vendor,
        productType: product.productType,
        handle: product.handle,
        status: product.status,
        tags: product.tags ? product.tags.split(",").map(tag => tag.trim()) : [],
        imageUrl: product.imageUrl || (product.images[0]?.src || ""),
        shopifyVariants,
        shopifyImages,
        variantsOptions: {
          sizes,
          styles,
          soles,
          materials,
          colors,
          panels,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedProducts,
      meta: {
        totalItems: total,
        totalPages: Math.ceil(total / pageSize),
        currentPage: page,
        itemsPerPage: pageSize,
      },
      total: total,
    });
  } catch (error) {
    console.error("Error fetching products:", (error as Error).message);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}