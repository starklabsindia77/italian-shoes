"use client";

import React, {
  useEffect,
  useLayoutEffect,
  useState,
  Suspense,
  useRef,
  SetStateAction,
  useCallback,
  useMemo,
  memo,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Bounds, ContactShadows } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { Sun, Circle } from "lucide-react";
import { getAssetUrl } from "@/lib/utils";
import { applyTiling, clearUvScaleCache } from "@/lib/texture-tiling";

/* ============================================================================
   Types
   ========================================================================= */

interface TextureConfig {
  colorUrl?: string;
  normalUrl?: string;
  roughnessUrl?: string;
}

export interface ShoeAvatarRef {
  captureScreenshot: () => string | null;
}

interface AvatarProps {
  avatarData: string;
  objectList: THREE.Mesh[];
  setObjectList: React.Dispatch<React.SetStateAction<THREE.Mesh[]>>;
  selectedTextureMap?: Record<string, TextureConfig>;
  setIsTextureLoading?: React.Dispatch<SetStateAction<boolean>>;
}

interface AvatarSceneProps extends AvatarProps {
  roughness: number;
}

/* ============================================================================
   Constants
   ========================================================================= */

/** Baseline PBR values for the leather look. */
const LEATHER_PBR = {
  metalness: 0,
  roughness: 0.3,
  envMapIntensity: 2.6,
  reflectivity: 0.6,
  clearcoat: 0.55,
  clearcoatRoughness: 0.32,
} as const;

const DEFAULT_ROUGHNESS = LEATHER_PBR.roughness;
const DEFAULT_BRIGHTNESS = 1.15;

/** The GLB and the HDRI compete for bandwidth on first paint, so the canvas is
 *  revealed first and the environment map is attached a moment later. */
const CANVAS_REVEAL_MS = 1200;
const ENVIRONMENT_DELAY_MS = 3500;

/* ============================================================================
   Error boundary
   ========================================================================= */

class WebGLErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("WebGL Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full rounded-lg bg-gray-50">
          <div className="p-4 text-center">
            <p className="mb-3 text-sm text-gray-600">3D viewport unavailable</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="rounded border border-gray-200 bg-white px-4 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Reload viewport
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/* ============================================================================
   Texture helpers
   ========================================================================= */

function getFallbackColor(imageUrl: string | null | undefined): string {
  if (!imageUrl) return "#cccccc";
  const urlLower = imageUrl.toLowerCase();
  if (urlLower.includes("black")) return "#1a1a1a";
  if (urlLower.includes("brown") || urlLower.includes("coffee")) return "#5c4033";
  if (urlLower.includes("red") || urlLower.includes("burgundy")) return "#800020";
  if (urlLower.includes("orange")) return "#e65c00";
  if (urlLower.includes("white")) return "#f3f3f3";
  if (urlLower.includes("blue") || urlLower.includes("navy")) return "#000080";
  if (urlLower.includes("green") || urlLower.includes("olive")) return "#556b2f";
  if (urlLower.includes("grey") || urlLower.includes("gray")) return "#808080";
  if (urlLower.includes("pink")) return "#ffc0cb";
  if (urlLower.includes("yellow")) return "#ffd700";
  return "#d2b48c"; // tan/leather default
}

const textureLoader = new THREE.TextureLoader();
textureLoader.setCrossOrigin("anonymous");

const normalizePanelId = (name: string): string => {
  if (!name) return "";
  const lower = name.toLowerCase().trim().replace(/[\s_-]+/g, "");

  if (lower === "linning" || lower === "lining") return "lining";
  if (lower === "insole") return "insole";
  if (lower === "sole") return "sole";
  if (lower === "upper") return "upper";
  if (lower === "stretch") return "stretch";
  if (lower === "tounge" || lower === "tongue") return "tongue";
  if (lower === "stiches" || lower === "stiching" || lower === "stitching") return "stitching";
  if (lower === "shoelaces" || lower === "shoelace" || lower.includes("laces") || lower.includes("lace")) return "shoelaces";
  if (lower.includes("toecap") || lower === "toe" || lower === "front") return "toe";
  if (lower.includes("backcap") || lower === "back") return "back";

  return lower;
};

/* ============================================================================
   Avatar — model, materials, textures
   ========================================================================= */

const Avatar: React.FC<AvatarSceneProps> = ({
  avatarData,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  objectList: _objectList,
  setObjectList,
  selectedTextureMap = {},
  setIsTextureLoading,
  roughness,
}) => {
  const gltf = useGLTF(avatarData || "");
  const { scene } = gltf as { scene: THREE.Group };

  const meshRef = useRef<THREE.Group>(null);
  const prevTextureMapRef = useRef<string>("");
  const isMountedRef = useRef(true);

  /** One decoded image per URL. Clones below share its GPU upload. */
  const textureCacheRef = useRef<Map<string, THREE.Texture>>(new Map());
  /**
   * `repeat` lives on the Texture, not the Material, so meshes needing different
   * tiling cannot share one Texture instance — the last writer would win. Each
   * mesh gets a lightweight clone (shared `source`, own UV transform).
   */
  const meshTextureCacheRef = useRef<Map<string, THREE.Texture>>(new Map());
  const originalMapRef = useRef<WeakMap<THREE.Material, THREE.Texture | null>>(new WeakMap());
  const pendingLoadsRef = useRef(0);
  const modelSizeRef = useRef(0);

  const getTextureConfig = useCallback(
    (meshName: string) => {
      if (!selectedTextureMap) return undefined;
      const direct = selectedTextureMap[meshName];
      if (direct) return direct;

      const normalizedMesh = normalizePanelId(meshName);
      for (const key of Object.keys(selectedTextureMap)) {
        if (normalizePanelId(key) === normalizedMesh) {
          return selectedTextureMap[key];
        }
      }
      return undefined;
    },
    [selectedTextureMap]
  );

  const setLoading = useCallback(
    (isLoading: boolean) => {
      if (isMountedRef.current) {
        setIsTextureLoading?.(isLoading);
      }
    },
    [setIsTextureLoading]
  );

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    const baseCache = textureCacheRef.current;
    const meshCache = meshTextureCacheRef.current;
    return () => {
      isMountedRef.current = false;
      meshCache.forEach((texture) => texture.dispose());
      meshCache.clear();
      baseCache.forEach((texture) => texture.dispose());
      baseCache.clear();
    };
  }, []);

  // --- Center + scale ---
  useLayoutEffect(() => {
    if (!scene || !meshRef.current || !isMountedRef.current) return;

    try {
      meshRef.current.scale.set(27, 28, 31);

      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      meshRef.current.position.set(-center.x, -center.y, -center.z);
    } catch (error) {
      console.error("Error setting up scene positioning:", error);
    }
  }, [scene]);

  // --- Ground on Y=0, and record world size for texture tiling ---
  useLayoutEffect(() => {
    if (!meshRef.current || !isMountedRef.current) return;

    try {
      const scaledBox = new THREE.Box3().setFromObject(meshRef.current);
      meshRef.current.position.y -= scaledBox.min.y;

      // Longest world dimension: the reference for one texture tile's size.
      const size = scaledBox.getSize(new THREE.Vector3());
      modelSizeRef.current = Math.max(size.x, size.y, size.z);

      // UV density is measured against the world matrix, so drop any cached
      // values computed before this scale/position pass.
      clearUvScaleCache(meshRef.current);
    } catch (error) {
      console.error("Error setting ground position:", error);
    }
  }, [scene]);

  // --- Material setup: clone per mesh so customisation is isolated ---
  useLayoutEffect(() => {
    if (!scene || !isMountedRef.current) return;

    try {
      scene.traverse((o: THREE.Object3D) => {
        if (!(o instanceof THREE.Mesh) || !o.material) return;
        let mat = o.material as THREE.MeshStandardMaterial;

        if (!mat.userData.isCloned) {
          const originalMat = mat;
          mat = originalMat.clone();
          mat.userData.isCloned = true;
          o.material = mat;
          originalMapRef.current.set(mat, originalMat.map ?? null);
        }

        mat.metalness = LEATHER_PBR.metalness;
        mat.roughness = LEATHER_PBR.roughness;
        mat.envMapIntensity = LEATHER_PBR.envMapIntensity;
        (mat as unknown as { reflectivity: number }).reflectivity = LEATHER_PBR.reflectivity;
        (mat as unknown as { clearcoat: number }).clearcoat = LEATHER_PBR.clearcoat;
        (mat as unknown as { clearcoatRoughness: number }).clearcoatRoughness =
          LEATHER_PBR.clearcoatRoughness;
        mat.needsUpdate = true;

        const texConfig = getTextureConfig(o.name);
        const mesh = o;
        // Normal and roughness detail must tile identically to the colour map,
        // otherwise the grain and its shading drift apart.
        if (texConfig?.normalUrl) {
          try {
            const normalMap = textureLoader.load(getAssetUrl(texConfig.normalUrl), (loaded) =>
              applyTiling(loaded, mesh, modelSizeRef.current)
            );
            normalMap.flipY = false;
            applyTiling(normalMap, mesh, modelSizeRef.current);
            mat.normalMap = normalMap;
          } catch (error) {
            console.error(`Error loading normal map for ${o.name}:`, error);
          }
        }
        if (texConfig?.roughnessUrl) {
          try {
            const roughnessMap = textureLoader.load(getAssetUrl(texConfig.roughnessUrl), (loaded) =>
              applyTiling(loaded, mesh, modelSizeRef.current)
            );
            roughnessMap.flipY = false;
            applyTiling(roughnessMap, mesh, modelSizeRef.current);
            mat.roughnessMap = roughnessMap;
          } catch (error) {
            console.error(`Error loading roughness map for ${o.name}:`, error);
          }
        }
      });
    } catch (error) {
      console.error("Error enhancing materials:", error);
    }
  }, [scene, getTextureConfig]);

  /* --- Roughness control -------------------------------------------------
     Runs as an effect (not a layout effect) so it always lands after the
     material setup above, which resets roughness to the leather baseline.
     Re-applies on texture change for the same reason. */
  useEffect(() => {
    if (!scene || !isMountedRef.current) return;

    scene.traverse((child: THREE.Object3D) => {
      if (!(child instanceof THREE.Mesh)) return;
      const mat = child.material as THREE.MeshStandardMaterial;
      if (!mat) return;

      mat.roughness = roughness;
      mat.needsUpdate = true;
    });
  }, [scene, roughness, selectedTextureMap]);

  // --- Collect meshes for UI ---
  useEffect(() => {
    if (!scene || !isMountedRef.current) return;

    try {
      const children: THREE.Mesh[] = [];
      scene.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) children.push(child);
      });

      setObjectList((prev: THREE.Mesh[]) => {
        const prevNames = prev?.map((o) => o.name).sort().join(",");
        const newNames = children.map((o) => o.name).sort().join(",");
        return prevNames === newNames ? prev : children;
      });
    } catch (error) {
      console.error("Error collecting meshes:", error);
    }
  }, [scene, setObjectList]);

  // --- Texture loading ---
  const beginLoad = useCallback(() => {
    if (isMountedRef.current) {
      pendingLoadsRef.current += 1;
      setLoading(true);
    }
  }, [setLoading]);

  const endLoad = useCallback(() => {
    if (isMountedRef.current) {
      pendingLoadsRef.current = Math.max(0, pendingLoadsRef.current - 1);
      if (pendingLoadsRef.current === 0) setLoading(false);
    }
  }, [setLoading]);

  const getTexture = useCallback(
    (url: string, onLoad?: () => void, onError?: (error: unknown) => void) => {
      const cache = textureCacheRef.current;
      const cached = cache.get(url);
      if (cached) {
        onLoad?.();
        return cached;
      }

      beginLoad();
      try {
        const tex = textureLoader.load(
          url,
          () => {
            endLoad();
            onLoad?.();
          },
          undefined,
          (error: unknown) => {
            // Drop from cache so a retry can re-request.
            cache.delete(url);

            let errorMessage = "Unknown error";
            if (error && typeof error === "object" && "target" in error) {
              const target = (error as { target: { src?: string } }).target;
              if (target?.src) errorMessage = `Failed to load image from source: ${target.src}`;
            } else if (error instanceof Error) {
              errorMessage = error.message;
            }
            console.error(`Texture load failed for ${url}: ${errorMessage}`);
            endLoad();
            onError?.(error);
          }
        );
        tex.flipY = false;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 16;
        // applyTiling() later sets the authoritative mirrored wrap; keep the
        // base texture consistent with it.
        tex.wrapS = THREE.MirroredRepeatWrapping;
        tex.wrapT = THREE.MirroredRepeatWrapping;
        cache.set(url, tex);
        return tex;
      } catch (error) {
        console.error(`Error creating texture for ${url}:`, error);
        endLoad();
        onError?.(error);
        return null;
      }
    },
    [beginLoad, endLoad]
  );

  // --- Texture swapping ---
  useEffect(() => {
    const currentMapStr = JSON.stringify(selectedTextureMap || {});
    if (!scene || currentMapStr === prevTextureMapRef.current || !isMountedRef.current) return;

    try {
      scene.traverse((child: THREE.Object3D) => {
        if (!(child instanceof THREE.Mesh)) return;
        const mat = child.material as THREE.MeshStandardMaterial;
        if (!mat) return;

        const texConfig = getTextureConfig(child.name);
        const textureUrl: string | undefined = texConfig?.colorUrl;
        const original = originalMapRef.current.get(mat) ?? null;

        if (!textureUrl) {
          if (mat.map !== original) {
            mat.map = original;
            mat.color.set("#ffffff");
            mat.needsUpdate = true;
          }
          return;
        }

        const appliedUrl = (mat.map as unknown as { userData?: { _appliedUrl?: string } })?.userData
          ?._appliedUrl;
        if (appliedUrl === textureUrl) return;

        mat.color.set("#ffffff");

        const mesh = child;
        const resolvedUrl = getAssetUrl(textureUrl);
        const meshKey = `${mesh.uuid}|${resolvedUrl}`;

        let base: THREE.Texture | null = null;
        try {
          base = getTexture(
            resolvedUrl,
            () => {
              // The image is decoded now, so the aspect correction is finally
              // knowable — retile every clone drawn from this URL.
              meshTextureCacheRef.current.forEach((clone, key) => {
                if (!key.endsWith(`|${resolvedUrl}`)) return;
                const owner = clone.userData._ownerMesh as THREE.Mesh | undefined;
                if (owner) applyTiling(clone, owner, modelSizeRef.current);
              });
            },
            () => {
              mat.map = null;
              mat.color.set(getFallbackColor(textureUrl));
              mat.needsUpdate = true;
            }
          );
        } catch (e) {
          console.error(`Error loading texture for "${mesh.name}":`, e);
        }

        if (base) {
          let tex = meshTextureCacheRef.current.get(meshKey);
          if (!tex) {
            // Shares `source` with the base, so no second GPU upload.
            tex = base.clone();
            tex.userData = { ...tex.userData, _appliedUrl: textureUrl, _ownerMesh: mesh };
            meshTextureCacheRef.current.set(meshKey, tex);
          }

          // Preserve the GLB's UV orientation, but derive scale ourselves —
          // copying the original `repeat` is what stretched one tile over a
          // whole panel.
          const prevMap = original;
          if (prevMap) {
            tex.center.copy(prevMap.center);
            tex.rotation = prevMap.rotation;
          }
          applyTiling(tex, mesh, modelSizeRef.current);

          mat.map = tex;
          mat.needsUpdate = true;
        } else {
          mat.map = null;
          mat.color.set(getFallbackColor(textureUrl));
          mat.needsUpdate = true;
        }
      });

      prevTextureMapRef.current = currentMapStr;
    } catch (error) {
      console.error("Error swapping textures:", error);
    }
  }, [selectedTextureMap, scene, getTexture, getTextureConfig]);

  if (!avatarData || !scene) return null;

  return (
    <group ref={meshRef}>
      <primitive object={scene} />
    </group>
  );
};

/* ============================================================================
   Viewport plumbing
   ========================================================================= */

/** Drives renderer exposure from the Brightness slider. */
const BrightnessControl: React.FC<{ value: number }> = ({ value }) => {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    gl.toneMappingExposure = value;
  }, [gl, value]);
  return null;
};

/** Slow turntable until the user takes hold of the model. */
const Turntable: React.FC<{
  enabled: boolean;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}> = ({ enabled, controlsRef }) => {
  useFrame((_state, delta) => {
    if (!enabled || !controlsRef.current) return;
    const controls = controlsRef.current;

    const target = controls.target;
    const relativePos = new THREE.Vector3().copy(controls.object.position).sub(target);
    relativePos.applyAxisAngle(new THREE.Vector3(0, 1, 0), delta * 0.4);

    controls.object.position.copy(target).add(relativePos);
    controls.update();
  });

  return null;
};

/* ============================================================================
   Viewport chrome
   ========================================================================= */

const ViewportSlider: React.FC<{
  label: string;
  icon: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
  onReset: () => void;
}> = ({ label, icon, value, min, max, step, display, onChange, onReset }) => (
  <div className="flex items-center gap-2 px-1">
    <span className="text-gray-400" aria-hidden>
      {icon}
    </span>
    <span
      className="hidden text-[10px] uppercase tracking-[0.12em] text-gray-500 sm:inline"
      onDoubleClick={onReset}
      title={`${label} — double-click to reset`}
    >
      {label}
    </span>
    <input
      type="range"
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      onDoubleClick={onReset}
      className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-gray-200 accent-red-500 sm:w-24"
    />
    <span className="w-8 shrink-0 text-right font-mono text-[10px] tabular-nums text-gray-500">
      {display}
    </span>
  </div>
);

const DomSpinner: React.FC = () => (
  <div
    aria-label="Loading"
    className="h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-red-500"
  />
);

/* ============================================================================
   ShoeAvatar — the viewport shell
   ========================================================================= */

const ShoeAvatar = React.forwardRef<ShoeAvatarRef, AvatarProps>(
  ({ avatarData, objectList, setObjectList, selectedTextureMap }, ref) => {
    const [isReady, setIsReady] = useState(false);
    const [isEnvReady, setIsEnvReady] = useState(false);
    const [autoRetryCount, setAutoRetryCount] = useState(0);
    const [isTextureLoading, setIsTextureLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const glRef = useRef<THREE.WebGLRenderer | null>(null);

    // The only two viewport controls.
    const [roughness, setRoughness] = useState<number>(DEFAULT_ROUGHNESS);
    const [brightness, setBrightness] = useState<number>(DEFAULT_BRIGHTNESS);

    const [isAutoSpinning, setIsAutoSpinning] = useState(true);

    const controlsRef = useRef<OrbitControlsImpl | null>(null);

    React.useImperativeHandle(ref, () => ({
      captureScreenshot: () => glRef.current?.domElement.toDataURL("image/png") ?? null,
    }));

    useEffect(() => {
      if (!avatarData || avatarData === "") setHasError(false);
    }, [avatarData]);

    useEffect(() => {
      const revealTimer = setTimeout(() => setIsReady(true), CANVAS_REVEAL_MS);
      const envTimer = setTimeout(() => setIsEnvReady(true), ENVIRONMENT_DELAY_MS);
      return () => {
        clearTimeout(revealTimer);
        clearTimeout(envTimer);
      };
    }, []);

    const canvasStyle = useMemo(
      () => ({ width: "100%", height: "100%", display: isReady ? "block" : ("none" as const) }),
      [isReady]
    );

    if (!isReady) {
      return (
        <div className="flex h-[350px] items-center justify-center rounded-lg bg-gray-50 sm:h-[450px] md:h-[550px] lg:h-[600px]">
          <DomSpinner />
        </div>
      );
    }

    if (hasError) {
      return (
        <div className="flex h-[350px] flex-col items-center justify-center rounded-lg bg-gray-50 sm:h-[450px] md:h-[550px] lg:h-[600px]">
          <div className="p-4 text-center">
            <p className="mb-3 text-sm text-gray-600">Failed to load 3D model</p>
            <button
              onClick={() => {
                setHasError(false);
                window.dispatchEvent(new Event("resize"));
              }}
              className="cursor-pointer rounded border border-gray-200 bg-white px-4 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return (
      <WebGLErrorBoundary>
        <div className="relative h-[350px] w-full select-none sm:h-[450px] md:h-[550px] lg:h-[600px]">
          {isTextureLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-white/70">
              <DomSpinner />
            </div>
          )}

          <Canvas
            shadows
            gl={{
              antialias: true,
              // Transparent canvas so the viewport shows the page behind it
              // instead of the renderer's default black clear colour.
              alpha: true,
              powerPreference: "high-performance",
              preserveDrawingBuffer: true,
              failIfMajorPerformanceCaveat: false,
            }}
            dpr={[1, 2]}
            style={canvasStyle}
            camera={{ position: [2.2, 0.5, 0.001], fov: 50 }}
            onCreated={({ gl }: { gl: THREE.WebGLRenderer }) => {
              glRef.current = gl;
              try {
                gl.outputColorSpace = THREE.SRGBColorSpace;
                gl.toneMapping = THREE.ACESFilmicToneMapping;
                gl.toneMappingExposure = brightness;
                gl.setClearAlpha(0);
                gl.shadowMap.enabled = true;
                gl.shadowMap.type = THREE.PCFSoftShadowMap;

                const canvas = gl.getContext().canvas;
                canvas.addEventListener("webglcontextlost", (e) => {
                  e.preventDefault();
                  console.warn("WebGL context lost. Attempting auto-recovery...");

                  if (autoRetryCount < 1) {
                    setAutoRetryCount((prev) => prev + 1);
                    setIsReady(false);
                    setIsEnvReady(false);
                    setTimeout(() => setIsReady(true), 500);
                  } else {
                    setHasError(true);
                  }
                });

                canvas.addEventListener("webglcontextrestored", () => setHasError(false));
              } catch (error) {
                console.error("Error setting up WebGL renderer:", error);
                setHasError(true);
              }
            }}
          >
            <BrightnessControl value={brightness} />

            <ambientLight intensity={0.3} />
            <directionalLight
              position={[2, 6, 5]}
              intensity={1.6}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
            <directionalLight position={[-5, 3, 5]} intensity={0.6} />
            <directionalLight position={[0, 5, -6]} intensity={0.8} color="#fff" />

            {isEnvReady && (
              <Environment files="/hdri/studio_small_08_4k.hdr" background={false} />
            )}

            <ContactShadows
              position={[0, 0.001, 0]}
              opacity={0.5}
              scale={6}
              blur={2.4}
              far={2}
              resolution={512}
              color="#000000"
            />

            <Suspense fallback={null}>
              <Bounds margin={1.1}>
                <Avatar
                  avatarData={avatarData}
                  objectList={objectList}
                  setObjectList={setObjectList}
                  selectedTextureMap={selectedTextureMap}
                  setIsTextureLoading={setIsTextureLoading}
                  roughness={roughness}
                />
              </Bounds>
            </Suspense>

            <Turntable enabled={isAutoSpinning} controlsRef={controlsRef} />

            <OrbitControls
              ref={controlsRef}
              enablePan={false}
              enableZoom
              minDistance={1.2}
              maxDistance={5}
              target={[0, 0.5, 0]}
              enableDamping
              dampingFactor={0.08}
              minPolarAngle={Math.PI / 2.2}
              maxPolarAngle={Math.PI / 2.2}
              onStart={() => setIsAutoSpinning(false)}
            />
          </Canvas>

          {/* Roughness + Brightness */}
          <div className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2">
            <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-white/90 p-1.5 shadow-sm backdrop-blur-sm">
              <ViewportSlider
                label="Roughness"
                icon={<Circle className="size-3.5" />}
                value={roughness}
                min={0}
                max={1}
                step={0.01}
                display={roughness.toFixed(2)}
                onChange={setRoughness}
                onReset={() => setRoughness(DEFAULT_ROUGHNESS)}
              />
              <div className="mx-0.5 h-5 w-px bg-gray-200" />
              <ViewportSlider
                label="Brightness"
                icon={<Sun className="size-3.5" />}
                value={brightness}
                min={0.3}
                max={2.5}
                step={0.05}
                display={brightness.toFixed(2)}
                onChange={setBrightness}
                onReset={() => setBrightness(DEFAULT_BRIGHTNESS)}
              />
            </div>
          </div>
        </div>
      </WebGLErrorBoundary>
    );
  }
);

ShoeAvatar.displayName = "ShoeAvatar";

export default memo(ShoeAvatar);
