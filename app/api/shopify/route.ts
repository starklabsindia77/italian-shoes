import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

type ResponseData = {
  success: boolean;
  data?: any;
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
): Promise<void> {
  try {
    if (req.method === "GET") {
      // Fetch all Shopify_Custom_Collection data
      const collections = await prisma.shopifyProduct.findMany();

      return res.status(200).json({
        success: true,
        data: collections,
      });
    } else {
      // Handle unsupported HTTP methods
      res.setHeader("Allow", ["GET"]);
      return res.status(405).json({
        success: false,
        message: `Method ${req.method} Not Allowed`,
      });
    }
  } catch (error) {
    console.error("Error fetching collections:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}