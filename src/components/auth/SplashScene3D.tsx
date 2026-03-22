import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useRef, Suspense, useState } from "react";
import * as THREE from "three";

function BouclierModel({ onRotationDone }: { onRotationDone: () => void }) {
  const { scene } = useGLTF("/models/bouclier.glb");
  const ref = useRef<THREE.Group>(null);
  const rotated = useRef(0);
  const [done, setDone] = useState(false);

  useFrame((_, delta) => {
    if (ref.current && !done) {
      // Slower rotation — full turn in ~4s
      const speed = 1.6;
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
  const posRef = useRef({ x: 0, y: startY });

  useFrame((_, delta) => {
    if (!visible || !ref.current) return;
    posRef.current.y = THREE.MathUtils.lerp(posRef.current.y, targetY, delta * 3);
    posRef.current.x = THREE.MathUtils.lerp(posRef.current.x, targetX, delta * 3);
    ref.current.position.set(posRef.current.x, posRef.current.y, 0);
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

export default function SplashScene3D({ onAnimDone }: { onAnimDone: () => void }) {
  const [showHat, setShowHat] = useState(false);

  return (
    <div className="w-52 h-52 mx-auto">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <directionalLight position={[-5, -5, -5]} intensity={0.3} />
        <Suspense fallback={null}>
          <BouclierModel onRotationDone={() => {
            setShowHat(true);
            // Hat lands in ~1.5s, then signal done
            setTimeout(onAnimDone, 1500);
          }} />
          <ChapeauModel visible={showHat} />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/bouclier.glb");
useGLTF.preload("/models/chapeau.glb");
