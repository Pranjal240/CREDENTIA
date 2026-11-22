"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface MorphTextProps {
  /**
   * Words or phrases to cycle through.
   * @default ["CREATE", "DESIGN", "DEVELOP"]
   */
  words?: string[];
  /**
   * Milliseconds each word is displayed before the next one takes over.
   * @default 3000
   */
  interval?: number;
  /** Optional subtext under the morphing word. */
  subtext?: string;
  /**
   * Font size as a CSS value. Defaults to a fluid clamp that scales with the viewport.
   */
  fontSize?: string;
  /** Font family. Defaults to the app font. */
  fontFamily?: string;
  /** Width reserved for the longest word, for example "18ch". */
  minWidth?: string;
  /** Extra classes on the root wrapper. */
  className?: string;
  /** Extra classes on the morphing text container. */
  textClassName?: string;
  /** Extra classes on the subtext. */
  subtextClassName?: string;
}

/**
 * Cycling words. One word leaves with a soft blur and a small lift, then the next
 * arrives the same way, so two words are never on screen together and nothing
 * overlaps. Only opacity, transform and a light blur animate, so it stays smooth.
 */
export function MorphText({
  words = ["CREATE", "DESIGN", "DEVELOP"],
  interval = 3000,
  subtext,
  fontSize = "clamp(3rem, 15vw, 10rem)",
  fontFamily = "var(--font-sans), system-ui, sans-serif",
  minWidth = "14ch",
  className,
  textClassName,
  subtextClassName,
}: MorphTextProps) {
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || words.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % words.length), interval);
    return () => window.clearInterval(id);
  }, [reduced, words.length, interval]);

  return (
    <div className={cn("morph-text-root relative flex flex-col items-center", className)} aria-label={words.join(", ")} role="img">
      <div
        aria-hidden="true"
        className={cn("morph-text-container relative select-none", textClassName)}
        style={{ fontSize, fontWeight: 700, fontFamily }}
      >
        <div className="relative flex items-center justify-center overflow-hidden" style={{ height: "1.25em", minWidth }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={words[index]}
              className="block whitespace-nowrap"
              initial={{ opacity: 0, y: "0.35em", filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: "-0.35em", filter: "blur(8px)" }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
              {words[index]}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {subtext && (
        <p
          className={cn("morph-subtext mt-8 uppercase tracking-[0.2em] text-muted-foreground", subtextClassName)}
          style={{ fontSize: "1.2rem", opacity: 0, animation: "morph-fade-up 1s ease-out 1s forwards", fontFamily }}
        >
          {subtext}
        </p>
      )}
    </div>
  );
}

export default MorphText;
