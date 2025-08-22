"use client";

import React, {
  useEffect,
  useLayoutEffect,
  useState,
  Suspense,
  useRef,
  SetStateAction,
} from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Bounds } from "@react-three/drei";
import * as THREE from "three";

interface AvatarProps {
  avatarData: string;
  objectList: any[];
  setObjectList: React.Dispatch<React.SetStateAction<any[]>>;
  selectedTextureMap?: Record<
    string,
    {
      colorUrl?: string;
      // future: normalUrl?: string; roughnessUrl?: string;
    }
  >;
  setIsTextureLoading?: React.Dispatch<SetStateAction<boolean>>;
}

const textureLoader = new THREE.TextureLoader();

const Avatar: React.FC<AvatarProps> = ({
  avatarData,
  objectList,
  setObjectList,
  selectedTextureMap = {},
  setIsTextureLoading,
}) => {
  const { scene } = useGLTF(avatarData);
  const meshRef = useRef<THREE.Group>(null);
  const prevTextureMapRef = useRef<string>("");

  // caches + bookkeeping
  const textureCacheRef = useRef<Map<string, THREE.Texture>>(new Map());
  const originalMapRef = useRef<WeakMap<THREE.Material, THREE.Texture | null>>(
    new WeakMap()
  );
  const pendingLoadsRef = useRef(0);

  const setLoading = (isLoading: boolean) => {
    setIsTextureLoading?.(isLoading);
  };

  // ---------- CENTER ONLY (preserve author scale; no forced length) ----------
useLayoutEffect(() => {
    if (!scene || !meshRef.current) return;
    // keep authoring scale (1,1,1)
    meshRef.current.scale.set(27, 28, 31); 
    // center the model at the origin
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    meshRef.current.position.set(-center.x, -center.y, -center.z);
  }, [scene]);

  // Pass 2: re-ground the shoe so the lowest point (sole) sits at y=0
  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const scaledBox = new THREE.Box3().setFromObject(meshRef.current);
    const minY = scaledBox.min.y;
    meshRef.current.position.y -= minY;
  }, []);
  
  useLayoutEffect(() => {
  if (!scene) return;
  scene.traverse((o: any) => {
    if (o.isMesh && o.material && 'envMapIntensity' in o.material) {
      (o.material as THREE.MeshStandardMaterial).envMapIntensity = 0.35; // 0.3–0.5
      o.material.needsUpdate = true;
    }
  });
}, [scene]);


  // Gather mesh children once the scene is available (for your UI lists)
  useEffect(() => {
    if (!scene) return;
    const children: THREE.Mesh[] = [];
    scene.traverse((child: any) => {
      if (child.isMesh) children.push(child);
    });

    setObjectList((prev: any[]) => {
      const prevNames = prev?.map((o) => o.name).sort().join(",");
      const newNames = children.map((o) => o.name).sort().join(",");
      return prevNames === newNames ? prev : children;
    });
  }, [scene, setObjectList]);

  // ---------- TEXTURE SWAP (preserve transforms, keep GLB defaults) ----------
  useEffect(() => {
    const currentMapStr = JSON.stringify(selectedTextureMap || {});
    if (!scene || currentMapStr === prevTextureMapRef.current) return;

    const cache = textureCacheRef.current;

    const beginLoad = () => {
      pendingLoadsRef.current += 1;
      setLoading(true);
    };
    const endLoad = () => {
      pendingLoadsRef.current = Math.max(0, pendingLoadsRef.current - 1);
      if (pendingLoadsRef.current === 0) setLoading(false);
    };

    const getTexture = (url: string) => {
      const cached = cache.get(url);
      if (cached) return cached;

      beginLoad();
      const tex = textureLoader.load(
        url,
        () => endLoad(), // onLoad
        undefined,
        () => endLoad() // onError
      );
      // GLTF compatibility + quality
      tex.flipY = false; // baseColorTexture from glTF expects this
      tex.colorSpace = THREE.SRGBColorSpace; // base color uses sRGB
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      cache.set(url, tex);
      return tex;
    };

    scene.traverse((child: any) => {
      if (!child.isMesh) return;

      const prevMat = child.material as THREE.MeshStandardMaterial;

      // remember original GLB map once
      if (!originalMapRef.current.has(prevMat)) {
        originalMapRef.current.set(prevMat, prevMat.map ?? null);
      }

      // requested swap for this mesh?
      const textureUrl: string | undefined =
        selectedTextureMap?.[child.name]?.colorUrl;

      // Clone so shared materials aren’t mutated
      child.material = prevMat.clone();
      const mat = child.material as THREE.MeshStandardMaterial;

      // currently applied/known previous map
      const prevMap = prevMat.map ?? originalMapRef.current.get(prevMat) ?? null;

      if (!textureUrl) {
        // No swap requested -> keep / restore GLB’s baked map
        const original = originalMapRef.current.get(prevMat) ?? null;
        if (mat.map !== original) {
          mat.map = original;
          mat.needsUpdate = true;
        }
        return;
      }

      // Skip if already applied
      if ((mat.map as any)?.userData?._appliedUrl === textureUrl) return;

      // Load / reuse texture and preserve transforms (KHR_texture_transform)
      const tex = getTexture(textureUrl);
      if (prevMap) {
        tex.offset.copy(prevMap.offset);
        tex.repeat.copy(prevMap.repeat);
        tex.center.copy(prevMap.center);
        tex.rotation = prevMap.rotation;
      }

      (tex as any).userData = {
        ...(tex as any).userData,
        _appliedUrl: textureUrl,
      };

      mat.map = tex;
      // Keep PBR values from GLB (don’t force roughness/metalness here)
      mat.needsUpdate = true;
    });

    prevTextureMapRef.current = currentMapStr;
  }, [selectedTextureMap, scene]);

  return (
    <group ref={meshRef}>
      <primitive object={scene} />

      {/* Ground plane for soft shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[5, 5]} />
        <shadowMaterial opacity={0.25} />
      </mesh>
    </group>
  );
};

const ShoeAvatar: React.FC<AvatarProps> = ({
  avatarData,
  objectList,
  setObjectList,
  selectedTextureMap,
}) => {
  const [canvasSize, setCanvasSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 800,
    height: typeof window !== "undefined" ? window.innerHeight : 600,
  });
  const [hasMounted, setHasMounted] = useState(false);
  const [isTextureLoading, setIsTextureLoading] = useState(false);

  useGLTF.preload(avatarData);

  useEffect(() => {
    setHasMounted(true);
    const resize = () => {
      setCanvasSize({
        width: Math.min(window.innerWidth, 800),
        height: Math.min(window.innerHeight * 0.8, 600),
      });
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  if (!hasMounted) return null;

  return (
    <div className="relative">
      {isTextureLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <DomSpinner />
        </div>
      )}

      <Canvas
        shadows
                gl={{ antialias: true, outputColorSpace: THREE.SRGBColorSpace }}
                style={{
                  width: `${canvasSize.width}px`,
                  height: `${canvasSize.height}px`,
                  maxWidth: "100%",
                }}
                camera={{ position: [2, 0.25, 0.2], fov: 50 }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.2;

          const renderer = gl as THREE.WebGLRenderer;
          renderer.shadowMap.enabled = true;
          renderer.shadowMap.type = THREE.PCFSoftShadowMap;

          // guard against context loss
          renderer.getContext().canvas.addEventListener(
            "webglcontextlost",
            (e) => {
              e.preventDefault();
              console.warn("WebGL context lost.");
            }
          );
        }}
      >
        {/* Balanced lights + studio env */}
        <ambientLight intensity={0.1} />
        <directionalLight
          position={[-18, -5, 1]}
          intensity={0.8}
          // color="White"
          castShadow
          // shadow-mapSize-width={1024}
          // shadow-mapSize-height={1024}
        />
        <directionalLight
          position={[-10, 0, 5]}
          intensity={0.5}
        />
        <directionalLight
          position={[0, 0, -5]}
          intensity={0.5}
        />
        <Environment preset="studio" />
       

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

        <OrbitControls
          enablePan={false}
          enableZoom
          minDistance={1.2}
          maxDistance={5}
          target={[0, 0.5, 0]}
          maxPolarAngle={Math.PI}
        />
      </Canvas>
    </div>
  );
};

// Pure DOM spinner for the overlay (no R3F hooks here)
const DomSpinner: React.FC = () => {
  return (
    <div
      aria-label="Loading"
      className="animate-spin rounded-full h-12 w-12 border-4 border-white/70 border-t-transparent"
      // If you don't use Tailwind, uncomment inline styles:
      // style={{
      //   width: 48,
      //   height: 48,
      //   border: "4px solid rgba(255,255,255,.7)",
      //   borderTopColor: "transparent",
      //   borderRadius: "9999px",
      //   animation: "spin 0.8s linear infinite",
      // }}
    />
  );
};

export default ShoeAvatar;
