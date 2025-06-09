// "use client";

// import React, { useEffect, useState, Suspense } from "react";
// import { Canvas } from "@react-three/fiber";
// import { OrbitControls, useGLTF } from "@react-three/drei";
// import { Group } from "three";

// interface AvatarProps {
//   avatarData: string;
// }

// const Avatar: React.FC<AvatarProps> = ({ avatarData }) => {
//   const { scene } = useGLTF(avatarData) as { scene: Group };
//   console.log('scene', scene)

//   return (
//     <primitive
//       object={scene}
//       scale={[1, 1, 1]}
//       position={[0, 0, 0]}
//       rotation={[0, 0, 0]}
//     />
//   );
// };

// // Preload the model once (optional but improves performance)
// useGLTF.preload("/shoe.glb");

// const ShoeAvatar: React.FC<AvatarProps> = ({ avatarData }) => {
//   const [canvasSize, setCanvasSize] = useState({ width: 400, height: 400 });
//   const [hasMounted, setHasMounted] = useState(false);

//   useEffect(() => {
//     setHasMounted(true);

//     const resize = () => {
//       setCanvasSize({
//         width: window.innerWidth * 1,
//         height: window.innerHeight * 1,
//       });
//     };

//     resize();
//     window.addEventListener("resize", resize);
//     return () => window.removeEventListener("resize", resize);
//   }, []);

//   if (!hasMounted) return null;

//   return (
//     <div style={{ textAlign: "center", marginTop: "-50px" }}>
//       <Canvas
//         style={{
//           width: `${canvasSize.width}px`,
//           height: `${canvasSize.height}px`,
//           margin: "0 auto",
//         }}
//       >
//         <ambientLight intensity={5} />
//         <directionalLight position={[5, 5, 5]} intensity={0.5} />
//         <Suspense fallback={null}>
//           <Avatar avatarData={avatarData} />
//         </Suspense>
//         <OrbitControls
//           enableZoom={false}
//           target={[0, 2, 0]}
//           maxDistance={1.5}
//           minDistance={1.5}
//         />
//       </Canvas>
//     </div>
//   );
// };

// export default ShoeAvatar;

 "use client";

    import React, { useEffect, useState, Suspense, useRef } from "react";
    import ReactDOM from "react-dom";
    import { Canvas, useFrame } from "@react-three/fiber";
    import { OrbitControls, useGLTF, PerspectiveCamera } from "@react-three/drei";
    import { Box3, Vector3, Group } from "three";
    import * as THREE from 'three'; 

    interface AvatarProps {
      avatarData: string;
    }

    const Avatar: React.FC<AvatarProps> = ({ avatarData }) => {
      const { scene } = useGLTF(avatarData);
      const meshRef = useRef();
      const [scale, setScale] = useState(1);

      useEffect(() => {
        if (scene) {
          // Calculate bounding box to determine model size
          const box = new Box3().setFromObject(scene);
          const size = new Vector3();
          box.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z);
          const desiredSize = 2; // Target size in Three.js units
          const newScale = desiredSize / maxDim;
          setScale(newScale);

          // Center the model
          const center = new Vector3();
          box.getCenter(center);
          scene.position.sub(center.multiplyScalar(newScale));
        }
      }, [scene]);

      return (
        <primitive
          ref={meshRef}
          object={scene}
          scale={[scale, scale, scale]}
          position={[0, 0, 0]}
        />
      );
    };

    useGLTF.preload("/shoe.glb");

    const ShoeAvatar: React.FC<AvatarProps> = ({ avatarData }) => {
      const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight });
      const [hasMounted, setHasMounted] = useState(false);

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
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
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
              target={[0, 0.5, 0]}
              maxPolarAngle={Math.PI / 2}
            />
            <PerspectiveCamera makeDefault position={[0, 1, 3]} fov={50} />
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
      <meshStandardMaterial color="gray" />
    </mesh>
  );
};

    export default ShoeAvatar;
