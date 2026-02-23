import { prisma } from "@/lib/prisma";
import { ok, bad, server, requireAdmin } from "@/lib/api-helpers";
import { ProductCreateSchema } from "@/lib/validators";
import { unstable_cache, revalidateTag } from "next/cache";

// Cache product fetch for 1 hour (3600 seconds)
const getCachedProduct = (id: string) =>
  unstable_cache(
    async () => {
      return prisma.product.findUnique({
        where: { id }
      });
    },
    [`product-${id}`],
    { revalidate: 3600, tags: [`product-${id}`] }
  )();

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;

    // Find the product using cached function
    const product = await getCachedProduct(id);

    if (!product) {
      return bad("Product not found", 404);
    }

    const response = ok(product);
    // Add cache headers for the browser/CDN (1 hour)
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=59');

    return response;
  } catch (e) {
    console.error("GET product error:", e);
    return server(e);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    // Validate the request body
    const parsed = ProductCreateSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.message);
    const d = parsed.data;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });
    if (!existingProduct) {
      return bad("Product not found", 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Update the product
      const product = await tx.product.update({
        where: { id },
        data: {
          title: d.title,
          vendor: d.vendor ?? null,
          description: d.description,
          metaTitle: d.metaTitle,
          metaDescription: d.metaDescription,
          metaKeywords: d.metaKeywords,
          price: d.price,
          currency: d.currency,
          compareAtPrice: d.compareAtPrice ?? null,
          assets: d.assets ?? {
            glb: { url: d.glbUrl, lighting: body.glbLighting, environment: body.glbEnvironment },
            thumbnail: d.thumbnailUrl
          },
          selectedMaterials: d.selectedMaterials ?? undefined,
          selectedStyles: d.selectedStyles ?? undefined,
          selectedSoles: d.selectedSoles ?? undefined,
          isActive: d.isActive ?? true
        }
      });

      return product;
    });

    // Invalidate product cache
    revalidateTag(`product-${id}`);

    return ok(updated);
  } catch (e: any) {
    console.error("PUT product error:", e);
    if (e?.code === 401 || e?.code === 403) return bad(e.message, e.code);
    return server(e);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const { id } = params;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });
    if (!existingProduct) {
      return bad("Product not found", 404);
    }

    // Check if product is referenced in any orders
    const orderItems = await prisma.orderItem.findFirst({
      where: { productId: id }
    });
    if (orderItems) {
      return bad("Cannot delete product that is referenced in orders. Consider deactivating it instead.", 400);
    }

    // Delete the product
    await prisma.product.delete({
      where: { id }
    });

    // Invalidate product cache
    revalidateTag(`product-${id}`);

    return ok({ message: "Product deleted successfully" });
  } catch (e: any) {
    console.error("DELETE product error:", e);
    if (e?.code === 401 || e?.code === 403) return bad(e.message, e.code);
    return server(e);
  }
}
