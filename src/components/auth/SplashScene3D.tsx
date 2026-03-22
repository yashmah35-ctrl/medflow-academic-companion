import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useRef, Suspense, useState, useEffect } from "react";
import * as THREE from "three";

function BouclierModel({ onRotationDone }: { onRotationDone: () => void }) {
  const { scene } = useGLTF("/models/bouclier.glb");
  const ref = useRef<THREE.Group>(null);
  const rotated = useRef(0);
  const [done, setDone] = useState(false);

  useFrame((_, delta) => {
    if (ref.current && !done) {
      const speed = 3;
      const step = delta * speed;
      rotated.current += step;
      ref.current.rotation.y += step;
      if (rotated.current >= Math.PI * 2) {
        ref.current.rotation.y = 0;
        setDone(true);
        onRotationDone();
      }
    }
  });

  return <primitive ref={ref} object={scene} scale={2.2} position={[0, 0, 0]} />;
}

function ChapeauModel({ visible }: { visible: boolean }) {
  const { scene } = useGLTF("/models/chapeau.glb");
  const ref = useRef<THREE.Group>(null);
  const startY = 4;
  const targetY = 1.6;
  const targetX = -0.9;
  const [pos, setPos] = useState({ x: 0, y: startY });

  useFrame((_, delta) => {
    if (!visible || !ref.current) return;
    setPos((prev) => {
      const newY = THREE.MathUtils.lerp(prev.y, targetY, delta * 5);
      const newX = THREE.MathUtils.lerp(prev.x, targetX, delta * 5);
      return { x: newX, y: newY };
    });
    ref.current.position.set(pos.x, pos.y, 0);
  });

  if (!visible) return null;

  return (
    <primitive
      ref={ref}
      object={scene}
      scale={1.4}
      position={[0, startY, 0]}
      rotation={[0, 0, 0.15]}
    />
  );
}

export default function SplashScene3D({ onComplete }: { onComplete: () => void }) {
  const [showHat, setShowHat] = useState(false);

  useEffect(() => {
    // Safety timeout — if animation hangs, still proceed
    const t = setTimeout(onComplete, 4000);
    return () => clearTimeout(t);
  }, [onComplete]);

  useEffect(() => {
    if (showHat) {
      // Hat lands in ~0.6s, then we're done
      const t = setTimeout(onComplete, 800);
      return () => clearTimeout(t);
    }
  }, [showHat, onComplete]);

  return (
    <div className="w-52 h-52 mx-auto">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <directionalLight position={[-5, -5, -5]} intensity={0.3} />
        <Suspense fallback={null}>
          <BouclierModel onRotationDone={() => setShowHat(true)} />
          <ChapeauModel visible={showHat} />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/bouclier.glb");
useGLTF.preload("/models/chapeau.glb");
