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
  hoverColor: string;
}

const HEART_PARTS: HeartPart[] = [
  {
    id: "ventricule-gauche",
    name: "Ventricule gauche",
    description:
      "Chambre la plus puissante du cœur. Il pompe le sang oxygéné vers tout le corps via l'aorte. Sa paroi est la plus épaisse car il doit générer une pression suffisante pour la circulation systémique.",
    color: "#c0392b",
    hoverColor: "#e74c3c",
  },
  {
    id: "ventricule-droit",
    name: "Ventricule droit",
    description:
      "Il reçoit le sang désoxygéné de l'oreillette droite et le propulse vers les poumons via l'artère pulmonaire. Sa paroi est plus fine que celle du ventricule gauche.",
    color: "#2980b9",
    hoverColor: "#3498db",
  },
  {
    id: "oreillette-gauche",
    name: "Oreillette gauche",
    description:
      "Elle reçoit le sang oxygéné provenant des poumons par les veines pulmonaires. Elle se contracte pour envoyer ce sang dans le ventricule gauche à travers la valve mitrale.",
    color: "#e74c3c",
    hoverColor: "#ff6b6b",
  },
  {
    id: "oreillette-droite",
    name: "Oreillette droite",
    description:
      "Elle reçoit le sang désoxygéné du corps par les veines caves supérieure et inférieure. Elle envoie ce sang vers le ventricule droit via la valve tricuspide.",
    color: "#3498db",
    hoverColor: "#5dade2",
  },
  {
    id: "aorte",
    name: "Aorte",
    description:
      "La plus grande artère du corps. Elle part du ventricule gauche et distribue le sang oxygéné à tous les organes. Elle forme une crosse caractéristique avant de descendre dans le thorax et l'abdomen.",
    color: "#e74c3c",
    hoverColor: "#ff6b6b",
  },
  {
    id: "artere-pulmonaire",
    name: "Artère pulmonaire",
    description:
      "Elle transporte le sang désoxygéné du ventricule droit vers les poumons pour y être oxygéné. C'est la seule artère qui transporte du sang pauvre en oxygène.",
    color: "#2980b9",
    hoverColor: "#5dade2",
  },
  {
    id: "valve-mitrale",
    name: "Valve mitrale",
    description:
      "Aussi appelée valve bicuspide, elle sépare l'oreillette gauche du ventricule gauche. Elle empêche le reflux du sang lors de la contraction ventriculaire (systole).",
    color: "#f39c12",
    hoverColor: "#f1c40f",
  },
  {
    id: "valve-tricuspide",
    name: "Valve tricuspide",
    description:
      "Elle sépare l'oreillette droite du ventricule droit. Composée de trois feuillets, elle empêche le reflux du sang vers l'oreillette droite lors de la contraction ventriculaire.",
    color: "#e67e22",
    hoverColor: "#f39c12",
  },
  {
    id: "veine-cave",
    name: "Veine cave",
    description:
      "Les veines caves supérieure et inférieure sont les deux plus grosses veines du corps. Elles ramènent le sang désoxygéné de l'organisme vers l'oreillette droite du cœur.",
    color: "#8e44ad",
    hoverColor: "#9b59b6",
  },
];

const MODEL_URL =
  "https://tpvwxfbcdqpwvdwcrluy.supabase.co/storage/v1/object/public/model/anatomical+heart+3d+model.glb";

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
  const { camera } = useThree();

  // Auto-rotate when nothing is selected/hovered
  useFrame((_, delta) => {
    if (groupRef.current && !hoveredPart && !selectedPart) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  // Center and scale the model on load
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

  // Map mesh names from GLB to our part IDs
  // We'll traverse the scene and make all meshes clickable
  // The user can click any mesh, and we'll try to match it to a part
  const meshPartMap = useRef<Map<THREE.Object3D, string>>(new Map());

  useEffect(() => {
    if (!scene) return;
    meshPartMap.current.clear();
    
    // Log all mesh names for debugging
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const name = child.name.toLowerCase();
        // Try to auto-map based on common naming patterns
        if (name.includes("ventricle") && name.includes("left") || name.includes("lv")) {
          meshPartMap.current.set(child, "ventricule-gauche");
        } else if (name.includes("ventricle") && name.includes("right") || name.includes("rv")) {
          meshPartMap.current.set(child, "ventricule-droit");
        } else if (name.includes("atri") && name.includes("left") || name.includes("la")) {
          meshPartMap.current.set(child, "oreillette-gauche");
        } else if (name.includes("atri") && name.includes("right") || name.includes("ra")) {
          meshPartMap.current.set(child, "oreillette-droite");
        } else if (name.includes("aort")) {
          meshPartMap.current.set(child, "aorte");
        } else if (name.includes("pulmon")) {
          meshPartMap.current.set(child, "artere-pulmonaire");
        } else if (name.includes("mitral") || name.includes("bicuspid")) {
          meshPartMap.current.set(child, "valve-mitrale");
        } else if (name.includes("tricuspid")) {
          meshPartMap.current.set(child, "valve-tricuspide");
        } else if (name.includes("vena") || name.includes("cava") || name.includes("cave")) {
          meshPartMap.current.set(child, "veine-cave");
        }
      }
    });
  }, [scene]);

  const handleClick = (e: any) => {
    e.stopPropagation();
    const obj = e.object as THREE.Object3D;
    const partId = meshPartMap.current.get(obj);
    if (partId) {
      onSelectPart(partId);
    }
  };

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    const obj = e.object as THREE.Object3D;
    const partId = meshPartMap.current.get(obj);
    if (partId) {
      onHoverPart(partId);
      document.body.style.cursor = "pointer";
    }
  };

  const handlePointerOut = () => {
    onUnhoverPart();
    document.body.style.cursor = "auto";
  };

  return (
    <group ref={groupRef}>
      <primitive
        object={scene}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />
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
