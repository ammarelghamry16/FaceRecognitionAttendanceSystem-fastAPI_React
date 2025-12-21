/**
 * LiveAttendanceFeed Component - Animated attendance feed demo
 * Converted from Next.js to React (Vite)
 */
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, Clock } from "lucide-react";
import { useEffect, useState } from "react";

const attendanceData = [
    { name: "Sarah Johnson", time: "8:01 AM", status: "On Time", avatar: "SJ" },
    { name: "Ahmed Hassan", time: "8:02 AM", status: "On Time", avatar: "AH" },
    { name: "Emma Williams", time: "8:05 AM", status: "On Time", avatar: "EW" },
    { name: "Michael Chen", time: "8:12 AM", status: "Late", avatar: "MC" },
    { name: "Lisa Park", time: "8:03 AM", status: "On Time", avatar: "LP" },
];

export function LiveAttendanceFeed() {
    const [entries, setEntries] = useState(attendanceData.slice(0, 3));
    const [_currentIndex, setCurrentIndex] = useState(3);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => {
                const nextIndex = (prev + 1) % attendanceData.length;
                const newEntry = attendanceData[nextIndex];
                setEntries((current) => [newEntry, ...current.slice(0, 3)]);
                return nextIndex;
            });
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                    <motion.div
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-green-400"
                    />
                    <span className="text-sm font-medium text-gray-300">Live Feed</span>
                </div>
                <span className="text-xs text-gray-500">Auto-updating</span>
            </div>

            <AnimatePresence mode="popLayout">
                {entries.map((entry, i) => (
                    <motion.div
                        key={`${entry.name}-${i}`}
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-white/5 border border-gray-800/50"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                                {entry.avatar}
                            </div>
                            <div>
                                <div className="text-sm font-medium text-white">{entry.name}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {entry.time}
                                </div>
                            </div>
                        </div>
                        <span
                            className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 ${entry.status === "On Time"
                                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                }`}
                        >
                            <CheckCircle className="w-3 h-3" />
                            {entry.status}
                        </span>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

export default LiveAttendanceFeed;
