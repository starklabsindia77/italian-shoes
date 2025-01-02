import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Fetch all product variants with related data
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    const totalVariants = await prisma.productVariant.count();

    const variants = await prisma.productVariant.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include: {
        shopifyProduct: true, // Ensure this relation is defined in the schema
        variant: true,        // Include related Variant
        seoMetadata: true,    // Include SEO metadata
      },
    });

    return NextResponse.json({
      data: variants,
      meta: {
        totalItems: totalVariants,
        totalPages: Math.ceil(totalVariants / pageSize),
        currentPage: page,
        itemsPerPage: pageSize,
      },
      total:totalVariants
    });
  } catch (error) {
    console.error("Error fetching product variants:", error);
    return NextResponse.json({ error: "Failed to fetch product variants" }, { status: 500 });
  }
}

// POST: Create a new product variant
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      shopifyProductId,
      variantId,
      title,
      description,
      price,
      inventoryQuantity,
      images,
      seoMetadata,
      vendor, // Required
      productType, // Required
      handle, // Required
      status, // Required
    } = body;
    
    if (!vendor || !productType || !handle || !status) {
      return NextResponse.json(
        { error: "vendor, productType, handle, and status are required fields" },
        { status: 400 }
      );
    }
    
    // const newProductVariant = await prisma.productVariant.create({
    //   data: {
    //     shopifyProductId: shopifyProductId || null,
    //     variantId: variantId || null,
    //     title: title || null,
    //     description : description || null,
    //     price: price || null,
    //     inventoryQuantity: inventoryQuantity || null,
    //     vendor: vendor || "Default Vendor", // Default value
    //     productType: productType || "Default Type", // Default value
    //     handle: handle || `${title}-${variantId}`, // Generate handle if not provided
    //     status: status || "active", // Default status
    //     images: {
    //       create: images || [], // Default to an empty array
    //     },
    //     seoMetadata: seoMetadata
    //       ? {
    //           create: {
    //             title: seoMetadata.title || null,
    //             description: seoMetadata.description || null,
    //             keywords: seoMetadata.keywords || null,
    //           },
    //         }
    //       : undefined,
    //   },
    // });

    const newProductVariant = await prisma.productVariant.create({
      data: {
        shopifyProduct: {
          connect: { id: shopifyProductId }, // Assuming shopifyProductId is the ID of the related shopifyProduct
        },
        variant: {
          connect: { id: variantId }, // Assuming variantId is the ID of the related variant
        },
        title: title || null,
        description: description || null,
        price: price || null,
        inventoryQuantity: inventoryQuantity || null,
        vendor: vendor || "Default Vendor", // Default value
        productType: productType || "Default Type", // Default value
        handle: handle || `${title}-${variantId}`, // Generate handle if not provided
        status: status || "active", // Default status
        images: {
          create: images || [], // Default to an empty array
        },
        seoMetadata: seoMetadata
          ? {
              create: {
                title: seoMetadata.title || null,
                description: seoMetadata.description || null,
                keywords: seoMetadata.keywords || null,
              },
            }
          : undefined,
      },
    });
    
    return NextResponse.json(newProductVariant, { status: 201 });
  } catch (error) {
    console.error("Error creating product variant:", error);
    return NextResponse.json({ error: "Failed to create product variant" }, { status: 500 });
  }
}

// PUT: Update an existing product variant
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const {
      shopifyProductId,
      variantId,
      title,
      description,
      price,
      inventoryQuantity,
      images,
      seoMetadata,
    } = body;

    const updatedVariant = await prisma.productVariant.update({
      where: { id: parseInt(id, 10) },
      data: {
        shopifyProductId,
        variantId,
        title,
        description,
        price,
        inventoryQuantity,
        images: {
          deleteMany: {},
          create: images.map((image: { url: string; altText?: string }) => ({
            url: image.url,
            altText: image.altText,
          })),
        },
        seoMetadata: seoMetadata
          ? {
              upsert: {
                create: {
                  title: seoMetadata.title,
                  description: seoMetadata.description,
                  keywords: seoMetadata.keywords,
                },
                update: {
                  title: seoMetadata.title,
                  description: seoMetadata.description,
                  keywords: seoMetadata.keywords,
                },
              },
            }
          : undefined,
      },
    });

    return NextResponse.json(updatedVariant, { status: 200 });
  } catch (error) {
    console.error("Error updating product variant:", error);
    return NextResponse.json({ error: "Failed to update product variant" }, { status: 500 });
  }
}

// DELETE: Delete a product variant
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    await prisma.productVariant.delete({
      where: { id: parseInt(id, 10) },
    });

    return NextResponse.json({ message: "Product variant deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting product variant:", error);
    return NextResponse.json({ error: "Failed to delete product variant" }, { status: 500 });
  }
}
