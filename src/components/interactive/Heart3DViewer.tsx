import { useState, useRef, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import { X, Loader2 } from "lucide-react";

interface HeartPart {
  id: string;
  name: string;
  description: string;
  color: string;
  position: [number, number, number]; // 3D position for hotspot
}

const HEART_PARTS: HeartPart[] = [
  {
    id: "ventricule-gauche",
    name: "Ventricule gauche",
    description:
      "Chambre la plus puissante du cœur. Il pompe le sang oxygéné vers tout le corps via l'aorte. Sa paroi est la plus épaisse car il doit générer une pression suffisante pour la circulation systémique.",
    color: "#c0392b",
    position: [0.4, -0.6, 0.5],
  },
  {
    id: "ventricule-droit",
    name: "Ventricule droit",
    description:
      "Il reçoit le sang désoxygéné de l'oreillette droite et le propulse vers les poumons via l'artère pulmonaire. Sa paroi est plus fine que celle du ventricule gauche.",
    color: "#2980b9",
    position: [-0.4, -0.6, 0.5],
  },
  {
    id: "oreillette-gauche",
    name: "Oreillette gauche",
    description:
      "Elle reçoit le sang oxygéné provenant des poumons par les veines pulmonaires. Elle se contracte pour envoyer ce sang dans le ventricule gauche à travers la valve mitrale.",
    color: "#e74c3c",
    position: [0.5, 0.5, 0.3],
  },
  {
    id: "oreillette-droite",
    name: "Oreillette droite",
    description:
      "Elle reçoit le sang désoxygéné du corps par les veines caves supérieure et inférieure. Elle envoie ce sang vers le ventricule droit via la valve tricuspide.",
    color: "#3498db",
    position: [-0.5, 0.5, 0.3],
  },
  {
    id: "aorte",
    name: "Aorte",
    description:
      "La plus grande artère du corps. Elle part du ventricule gauche et distribue le sang oxygéné à tous les organes. Elle forme une crosse caractéristique avant de descendre dans le thorax et l'abdomen.",
    color: "#e74c3c",
    position: [0.1, 1.1, 0],
  },
  {
    id: "artere-pulmonaire",
    name: "Artère pulmonaire",
    description:
      "Elle transporte le sang désoxygéné du ventricule droit vers les poumons pour y être oxygéné. C'est la seule artère qui transporte du sang pauvre en oxygène.",
    color: "#2980b9",
    position: [-0.3, 0.9, 0.4],
  },
  {
    id: "valve-mitrale",
    name: "Valve mitrale",
    description:
      "Aussi appelée valve bicuspide, elle sépare l'oreillette gauche du ventricule gauche. Elle empêche le reflux du sang lors de la contraction ventriculaire (systole).",
    color: "#f39c12",
    position: [0.3, 0, 0.4],
  },
  {
    id: "valve-tricuspide",
    name: "Valve tricuspide",
    description:
      "Elle sépare l'oreillette droite du ventricule droit. Composée de trois feuillets, elle empêche le reflux du sang vers l'oreillette droite lors de la contraction ventriculaire.",
    color: "#e67e22",
    position: [-0.3, 0, 0.4],
  },
  {
    id: "veine-cave",
    name: "Veine cave",
    description:
      "Les veines caves supérieure et inférieure sont les deux plus grosses veines du corps. Elles ramènent le sang désoxygéné de l'organisme vers l'oreillette droite du cœur.",
    color: "#8e44ad",
    position: [-0.6, 0.8, -0.2],
  },
];

const MODEL_URL =
  "https://tpvwxfbcdqpwvdwcrluy.supabase.co/storage/v1/object/public/model/anatomical+heart+3d+model.glb";

function Hotspot({
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
  return (
    <group position={part.position}>
      <Html center distanceFactor={5} zIndexRange={[100, 0]}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          onMouseEnter={onHover}
          onMouseLeave={onUnhover}
          className="relative group"
          style={{ transform: "translate(-50%, -50%)" }}
        >
          {/* Pulse ring */}
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-40"
            style={{
              backgroundColor: part.color,
              width: 20,
              height: 20,
              top: -2,
              left: -2,
            }}
          />
          {/* Dot */}
          <span
            className="relative block rounded-full border-2 border-white shadow-lg cursor-pointer transition-transform hover:scale-125"
            style={{
              backgroundColor: isSelected || isHovered ? "#fff" : part.color,
              border: `2px solid ${part.color}`,
              width: 16,
              height: 16,
            }}
          />
          {/* Tooltip on hover */}
          {isHovered && !isSelected && (
            <span
              className="absolute left-1/2 -translate-x-1/2 -top-7 whitespace-nowrap rounded px-2 py-0.5 text-[10px] font-medium text-white shadow-md pointer-events-none"
              style={{ backgroundColor: part.color }}
            >
              {part.name}
            </span>
          )}
        </button>
      </Html>
    </group>
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
  const { scene } = useGLTF(MODEL_URL);

  useFrame((_, delta) => {
    if (groupRef.current && !hoveredPart && !selectedPart) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  useEffect(() => {
    if (scene) {
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2.5 / maxDim;
      scene.scale.setScalar(scale);
      scene.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
    }
  }, [scene]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
      {/* Hotspot buttons in 3D space */}
      {HEART_PARTS.map((part) => (
        <Hotspot
          key={part.id}
          part={part}
          isSelected={selectedPart === part.id}
          isHovered={hoveredPart === part.id}
          onSelect={() => onSelectPart(part.id)}
          onHover={() => onHoverPart(part.id)}
          onUnhover={onUnhoverPart}
        />
      ))}
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
        <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <directionalLight position={[-3, 2, -3]} intensity={0.3} />
          <pointLight position={[0, 3, 2]} intensity={0.4} color="#ffcccc" />
          <Suspense fallback={null}>
            <HeartModel
              selectedPart={selectedPart}
              hoveredPart={hoveredPart}
              onSelectPart={setSelectedPart}
              onHoverPart={setHoveredPart}
              onUnhoverPart={() => setHoveredPart(null)}
            />
          </Suspense>
          <OrbitControls
            enablePan={false}
            minDistance={2}
            maxDistance={6}
            enableDamping
            dampingFactor={0.05}
          />
        </Canvas>

        <div className="absolute bottom-3 left-3 text-xs text-muted-foreground bg-card/80 backdrop-blur-sm px-2 py-1 rounded">
          🖱️ Glisser pour tourner · Cliquer sur un point pour explorer
        </div>
      </div>

      {/* Side panel */}
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
              Clique sur un point coloré du cœur pour en savoir plus
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
