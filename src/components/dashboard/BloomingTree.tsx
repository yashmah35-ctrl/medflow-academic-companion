import { motion } from "framer-motion";

interface BloomingTreeProps {
  /** 0-100: percentage of bloom based on total study minutes */
  bloomLevel: number;
  size?: number;
}

const BloomingTree = ({ bloomLevel, size = 160 }: BloomingTreeProps) => {
  const clamp = Math.max(0, Math.min(100, bloomLevel));
  
  // Tree stages: bare (0-10), buds (10-30), partial bloom (30-60), full bloom (60-100)
  const trunkColor = clamp > 30 ? "hsl(25, 40%, 35%)" : "hsl(25, 30%, 28%)";
  const leafOpacity = Math.min(1, clamp / 40);
  const flowerCount = Math.floor((clamp / 100) * 12);
  const leafScale = 0.3 + (clamp / 100) * 0.7;

  const flowers = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const radius = 22 + (i % 3) * 10;
    const cx = 80 + Math.cos(angle) * radius;
    const cy = 42 + Math.sin(angle) * (radius * 0.7);
    return { cx, cy, visible: i < flowerCount, delay: i * 0.12 };
  });

  return (
    <svg width={size} height={size} viewBox="0 0 160 160" className="drop-shadow-lg">
      {/* Ground */}
      <ellipse cx="80" cy="148" rx="45" ry="6" fill="hsl(145, 30%, 20%)" opacity={0.5} />

      {/* Trunk */}
      <motion.path
        d="M80 150 Q78 120 76 100 Q74 85 80 70 Q86 85 84 100 Q82 120 80 150Z"
        fill={trunkColor}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        style={{ transformOrigin: "80px 150px" }}
      />

      {/* Branches */}
      <motion.path
        d="M78 95 Q65 85 55 80 M82 95 Q95 85 105 80 M79 85 Q60 72 50 65 M81 85 Q100 72 110 65"
        fill="none"
        stroke={trunkColor}
        strokeWidth={2.5}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: clamp > 5 ? 1 : 0 }}
        transition={{ duration: 1.2, delay: 0.5 }}
      />

      {/* Leaf canopy */}
      <motion.ellipse
        cx="80" cy="52"
        rx="42" ry="35"
        fill={`hsl(${120 + clamp * 0.3}, ${40 + clamp * 0.3}%, ${20 + clamp * 0.15}%)`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: leafScale, opacity: leafOpacity }}
        transition={{ duration: 1.5, delay: 0.8 }}
        style={{ transformOrigin: "80px 70px" }}
      />
      <motion.ellipse
        cx="65" cy="58"
        rx="25" ry="20"
        fill={`hsl(${130 + clamp * 0.2}, ${35 + clamp * 0.3}%, ${22 + clamp * 0.1}%)`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: leafScale * 0.9, opacity: leafOpacity * 0.8 }}
        transition={{ duration: 1.3, delay: 1 }}
        style={{ transformOrigin: "65px 70px" }}
      />
      <motion.ellipse
        cx="95" cy="58"
        rx="25" ry="20"
        fill={`hsl(${130 + clamp * 0.2}, ${35 + clamp * 0.3}%, ${22 + clamp * 0.1}%)`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: leafScale * 0.9, opacity: leafOpacity * 0.8 }}
        transition={{ duration: 1.3, delay: 1.1 }}
        style={{ transformOrigin: "95px 70px" }}
      />

      {/* Flowers */}
      {flowers.map((f, i) =>
        f.visible ? (
          <motion.circle
            key={i}
            cx={f.cx}
            cy={f.cy}
            r={clamp > 70 ? 5 : 3.5}
            fill={i % 3 === 0 ? "hsl(340, 75%, 65%)" : i % 3 === 1 ? "hsl(45, 90%, 70%)" : "hsl(0, 0%, 100%)"}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.5 + f.delay, type: "spring" }}
            style={{ transformOrigin: `${f.cx}px ${f.cy}px` }}
          />
        ) : null
      )}

      {/* Sparkles for high bloom */}
      {clamp > 80 && (
        <>
          {[
            { cx: 50, cy: 30 },
            { cx: 110, cy: 35 },
            { cx: 80, cy: 20 },
          ].map((s, i) => (
            <motion.circle
              key={`sparkle-${i}`}
              cx={s.cx} cy={s.cy} r={2}
              fill="hsl(45, 100%, 80%)"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.7 }}
            />
          ))}
        </>
      )}
    </svg>
  );
};

export default BloomingTree;
