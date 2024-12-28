import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      try {
        const { page = 1, pageSize = 10 } = req.query;

        // Convert query params to numbers
        const currentPage = parseInt(page as string, 10) || 1;
        const itemsPerPage = parseInt(pageSize as string, 10) || 10;

        // Fetch data with pagination
        const totalVariants = await prisma.variant.count();
        const variants = await prisma.variant.findMany({
          skip: (currentPage - 1) * itemsPerPage,
          take: itemsPerPage,
          include: { product: true, VariantProduct: true },
        });

        res.status(200).json({
          data: variants,
          meta: {
            totalItems: totalVariants,
            totalPages: Math.ceil(totalVariants / itemsPerPage),
            currentPage,
            itemsPerPage,
          },
        });
      } catch (error) {
        res.status(500).json({ error: 'Error fetching variants' });
      }
      break;

    case 'POST':
        try {
            const {
              title,
              sku,
              price,
              inventoryQuantity,
              inventoryPolicy,
              inventoryItemId,
              productId,
            } = req.body;
    
            // Generate a unique `variantId` if not provided
            const variantId = `VARIANT_${Date.now()}`; // Example ID generation logic
    
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
                  connect: { id: productId }, // Ensure the product exists in the database
                },
              },
            });
    
            res.status(201).json(newVariant);
          } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error creating variant', details: error });
          }
          break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
