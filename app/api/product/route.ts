import { PrismaClient, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

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
    const where: Prisma.ShopifyProductWhereInput = {
      status: "active",
    };

    // Add optional filters if they exist
    if (vendor) {
      where.vendor = vendor;
    }

    if (productType) {
      where.productType = productType;
    }

    // Define the type for variants filtering
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter: Prisma.FloatFilter = {};
      
      if (minPrice !== undefined) {
        priceFilter.gte = minPrice;
      }
      
      if (maxPrice !== undefined) {
        priceFilter.lte = maxPrice;
      }
      
      where.variants = {
        some: {
          price: priceFilter
        }
      };
    }

    // For sorting, we'll use a standard query first
    // For price sorting, we'll apply it after fetching the results
    const orderByClause: Prisma.ShopifyProductOrderByWithRelationInput = 
      sortBy !== 'price' 
        ? { [sortBy]: sortOrder as Prisma.SortOrder }
        : { createdAt: 'desc' as Prisma.SortOrder }; // Default ordering when we'll sort by price manually

    // First, fetch the total count for pagination
    const total = await prisma.shopifyProduct.count({
      where,
    });

    // Fetch all the products for the current page
    // For price sorting, we need to fetch more and then apply manual sorting
    const fetchLimit = sortBy === 'price' ? total : pageSize;
    const fetchSkip = sortBy === 'price' ? 0 : skip;

    const allProducts = await prisma.shopifyProduct.findMany({
      orderBy: orderByClause,
      where,
      skip: fetchSkip,
      take: fetchLimit,
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

    // Transform the data to match the Product type from product.ts
    let formattedProducts = allProducts.map((product) => {
      // Get price range from variants
      const prices = product.variants.map((variant: Prisma.ShopifyVariantGetPayload<{}>) => variant.price);
      
      // Calculate min, max and average price for sorting
      // Handle empty price arrays gracefully
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
      const avgPrice = prices.length > 0 
        ? prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length 
        : 0;
      
      // Format product variants
      const productVariants = product.ProductVariant.map((pv: any) => {
        return {
          id: pv.id,
          title: pv.title || "",
          price: pv.price || 0,
          inventoryQuantity: pv.inventoryQuantity || 0,
          images: pv.images.map((img: any) => ({
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
      const shopifyVariants = product.variants.map((variant: any) => ({
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
      const shopifyImages = product.images.map((image: any) => ({
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
            .filter((pv: any) => pv.variant.size)
            .map((pv: any) => pv.variant.size)
        )
      );
      
      const styles = Array.from(
        new Set(
          product.ProductVariant
            .filter((pv: any) => pv.variant.style)
            .map((pv: any) => pv.variant.style)
        )
      );
      
      const soles = Array.from(
        new Set(
          product.ProductVariant
            .filter((pv: any) => pv.variant.sole)
            .map((pv: any) => pv.variant.sole)
        )
      );
      
      const materials = Array.from(
        new Set(
          product.ProductVariant
            .filter((pv: any) => pv.variant.material)
            .map((pv: any) => pv.variant.material)
        )
      );
      
      const colors = Array.from(
        new Set(
          product.ProductVariant
            .filter((pv: any) => pv.variant.color)
            .map((pv: any) => pv.variant.color)
        )
      );
      
      const panels = Array.from(
        new Set(
          product.ProductVariant
            .filter((pv: any) => pv.variant.panel)
            .map((pv: any) => pv.variant.panel)
        )
      );

      return {
        id: product.id,
        productId: product.productId,
        title: product.title,
        description: product.description || "",
        price: prices,
        minPrice,
        maxPrice,
        avgPrice,
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

    // If we're sorting by price, do it manually after formatting
    if (sortBy === 'price') {
      if (sortOrder === 'asc') {
        // Sort by minPrice (for products with identical minPrice/maxPrice, this still works)
        formattedProducts.sort((a, b) => {
          // First compare by minPrice
          if (a.minPrice !== b.minPrice) {
            return a.minPrice - b.minPrice;
          }
          // If minPrice is the same, sort by product ID for consistent ordering
          return a.id - b.id;
        });
      } else {
        // Sort by maxPrice for high to low
        formattedProducts.sort((a, b) => {
          // First compare by maxPrice
          if (a.maxPrice !== b.maxPrice) {
            return b.maxPrice - a.maxPrice;
          }
          // If maxPrice is the same, sort by product ID for consistent ordering
          return a.id - b.id;
        });
      }
      
      // Apply pagination after sorting
      formattedProducts = formattedProducts.slice(skip, skip + pageSize);
    }

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