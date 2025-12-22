/**
 * Landing Page - Modern Face Recognition Attendance System
 * Converted from Next.js landing-page-enhancement to React (Vite)
 */
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import {
  Scan,
  ArrowRight,
  Shield,
  Clock,
  Users,
  CheckCircle,
  Zap,
  BarChart3,
  Building2,
  GraduationCap,
  Briefcase,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveAttendanceFeed } from "@/components/LiveAttendanceFeed";
import { HeroVisual } from "@/components/HeroVisual";
import { ThreeDMarquee } from "@/components/ui/3d-marquee";
import { FloatingNavbar } from "@/components/ui/floating-navbar";

export default function Landing() {
  const showcaseImages = [
    "/face-recognition-scan-interface.jpg",
    "/student-attendance-dashboard.jpg",
    "/biometric-verification-system.jpg",
    "/classroom-monitoring-display.jpg",
    "/ai-face-detection-overlay.jpg",
    "/real-time-attendance-log.jpg",
    "/smart-campus-security-system.jpg",
    "/student-check-in-kiosk.jpg",
    "/face-recognition-scan-interface.jpg",
    "/student-attendance-dashboard.jpg",
    "/biometric-verification-system.jpg",
    "/classroom-monitoring-display.jpg",
    "/ai-face-detection-overlay.jpg",
    "/real-time-attendance-log.jpg",
    "/smart-campus-security-system.jpg",
    "/student-check-in-kiosk.jpg",
  ];

  const features = [
    {
      icon: Shield,
      title: "99.7% Accuracy",
      description: "Military-grade facial recognition with advanced anti-spoofing protection",
    },
    {
      icon: Clock,
      title: "Sub-Second Check-in",
      description: "Students walk in and are automatically logged in under 0.3 seconds",
    },
    {
      icon: Users,
      title: "Unlimited Capacity",
      description: "Handle thousands of faces simultaneously with no performance drop",
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Instant attendance reports, trends, and insights at your fingertips",
    },
  ];


  const steps = [
    {
      number: "01",
      title: "Quick Setup",
      description: "Install our compact camera system in any classroom or entrance point",
    },
    {
      number: "02",
      title: "Enroll Faces",
      description: "Students take a quick photo - our AI builds a secure facial profile",
    },
    {
      number: "03",
      title: "Auto-Track",
      description: "Attendance is logged automatically as students enter the room",
    },
  ];

  const useCases = [
    { icon: GraduationCap, title: "Schools & Universities", description: "Automated classroom attendance" },
    { icon: Building2, title: "Corporate Offices", description: "Secure employee check-in" },
    { icon: Briefcase, title: "Training Centers", description: "Course attendance tracking" },
  ];

  const testimonials = [
    {
      quote: "We eliminated 45 minutes of daily roll-call time across 50 classrooms. The ROI was immediate.",
      author: "Dr. Sarah Chen",
      role: "Principal, Westfield Academy",
      metric: "45 min saved daily",
    },
    {
      quote: "The accuracy is remarkable. Zero false positives in 6 months of operation with 2,000 students.",
      author: "Michael Torres",
      role: "IT Director, Metro University",
      metric: "0 false positives",
    },
    {
      quote: "Our employees love it. No more badge swipes, no more queues at the entrance.",
      author: "Lisa Park",
      role: "HR Manager, TechCorp",
      metric: "100% adoption",
    },
  ];

  const navItems = [
    { name: "Features", link: "#features" },
    { name: "How It Works", link: "#how-it-works" },
    { name: "Showcase", link: "#showcase" },
    { name: "Testimonials", link: "#testimonials" },
  ];

  // Landing page specific theme (violet/cyan dark theme)
  const landingThemeStyles = {
    '--background': 'oklch(0.07 0.01 280)',
    '--foreground': 'oklch(0.98 0 0)',
    '--card': 'oklch(0.12 0.015 280)',
    '--card-foreground': 'oklch(0.98 0 0)',
    '--popover': 'oklch(0.12 0.015 280)',
    '--popover-foreground': 'oklch(0.98 0 0)',
    '--primary': 'oklch(0.628 0.2 280)',
    '--primary-foreground': 'oklch(0.98 0 0)',
    '--secondary': 'oklch(0.18 0.02 280)',
    '--secondary-foreground': 'oklch(0.98 0 0)',
    '--muted': 'oklch(0.18 0.02 280)',
    '--muted-foreground': 'oklch(0.6 0 0)',
    '--accent': 'oklch(0.75 0.15 195)',
    '--accent-foreground': 'oklch(0.12 0 0)',
    '--destructive': 'oklch(0.577 0.245 27.325)',
    '--destructive-foreground': 'oklch(0.98 0 0)',
    '--border': 'oklch(0.25 0.02 280)',
    '--input': 'oklch(0.18 0.02 280)',
    '--ring': 'oklch(0.628 0.2 280)',
  } as React.CSSProperties;

  return (
    <main
      className="min-h-screen bg-background text-foreground overflow-x-hidden"
      style={landingThemeStyles}
    >
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex flex-col">
        {/* Background gradient effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-[128px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[128px]" />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Floating Navigation */}
        <FloatingNavbar
          navItems={navItems}
          logo={
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Scan className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-white hidden sm:block">AttendanceAI</span>
            </Link>
          }
          actionButtons={
            <Button size="sm" className="bg-primary hover:bg-primary/90" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          }
        />


        {/* Hero Content */}
        <div className="relative z-20 flex-1 flex items-center px-6 lg:px-12 py-16">
          <div className="w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left side - Text */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6"
              >
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm">
                  <Zap className="w-4 h-4" />
                  AI-Powered Face Recognition
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-balance"
              >
                The Future of{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
                  Attendance
                </span>{" "}
                is Here
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg text-muted-foreground mb-8 max-w-lg"
              >
                Eliminate manual roll calls forever. Our AI identifies and logs attendance in milliseconds as people
                walk through the door. No badges, no check-ins, no friction.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex items-center gap-8"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm text-muted-foreground">No hardware required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm text-muted-foreground">GDPR compliant</span>
                </div>
              </motion.div>
            </div>

            {/* Right side - Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <HeroVisual />
            </motion.div>
          </div>
        </div>

        {/* Trusted by logos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="relative z-20 border-t border-border/50 py-8 px-6 lg:px-12"
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <span className="text-sm text-muted-foreground">Trusted by leading institutions</span>
            <div className="flex items-center gap-8 md:gap-12 text-muted-foreground/50">
              {["Stanford", "MIT", "Harvard", "Oxford", "TechCorp"].map((name) => (
                <span key={name} className="text-lg font-semibold tracking-wide">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </section>


      {/* ===== FEATURES SECTION ===== */}
      <section id="features" className="py-24 px-6 lg:px-12 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary text-sm font-medium tracking-wider uppercase mb-4 block">Features</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-balance">
              Everything You Need for Modern Attendance
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built with cutting-edge AI to handle real-world scenarios with precision
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS SECTION ===== */}
      <section id="how-it-works" className="py-24 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary text-sm font-medium tracking-wider uppercase mb-4 block">How It Works</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-balance">Up and Running in Minutes</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to transform your attendance management
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative"
              >
                <div className="text-6xl font-bold text-primary/10 mb-4">{step.number}</div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 right-0 w-1/2 h-0.5 bg-gradient-to-r from-primary/30 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ===== LIVE DEMO SECTION ===== */}
      <section className="py-24 px-6 lg:px-12 bg-gradient-to-b from-card/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary text-sm font-medium tracking-wider uppercase mb-4 block">Live Demo</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-balance">See It In Action</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Watch real-time attendance being logged as students check in
            </p>
          </motion.div>

          <div className="max-w-2xl mx-auto">
            <LiveAttendanceFeed />
          </div>
        </div>
      </section>

      {/* ===== 3D SHOWCASE SECTION ===== */}
      <section id="showcase" className="py-24 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 px-6"
        >
          <span className="text-primary text-sm font-medium tracking-wider uppercase mb-4 block">Showcase</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-balance">Trusted Across Industries</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From classrooms to corporate offices, AttendanceAI adapts to your needs
          </p>
        </motion.div>

        <div className="h-[500px]">
          <ThreeDMarquee images={showcaseImages} />
        </div>
      </section>

      {/* ===== USE CASES SECTION ===== */}
      <section className="py-24 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary text-sm font-medium tracking-wider uppercase mb-4 block">Use Cases</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-balance">
              Built for Every Environment
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {useCases.map((useCase, index) => (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group p-8 rounded-2xl bg-gradient-to-br from-card to-card/50 border border-border hover:border-primary/30 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <useCase.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{useCase.title}</h3>
                <p className="text-muted-foreground">{useCase.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ===== TESTIMONIALS SECTION ===== */}
      <section
        id="testimonials"
        className="py-24 px-6 lg:px-12 bg-gradient-to-b from-transparent via-primary/5 to-transparent"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary text-sm font-medium tracking-wider uppercase mb-4 block">Testimonials</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-balance">Loved by Administrators</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-card border border-border"
              >
                <div className="mb-4 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium inline-block">
                  {testimonial.metric}
                </div>
                <blockquote className="text-foreground mb-6">{`"${testimonial.quote}"`}</blockquote>
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-24 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-12 rounded-3xl bg-gradient-to-br from-primary/20 via-card to-accent/20 border border-border relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-transparent to-cyan-500/10" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-balance">
                Ready to Transform Your Attendance?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Join thousands of institutions already using AttendanceAI.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-12 px-6 lg:px-12 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Scan className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">AttendanceAI</span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link to="/login" className="hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
          <div className="text-sm text-muted-foreground">© 2025 AttendanceAI. All rights reserved.</div>
        </div>
      </footer>
    </main>
  );
}
