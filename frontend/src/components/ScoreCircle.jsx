import { motion } from "framer-motion";

export default function ScoreCircle({ score = 0 }) {
  const safeScore = Math.max(0, Math.min(100, score));
  const r = 70;
  const cx = 80;
  const cy = 80;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="flex justify-center mt-6">
      <div className="relative w-40 h-40">
        <svg width="160" height="160" viewBox="0 0 160 160">
          <motion.circle
            cx={cx}
            cy={cy}
            r={r}
            stroke="#22c55e"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (circumference * safeScore) / 100}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{
              strokeDashoffset:
                circumference - (circumference * safeScore) / 100,
            }}
            transition={{ duration: 1.5 }}
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold">
          {Math.round(safeScore)}%
        </div>
      </div>
    </div>
  );
}
