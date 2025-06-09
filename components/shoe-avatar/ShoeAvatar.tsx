"use client";

import React, { useEffect, useState, Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, PerspectiveCamera } from "@react-three/drei";
import { Box3, Vector3, Group } from "three";
import * as THREE from 'three';
import { GLTF } from "three-stdlib";

interface AvatarProps {
  avatarData: string;
}

const Avatar: React.FC<AvatarProps> = ({ avatarData }) => {
  const { scene } = useGLTF(avatarData);
  const shoes = useGLTF(avatarData);
  // const meshRef = useRef();
  const meshRef = useRef<THREE.Group>(null);
  const [scale, setScale] = useState(1);
  const [objectList, setObjectList] = useState<any>();

  useEffect(() => {
    if (scene && meshRef.current) {
      const box = new Box3().setFromObject(scene);
      const size = new Vector3();
      const center = new Vector3();
      box.getSize(size);
      box.getCenter(center);

      const maxDim = Math.max(size.x, size.y, size.z);
      const desiredSize = 2.5;
      const newScale = desiredSize / maxDim;

      setScale(newScale);

      // Apply centering only to position
      meshRef.current.position.set(-center.x, -center.y, -center.z);
      setObjectList(shoes.scene.children)

    }
  }, [scene]);

  

  // useEffect(() => {
  //   if (scene) {
  //     // Calculate bounding box to determine model size
  //     const box = new Box3().setFromObject(scene);
  //     const size = new Vector3();
  //     box.getSize(size);
  //     const maxDim = Math.max(size.x, size.y, size.z);
  //     const desiredSize = 2; // Target size in Three.js units
  //     const newScale = desiredSize / maxDim;
  //     setScale(newScale);

  //     // Center the model
  //     const center = new Vector3();
  //     box.getCenter(center);
  //     scene.position.sub(center.multiplyScalar(newScale));
  //   }
  // }, [scene]);
   return (
    <group ref={meshRef} scale={[scale, scale, scale]}>
      <primitive object={scene} />
    </group>
  );

  // return (
  //   <primitive
  //     ref={meshRef}
  //     object={scene}
  //     scale={[scale, scale, scale]}
  //     position={[0, 0, 0]}
  //   />
  // );
};


const ShoeAvatar: React.FC<AvatarProps> = ({ avatarData }) => {
  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [hasMounted, setHasMounted] = useState(false);
  useGLTF.preload(avatarData);

  useEffect(() => {
    setHasMounted(true);

    const resize = () => {
      setCanvasSize({
        width: Math.min(window.innerWidth, 800), // Cap max width
        height: Math.min(window.innerHeight * 0.8, 600), // 80% of height, capped
      });
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  if (!hasMounted) return null;

  return (
    <div className="">
      <Canvas
        style={{
          width: `${canvasSize.width}px`,
          height: `${canvasSize.height}px`,
          maxWidth: '100%',
        }}
        camera={{ position: [0, 1, 3], fov: 50 }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} />
        <Suspense fallback={<LoadingSpinner />}>
          <Avatar avatarData={avatarData} />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={1}
          maxDistance={5}
          target={[0, 0, 0]}
          maxPolarAngle={Math.PI}
        />
        <PerspectiveCamera makeDefault position={[-9, 1, 3]} fov={35} />
      </Canvas>
    </div>
  );
};

const LoadingSpinner = () => {
  const meshRef = useRef<THREE.Mesh>(null); // Explicitly type the ref as THREE.Mesh

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
