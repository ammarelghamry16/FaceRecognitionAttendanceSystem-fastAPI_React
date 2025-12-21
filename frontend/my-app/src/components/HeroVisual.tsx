/**
 * HeroVisual Component - Animated face scanning visualization
 * Converted from Next.js to React (Vite)
 */
import { motion } from "motion/react";
import { useEffect, useState } from "react";

const scanPoints = [
    { x: 35, y: 28, label: "Eye L" },
    { x: 65, y: 28, label: "Eye R" },
    { x: 50, y: 45, label: "Nose" },
    { x: 35, y: 60, label: "Mouth L" },
    { x: 65, y: 60, label: "Mouth R" },
    { x: 50, y: 70, label: "Chin" },
    { x: 25, y: 40, label: "Jaw L" },
    { x: 75, y: 40, label: "Jaw R" },
];

export function HeroVisual() {
    const [scanProgress, setScanProgress] = useState(0);
    const [activePoints, setActivePoints] = useState<number[]>([]);
    const [status, setStatus] = useState<"scanning" | "verified">("scanning");

    useEffect(() => {
        const interval = setInterval(() => {
            setScanProgress((prev) => {
                if (prev >= 100) {
                    setStatus("verified");
                    setTimeout(() => {
                        setScanProgress(0);
                        setActivePoints([]);
                        setStatus("scanning");
                    }, 2000);
                    return 100;
                }
                return prev + 2;
            });
        }, 50);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const pointInterval = setInterval(() => {
            if (status === "scanning") {
                setActivePoints((prev) => {
                    if (prev.length >= scanPoints.length) return prev;
                    const next = [...prev, prev.length];
                    return next;
                });
            }
        }, 300);

        return () => clearInterval(pointInterval);
    }, [status]);


    return (
        <div className="relative w-full max-w-lg mx-auto">
            {/* Outer glow */}
            <div className="absolute -inset-8 bg-gradient-to-r from-violet-500/20 via-cyan-500/20 to-violet-500/20 blur-3xl rounded-full" />

            {/* Main container */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative aspect-square rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm overflow-hidden"
            >
                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `
              linear-gradient(to right, rgba(139, 92, 246, 0.3) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(139, 92, 246, 0.3) 1px, transparent 1px)
            `,
                        backgroundSize: "40px 40px",
                    }}
                />

                {/* Scanning line */}
                <motion.div
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                    style={{ top: `${scanProgress}%` }}
                    animate={{
                        opacity: status === "scanning" ? [0.5, 1, 0.5] : 0,
                    }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                />

                {/* Face outline */}
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full p-8">
                    {/* Face oval */}
                    <motion.ellipse
                        cx="50"
                        cy="50"
                        rx="30"
                        ry="38"
                        fill="none"
                        stroke="url(#faceGradient)"
                        strokeWidth="0.5"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                    />

                    {/* Detection points */}
                    {scanPoints.map((point, i) => (
                        <g key={i}>
                            <motion.circle
                                cx={point.x}
                                cy={point.y}
                                r="2"
                                fill={activePoints.includes(i) ? "#06b6d4" : "transparent"}
                                stroke={activePoints.includes(i) ? "#06b6d4" : "#8b5cf6"}
                                strokeWidth="0.5"
                                initial={{ scale: 0 }}
                                animate={{
                                    scale: activePoints.includes(i) ? 1 : 0.5,
                                    opacity: activePoints.includes(i) ? 1 : 0.3,
                                }}
                                transition={{ duration: 0.3 }}
                            />
                            {activePoints.includes(i) && (
                                <motion.circle
                                    cx={point.x}
                                    cy={point.y}
                                    r="4"
                                    fill="none"
                                    stroke="#06b6d4"
                                    strokeWidth="0.3"
                                    initial={{ scale: 0, opacity: 1 }}
                                    animate={{ scale: 2, opacity: 0 }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                />
                            )}
                        </g>
                    ))}

                    {/* Connection lines between points */}
                    {activePoints.length > 1 && (
                        <motion.path
                            d={`M ${scanPoints[0].x} ${scanPoints[0].y} 
                  L ${scanPoints[1].x} ${scanPoints[1].y}
                  L ${scanPoints[7].x} ${scanPoints[7].y}
                  L ${scanPoints[4].x} ${scanPoints[4].y}
                  L ${scanPoints[5].x} ${scanPoints[5].y}
                  L ${scanPoints[3].x} ${scanPoints[3].y}
                  L ${scanPoints[6].x} ${scanPoints[6].y}
                  L ${scanPoints[0].x} ${scanPoints[0].y}`}
                            fill="none"
                            stroke="url(#lineGradient)"
                            strokeWidth="0.3"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: activePoints.length / scanPoints.length }}
                            transition={{ duration: 0.5 }}
                        />
                    )}

                    <defs>
                        <linearGradient id="faceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.5" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Corner brackets */}
                <div className="absolute top-6 left-6 w-8 h-8 border-l-2 border-t-2 border-violet-500/50" />
                <div className="absolute top-6 right-6 w-8 h-8 border-r-2 border-t-2 border-violet-500/50" />
                <div className="absolute bottom-6 left-6 w-8 h-8 border-l-2 border-b-2 border-violet-500/50" />
                <div className="absolute bottom-6 right-6 w-8 h-8 border-r-2 border-b-2 border-violet-500/50" />

                {/* Status indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
                    <motion.div
                        className={`w-2 h-2 rounded-full ${status === "verified" ? "bg-emerald-400" : "bg-cyan-400"}`}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                    />
                    <span className={`text-sm font-mono ${status === "verified" ? "text-emerald-400" : "text-cyan-400"}`}>
                        {status === "verified" ? "VERIFIED" : `SCANNING ${scanProgress}%`}
                    </span>
                </div>
            </motion.div>

            {/* Floating data cards */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute -left-4 top-1/4 bg-card/80 backdrop-blur-sm border border-white/10 rounded-lg p-3 text-xs"
            >
                <div className="text-muted-foreground">Match Rate</div>
                <div className="text-lg font-bold text-violet-400">99.7%</div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="absolute -right-4 top-1/3 bg-card/80 backdrop-blur-sm border border-white/10 rounded-lg p-3 text-xs"
            >
                <div className="text-muted-foreground">Process Time</div>
                <div className="text-lg font-bold text-cyan-400">0.3s</div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-card/80 backdrop-blur-sm border border-white/10 rounded-lg p-3 text-xs whitespace-nowrap"
            >
                <div className="text-muted-foreground">Points Mapped</div>
                <div className="text-lg font-bold text-emerald-400">
                    {activePoints.length}/{scanPoints.length}
                </div>
            </motion.div>
        </div>
    );
}

export default HeroVisual;
