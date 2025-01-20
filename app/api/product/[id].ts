// /pages/api/product/[id].ts

import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  try {
    // Fetch the product by ID with related variants and SEO metadata
    const product = await prisma.shopifyProduct.findUnique({
      where: { id: parseInt(id as string, 10) },
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
      return res.status(404).json({ message: "Product not found" });
    }

    // Transform data if needed for the frontend
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
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
