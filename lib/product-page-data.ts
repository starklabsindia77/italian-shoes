import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

/**
 * Server-side data for the public product page. Mirrors what the page used to
 * assemble client-side from /api/products/[id], /api/sizes and /api/panels
 * (same shapes, same default pagination of 20), and shares those routes' cache
 * tags so admin writes invalidate this page too.
 */

export const getCachedProduct = (id: string) =>
  unstable_cache(
    async () => {
      return prisma.product.findUnique({
        where: { id },
      });
    },
    [`product-${id}`],
    { revalidate: 3600, tags: [`product-${id}`] }
  )();

export const getCachedSizes = () =>
  unstable_cache(
    async () => {
      const where = { isActive: true } as const;
      const [items, total] = await Promise.all([
        prisma.size.findMany({
          where,
          orderBy: [{ sortOrder: "asc" }, { value: "asc" }],
          take: 20,
        }),
        prisma.size.count({ where }),
      ]);
      return { items, total, limit: 20 };
    },
    ["sizes-product-page"],
    { revalidate: 3600, tags: ["sizes"] }
  )();

export const getCachedPanels = () =>
  unstable_cache(
    async () => {
      const [items, total] = await Promise.all([
        prisma.panel.findMany({
          take: 20,
          orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        }),
        prisma.panel.count(),
      ]);
      return { items, total, limit: 20 };
    },
    ["panels-product-page"],
    { revalidate: 3600, tags: ["panels"] }
  )();
