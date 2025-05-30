"use client";

import React, { useEffect, useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Group } from "three";

interface AvatarProps {
  avatarData: string;
}

const Avatar: React.FC<AvatarProps> = ({ avatarData }) => {
  const { scene } = useGLTF(avatarData) as { scene: Group };

  return (
    <primitive
      object={scene}
      scale={[3.2, 3.0, 2.5]}
      position={[0, -2.5, -2]}
      rotation={[0.5, 0, 0]}
    />
  );
};

// Preload the model once (optional but improves performance)
useGLTF.preload("/glb/shoe.glb");

const ShoeAvatar: React.FC<AvatarProps> = ({ avatarData }) => {
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 400 });
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);

    const resize = () => {
      setCanvasSize({
        width: window.innerWidth * 0.4,
        height: window.innerHeight * 0.5,
      });
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  if (!hasMounted) return null;

  return (
    <div style={{ textAlign: "center", marginTop: "-50px" }}>
      <Canvas
        style={{
          width: `${canvasSize.width}px`,
          height: `${canvasSize.height}px`,
          margin: "0 auto",
        }}
      >
        <ambientLight intensity={5} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} />
        <Suspense fallback={null}>
          <Avatar avatarData={avatarData} />
        </Suspense>
        <OrbitControls
          enableZoom={false}
          target={[0, 2, 0]}
          maxDistance={1.5}
          minDistance={1.5}
        />
      </Canvas>
    </div>
  );
};

export default ShoeAvatar;
