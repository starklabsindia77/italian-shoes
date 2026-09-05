import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, prune, textureCompress, meshopt } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import sharp from "sharp";

/**
 * Compress a GLB: meshopt geometry (EXT_meshopt_compression) + WebP textures
 * capped at 1024px. Same recipe as `gltf-transform optimize --compress meshopt
 * --texture-compress webp --texture-size 1024`, which took the catalog models
 * from ~10MB to ~0.5-1MB. The viewer needs no changes: drei's useGLTF wires
 * the meshopt decoder by default, and GLTFLoader reads EXT_texture_webp.
 */
export async function optimizeGlb(input: Buffer): Promise<Buffer> {
  await MeshoptEncoder.ready;
  await MeshoptDecoder.ready;

  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      "meshopt.encoder": MeshoptEncoder,
      "meshopt.decoder": MeshoptDecoder,
    });

  const document = await io.readBinary(new Uint8Array(input));

  await document.transform(
    dedup(),
    prune(),
    textureCompress({ encoder: sharp, targetFormat: "webp", resize: [1024, 1024] }),
    meshopt({ encoder: MeshoptEncoder })
  );

  return Buffer.from(await io.writeBinary(document));
}
