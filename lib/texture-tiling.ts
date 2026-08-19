import * as THREE from "three";

/**
 * How many times one texture tile repeats across the model's longest dimension.
 *
 * This is THE knob for texture scale. A GLB's UV layout typically maps each
 * panel across roughly the full 0..1 UV range, so a repeat of (1,1) blows a
 * single tile up over an entire panel — which reads as stretched, oversized
 * grain. Raise this number for finer grain, lower it for coarser.
 */
export const TEXTURE_TILES_ACROSS_MODEL = 8;

/** Sampling cap when measuring UV density on dense meshes. */
const UV_AREA_SAMPLE_LIMIT = 2000;

/**
 * World units covered by one unit of UV space, derived from the ratio of
 * world-space triangle area to UV-space triangle area.
 *
 * Using an area ratio (rather than a bounding-box ratio) yields a single
 * isotropic figure, so the tiling it produces is square in world space — the
 * texture cannot end up stretched along one axis. It also absorbs the model
 * group's non-uniform scale, since the world matrix is applied to positions.
 *
 * Returns null when the mesh has no UVs or degenerate UV area.
 */
export function computeUvScale(mesh: THREE.Mesh): number | null {
  const geometry = mesh.geometry;
  const position = geometry.getAttribute("position");
  const uv = geometry.getAttribute("uv");
  if (!position || !uv) return null;

  const index = geometry.getIndex();
  const triangleCount = Math.floor((index ? index.count : position.count) / 3);
  if (triangleCount < 1) return null;

  mesh.updateWorldMatrix(true, false);
  const matrix = mesh.matrixWorld;

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();

  const step = Math.max(1, Math.floor(triangleCount / UV_AREA_SAMPLE_LIMIT));
  let worldArea = 0;
  let uvArea = 0;

  for (let t = 0; t < triangleCount; t += step) {
    const base = t * 3;
    const i0 = index ? index.getX(base) : base;
    const i1 = index ? index.getX(base + 1) : base + 1;
    const i2 = index ? index.getX(base + 2) : base + 2;

    a.fromBufferAttribute(position as THREE.BufferAttribute, i0).applyMatrix4(matrix);
    b.fromBufferAttribute(position as THREE.BufferAttribute, i1).applyMatrix4(matrix);
    c.fromBufferAttribute(position as THREE.BufferAttribute, i2).applyMatrix4(matrix);
    worldArea += ab.subVectors(b, a).cross(ac.subVectors(c, a)).length() * 0.5;

    // getX/getY work for both BufferAttribute and InterleavedBufferAttribute.
    const uAx = uv.getX(i0);
    const uAy = uv.getY(i0);
    const uBx = uv.getX(i1);
    const uBy = uv.getY(i1);
    const uCx = uv.getX(i2);
    const uCy = uv.getY(i2);
    uvArea += Math.abs((uBx - uAx) * (uCy - uAy) - (uCx - uAx) * (uBy - uAy)) * 0.5;
  }

  if (uvArea <= 1e-9 || worldArea <= 0) return null;
  return Math.sqrt(worldArea / uvArea);
}

/** Cached per mesh — UV density does not change once the model is placed. */
export function getUvScale(mesh: THREE.Mesh): number | null {
  if (mesh.userData._uvScale === undefined) {
    mesh.userData._uvScale = computeUvScale(mesh);
  }
  return mesh.userData._uvScale as number | null;
}

/** Drop cached UV density, e.g. after the model is rescaled or repositioned. */
export function clearUvScaleCache(root: THREE.Object3D) {
  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) delete child.userData._uvScale;
  });
}

/**
 * Sets `repeat` so one tile occupies `modelSize / TEXTURE_TILES_ACROSS_MODEL`
 * world units, correcting for non-square source images so texels stay square.
 */
export function applyTiling(texture: THREE.Texture, mesh: THREE.Mesh, modelSize: number) {
  const uvScale = getUvScale(mesh);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  // When UV density cannot be measured, fall back to tiling across the panel's
  // 0..1 UV range. Still far closer to correct than the (1,1) that stretched a
  // single tile over an entire panel.
  const repeat =
    uvScale && modelSize
      ? uvScale / (modelSize / TEXTURE_TILES_ACROSS_MODEL)
      : TEXTURE_TILES_ACROSS_MODEL;

  // A 2:1 image must cover twice the width per tile, hence half the repeats in U.
  const image = texture.image as { width?: number; height?: number } | undefined;
  const aspect = image?.width && image?.height ? image.width / image.height : 1;

  texture.repeat.set(repeat / aspect, repeat);
  texture.needsUpdate = true;
}
