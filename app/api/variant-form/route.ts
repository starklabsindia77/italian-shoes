import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const [sizes, styles, soles, materials, colors, panels] = await Promise.all([
      prisma.sizeOption.findMany({
        select: { id: true, sizeSystem: true, size: true, width: true },
      }),
      prisma.styleOption.findMany({
        select: { id: true, name: true, imageUrl: true },
      }),
      prisma.soleOption.findMany({
        select: { id: true, type: true, height: true },
      }),
      prisma.material.findMany({
        select: { id: true, name: true, description: true },
      }),
      prisma.color.findMany({
        select: { id: true, name: true, hexCode: true },
      }),
      prisma.panel.findMany({
        select: { id: true, name: true, description: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        sizes,
        styles,
        soles,
        materials,
        colors,
        panels,
      },
    });
  } catch (error) {
    console.error("Error fetching variant form data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch variant form data" },
      { status: 500 }
    );
  }
}
