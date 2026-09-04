/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";
import { preload } from "react-dom";
import {
  getCachedProduct,
  getCachedSizes,
  getCachedPanels,
} from "@/lib/product-page-data";
import { getAssetUrl } from "@/lib/utils";
import ProductBuilder from "./product-builder";

/**
 * Server component: fetches everything the builder needs in one parallel pass
 * so the client no longer pays the hydrate-then-fetch waterfall, and the GLB
 * URL is known at first paint.
 */
export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, sizes, panels] = await Promise.all([
    getCachedProduct(id),
    getCachedSizes(),
    getCachedPanels(),
  ]);

  if (!product) notFound();

  // Same GLB resolution the client viewer performs; done here too so the
  // browser starts downloading the model from the initial HTML, overlapping
  // the JS/hydration phase. `crossOrigin: "anonymous"` matches three.js's
  // FileLoader fetch (mode cors, credentials same-origin) for both local
  // /models paths and CloudFront URLs — without it the preload wouldn't match
  // and the file would download twice.
  const assets = product.assets as { glb?: { url?: string } } | null;
  const fallbackGlb =
    ((product.selectedSoles as any[]) || []).find((so: any) => so?.glbUrl)
      ?.glbUrl ||
    ((product.selectedStyles as any[]) || []).find((st: any) => st?.glbUrl)
      ?.glbUrl;
  const glbUrl = getAssetUrl(assets?.glb?.url || fallbackGlb);
  if (glbUrl) preload(glbUrl, { as: "fetch", crossOrigin: "anonymous" });
  preload("/hdri/studio_small_08_1k.hdr", {
    as: "fetch",
    crossOrigin: "anonymous",
  });

  return (
    <ProductBuilder
      id={id}
      productData={product}
      sizesData={sizes}
      panelsData={panels}
    />
  );
}
