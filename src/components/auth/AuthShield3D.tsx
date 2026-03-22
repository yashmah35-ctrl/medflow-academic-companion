import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import { useRef, Suspense } from "react";
import * as THREE from "three";

function ShieldModel() {
  const { scene } = useGLTF("/models/medical_shield.glb");
  const ref = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.8;
    }
  });

  return <primitive ref={ref} object={scene} scale={2.5} position={[0, 0, 0]} />;
}

export default function AuthShield3D() {
  return (
    <div className="w-40 h-40 mx-auto">
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <directionalLight position={[-5, -5, -5]} intensity={0.3} />
        <Suspense fallback={null}>
          <ShieldModel />
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/medical_shield.glb");
