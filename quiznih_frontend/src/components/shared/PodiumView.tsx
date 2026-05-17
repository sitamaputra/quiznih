"use client";
import { motion } from "framer-motion";
import { useEffect } from "react";
import confetti from "canvas-confetti";

export interface PodiumPlayer {
  name: string;
  score: number;
  avatar?: string;
}

interface PodiumViewProps {
  players: PodiumPlayer[]; // sorted rank 1 first, up to 3
  lang?: string;
}

// Visual order: rank 2 (left) → rank 1 (center) → rank 3 (right)
// Stagger: rank 2 rises first, then rank 1, then rank 3
const SLOTS = [
  {
    rankIndex: 1,
    rank: 2,
    delay: 0,
    heightClass: "h-[90px] sm:h-[120px]",
    gradient: "linear-gradient(to top, #9CA3AF, #D1D5DB)",
    numberColor: "#6B7280",
    label: "2",
    crown: false,
  },
  {
    rankIndex: 0,
    rank: 1,
    delay: 0.2,
    heightClass: "h-[120px] sm:h-[160px]",
    gradient: "linear-gradient(to top, #F59E0B, #FCFF52)",
    numberColor: "#92400E",
    label: "1",
    crown: true,
  },
  {
    rankIndex: 2,
    rank: 3,
    delay: 0.4,
    heightClass: "h-[70px] sm:h-[90px]",
    gradient: "linear-gradient(to top, #B45309, #CD7F32)",
    numberColor: "#78350F",
    label: "3",
    crown: false,
  },
] as const;

export default function PodiumView({ players }: PodiumViewProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      confetti({
        particleCount: 200,
        spread: 80,
        origin: { y: 0.5 },
        colors: ["#FCFF52", "#35D07F", "#FDE047", "#CD7F32"],
      });
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full">
      <div className="flex items-end justify-center gap-2 sm:gap-4 px-2">
        {SLOTS.map(({ rankIndex, rank, delay, heightClass, gradient, numberColor, label, crown }) => {
          const player = players[rankIndex];
          return (
            <div key={rank} className="flex flex-col items-center" style={{ width: "30%", maxWidth: 150 }}>
              {/* Player info above podium block */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: delay + 0.18, type: "spring", stiffness: 220, damping: 22 }}
                className="flex flex-col items-center gap-0.5 text-center mb-2 w-full"
              >
                {crown && (
                  <span className="text-2xl sm:text-3xl leading-none mb-0.5">👑</span>
                )}
                {player ? (
                  <>
                    {player.avatar && (
                      <span className="text-2xl sm:text-3xl leading-none">{player.avatar}</span>
                    )}
                    <p className="font-extrabold text-[11px] sm:text-sm text-[#0a1a0f] truncate w-full px-1 leading-tight">
                      {player.name}
                    </p>
                    <p className="font-black text-xs sm:text-sm text-[#35D07F] leading-none">
                      {player.score} pts
                    </p>
                  </>
                ) : (
                  <p className="text-gray-300 text-xs italic leading-none">—</p>
                )}
              </motion.div>

              {/* Podium block — rises from bottom */}
              <motion.div
                className={`w-full ${heightClass} origin-bottom rounded-t-2xl flex items-center justify-center`}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{ delay, type: "spring", stiffness: 160, damping: 20 }}
                style={{ background: player ? gradient : "rgba(209,213,219,0.25)" }}
              >
                <span
                  className="font-black text-3xl sm:text-4xl select-none"
                  style={{ color: player ? numberColor : "#D1D5DB" }}
                >
                  {label}
                </span>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Base platform strip */}
      <div
        className="h-2.5 mx-auto rounded-b-xl"
        style={{
          maxWidth: 460,
          background: "linear-gradient(90deg, #9CA3AF 0%, #FCFF52 50%, #CD7F32 100%)",
          opacity: 0.4,
        }}
      />
    </div>
  );
}
