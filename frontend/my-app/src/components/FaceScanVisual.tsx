/**
 * FaceScanVisual Component - Animated face scanning visualization for sign-in page
 * Converted from Next.js to React (Vite)
 */
import { useEffect, useState } from "react";
import { Scan, Shield, Zap, Target } from "lucide-react";

function FeatureHighlight({ icon: Icon, label }: { icon: typeof Target; label: string }) {
    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg">
            <Icon className="w-4 h-4 text-accent" />
            <span className="text-xs text-foreground font-medium">{label}</span>
        </div>
    );
}

export function FaceScanVisual() {
    const [scanProgress, setScanProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setScanProgress((prev) => (prev >= 100 ? 0 : prev + 1));
        }, 50);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            {/* Background gradient blobs */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-float" />
                <div
                    className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-[128px] animate-float"
                    style={{ animationDelay: "-3s" }}
                />
            </div>

            {/* Dot grid pattern */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(139, 92, 246, 0.3) 1px, transparent 0)`,
                    backgroundSize: "32px 32px",
                }}
            />

            {/* Face scan container */}
            <div className="relative z-10">
                {/* Outer rings */}
                <div className="absolute inset-0 -m-16">
                    <div className="absolute inset-0 border border-primary/20 rounded-full animate-pulse-ring" />
                    <div
                        className="absolute inset-4 border border-primary/30 rounded-full animate-pulse-ring"
                        style={{ animationDelay: "-0.5s" }}
                    />
                    <div
                        className="absolute inset-8 border border-primary/40 rounded-full animate-pulse-ring"
                        style={{ animationDelay: "-1s" }}
                    />
                </div>

                {/* Face frame */}
                <div className="relative w-64 h-80 border-2 border-primary/50 rounded-3xl overflow-hidden bg-card/30 backdrop-blur-sm">
                    {/* Corner brackets */}
                    <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                    <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                    <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                    <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />

                    {/* Scanning line */}
                    <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent animate-scan-line" />

                    {/* Face placeholder */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center">
                                <Scan className="w-12 h-12 text-primary/60" />
                            </div>
                            {/* Scan points */}
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-accent rounded-full animate-pulse" />
                            <div
                                className="absolute top-1/4 -left-1 w-2 h-2 bg-accent rounded-full animate-pulse"
                                style={{ animationDelay: "0.2s" }}
                            />
                            <div
                                className="absolute top-1/4 -right-1 w-2 h-2 bg-accent rounded-full animate-pulse"
                                style={{ animationDelay: "0.4s" }}
                            />
                            <div
                                className="absolute bottom-1/4 -left-1 w-2 h-2 bg-primary rounded-full animate-pulse"
                                style={{ animationDelay: "0.6s" }}
                            />
                            <div
                                className="absolute bottom-1/4 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse"
                                style={{ animationDelay: "0.8s" }}
                            />
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="absolute bottom-6 inset-x-6">
                        <div className="h-1 bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-100"
                                style={{ width: `${scanProgress}%` }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground text-center mt-2">Scanning... {scanProgress}%</p>
                    </div>
                </div>

                {/* Status indicator */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-card border border-border rounded-full flex items-center gap-2">
                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                    <span className="text-xs text-foreground font-medium">AI Recognition Active</span>
                </div>
            </div>

            {/* Feature highlights */}
            <div className="absolute bottom-16 left-8 right-8 flex justify-between">
                <FeatureHighlight icon={Target} label="99.7% Accuracy" />
                <FeatureHighlight icon={Zap} label="Sub-second Check-in" />
                <FeatureHighlight icon={Shield} label="Enterprise Security" />
            </div>

            {/* Logo and tagline */}
            <div className="absolute top-8 left-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary rounded-xl">
                        <Scan className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">AttendanceAI</h1>
                        <p className="text-sm text-muted-foreground">Smart Attendance System</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FaceScanVisual;
