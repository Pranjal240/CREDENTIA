"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  type ButtonHTMLAttributes,
  cloneElement,
  forwardRef,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type Ref,
  useEffect,
  useRef,
} from "react";

/**
 * SmoothButton, the light weight button of the Credentia system.
 *
 * Use it for dense UI: table row actions, icon buttons, chips, dialog footers.
 * Primary calls to action use LiquidButton instead.
 *
 * Three axes:
 *   variant: appearance only (solid | soft | outline | ghost | link)
 *   color:   hue (accent | neutral | destructive | green | amber)
 *   size:    xs | sm | default | lg | icon | icon-sm | icon-lg
 *
 * The color axis only sets custom properties (--btn, --btn-hover, --btn-fg,
 * --btn-text). Every variant reads them, so five variants and five colors stay a
 * handful of class strings. Everything is a flat fill.
 */

// Grows the touch target to 44px on coarse pointers without changing layout.
const HIT_AREA =
  "pointer-coarse:after:absolute pointer-coarse:after:left-1/2 pointer-coarse:after:top-1/2 pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2 pointer-coarse:after:content-['']";

const smoothButtonVariants = cva(
  "relative inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium outline-none transition-[transform,background-color,border-color,color,box-shadow] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    defaultVariants: {
      shape: "default",
      size: "default",
      variant: "default",
    },
    variants: {
      color: {
        accent:
          "[--btn-fg:var(--color-on-brand)] [--btn-hover:var(--color-brand-hover)] [--btn-text:var(--color-brand-ink)] [--btn:var(--color-brand)]",
        amber:
          "[--btn-fg:var(--color-amber-fg)] [--btn-hover:var(--color-amber-hover)] [--btn-text:var(--color-amber-ink)] [--btn:var(--color-amber)]",
        destructive:
          "[--btn-fg:var(--color-destructive-fg)] [--btn-hover:var(--color-destructive-hover)] [--btn-text:var(--color-destructive-ink)] [--btn:var(--color-destructive)]",
        green:
          "[--btn-fg:var(--color-green-fg)] [--btn-hover:var(--color-green-hover)] [--btn-text:var(--color-green-ink)] [--btn:var(--color-green)]",
        neutral:
          "[--btn-fg:var(--color-background)] [--btn-hover:var(--color-smooth-900)] [--btn:var(--color-foreground)]",
      },
      shape: {
        default: "",
        pill: "!rounded-xl",
        square: "!rounded-none",
      },
      size: {
        default: "h-10 gap-2 rounded-lg px-4 text-sm pointer-coarse:min-h-11 [&_svg]:size-4",
        icon: "size-10 rounded-lg pointer-coarse:size-11 [&_svg]:size-4",
        "icon-lg": "size-11 rounded-xl [&_svg]:size-5",
        "icon-sm": `size-9 rounded-lg ${HIT_AREA} [&_svg]:size-4`,
        lg: "h-12 gap-2 rounded-xl px-7 text-base [&_svg]:size-5",
        sm: `h-9 gap-1.5 rounded-lg px-3 text-sm ${HIT_AREA} [&_svg]:size-4`,
        xs: `h-7 gap-1.5 rounded-md px-2.5 text-xs ${HIT_AREA} [&_svg]:size-3.5`,
      },
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-brand-hover",
        destructive: "bg-destructive text-destructive-fg hover:bg-destructive/90",
        ghost:
          "text-[var(--btn-text,var(--btn,var(--color-foreground)))] hover:bg-[color-mix(in_oklab,var(--btn,var(--color-foreground))_12%,transparent)]",
        link: "text-[var(--btn-text,var(--btn,var(--color-foreground)))] underline-offset-4 hover:underline",
        outline:
          "border border-white/15 bg-white/[0.04] text-[var(--btn-text,var(--btn,var(--color-foreground)))] hover:border-white/25 hover:bg-white/10",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        soft: "bg-[color-mix(in_oklab,var(--btn,var(--color-foreground))_14%,transparent)] text-[var(--btn-text,var(--btn,var(--color-foreground)))] hover:bg-[color-mix(in_oklab,var(--btn,var(--color-foreground))_22%,transparent)]",
        solid:
          "bg-[var(--btn,var(--color-foreground))] text-[var(--btn-fg,var(--color-background))] hover:bg-[var(--btn-hover,var(--color-smooth-900))]",
      },
    },
  }
);

export type SmoothButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "prefix" | "color"
> &
  VariantProps<typeof smoothButtonVariants> & {
    asChild?: boolean;
    /** Show a spinner that replaces the label without a layout jump. */
    loading?: boolean;
    /** Content before the label (icon, key hint). */
    prefix?: ReactNode;
    /** Content after the label. */
    suffix?: ReactNode;
    /** Opt in Safari force press depth (scales to 0.94 under pressure). */
    forcePress?: boolean;
  };

const Spinner = () => (
  <svg
    aria-hidden="true"
    className="size-[1em] animate-spin"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="3"
    />
    <path
      className="opacity-90"
      d="M12 2a10 10 0 0 1 10 10"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="3"
    />
  </svg>
);

const mergeRefs =
  <T,>(...refs: (Ref<T> | undefined)[]) =>
  (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        (ref as { current: T | null }).current = node;
      }
    }
  };

const SmoothButton = forwardRef<HTMLButtonElement, SmoothButtonProps>(
  function SmoothButton(
    {
      className,
      variant,
      color,
      size,
      shape,
      asChild = false,
      loading = false,
      forcePress = false,
      prefix,
      suffix,
      disabled,
      children,
      ...props
    },
    ref
  ) {
    const shouldReduceMotion = useReducedMotion();
    const localRef = useRef<HTMLButtonElement>(null);

    // Safari only: deepen the press past the normal active scale.
    useEffect(() => {
      const node = localRef.current;
      if (!(forcePress && node) || shouldReduceMotion) {
        return;
      }
      const FORCE_THRESHOLD = 2;
      const onForce = (e: Event) => {
        const force = (e as Event & { webkitForce?: number }).webkitForce ?? 0;
        node.style.transform = force >= FORCE_THRESHOLD ? "scale(0.94)" : "";
      };
      const reset = () => {
        node.style.transform = "";
      };
      node.addEventListener("webkitmouseforcechanged", onForce);
      node.addEventListener("mouseup", reset);
      node.addEventListener("mouseleave", reset);
      return () => {
        node.removeEventListener("webkitmouseforcechanged", onForce);
        node.removeEventListener("mouseup", reset);
        node.removeEventListener("mouseleave", reset);
      };
    }, [forcePress, shouldReduceMotion]);

    const classes = cn(
      smoothButtonVariants({ className, color, shape, size, variant })
    );
    const variantName = variant ?? "default";

    // asChild hands rendering to the consumer's element, so slots and the
    // loading overlay are not injected.
    if (asChild) {
      if (!isValidElement(children)) {
        return null;
      }
      const child = children as ReactElement<{
        className?: string;
        ref?: Ref<HTMLButtonElement>;
      }> & { ref?: Ref<HTMLButtonElement> };
      return cloneElement(child, {
        ...props,
        className: cn(classes, child.props.className),
        "data-variant": variantName,
        ref: mergeRefs(ref, child.ref, localRef),
      } as never);
    }

    return (
      <button
        aria-busy={loading || undefined}
        className={classes}
        data-variant={variantName}
        disabled={disabled || loading}
        ref={mergeRefs(ref, localRef)}
        type={props.type ?? "button"}
        {...props}
      >
        {/* The spinner overlays the label instead of pushing it aside, so the
            button keeps its width and only opacity and scale animate. */}
        <span
          className={cn(
            "inline-flex items-center justify-center gap-[inherit] transition-opacity duration-150 ease-out motion-reduce:transition-none",
            loading && "opacity-0"
          )}
        >
          {prefix}
          {children}
          {suffix}
        </span>
        <AnimatePresence initial={false}>
          {loading ? (
            <motion.span
              animate={{ opacity: 1, scale: 1 }}
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center"
              exit={{ opacity: 0, scale: 0.95 }}
              initial={
                shouldReduceMotion
                  ? { opacity: 1, scale: 1 }
                  : { opacity: 0, scale: 0.95 }
              }
              key="spinner"
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { bounce: 0.1, duration: 0.25, type: "spring" }
              }
            >
              <Spinner />
            </motion.span>
          ) : null}
        </AnimatePresence>
      </button>
    );
  }
);

export default SmoothButton;
export { smoothButtonVariants };
