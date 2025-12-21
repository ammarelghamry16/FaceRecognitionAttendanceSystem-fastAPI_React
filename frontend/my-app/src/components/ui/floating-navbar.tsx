"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "motion/react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface NavItem {
    name: string;
    link: string;
    icon?: React.ReactNode;
}

interface FloatingNavbarProps {
    navItems: NavItem[];
    className?: string;
    logo?: React.ReactNode;
    actionButtons?: React.ReactNode;
}

export function FloatingNavbar({
    navItems,
    className,
    logo,
    actionButtons,
}: FloatingNavbarProps) {
    const { scrollYProgress } = useScroll();
    const [visible, setVisible] = useState(true);
    const [atTop, setAtTop] = useState(true);

    useMotionValueEvent(scrollYProgress, "change", (current) => {
        if (typeof current === "number") {
            const direction = current - scrollYProgress.getPrevious()!;

            // Check if at top of page
            if (current < 0.05) {
                setAtTop(true);
                setVisible(true);
            } else {
                setAtTop(false);
                // Show navbar when scrolling up, hide when scrolling down
                if (direction < 0) {
                    setVisible(true);
                } else {
                    setVisible(false);
                }
            }
        }
    });

    return (
        <AnimatePresence mode="wait">
            <motion.nav
                initial={{
                    opacity: 1,
                    y: 0,
                }}
                animate={{
                    y: visible ? 0 : -100,
                    opacity: visible ? 1 : 0,
                }}
                transition={{
                    duration: 0.2,
                }}
                className={cn(
                    "fixed top-4 inset-x-0 mx-auto z-50 flex items-center justify-between",
                    "max-w-fit px-4 py-2 rounded-full",
                    "border border-white/[0.1] bg-black/80 backdrop-blur-md shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]",
                    atTop && "bg-transparent border-transparent shadow-none backdrop-blur-none",
                    className
                )}
            >
                {/* Logo */}
                {logo && (
                    <div className="mr-4">
                        {logo}
                    </div>
                )}

                {/* Nav Items */}
                <div className="flex items-center gap-1">
                    {navItems.map((navItem, idx) => (
                        <a
                            key={`nav-${idx}`}
                            href={navItem.link}
                            className={cn(
                                "relative flex items-center gap-1.5 px-4 py-2 text-sm",
                                "text-neutral-300 hover:text-white transition-colors",
                                "rounded-full hover:bg-white/[0.05]"
                            )}
                        >
                            {navItem.icon && (
                                <span className="block sm:hidden">{navItem.icon}</span>
                            )}
                            <span className="hidden sm:block">{navItem.name}</span>
                        </a>
                    ))}
                </div>

                {/* Action Buttons */}
                {actionButtons && (
                    <div className="ml-4 flex items-center gap-2">
                        {actionButtons}
                    </div>
                )}
            </motion.nav>
        </AnimatePresence>
    );
}

export default FloatingNavbar;
