"use client";

import React, { useEffect, useState, Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface AvatarProps {
  avatarData: string;
  objectList: any;
  setObjectList: any;
  selectedPanelName?: string;
  selectedColorHex?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  avatarData,
  objectList,
  setObjectList,
  selectedPanelName,
  selectedColorHex,
}) => {
  const { scene } = useGLTF(avatarData);
  const meshRef = useRef<THREE.Group>(null);
  const [scale, setScale] = useState(1);
  const prevPanelRef = useRef<string | null>(null);
  const prevColorRef = useRef<string | null>(null);

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

      const children: any[] = [];
      scene.traverse((child: any) => {
        if (child.isMesh) children.push(child);
      });

      setObjectList((prev: any[]) => {
        const names = prev?.map(obj => obj.name).sort().join(",");
        const newNames = children.map(obj => obj.name).sort().join(",");
        return names === newNames ? prev : children;
      });
    }
  }, [scene]);

  useEffect(() => {
    if (!scene || !selectedPanelName || prevPanelRef.current === selectedPanelName) return;

    scene.traverse((child: any) => {
      if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
        const idx = child.morphTargetDictionary[selectedPanelName];
        if (typeof idx === "number") {
          for (let i = 0; i < child.morphTargetInfluences.length; i++) {
            child.morphTargetInfluences[i] = i === idx ? 1 : 0;
          }
        }
      }
    });

    prevPanelRef.current = selectedPanelName;
  }, [selectedPanelName]);

  useEffect(() => {
    if (!scene || !selectedColorHex || prevColorRef.current === selectedColorHex) return;

    scene.traverse((child: any) => {
      if (child.isMesh && child.material) {
        child.material = child.material.clone();
        child.material.color = new THREE.Color(selectedColorHex);
        child.material.needsUpdate = true;
      }
    });

    prevColorRef.current = selectedColorHex;
  }, [selectedColorHex]);

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
  selectedPanelName,
  selectedColorHex,
}) => {
  const [canvasSize, setCanvasSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
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
        camera={{ position: [-9, 1, 3], fov: 35 }}
        onCreated={({ gl }) => {
          gl.getContext().canvas.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            console.warn("WebGL context lost. Consider refreshing or simplifying content.");
          });
        }}
      >
        <ambientLight intensity={1.0} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <Suspense fallback={<LoadingSpinner />}>
          <Avatar
            avatarData={avatarData}
            objectList={objectList}
            setObjectList={setObjectList}
            selectedPanelName={selectedPanelName}
            selectedColorHex={selectedColorHex}
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
