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
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Bounds } from "@react-three/drei";
import * as THREE from "three";
import { getAssetUrl } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TextureConfig {
  colorUrl?: string;
  normalUrl?: string;
  roughnessUrl?: string;
}

interface AvatarProps {
  avatarData: string;
  objectList: THREE.Mesh[];
  setObjectList: React.Dispatch<React.SetStateAction<THREE.Mesh[]>>;
  selectedTextureMap?: Record<string, TextureConfig>;
  setIsTextureLoading?: React.Dispatch<SetStateAction<boolean>>;
}

// Error boundary component for WebGL errors
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
        <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
          <div className="text-center p-4">
            <p className="text-gray-600 mb-2">
              3D Viewer temporarily unavailable
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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

const Avatar: React.FC<AvatarProps> = ({
  avatarData,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  objectList: _objectList,
  setObjectList,
  selectedTextureMap = {},
  setIsTextureLoading,
}) => {
  const gltf = useGLTF(avatarData || "");
  const { scene } = gltf as { scene: THREE.Group };

  const meshRef = useRef<THREE.Group>(null);
  const prevTextureMapRef = useRef<string>("");
  const isMountedRef = useRef(true);

  const textureCacheRef = useRef<Map<string, THREE.Texture>>(new Map());
  const originalMapRef = useRef<WeakMap<THREE.Material, THREE.Texture | null>>(
    new WeakMap()
  );
  const pendingLoadsRef = useRef(0);

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
    const currentCache = textureCacheRef.current;
    return () => {
      isMountedRef.current = false;
      // Clean up textures
      currentCache.forEach((texture) => {
        texture.dispose();
      });
      currentCache.clear();
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

  // --- Ground on Y=0 ---
  useLayoutEffect(() => {
    if (!meshRef.current || !isMountedRef.current) return;

    try {
      const scaledBox = new THREE.Box3().setFromObject(meshRef.current);
      const minY = scaledBox.min.y;
      meshRef.current.position.y -= minY;
    } catch (error) {
      console.error("Error setting ground position:", error);
    }
  }, [scene]); // Added scene as dependency to re-calculate on new model load

  // --- Material Enhancements ---
  useLayoutEffect(() => {
    if (!scene || !isMountedRef.current) return;

    try {
      scene.traverse((o: THREE.Object3D) => {
        if (o instanceof THREE.Mesh && o.material) {
          let mat = o.material as THREE.MeshStandardMaterial;

          // Clone material to isolate this mesh's customisation
          if (!mat.userData.isCloned) {
            const originalMat = mat;
            mat = originalMat.clone();
            mat.userData.isCloned = true;
            o.material = mat;

            // Save the original texture map reference
            originalMapRef.current.set(mat, originalMat.map ?? null);
          }

          // Leather-like tuning
          mat.metalness = 0;
          mat.roughness = 0.3;        // leather shine balance
          mat.envMapIntensity = 2.6;   // reflection strength
          (mat as unknown as { reflectivity: number }).reflectivity = 0.6;
          // subtle premium leather layer
          (mat as unknown as { clearcoat: number }).clearcoat = 0.55;
          (mat as unknown as { clearcoatRoughness: number }).clearcoatRoughness = 0.32;

          mat.needsUpdate = true;

          const texConfig = getTextureConfig(o.name);
          if (texConfig?.normalUrl) {
            try {
              const normalMap = textureLoader.load(getAssetUrl(texConfig.normalUrl));
              normalMap.flipY = false;
              mat.normalMap = normalMap;
            } catch (error) {
              console.error(`Error loading normal map for ${o.name}:`, error);
            }
          }
          if (texConfig?.roughnessUrl) {
            try {
              const roughnessMap = textureLoader.load(getAssetUrl(texConfig.roughnessUrl));
              roughnessMap.flipY = false;
              mat.roughnessMap = roughnessMap;
            } catch (error) {
              console.error(
                `Error loading roughness map for ${o.name}:`,
                error
              );
            }
          }
        }
      });
    } catch (error) {
      console.error("Error enhancing materials:", error);
    }
  }, [scene, getTextureConfig]);

  // --- Collect meshes for UI ---
  useEffect(() => {
    if (!scene || !isMountedRef.current) return;

    try {
      const children: THREE.Mesh[] = [];
      scene.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          children.push(child);
        }
      });

      setObjectList((prev: THREE.Mesh[]) => {
        const prevNames = prev
          ?.map((o) => o.name)
          .sort()
          .join(",");
        const newNames = children
          .map((o) => o.name)
          .sort()
          .join(",");
        return prevNames === newNames ? prev : children;
      });
    } catch (error) {
      console.error("Error collecting meshes:", error);
    }
  }, [scene, setObjectList]);

  // Texture loading functions
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
            // Remove from cache so subsequent clicks can retry
            cache.delete(url);

            let errorMessage = "Unknown error";
            if (error && typeof error === "object" && "target" in error) {
              const target = (error as { target: { src?: string } }).target;
              if (target?.src) {
                errorMessage = `Failed to load image from source: ${target.src}`;
              }
            } else if (error instanceof Error) {
              errorMessage = error.message;
            }
            console.error(`Texture Load Failed for ${url}. Details: ${errorMessage}`, error);
            endLoad();
            onError?.(error);
          }
        );
        tex.flipY = false;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 16;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
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
    console.log("STEP 3: Texture swapping useEffect triggered. selectedTextureMap:", selectedTextureMap);
    if (
      !scene ||
      currentMapStr === prevTextureMapRef.current ||
      !isMountedRef.current
    ) {
      console.log("STEP 3: Texture swap skipped. Conditions not met:", {
        hasScene: !!scene,
        isMounted: isMountedRef.current,
        isSameMap: currentMapStr === prevTextureMapRef.current
      });
      return;
    }

    try {
      scene.traverse((child: THREE.Object3D) => {
        if (!(child instanceof THREE.Mesh)) return;
        const mat = child.material as THREE.MeshStandardMaterial;
        if (!mat) return;

        const texConfig = getTextureConfig(child.name);
        const textureUrl: string | undefined = texConfig?.colorUrl;

        const original = originalMapRef.current.get(mat) ?? null;

        console.log(`STEP 3: Traversed mesh: "${child.name}"`, {
          textureUrl,
          hasOriginalTexture: !!original,
          currentTextureUrl: (mat.map as unknown as { userData?: { _appliedUrl?: string } })?.userData?._appliedUrl || (mat.map ? "Other" : "None"),
          currentColor: mat.color.getHexString()
        });

        if (!textureUrl) {
          if (mat.map !== original) {
            console.log(`STEP 3: Restoring original texture for "${child.name}"`);
            mat.map = original;
            mat.color.set("#ffffff");
            mat.needsUpdate = true;
          }
          return;
        }

        if ((mat.map as unknown as { userData?: { _appliedUrl?: string } })?.userData?._appliedUrl === textureUrl) {
          console.log(`STEP 3: Texture already applied for "${child.name}":`, textureUrl);
          return;
        }

        console.log(`STEP 3: Applying custom settings to "${child.name}"...`);
        mat.color.set("#ffffff");

        let tex: THREE.Texture | null = null;
        try {
          console.log(`STEP 3: Calling getTexture for "${child.name}" with URL:`, getAssetUrl(textureUrl));
          tex = getTexture(
            getAssetUrl(textureUrl),
            () => {
              console.log(`STEP 3: Successfully loaded texture for "${child.name}"`);
            },
            (error) => {
              console.error(`STEP 3: Failed to load texture for "${child.name}". Error details:`, error);
              console.log(`STEP 3: Applying solid color fallback for "${child.name}"`);
              mat.map = null;
              const fallbackHex = getFallbackColor(textureUrl);
              console.log(`STEP 3: Setting fallback hex color for "${child.name}":`, fallbackHex);
              mat.color.set(fallbackHex);
              mat.needsUpdate = true;
            }
          );
        } catch (e) {
          console.error(`STEP 3: Error loading texture for "${child.name}":`, e);
        }

        if (tex) {
          console.log(`STEP 3: Setting texture map on material for "${child.name}"`);
          const prevMap = original || mat.map;
          if (prevMap) {
            tex.offset.copy(prevMap.offset);
            tex.repeat.copy(prevMap.repeat);
            tex.center.copy(prevMap.center);
            tex.rotation = prevMap.rotation;
          }

          (tex as unknown as { userData: { _appliedUrl: string } }).userData = {
            ...(tex as unknown as { userData: Record<string, unknown> }).userData,
            _appliedUrl: textureUrl,
          };

          mat.map = tex;
          mat.needsUpdate = true;
          console.log(`STEP 3: Set mat.map successfully for "${child.name}"`);
        } else {
          console.warn(`STEP 3: getTexture returned null synchronously for "${child.name}". Applying solid color fallback...`);
          mat.map = null;
          const fallbackHex = getFallbackColor(textureUrl);
          mat.color.set(fallbackHex);
          mat.needsUpdate = true;
        }
      });

      prevTextureMapRef.current = currentMapStr;
    } catch (error) {
      console.error("STEP 3: Error swapping textures:", error);
    }
  }, [selectedTextureMap, scene, getTexture, getTextureConfig]);

  // Step 4 log on render/commit
  useEffect(() => {
    console.log("STEP 4: R3F Canvas / Avatar render committed to screen.", {
      selectedTextureMap
    });
  });

  // Guard against empty avatarData AFTER all hooks are declared
  if (!avatarData || !scene) {
    return null;
  }

  return (
    <group ref={meshRef}>
      <primitive object={scene} />

      {/* Soft shadow ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[5, 5]} />
        <shadowMaterial attach="material" opacity={0.25} />
      </mesh>
    </group>
  );
};

const applyViewConstraints = (view: string, controls: any) => {
  if (view === "side" || view === "oppositeSide" || view === "front" || view === "back") {
    controls.minPolarAngle = Math.PI / 2.2;
    controls.maxPolarAngle = Math.PI / 2.2;
  } else if (view === "top") {
    controls.minPolarAngle = 0.05;
    controls.maxPolarAngle = 0.05;
  } else if (view === "sole") {
    controls.minPolarAngle = Math.PI - 0.05;
    controls.maxPolarAngle = Math.PI - 0.05;
  }
};

interface CameraControllerProps {
  activeView: "side" | "oppositeSide" | "top" | "front" | "back" | "sole";
  isAutoSpinning: boolean;
  controlsRef: React.RefObject<any>;
  targetCameraPosRef: React.MutableRefObject<THREE.Vector3 | null>;
  isAnimatingRef: React.MutableRefObject<boolean>;
  tempUnlockRef: React.MutableRefObject<boolean>;
}

const CameraController: React.FC<CameraControllerProps> = ({
  activeView,
  isAutoSpinning,
  controlsRef,
  targetCameraPosRef,
  isAnimatingRef,
  tempUnlockRef,
}) => {
  const { camera } = useThree();

  useEffect(() => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;

    let targetPos = new THREE.Vector3();
    if (activeView === "side") {
      targetPos.set(2.2, 0.5, 0.001);
    } else if (activeView === "oppositeSide") {
      targetPos.set(-2.2, 0.5, 0.001);
    } else if (activeView === "top") {
      targetPos.set(0.001, 2.8, 0);
    } else if (activeView === "front") {
      targetPos.set(0.001, 0.5, 2.2);
    } else if (activeView === "back") {
      targetPos.set(0.001, 0.5, -2.2);
    } else if (activeView === "sole") {
      targetPos.set(0.001, -2.8, 0);
    }

    tempUnlockRef.current = true;
    targetCameraPosRef.current = targetPos;
    isAnimatingRef.current = true;
  }, [activeView, controlsRef, targetCameraPosRef, isAnimatingRef, tempUnlockRef]);

  useFrame((state, delta) => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;

    if (isAutoSpinning) {
      const target = controls.target;
      const relativePos = new THREE.Vector3().copy(controls.object.position).sub(target);
      
      const angle = delta * 0.4;
      const axis = new THREE.Vector3(0, 1, 0);
      relativePos.applyAxisAngle(axis, angle);
      
      controls.object.position.copy(target).add(relativePos);
      controls.update();
      return;
    }

    if (isAnimatingRef.current && targetCameraPosRef.current) {
      const targetPos = targetCameraPosRef.current;
      const targetLookAt = new THREE.Vector3(0, 0.5, 0);

      controls.minPolarAngle = 0;
      controls.maxPolarAngle = Math.PI;

      controls.object.position.lerp(targetPos, 0.1);
      controls.target.lerp(targetLookAt, 0.1);
      controls.update();

      const dist = controls.object.position.distanceTo(targetPos);
      if (dist < 0.01) {
        controls.object.position.copy(targetPos);
        controls.target.copy(targetLookAt);
        controls.update();

        isAnimatingRef.current = false;
        targetCameraPosRef.current = null;
        tempUnlockRef.current = false;

        applyViewConstraints(activeView, controls);
      }
    }
  });

  return null;
};

export interface ShoeAvatarRef {
  captureScreenshot: () => string | null;
}

const ShoeAvatar = React.forwardRef<ShoeAvatarRef, AvatarProps>(
  ({ avatarData, objectList, setObjectList, selectedTextureMap }, ref) => {

    const [isReady, setIsReady] = useState(false);
    const [isEnvReady, setIsEnvReady] = useState(false);
    const [autoRetryCount, setAutoRetryCount] = useState(0);
    const [isTextureLoading, setIsTextureLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const glRef = useRef<THREE.WebGLRenderer | null>(null);

    const [activeView, setActiveView] = useState<"side" | "oppositeSide" | "top" | "front" | "back" | "sole">("side");
    const [isAutoSpinning, setIsAutoSpinning] = useState(false);

    const controlsRef = useRef<any>(null);
    const targetCameraPosRef = useRef<THREE.Vector3 | null>(null);
    const isAnimatingRef = useRef(false);
    const tempUnlockRef = useRef(false);

    // Expose screenshot capture method
    React.useImperativeHandle(ref, () => ({
      captureScreenshot: () => {
        if (glRef.current) {
          return glRef.current.domElement.toDataURL("image/png");
        }
        return null;
      },
    }));

    // We removed redundant useGLTF.preload to prevent resource competition during initial mount
    useEffect(() => {
      if (!avatarData || avatarData === "") {
        setHasError(false);
      }
    }, [avatarData]);

    useEffect(() => {
      const timer1 = setTimeout(() => {
        setIsReady(true);
      }, 1200);

      const timer2 = setTimeout(() => {
        setIsEnvReady(true);
      }, 3500);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }, []);

    const canvasStyle = useMemo(() => {
      return {
        width: "100%",
        height: "100%",
        display: isReady ? 'block' : 'none',
      };
    }, [isReady]);

    const triggerRotate = (direction: "left" | "right") => {
      if (!controlsRef.current) return;
      const controls = controlsRef.current;
      const camera = controls.object;
      const target = controls.target;
      
      setIsAutoSpinning(false);
      
      const relativePos = new THREE.Vector3().copy(camera.position).sub(target);
      const angle = direction === "left" ? Math.PI / 6 : -Math.PI / 6;
      const axis = new THREE.Vector3(0, 1, 0);
      relativePos.applyAxisAngle(axis, angle);
      
      const newPos = new THREE.Vector3().copy(target).add(relativePos);
      
      tempUnlockRef.current = true;
      targetCameraPosRef.current = newPos;
      isAnimatingRef.current = true;
    };

    const handleStart = () => {
      setIsAutoSpinning(false);
      isAnimatingRef.current = false;
      targetCameraPosRef.current = null;
      tempUnlockRef.current = false;
      if (controlsRef.current) {
        applyViewConstraints(activeView, controlsRef.current);
      }
    };

    const views = [
      { id: "side", label: "Side" },
      { id: "oppositeSide", label: "Opp. Side" },
      { id: "top", label: "Top" },
      { id: "front", label: "Front" },
      { id: "back", label: "Back" },
      { id: "sole", label: "Sole" },
    ] as const;

    if (!isReady) {
      return (
        <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
        </div>
      );
    }

    if (hasError) {
      return (
        <div
          className="flex flex-col items-center justify-center w-full bg-blue-100 rounded-lg"
          style={canvasStyle}
        >
          <div className="text-center p-4">
            <p className="text-gray-700 mb-2">Failed to load 3D model</p>
            <button
              onClick={() => {
                setHasError(false);
                window.dispatchEvent(new Event('resize'));
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return (
      <WebGLErrorBoundary>
        <div className="relative w-full h-[350px] sm:h-[450px] md:h-[550px] lg:h-[600px] select-none group/avatar">
          {isTextureLoading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-lg">
              <DomSpinner />
            </div>
          )}




          <Canvas
            shadows
            gl={{
              antialias: false,
              powerPreference: "default",
              preserveDrawingBuffer: true,
              failIfMajorPerformanceCaveat: false,
            }}
            style={canvasStyle}
            camera={{ position: [2.2, 0.5, 0.001], fov: 50 }}
            onCreated={({ gl }: { gl: THREE.WebGLRenderer }) => {
              glRef.current = gl;
              try {
                gl.outputColorSpace = THREE.SRGBColorSpace;
                gl.toneMapping = THREE.ACESFilmicToneMapping;
                gl.toneMappingExposure = 1.15;

                const renderer = gl as THREE.WebGLRenderer;
                renderer.shadowMap.enabled = true;
                renderer.shadowMap.type = THREE.PCFSoftShadowMap;

                const canvas = renderer.getContext().canvas;
                canvas.addEventListener("webglcontextlost", (e) => {
                  e.preventDefault();
                  console.warn("WebGL context lost. Attempting auto-recovery...");

                  if (autoRetryCount < 1) {
                    setAutoRetryCount(prev => prev + 1);
                    setIsReady(false);
                    setIsEnvReady(false);
                    setTimeout(() => {
                      setIsReady(true);
                    }, 500);
                  } else {
                    setHasError(true);
                  }
                });

                canvas.addEventListener("webglcontextrestored", () => {
                  console.log("WebGL context restored.");
                  setHasError(false);
                });
              } catch (error) {
                console.error("Error setting up WebGL renderer:", error);
                setHasError(true);
              }
            }}
          >
            <ambientLight intensity={0.3} />
            <directionalLight
              position={[2, 6, 5]}
              intensity={1.6}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
            <directionalLight position={[-5, 3, 5]} intensity={0.6} />
            <directionalLight
              position={[0, 5, -6]}
              intensity={0.8}
              color={"#fff"}
            />

            {isEnvReady && (
              <Environment
                files="/hdri/studio_small_08_4k.hdr"
                background={false}
              />
            )}

            <Suspense fallback={null}>
              <Bounds margin={1.1}>
                <Avatar
                  avatarData={avatarData}
                  objectList={objectList}
                  setObjectList={setObjectList}
                  selectedTextureMap={selectedTextureMap}
                  setIsTextureLoading={setIsTextureLoading}
                />
              </Bounds>
            </Suspense>

            <CameraController
              activeView={activeView}
              isAutoSpinning={isAutoSpinning}
              controlsRef={controlsRef}
              targetCameraPosRef={targetCameraPosRef}
              isAnimatingRef={isAnimatingRef}
              tempUnlockRef={tempUnlockRef}
            />

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
              onStart={handleStart}
            />
          </Canvas>
        </div>
      </WebGLErrorBoundary>
    );
  }
);

export interface ShoeAvatarRef {
  captureScreenshot: () => string | null;
}

// Loading spinner
const DomSpinner: React.FC = () => {
  return (
    <div
      aria-label="Loading"
      className="animate-spin rounded-full h-12 w-12 border-4 border-white/70 border-t-transparent"
    />
  );
};

ShoeAvatar.displayName = "ShoeAvatar";

export default memo(ShoeAvatar);
