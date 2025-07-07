"use client";

import React, { useEffect, useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";

interface AvatarProps {
  avatarData: string;
  objectList: any[];
  setObjectList: React.Dispatch<React.SetStateAction<any[]>>;
  selectedTextureMap?: Record<string, string>; // key = mesh name, value = texture image path
}

const Avatar: React.FC<AvatarProps> = ({
  avatarData,
  objectList,
  setObjectList,
  selectedTextureMap = {},
}) => {
  const { scene } = useGLTF(avatarData);
  const meshRef = useRef<THREE.Group>(null);
  const [scale, setScale] = useState(1);

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
      setObjectList(children);
    }
  }, [scene, setObjectList]);

  // ✅ Apply texture maps
  useEffect(() => {
    const loader = new THREE.TextureLoader();

    scene.traverse((child: any) => {
      if (child.isMesh) {
        const textureUrl = selectedTextureMap[child.name];
        if (textureUrl) {
          loader.load(textureUrl, (texture) => {
            texture.flipY = false;
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;

            child.material = new THREE.MeshStandardMaterial({
              map: texture,
              roughness: 0.6,
              metalness: 0.1,
            });

            child.material.needsUpdate = true;
          });
        }
      }
    });
  }, [selectedTextureMap, scene]);

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
  selectedTextureMap,
}) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;

  return (
    <div>
      <Canvas camera={{ position: [2, 2, 9], fov: 35 }} shadows>
        {/* ✅ Balanced light setup */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-5, 5, -5]} intensity={0.6} />

        <Suspense fallback={<LoadingSpinner />}>
          <Environment preset="studio" background={false} />
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
    if (meshRef.current) meshRef.current.rotation.y += 0.05;
  });

  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[0.5, 0.2, 16, 32]} />
      <meshStandardMaterial color="white" />
    </mesh>
  );
};

export default ShoeAvatar;
