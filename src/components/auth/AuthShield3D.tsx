import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import { useRef, Suspense, useState } from "react";
import * as THREE from "three";
import { Loader2 } from "lucide-react";

function ShieldModel({ onLoaded }: { onLoaded: () => void }) {
  const { scene } = useGLTF("/models/medical_shield.glb");
  const ref = useRef<THREE.Group>(null);
  const reported = useRef(false);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.8;
      if (!reported.current) {
        reported.current = true;
        onLoaded();
      }
    }
  });

  return <primitive ref={ref} object={scene} scale={2.5} position={[0, 0, 0]} />;
}

export default function AuthShield3D() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="w-40 h-40 mx-auto relative">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <directionalLight position={[-5, -5, -5]} intensity={0.3} />
        <Suspense fallback={null}>
          <ShieldModel onLoaded={() => setLoaded(true)} />
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/medical_shield.glb");
