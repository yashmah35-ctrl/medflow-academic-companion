import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import { useRef, Suspense, useState } from "react";
import * as THREE from "three";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

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

export default function AuthShield3D({ animate = false }: { animate?: boolean }) {
  const [loaded, setLoaded] = useState(false);

  const container = (
    <div className="w-56 h-56 relative">
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

  if (animate) {
    return (
      <motion.div
        className="mx-auto"
        initial={{ y: -200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
      >
        {container}
      </motion.div>
    );
  }

  return <div className="mx-auto">{container}</div>;
}

useGLTF.preload("/models/medical_shield.glb");
