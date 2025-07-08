"use client";

import React, { useEffect, useState, Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";

interface AvatarProps {
  avatarData: string;
  objectList: any[];
  setObjectList: React.Dispatch<React.SetStateAction<any[]>>;
  selectedTextureMap?: Record<string, any>;
}

const textureLoader = new THREE.TextureLoader();

const Avatar: React.FC<AvatarProps> = ({
  avatarData,
  objectList,
  setObjectList,
  selectedTextureMap = {},
}) => {
  const { scene } = useGLTF(avatarData);
  const meshRef = useRef<THREE.Group>(null);
  const [scale, setScale] = useState(1);
  const prevTextureMapRef = useRef<string>("");

  useEffect(() => {
    if (scene && meshRef.current) {
      const box = new THREE.Box3().setFromObject(scene);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      const maxDim = Math.max(size.x, size.y, size.z);
      const newScale = 2.5 / maxDim;

      setScale(newScale);
      meshRef.current.position.set(-center.x, -center.y, -center.z);

      const children: THREE.Mesh[] = [];
      scene.traverse((child: any) => {
        if (child.isMesh) children.push(child);
      });

      setObjectList((prev: any[]) => {
        const prevNames = prev?.map((obj) => obj.name).sort().join(",");
        const newNames = children.map((obj) => obj.name).sort().join(",");
        return prevNames === newNames ? prev : children;
      });
    }
  }, [scene, setObjectList]);

  useEffect(() => {
    const currentMapStr = JSON.stringify(selectedTextureMap);
    if (!scene || currentMapStr === prevTextureMapRef.current) return;

   scene.traverse((child: any) => {
  if (child.isMesh) {
    child.material = child.material.clone();

    const textureUrl = selectedTextureMap[child.name]?.colorUrl;
    if (textureUrl) {
      const diffuseTexture = textureLoader.load(textureUrl, (tex) => {
        (tex as any).encoding = (THREE as any).sRGBEncoding;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(5, 5); // ✅ Tiling scale set to 20%
      });

      // ✅ Load Normal GL Map (if exists)
          const normalMapUrl = selectedTextureMap[child.name]?.normalUrl; // Assumes naming convention
          const normalTexture = textureLoader.load(normalMapUrl, () => {
            console.log(`Loaded normal map: ${normalMapUrl}`);
          });
          normalTexture.wrapS = THREE.RepeatWrapping;
          normalTexture.wrapT = THREE.RepeatWrapping;
          normalTexture.repeat.set(5, 5); // Same tiling scale

           // ✅ Load roughness map
          const roughnessMapUrl = selectedTextureMap[child.name]?.roughnessUrl;
          const roughnessTexture = textureLoader.load(roughnessMapUrl, () => {
            console.log(`Loaded roughness map: ${roughnessMapUrl}`);
          });
          roughnessTexture.wrapS = THREE.RepeatWrapping;
          roughnessTexture.wrapT = THREE.RepeatWrapping;
          roughnessTexture.repeat.set(5, 5);

          // ✅ Apply textures
          child.material.map = diffuseTexture;
          child.material.normalMap = normalTexture;
          child.material.roughnessMap = roughnessTexture;
          child.material.normalScale = new THREE.Vector2(1, 1); // Normal scale 100%

         

          // ✅ Determine material type for finish
          const isSuede = textureUrl.toLowerCase().includes("suede");

          if (isSuede) {
            child.material.roughness = 0.9;
            child.material.metalness = 0;
            child.material.envMapIntensity = 0.2;
          } else {
            child.material.roughness = 0.3;
            child.material.metalness = 0;
            child.material.envMapIntensity = 0.6;
          }

          child.material.needsUpdate = true;
    } else {
      child.material.map = null;
      child.material.needsUpdate = true;
    }
  }
});


    prevTextureMapRef.current = currentMapStr;
  }, [selectedTextureMap, scene]);

  return (
    <group ref={meshRef} scale={[scale, scale, scale]}>
      <primitive object={scene} />

      {/* ✅ Floor shadow plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.75, 0]} receiveShadow>
        <planeGeometry args={[5, 5]} />
        <shadowMaterial opacity={0.3} />
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
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <LoadingSpinner />
        </div>
      )}
      <Canvas
        shadows
        style={{
          width: `${canvasSize.width}px`,
          height: `${canvasSize.height}px`,
          maxWidth: "100%",
        }}
        camera={{ position: [2, 2, 9], fov: 35 }}
        onCreated={({ gl }) => {
          const renderer = gl as THREE.WebGLRenderer;
          renderer.toneMapping = THREE.ACESFilmicToneMapping;
          renderer.toneMappingExposure = 0.8;
          renderer.shadowMap.enabled = true;
          renderer.shadowMap.type = THREE.PCFSoftShadowMap;

          renderer.getContext().canvas.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            console.warn("WebGL context lost.");
          });
        }}
      >
        {/* ✅ Lighting setup */}
        <ambientLight intensity={0.8} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1.2}
          color="white"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <Suspense fallback={<LoadingSpinner />}>
          {/* <Environment preset="dawn" /> */}
          <Avatar
            avatarData={avatarData}
            objectList={objectList}
            setObjectList={setObjectList}
            selectedTextureMap={selectedTextureMap}
          />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={1}
          maxDistance={5}
          target={[0, 0, 0]}
          maxPolarAngle={Math.PI}
        />
      </Canvas>
    </div>
  );
};

const LoadingSpinner = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.05;
    }
  });

  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[0.5, 0.2, 16, 32]} />
      <meshStandardMaterial color="white" />
    </mesh>
  );
};

export default ShoeAvatar;
