"use client";

import React, { useEffect, useState, Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";

interface AvatarProps {
  avatarData: string;
  objectList: any[];
  setObjectList: React.Dispatch<React.SetStateAction<any[]>>;
  selectedColorHexMap?: Record<string, string>;
}

const Avatar: React.FC<AvatarProps> = ({
  avatarData,
  objectList,
  setObjectList,
  selectedColorHexMap = {},
}) => {
  const { scene } = useGLTF(avatarData);
  const meshRef = useRef<THREE.Group>(null);
  const [scale, setScale] = useState(1);
  const prevColorMapRef = useRef<string>("");

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
    const currentMapStr = JSON.stringify(selectedColorHexMap);
    if (!scene || currentMapStr === prevColorMapRef.current) return;

    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.material = child.material.clone();

        const hexColor = selectedColorHexMap[child.name];
        if (hexColor) {
          child.material.color = new THREE.Color(hexColor);
        } else if (!child.material.map) {
          child.material.color = new THREE.Color("#888888");
        }

        child.material.needsUpdate = true;
      }
    });

    prevColorMapRef.current = currentMapStr;
  }, [selectedColorHexMap, scene]);

  return (
    <group ref={meshRef} scale={[scale, scale, scale]}>
      <primitive object={scene} />
    </group>
  );
};

const ShoeAvatar: React.FC<AvatarProps> = ({
  avatarData,
  objectList,
  setObjectList,
  selectedColorHexMap,
}) => {

  console.log('selected Color Hex', selectedColorHexMap);
  const [canvasSize, setCanvasSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 800,
    height: typeof window !== "undefined" ? window.innerHeight : 600,
  });
  const [hasMounted, setHasMounted] = useState(false);

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
    <div>
      <Canvas
        style={{
          width: `${canvasSize.width}px`,
          height: `${canvasSize.height}px`,
          maxWidth: "100%",
        }}
        camera={{ position: [2, 0, 0], fov: 70 }}
        onCreated={({ gl }) => {
          const renderer = gl as THREE.WebGLRenderer;
          // renderer.outputEncoding = THREE.sRGBEncoding;
          renderer.toneMapping = THREE.ACESFilmicToneMapping;
          renderer.toneMappingExposure = 1.0;

          renderer.getContext().canvas.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            console.warn("WebGL context lost.");
          });
        }}

      >
        <ambientLight intensity={1} />
        <directionalLight position={[-5, 2, -2]} intensity={1} />
        <Suspense fallback={<LoadingSpinner />}>
          <Environment preset="studio" />
          <Avatar
            avatarData={avatarData}
            objectList={objectList}
            setObjectList={setObjectList}
            selectedColorHexMap={selectedColorHexMap}
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