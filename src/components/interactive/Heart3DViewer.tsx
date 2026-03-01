import { useState, useRef, useMemo } from "react";
import { Canvas, useFrame, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface HeartPart {
  id: string;
  name: string;
  description: string;
  color: string;
  hoverColor: string;
  position: [number, number, number];
  scale: [number, number, number];
  shape: "sphere" | "cylinder" | "tube";
  rotation?: [number, number, number];
}

const HEART_PARTS: HeartPart[] = [
  {
    id: "left-ventricle",
    name: "Ventricule gauche",
    description:
      "Chambre la plus puissante du cœur. Il pompe le sang oxygéné vers tout le corps via l'aorte. Sa paroi est la plus épaisse car il doit générer une pression suffisante pour la circulation systémique.",
    color: "#c0392b",
    hoverColor: "#e74c3c",
    position: [0.45, -0.5, 0.3],
    scale: [0.55, 0.75, 0.5],
    shape: "sphere",
  },
  {
    id: "right-ventricle",
    name: "Ventricule droit",
    description:
      "Il reçoit le sang désoxygéné de l'oreillette droite et le propulse vers les poumons via l'artère pulmonaire. Sa paroi est plus fine que celle du ventricule gauche.",
    color: "#2980b9",
    hoverColor: "#3498db",
    position: [-0.45, -0.5, 0.3],
    scale: [0.5, 0.7, 0.45],
    shape: "sphere",
  },
  {
    id: "left-atrium",
    name: "Oreillette gauche",
    description:
      "Elle reçoit le sang oxygéné provenant des poumons par les veines pulmonaires. Elle se contracte pour envoyer ce sang dans le ventricule gauche à travers la valve mitrale.",
    color: "#e74c3c",
    hoverColor: "#ff6b6b",
    position: [0.45, 0.55, 0],
    scale: [0.42, 0.4, 0.38],
    shape: "sphere",
  },
  {
    id: "right-atrium",
    name: "Oreillette droite",
    description:
      "Elle reçoit le sang désoxygéné du corps par les veines caves supérieure et inférieure. Elle envoie ce sang vers le ventricule droit via la valve tricuspide.",
    color: "#3498db",
    hoverColor: "#5dade2",
    position: [-0.45, 0.55, 0],
    scale: [0.4, 0.38, 0.35],
    shape: "sphere",
  },
  {
    id: "aorta",
    name: "Aorte",
    description:
      "La plus grande artère du corps. Elle part du ventricule gauche et distribue le sang oxygéné à tous les organes. Elle forme une crosse caractéristique avant de descendre dans le thorax et l'abdomen.",
    color: "#e74c3c",
    hoverColor: "#ff6b6b",
    position: [0.2, 1.2, -0.1],
    scale: [0.18, 0.55, 0.18],
    shape: "cylinder",
    rotation: [0, 0, -0.3],
  },
  {
    id: "pulmonary-artery",
    name: "Artère pulmonaire",
    description:
      "Elle transporte le sang désoxygéné du ventricule droit vers les poumons pour y être oxygéné. C'est la seule artère qui transporte du sang pauvre en oxygène.",
    color: "#2980b9",
    hoverColor: "#5dade2",
    position: [-0.25, 1.15, 0.15],
    scale: [0.15, 0.5, 0.15],
    shape: "cylinder",
    rotation: [0, 0, 0.35],
  },
  {
    id: "mitral-valve",
    name: "Valve mitrale",
    description:
      "Aussi appelée valve bicuspide, elle sépare l'oreillette gauche du ventricule gauche. Elle empêche le reflux du sang lors de la contraction ventriculaire (systole).",
    color: "#f39c12",
    hoverColor: "#f1c40f",
    position: [0.45, 0.05, 0.2],
    scale: [0.28, 0.06, 0.22],
    shape: "sphere",
  },
];

function HeartPartMesh({
  part,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  onUnhover,
}: {
  part: HeartPart;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: () => void;
  onUnhover: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const material = useMemo(() => {
    const active = isSelected || isHovered;
    return new THREE.MeshStandardMaterial({
      color: active ? part.hoverColor : part.color,
      transparent: true,
      opacity: isSelected ? 1 : isHovered ? 0.95 : 0.85,
      roughness: 0.4,
      metalness: 0.1,
      emissive: active ? part.hoverColor : "#000000",
      emissiveIntensity: active ? 0.3 : 0,
    });
  }, [isSelected, isHovered, part.color, part.hoverColor]);

  const geometry = useMemo(() => {
    if (part.shape === "cylinder") {
      return new THREE.CylinderGeometry(0.5, 0.45, 1, 16);
    }
    return new THREE.SphereGeometry(0.5, 24, 24);
  }, [part.shape]);

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={part.position}
      scale={part.scale}
      rotation={part.rotation || [0, 0, 0]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHover();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        onUnhover();
        document.body.style.cursor = "auto";
      }}
    />
  );
}

function HeartModel({
  selectedPart,
  hoveredPart,
  onSelectPart,
  onHoverPart,
  onUnhoverPart,
}: {
  selectedPart: string | null;
  hoveredPart: string | null;
  onSelectPart: (id: string) => void;
  onHoverPart: (id: string) => void;
  onUnhoverPart: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current && !hoveredPart && !selectedPart) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Septum / center wall */}
      <mesh position={[0, -0.15, 0.15]} scale={[0.06, 0.9, 0.4]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#8B0000" opacity={0.7} transparent roughness={0.5} />
      </mesh>

      {HEART_PARTS.map((part) => (
        <HeartPartMesh
          key={part.id}
          part={part}
          isSelected={selectedPart === part.id}
          isHovered={hoveredPart === part.id}
          onSelect={() => onSelectPart(part.id)}
          onHover={() => onHoverPart(part.id)}
          onUnhover={onUnhoverPart}
        />
      ))}

      {/* Selected part label in 3D */}
      {selectedPart && (() => {
        const p = HEART_PARTS.find((x) => x.id === selectedPart);
        if (!p) return null;
        return (
          <Html
            position={[p.position[0], p.position[1] + 0.6, p.position[2]]}
            center
            distanceFactor={4}
            style={{ pointerEvents: "none" }}
          >
            <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg px-3 py-1.5 shadow-lg whitespace-nowrap">
              <span className="text-xs font-semibold text-foreground">{p.name}</span>
            </div>
          </Html>
        );
      })()}
    </group>
  );
}

export default function Heart3DViewer() {
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);

  const selectedInfo = HEART_PARTS.find((p) => p.id === selectedPart);

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full h-full min-h-[500px]">
      {/* 3D Canvas */}
      <div className="flex-1 rounded-xl border border-border bg-card overflow-hidden relative min-h-[400px]">
        <Canvas camera={{ position: [0, 0, 3.5], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <directionalLight position={[-3, 2, -3]} intensity={0.3} />
          <pointLight position={[0, 3, 2]} intensity={0.4} color="#ffcccc" />
          <HeartModel
            selectedPart={selectedPart}
            hoveredPart={hoveredPart}
            onSelectPart={setSelectedPart}
            onHoverPart={setHoveredPart}
            onUnhoverPart={() => setHoveredPart(null)}
          />
          <OrbitControls
            enablePan={false}
            minDistance={2}
            maxDistance={6}
            enableDamping
            dampingFactor={0.05}
          />
        </Canvas>

        <div className="absolute bottom-3 left-3 text-xs text-muted-foreground bg-card/80 backdrop-blur-sm px-2 py-1 rounded">
          🖱️ Glisser pour tourner · Cliquer pour explorer
        </div>
      </div>

      {/* Side panel: Legend + Info */}
      <div className="w-full lg:w-72 flex flex-col gap-3">
        {/* Legend */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Légende</h3>
          <div className="space-y-1.5">
            {HEART_PARTS.map((part) => (
              <button
                key={part.id}
                onClick={() => setSelectedPart(selectedPart === part.id ? null : part.id)}
                onMouseEnter={() => setHoveredPart(part.id)}
                onMouseLeave={() => setHoveredPart(null)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-sm transition-colors ${
                  selectedPart === part.id
                    ? "bg-accent text-accent-foreground"
                    : hoveredPart === part.id
                    ? "bg-muted"
                    : "hover:bg-muted/50"
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0 border border-border"
                  style={{ backgroundColor: part.color }}
                />
                <span className="text-foreground">{part.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Detail card */}
        {selectedInfo ? (
          <div className="rounded-xl border border-border bg-card p-4 animate-fade-in">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: selectedInfo.color }}
                />
                <h3 className="font-semibold text-foreground text-sm">
                  {selectedInfo.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPart(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {selectedInfo.description}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-4 text-center">
            <p className="text-xs text-muted-foreground">
              Clique sur une partie du cœur pour en savoir plus
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
