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
      normalUrl?: string;
      roughnessUrl?: string;
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

  const textureCacheRef = useRef<Map<string, THREE.Texture>>(new Map());
  const originalMapRef = useRef<WeakMap<THREE.Material, THREE.Texture | null>>(
    new WeakMap()
  );
  const pendingLoadsRef = useRef(0);

  const setLoading = (isLoading: boolean) => {
    setIsTextureLoading?.(isLoading);
  };

  // --- Center + scale ---
  useLayoutEffect(() => {
    if (!scene || !meshRef.current) return;
    meshRef.current.scale.set(27, 28, 31);

    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    meshRef.current.position.set(-center.x, -center.y, -center.z);
  }, [scene]);

  // --- Ground on Y=0 ---
  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const scaledBox = new THREE.Box3().setFromObject(meshRef.current);
    const minY = scaledBox.min.y;
    meshRef.current.position.y -= minY;
  }, []);

  // --- Material Enhancements ---
  useLayoutEffect(() => {
    if (!scene) return;

    scene.traverse((o: any) => {
      if (o.isMesh && o.material) {
        const mat = o.material as THREE.MeshStandardMaterial;

        // Leather-like tuning
        mat.envMapIntensity = 1.2;
        mat.roughness = 0.45;
        mat.metalness = 0.1;
        mat.needsUpdate = true;

        const texConfig = selectedTextureMap?.[o.name];
        if (texConfig?.normalUrl) {
          const normalMap = textureLoader.load(texConfig.normalUrl);
          normalMap.flipY = false;
          mat.normalMap = normalMap;
        }
        if (texConfig?.roughnessUrl) {
          const roughnessMap = textureLoader.load(texConfig.roughnessUrl);
          roughnessMap.flipY = false;
          mat.roughnessMap = roughnessMap;
        }
      }
    });
  }, [scene, selectedTextureMap]);

  // --- Collect meshes for UI ---
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

  // --- Texture swapping ---
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
        () => endLoad(),
        undefined,
        () => endLoad()
      );
      tex.flipY = false;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      cache.set(url, tex);
      return tex;
    };

    scene.traverse((child: any) => {
      if (!child.isMesh) return;
      const prevMat = child.material as THREE.MeshStandardMaterial;

      if (!originalMapRef.current.has(prevMat)) {
        originalMapRef.current.set(prevMat, prevMat.map ?? null);
      }

      const textureUrl: string | undefined =
        selectedTextureMap?.[child.name]?.colorUrl;

      child.material = prevMat.clone();
      const mat = child.material as THREE.MeshStandardMaterial;

      const prevMap = prevMat.map ?? originalMapRef.current.get(prevMat) ?? null;

      if (!textureUrl) {
        const original = originalMapRef.current.get(prevMat) ?? null;
        if (mat.map !== original) {
          mat.map = original;
          mat.needsUpdate = true;
        }
        return;
      }

      if ((mat.map as any)?.userData?._appliedUrl === textureUrl) return;

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
      mat.needsUpdate = true;
    });

    prevTextureMapRef.current = currentMapStr;
  }, [selectedTextureMap, scene]);

  return (
    <group ref={meshRef}>
      <primitive object={scene} />

      {/* Soft shadow ground */}
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
        camera={{ position: [2.2, 0.25, 0], fov: 50 }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.5;

          const renderer = gl as THREE.WebGLRenderer;
          renderer.shadowMap.enabled = true;
          renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        {/* Lighting setup */}
        <ambientLight intensity={0.2} />

        <directionalLight
          position={[5, 8, 5]}
          intensity={1.6}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-5, 3, 5]} intensity={0.6} />
        <directionalLight position={[0, 5, -6]} intensity={0.8} color={"#fff"} />

        {/* Studio HDRI */}
        <Environment
          files="/hdri/studio_small_08_4k.hdr"
          background={false}
        />

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

// Loading spinner
const DomSpinner: React.FC = () => {
  return (
    <div
      aria-label="Loading"
      className="animate-spin rounded-full h-12 w-12 border-4 border-white/70 border-t-transparent"
    />
  );
};

export default ShoeAvatar;
