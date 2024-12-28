import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET Handler
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    // Fetch data with pagination
    const totalVariants = await prisma.variant.count();
    const variants = await prisma.variant.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { product: true, VariantProduct: true },
    });

    return NextResponse.json({
      data: variants,
      meta: {
        totalItems: totalVariants,
        totalPages: Math.ceil(totalVariants / pageSize),
        currentPage: page,
        itemsPerPage: pageSize,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error fetching variants' }, { status: 500 });
  }
}

// POST Handler
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      sku,
      price,
      inventoryQuantity,
      inventoryPolicy,
      inventoryItemId,
      productId,
    } = body;

    // Generate a unique `variantId` if not provided
    const variantId = `VARIANT_${Date.now()}`;

    const newVariant = await prisma.variant.create({
      data: {
        title,
        sku,
        price,
        inventoryQuantity,
        inventoryPolicy,
        inventoryItemId,
        variantId,
        product: {
          connect: { id: productId },
        },
      },
    });

    return NextResponse.json(newVariant, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error creating variant', details: error }, { status: 500 });
  }
}

// GET Handler for Specific Variant
export async function GETVariant(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
  
    if (isNaN(Number(id))) {
      return NextResponse.json({ error: 'Invalid ID parameter' }, { status: 400 });
    }
  
    try {
      const variant = await prisma.variant.findUnique({
        where: { id: parseInt(id) },
        include: { product: true, VariantProduct: true },
      });
      if (!variant) return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
      return NextResponse.json(variant);
    } catch (error) {
      return NextResponse.json({ error: 'Error fetching variant' }, { status: 500 });
    }
  }
  
  // PUT Handler for Specific Variant
  export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
  
    if (isNaN(Number(id))) {
      return NextResponse.json({ error: 'Invalid ID parameter' }, { status: 400 });
    }
  
    try {
      const body = await req.json();
      const { title, sku, price, inventoryQuantity, inventoryPolicy, inventoryItemId, productId } = body;
      const updatedVariant = await prisma.variant.update({
        where: { id: parseInt(id) },
        data: { title, sku, price, inventoryQuantity, inventoryPolicy, inventoryItemId, productId },
      });
      return NextResponse.json(updatedVariant);
    } catch (error) {
      return NextResponse.json({ error: 'Error updating variant' }, { status: 500 });
    }
  }
  
  // DELETE Handler for Specific Variant
  export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
  
    if (isNaN(Number(id))) {
      return NextResponse.json({ error: 'Invalid ID parameter' }, { status: 400 });
    }
  
    try {
      await prisma.variant.delete({ where: { id: parseInt(id) } });
      return NextResponse.json(null, { status: 204 });
    } catch (error) {
      return NextResponse.json({ error: 'Error deleting variant' }, { status: 500 });
    }
  }
  
  // Method not allowed handler
  export async function PATCH() {
    return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
  }
