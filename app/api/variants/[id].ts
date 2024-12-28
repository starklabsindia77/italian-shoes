import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID parameter' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const variant = await prisma.variant.findUnique({
          where: { id: parseInt(id) },
          include: { product: true, VariantProduct: true },
        });
        if (!variant) return res.status(404).json({ error: 'Variant not found' });
        res.status(200).json(variant);
      } catch (error) {
        res.status(500).json({ error: 'Error fetching variant' });
      }
      break;

    case 'PUT':
      try {
        const { title, sku, price, inventoryQuantity, inventoryPolicy, inventoryItemId, productId } = req.body;
        const updatedVariant = await prisma.variant.update({
          where: { id: parseInt(id) },
          data: { title, sku, price, inventoryQuantity, inventoryPolicy, inventoryItemId, productId },
        });
        res.status(200).json(updatedVariant);
      } catch (error) {
        res.status(500).json({ error: 'Error updating variant' });
      }
      break;

    case 'DELETE':
      try {
        await prisma.variant.delete({ where: { id: parseInt(id) } });
        res.status(204).end();
      } catch (error) {
        res.status(500).json({ error: 'Error deleting variant' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
