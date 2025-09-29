import { prisma } from "@/lib/prisma";
import { ok, bad, server, pagination, getSearchParams, requireAdmin } from "@/lib/api-helpers";
import { ProductCreateSchema } from "@/lib/validators";

export async function GET(req: Request) {
  try {
    const sp = getSearchParams(req);
    const q = sp.get("q")?.trim();
    const { skip, limit } = pagination(req);
    const where = q ? { 
      OR: [
        { title: { contains: q, mode: "insensitive" as const } }, 
        { productId: { contains: q, mode: "insensitive" as const } }
      ] 
    } : {};
    const [items, total] = await Promise.all([
      prisma.product.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.product.count({ where })
    ]);
    return ok({ items, total, limit });
  } catch (e) { return server(e); }
}

export async function POST(req: Request) {
  try {
    // Require admin authentication
    const admin = await requireAdmin();
    if (!admin) return bad("Unauthorized", 401);

    const body = await req.json();
    console.log("Creating product with data:", body);
    const validatedData = ProductCreateSchema.parse(body);

    // Check if productId already exists
    const existingProduct = await prisma.product.findUnique({
      where: { productId: validatedData.productId }
    });
    if (existingProduct) {
      return bad("Product with this ID already exists", 400);
    }

    // Create the product with all related data
    const product = await prisma.product.create({
      data: {
        productId: validatedData.productId,
        title: validatedData.title,
        vendor: validatedData.vendor,
        description: validatedData.description ?? "",
        metaTitle: validatedData.metaTitle ?? "",
        metaDescription: validatedData.metaDescription ?? "",
        metaKeywords: validatedData.metaKeywords ?? "",
        price: validatedData.price,
        currency: validatedData.currency as any,
        compareAtPrice: validatedData.compareAtPrice,
        assets: validatedData.assets,
        selectedMaterials: validatedData.selectedMaterials ?? undefined,
        selectedStyles: validatedData.selectedStyles ?? undefined,
        selectedSoles: validatedData.selectedSoles ?? undefined,
        isActive: validatedData.isActive ?? true,
      },
    });

    return ok(product, 201);
  } catch (e) {
    console.error("POST product error:", e);
    if (e instanceof Error && e.name === 'ZodError') {
      return bad("Validation error", 400);
    }
    return server(e);
  }
}



