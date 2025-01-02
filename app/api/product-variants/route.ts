import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import cloudinary from "cloudinary";


const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});



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

export async function POST(req: NextRequest) {
  try {
    // Parse formData and extract necessary fields
    const formData = await req.formData();  

    // Extract simple fields
    const shopifyProductId = formData.get("shopifyProductId") as string;
    const variantId = formData.get("variantId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const inventoryQuantity = parseInt(formData.get("inventoryQuantity") as string, 10);
    const vendor = formData.get("vendor") as string || "Default Vendor";
    const productType = formData.get("productType") as string || "Default Type";
    const handle = formData.get("handle") as string || "sample-product-variant";
    const status = formData.get("status") as string || "active";

    // Extract nested SEO metadata fields
    const seoMetadata = {
      title: formData.get("seoMetadata[title]") as string,
      description: formData.get("seoMetadata[description]") as string,
      keywords: formData.get("seoMetadata[keywords]") as string,
    };
    const images: File[] = [];
    formData.forEach((value, key) => {
      if (key.startsWith("images[") && value instanceof File) {
        images.push(value);
      }
    });

    // Validate required fields
    if (!shopifyProductId || !variantId || !title || !price || !inventoryQuantity) {
      return NextResponse.json(
        { error: "Missing required fields: shopifyProductId, variantId, title, price, inventoryQuantity" },
        { status: 400 }
      );
    }

    if (images.length === 0) {
      return NextResponse.json(
        { error: "At least one image file is required" },
        { status: 400 }
      );
    }

    // // Upload images to Cloudinary
    const uploadedImages = await Promise.all(
      images.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.v2.uploader.upload_stream(
            { folder: "product-variants" },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );
          uploadStream.end(buffer);
        });
      })
    );

    // Create Product Variant in the database
    const newProductVariant = await prisma.productVariant.create({
      data: {
        shopifyProduct: { connect: { id: Number(shopifyProductId) } },
        variant: { connect: { id: Number(variantId) } },
        title,
        description,
        price,
        inventoryQuantity,
        vendor,
        productType,
        handle,
        status,
        seoMetadata: seoMetadata.title || seoMetadata.description || seoMetadata.keywords
          ? {
              create: {
                title: seoMetadata.title || null,
                description: seoMetadata.description || null,
                keywords: seoMetadata.keywords || null,
              },
            }
          : undefined,
        images: {
          create: (uploadedImages as any[]).map(({ secure_url }: any) => ({
            url: secure_url,
          })),
        },
      },
    });

    return NextResponse.json(newProductVariant, { status: 201 });
  } catch (error: any) {
    console.error("Error creating product variant:", error);
    return NextResponse.json(
      { error: "Failed to create product variant", details: error.message },
      { status: 500 }
    );
  }
}

// PUT: Update an existing product variant
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "1", 10);
    const formData = await req.formData();

    // Extract simple fields
    const shopifyProductId = formData.get("shopifyProductId") as string;
    const variantId = formData.get("variantId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const inventoryQuantity = parseInt(formData.get("inventoryQuantity") as string, 10);
    const vendor = formData.get("vendor") as string || "Default Vendor";
    const productType = formData.get("productType") as string || "Default Type";
    const handle = formData.get("handle") as string || "sample-product-variant";
    const status = formData.get("status") as string || "active";

    // Extract nested SEO metadata fields
    const seoMetadata = {
      title: formData.get("seoMetadata[title]") as string,
      description: formData.get("seoMetadata[description]") as string,
      keywords: formData.get("seoMetadata[keywords]") as string,
    };

    // Extract and process image files
    const images: File[] = [];
    formData.forEach((value, key) => {
      if (key.startsWith("images[") && value instanceof File) {
        images.push(value);
      }
    });

    // Validate required fields
    if (!id || !title || !price || !inventoryQuantity) {
      return NextResponse.json(
        { error: "Missing required fields: id, title, price, inventoryQuantity" },
        { status: 400 }
      );
    }

    // Upload new images to Cloudinary if provided
    const uploadedImages = images.length > 0
      ? await Promise.all(
          images.map(async (file) => {
            const buffer = Buffer.from(await file.arrayBuffer());
            return new Promise((resolve, reject) => {
              const uploadStream = cloudinary.v2.uploader.upload_stream(
                { folder: "product-variants" },
                (error, result) => {
                  if (error) {
                    reject(error);
                  } else {
                    resolve(result);
                  }
                }
              );
              uploadStream.end(buffer);
            });
          })
        )
      : [];

    // Update Product Variant in the database
    const updatedVariant = await prisma.productVariant.update({
      where: { id: id },
      data: {
        shopifyProduct: shopifyProductId ? { connect: { id: Number(shopifyProductId) } } : undefined,
        variant: variantId ? { connect: { id: Number(variantId) } } : undefined,
        title,
        description,
        price,
        inventoryQuantity,
        vendor,
        productType,
        handle,
        status,
        images: images.length > 0
          ? {
              deleteMany: {}, // Clear old images
              create: (uploadedImages as any[]).map(({ secure_url }: any) => ({
                url: secure_url,
              })),
            }
          : undefined,
        seoMetadata: seoMetadata.title || seoMetadata.description || seoMetadata.keywords
          ? {
              upsert: {
                create: {
                  title: seoMetadata.title || null,
                  description: seoMetadata.description || null,
                  keywords: seoMetadata.keywords || null,
                },
                update: {
                  title: seoMetadata.title || null,
                  description: seoMetadata.description || null,
                  keywords: seoMetadata.keywords || null,
                },
              },
            }
          : undefined,
      },
    });

    return NextResponse.json(updatedVariant, { status: 200 });
  } catch (error: any) {
    console.error("Error updating product variant:", error);
    return NextResponse.json(
      { error: "Failed to update product variant", details: error.message },
      { status: 500 }
    );
  }
}


// DELETE: Delete a product variant
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "1", 10);
    await prisma.productVariant.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "Product variant deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting product variant:", error);
    return NextResponse.json({ error: "Failed to delete product variant" }, { status: 500 });
  }
}
