"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

const contributors = [
  {
    name: "Nihal Kumar",
    role: "Founder & Manager",
    img: "/team/NIHAL Kumar.png",
    bio: "Architecting scalable AI-powered verification systems using cutting-edge technologies. Expert in building secure, high-throughput platforms that handle millions of document verifications.",
    linkedin: "#",
    objectPosition: "object-center",
  },
  {
    name: "Pragya Mishra",
    role: "Founder & Junior Backend Developer",
    img: "/team/Pragya Mishra.png",
    bio: "Contributing to backend systems and server-side logic that powers the Credentia platform. Passionate about building reliable APIs and database architectures that ensure seamless credential verification at scale.",
    linkedin: "#",
    objectPosition: "object-[55%_20%]",
  },
  {
    name: "Harshita Sangwan",
    role: "Founder & Backend Developer",
    img: "/team/Harshita Sangwan.png",
    bio: "Engineering robust backend systems and scalable server infrastructure for the Credentia platform. Dedicated to building secure, high-performance APIs and architecting reliable data pipelines.",
    linkedin: "#",
    objectPosition: "object-[center_15%]",
  },
];

export default function ContributingMembersPage() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <main className="gradient-bg min-h-screen relative overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="absolute top-20 left-1/4 w-[400px] h-[400px] bg-blue-500/[0.04] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-40 right-1/4 w-[350px] h-[350px] bg-teal-400/[0.04] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/[0.03] rounded-full blur-[140px] pointer-events-none" />

      {/* Navigation bar */}
      <nav
        className="sticky top-0 z-50 px-4 sm:px-6 py-4"
        style={{
          background: "rgba(8,10,25,0.8)",
          backdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/#team">
            <motion.button
              whileHover={{ x: -3 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer"
              style={{ color: "rgb(var(--text-secondary))" }}
            >
              <ArrowLeft size={18} className="text-blue-400" />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Back</span>
            </motion.button>
          </Link>
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <img
                src="/logo.png"
                alt="Credentia"
                className="h-8 w-auto rounded-lg"
              />
              <span
                className="font-heading font-bold text-lg hidden sm:block"
                style={{ color: "rgb(var(--text-primary))" }}
              >
                Credentia
              </span>
            </motion.div>
          </Link>
        </div>
      </nav>

      {/* Page Content */}
      <div ref={ref} className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-24 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.15)",
            }}
          >
            <Sparkles size={14} className="text-blue-400" />
            <span className="text-xs font-semibold text-blue-400 tracking-wider uppercase">
              Our Contributors
            </span>
          </motion.div>

          <h1
            className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold mb-5 leading-tight"
            style={{ color: "rgb(var(--text-primary))" }}
          >
            Contributing{" "}
            <span className="gradient-text">Members</span>
          </h1>
          <p
            className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
            style={{ color: "rgb(var(--text-secondary))" }}
          >
            The dedicated individuals who contribute their expertise and passion
            to make Credentia&apos;s vision a reality
          </p>
        </motion.div>

        {/* Contributors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10 max-w-4xl mx-auto">
          {contributors.map((member, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
              onClick={() => setSelected(i)}
              className="group cursor-pointer"
            >
              <div
                className="relative rounded-3xl overflow-hidden transition-all duration-500 group-hover:translate-y-[-6px]"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                }}
              >
                {/* Hover glow overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-teal-400/0 group-hover:from-blue-500/10 group-hover:to-teal-400/10 transition-all duration-700 z-10 pointer-events-none" />

                {/* Image */}
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img
                    src={member.img}
                    alt={member.name}
                    className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 group-hover:brightness-110 ${member.objectPosition}`}
                  />
                  {/* Gradient fade at bottom */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-32"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.5) 50%, transparent 100%)",
                    }}
                  />
                </div>

                {/* Info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
                  <h3
                    className="font-heading text-lg font-bold mb-1 group-hover:text-blue-400 transition-colors duration-300"
                    style={{ color: "rgb(var(--text-primary))" }}
                  >
                    {member.name}
                  </h3>
                  <p
                    className="text-xs font-medium"
                    style={{ color: "rgb(var(--text-muted))" }}
                  >
                    {member.role}
                  </p>

                  {/* View profile hint */}
                  <div className="flex items-center gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <span className="text-[10px] font-semibold text-blue-400 tracking-wider uppercase">
                      View Profile
                    </span>
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        ease: "easeInOut",
                      }}
                    >
                      <ArrowLeft
                        size={12}
                        className="text-blue-400 rotate-180"
                      />
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Back to founders CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-16"
        >
          <Link href="/#team">
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer"
              style={{
                background: "rgba(59,130,246,0.1)",
                border: "1px solid rgba(59,130,246,0.2)",
                color: "#60a5fa",
              }}
            >
              <ArrowLeft size={16} />
              Back to Founders
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* Glassmorphism Zoom Modal */}
      <AnimatePresence>
        {selected !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
            style={{
              background: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(20px)",
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 40 }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
              style={{
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(40px) saturate(180%)",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow:
                  "0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              {/* Close */}
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-white/20"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  color: "white",
                }}
              >
                <X size={18} />
              </button>

              {/* Image area */}
              <div className="relative w-full aspect-[4/5] bg-gradient-to-br from-blue-600/20 via-transparent to-teal-600/20">
                <img
                  src={contributors[selected].img}
                  alt={contributors[selected].name}
                  className={`w-full h-full object-cover transition-transform duration-1000 ${contributors[selected].objectPosition}`}
                />
                <div
                  className="absolute bottom-0 left-0 right-0 h-32"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(10,10,15,0.95), transparent)",
                  }}
                />
              </div>

              {/* Bio area */}
              <div className="px-6 pb-6 -mt-14 relative z-10">
                <h3 className="font-heading text-2xl font-bold text-white mb-1">
                  {contributors[selected].name}
                </h3>
                <p className="text-sm font-semibold text-blue-400 mb-3">
                  {contributors[selected].role}
                </p>
                <p className="text-sm leading-relaxed text-white/60">
                  {contributors[selected].bio}
                </p>
                {contributors[selected].linkedin &&
                  contributors[selected].linkedin !== "#" && (
                    <a
                      href={contributors[selected].linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl text-sm font-medium text-blue-400 transition-all hover:bg-blue-500/20"
                      style={{ background: "rgba(59,130,246,0.1)" }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                      LinkedIn
                    </a>
                  )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
