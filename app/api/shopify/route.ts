
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
const prisma = new PrismaClient();

type ResponseData = {
  success: boolean;
  data?: any;
  message?: string;
};

export async function GET() {
  try {
    
    const collections = await prisma.shopifyProduct.findMany();

    return NextResponse.json({ message: "Shopify data sync completed", status: true, data: collections });
  } catch (error) {
    console.error("Error syncing Shopify data:", (error as Error).message);
    return NextResponse.json(
      { success: false,
        message: "Internal Server Error", },
      { status: 500 }
    );
  } 
}

