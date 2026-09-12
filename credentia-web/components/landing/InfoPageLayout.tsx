"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { ArrowLeft, Sun, Moon, AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import Footer from "./Footer";
import ScrollProgress from "./ScrollProgress";
import CustomCursor from "./CustomCursor";

interface InfoPageLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function InfoPageLayout({
  children,
  title,
  subtitle,
}: InfoPageLayoutProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showLightWarning, setShowLightWarning] = useState(false);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const orbY1 = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const orbY2 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const titleY = useTransform(scrollYProgress, [0, 1], [0, 40]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <ScrollProgress />
      <CustomCursor />
      <main ref={heroRef} className="gradient-bg min-h-screen">
        {/* Ambient glow — parallax */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <motion.div style={{ y: orbY1 }} className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[160px]" />
          <motion.div style={{ y: orbY2 }} className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[140px]" />
        </div>

        {/* Top Nav */}
        <nav className="sticky top-0 z-50 glass-strong">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-[rgb(var(--accent))]/30 group-hover:ring-[rgb(var(--accent))]/60 transition-all">
                <Image
                  src="/logo.png"
                  alt="CREDENTIA"
                  fill
                  className="object-contain p-0.5"
                />
              </div>
              <span className="font-heading text-lg font-extrabold tracking-tight text-[rgb(var(--text-primary))]">
                CREDENTIA
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--accent))]/5 rounded-lg transition-all"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Back to Home</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Banner — with parallax + tag */}
        <motion.section
          style={{ y: titleY }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative pt-16 pb-12 text-center px-4"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.25em] uppercase mb-5 px-3 py-1.5 rounded-full border"
            style={{ color: 'rgba(129,140,248,0.9)', background: 'rgba(79,70,229,0.08)', borderColor: 'rgba(129,140,248,0.2)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Credentia · Legal
          </motion.span>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[rgb(var(--text-primary))] mb-4 leading-tight">
            {title.split(" ").map((word, i) =>
              i === title.split(" ").length - 1 ? (
                <span key={i} className="inline-block ml-2" style={{ background: 'linear-gradient(135deg, #818cf8, #2dd4bf)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {word}
                </span>
              ) : (
                <span key={i}>
                  {i > 0 ? " " : ""}
                  {word}
                </span>
              ),
            )}
          </h1>
          <p className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(240,243,255,0.78)' }}>
            {subtitle}
          </p>
        </motion.section>

        {/* Page Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative max-w-6xl mx-auto px-4 sm:px-6 pb-20"
        >
          {children}
        </motion.div>

        <Footer />
      </main>

      {/* Light Mode Warning Toast */}
      <AnimatePresence>
        {showLightWarning && mounted && theme === "light" && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-[200] w-[400px] max-w-[calc(100vw-32px)]"
          >
            <div
              className="relative rounded-2xl p-[1px]"
              style={{
                background:
                  "linear-gradient(135deg, rgba(245,158,11,0.5), rgba(251,191,36,0.3), rgba(245,158,11,0.5))",
              }}
            >
              <div
                className="rounded-2xl p-5 relative overflow-hidden"
                style={{
                  background: "rgba(253,250,245,0.97)",
                  backdropFilter: "blur(20px)",
                }}
              >
                <div
                  className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-30 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(245,158,11,0.4) 0%, transparent 70%)",
                  }}
                />
                <button
                  onClick={() => setShowLightWarning(false)}
                  className="absolute top-3 right-3 p-1.5 rounded-lg transition-colors z-10"
                  style={{ color: "rgba(120,100,70,0.5)" }}
                >
                  <X size={14} />
                </button>
                <div className="flex items-start gap-3.5 relative z-10">
                  <motion.div
                    animate={{ rotate: [0, -8, 8, -4, 0] }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "rgba(245,158,11,0.12)",
                      border: "1px solid rgba(245,158,11,0.2)",
                    }}
                  >
                    <AlertTriangle size={20} style={{ color: "#d97706" }} />
                  </motion.div>
                  <div className="flex-1 min-w-0 pr-5">
                    <p
                      className="font-heading font-bold text-sm"
                      style={{ color: "#92400e" }}
                    >
                      Light Mode — In Development
                    </p>
                    <p
                      className="text-xs leading-relaxed mt-1.5"
                      style={{ color: "rgba(120,90,50,0.7)" }}
                    >
                      Light mode is still being perfected. For the best
                      experience, we recommend{" "}
                      <strong style={{ color: "#78350f" }}>Dark Mode</strong>.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 mt-4 relative z-10">
                  <button
                    onClick={() => setShowLightWarning(false)}
                    className="flex-1 h-9 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                    style={{
                      background: "rgba(245,158,11,0.08)",
                      color: "#b45309",
                      border: "1px solid rgba(245,158,11,0.2)",
                    }}
                  >
                    Continue in Light
                  </button>
                  <button
                    onClick={() => {
                      setTheme("dark");
                      setShowLightWarning(false);
                    }}
                    className="flex-1 h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:opacity-90"
                    style={{
                      background: "linear-gradient(135deg, #1e1b4b, #312e81)",
                      color: "#e0e7ff",
                      boxShadow: "0 4px 16px rgba(30,27,75,0.3)",
                    }}
                  >
                    <Moon size={13} /> Switch to Dark
                  </button>
                </div>
                <motion.div
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: 10, ease: "linear" }}
                  className="absolute bottom-0 left-0 right-0 h-[3px] origin-left"
                  style={{
                    background: "linear-gradient(90deg, #f59e0b, #d97706)",
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
