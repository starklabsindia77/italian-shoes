/**
 * Camera framing maths for the 3D product viewer.
 *
 * Kept out of the component so it can be tested directly: get this wrong and the
 * model is either cropped at the edges or marooned in empty space.
 */

export type ModelDimensions = { x: number; y: number; z: number };

export type FitOptions = {
  /**
   * Fraction of the frame the model should span on its tighter axis.
   * 1 = touching the edges. Lower it to leave more breathing room — the
   * viewport's slider bar overlays the bottom, so a little margin is wanted.
   */
  fill?: number;
  /** Camera polar angle; the viewer locks this, so the sweep only varies azimuth. */
  polarAngle?: number;
  /** Azimuth samples around the turntable. */
  samples?: number;
};

type Vec3 = [number, number, number];

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
function norm(a: Vec3): Vec3 {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}

/** The 8 corners of the box, relative to its centre. */
function corners(dims: ModelDimensions): Vec3[] {
  const hx = dims.x / 2;
  const hy = dims.y / 2;
  const hz = dims.z / 2;
  const out: Vec3[] = [];
  for (let i = 0; i < 8; i++) {
    out.push([i & 1 ? hx : -hx, i & 2 ? hy : -hy, i & 4 ? hz : -hz]);
  }
  return out;
}

/**
 * Largest |NDC| the model reaches at `distance`, sampled right around the
 * turntable. 1 means it is exactly touching the frame edge; above 1 it is being
 * cut off.
 *
 * This projects the real corners rather than reasoning about extents, so it
 * accounts for perspective — a corner swung toward the camera sits much closer
 * than the centre and projects far wider than its half-extent suggests.
 */
export function worstCaseExtent(
  dims: ModelDimensions,
  fovDegrees: number,
  aspect: number,
  distance: number,
  polarAngle: number,
  samples: number
): number {
  const vFov = (fovDegrees * Math.PI) / 180;
  const tanV = Math.tan(vFov / 2);
  const tanH = tanV * aspect;
  const pts = corners(dims);

  let worst = 0;

  for (let i = 0; i < samples; i++) {
    const azimuth = (i / samples) * Math.PI * 2;
    const sinP = Math.sin(polarAngle);
    const cosP = Math.cos(polarAngle);

    // Camera position relative to the model centre.
    const cam: Vec3 = [
      distance * sinP * Math.sin(azimuth),
      distance * cosP,
      distance * sinP * Math.cos(azimuth),
    ];

    // View basis: forward points from the camera back at the centre.
    const forward = norm([-cam[0], -cam[1], -cam[2]]);
    const right = norm(cross(forward, [0, 1, 0]));
    const up = cross(right, forward);

    for (const p of pts) {
      const rel = sub(p, cam);
      const z = dot(rel, forward);
      if (z <= 1e-6) return Number.POSITIVE_INFINITY; // behind/at the camera
      const ndcX = dot(rel, right) / z / tanH;
      const ndcY = dot(rel, up) / z / tanV;
      worst = Math.max(worst, Math.abs(ndcX), Math.abs(ndcY));
    }
  }

  return worst;
}

/**
 * Distance at which the model spans `fill` of the frame on its tighter axis,
 * from every angle of the turntable.
 *
 * Found by bisection on the projected silhouette rather than from a bounding
 * sphere. A sphere around a long, flat shoe is far larger than the shoe itself,
 * so fitting it leaves the model looking marooned; measuring the actual
 * silhouette fills the frame without ever clipping.
 */
export function computeFitDistance(
  dims: ModelDimensions,
  fovDegrees: number,
  aspect: number,
  options: FitOptions = {}
): number {
  const { fill = 0.85, polarAngle = Math.PI / 2.2, samples = 48 } = options;

  const safeAspect = aspect > 0 && Number.isFinite(aspect) ? aspect : 1;
  const radius = 0.5 * Math.hypot(dims.x, dims.y, dims.z);
  if (radius <= 0) return 0;

  const extentAt = (d: number) =>
    worstCaseExtent(dims, fovDegrees, safeAspect, d, polarAngle, samples);

  // The bounding-sphere distance always fits, so it is a safe upper bound.
  const vFov = (fovDegrees * Math.PI) / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * safeAspect);
  let hi = Math.max(radius / Math.sin(vFov / 2), radius / Math.sin(hFov / 2));
  // ...but only if it really is under target; widen until it is.
  for (let i = 0; i < 20 && extentAt(hi) > fill; i++) hi *= 1.3;

  let lo = radius * 0.1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (extentAt(mid) > fill) lo = mid;
    else hi = mid;
  }

  return hi;
}
