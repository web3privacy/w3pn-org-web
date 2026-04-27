"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useInView,
  type Variants,
} from "framer-motion";
import {
  useRef,
  useEffect,
  useLayoutEffect,
  useState,
  createContext,
  useContext,
  type ReactNode,
  type CSSProperties,
} from "react";

/** When true, parent StaggerContainer skipped motion — children render as plain elements (no stagger). */
const StaggerInstantContext = createContext(false);

type Direction = "up" | "down" | "left" | "right";

const OFFSET: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 40 },
  down: { x: 0, y: -40 },
  left: { x: -60, y: 0 },
  right: { x: 60, y: 0 },
};

interface FadeInProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
  style?: CSSProperties;
  as?: "div" | "section" | "span";
  viewportAmount?: number;
}

export function FadeIn({
  children,
  direction = "up",
  delay = 0,
  duration = 0.6,
  className,
  style,
  as = "div",
  viewportAmount = 0.15,
}: FadeInProps) {
  const reduced = useReducedMotion();
  const offset = OFFSET[direction];
  const Tag = motion[as];

  return (
    <Tag
      className={className}
      style={style}
      initial={reduced ? undefined : { opacity: 0, x: offset.x, y: offset.y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: viewportAmount }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </Tag>
  );
}

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  id?: string;
  stagger?: number;
  viewportAmount?: number;
  as?: "div" | "section" | "ul";
  /** Skip stagger / in-view motion (plain layout). Use for very narrow viewports where long stagger feels slow. */
  instant?: boolean;
}

export function StaggerContainer({
  children,
  className,
  style,
  id,
  stagger = 0.08,
  viewportAmount = 0.1,
  as = "div",
  instant = false,
}: StaggerContainerProps) {
  const reduced = useReducedMotion();
  const Tag = motion[as];

  const variants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduced ? 0 : stagger,
      },
    },
  };

  if (instant) {
    return (
      <StaggerInstantContext.Provider value={true}>
        {(() => {
          switch (as) {
            case "section":
              return (
                <section id={id} className={className} style={style}>
                  {children}
                </section>
              );
            case "ul":
              return (
                <ul id={id} className={className} style={style}>
                  {children}
                </ul>
              );
            default:
              return (
                <div id={id} className={className} style={style}>
                  {children}
                </div>
              );
          }
        })()}
      </StaggerInstantContext.Provider>
    );
  }

  return (
    <StaggerInstantContext.Provider value={false}>
      <Tag
        id={id}
        className={className}
        style={style}
        variants={variants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: viewportAmount }}
      >
        {children}
      </Tag>
    </StaggerInstantContext.Provider>
  );
}

const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
};

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: "div" | "article" | "a" | "span";
  [key: string]: unknown;
}

export function StaggerItem({ children, className, style, as = "div", ...rest }: StaggerItemProps) {
  const reduced = useReducedMotion();
  const staggerInstant = useContext(StaggerInstantContext);
  const Tag = motion[as] as typeof motion.div;

  if (staggerInstant) {
    switch (as) {
      case "article":
        return (
          <article className={className} style={style} {...rest}>
            {children}
          </article>
        );
      case "a":
        return (
          <a className={className} style={style} {...(rest as object)}>
            {children}
          </a>
        );
      case "span":
        return (
          <span className={className} style={style} {...rest}>
            {children}
          </span>
        );
      default:
        return (
          <div className={className} style={style} {...rest}>
            {children}
          </div>
        );
    }
  }

  return (
    <Tag
      className={className}
      style={style}
      variants={reduced ? undefined : staggerItemVariants}
      {...rest}
    >
      {children}
    </Tag>
  );
}

interface ScaleInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  style?: CSSProperties;
  viewportAmount?: number;
}

export function ScaleIn({
  children,
  delay = 0,
  duration = 0.6,
  className,
  style,
  viewportAmount = 0.2,
}: ScaleInProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      style={style}
      initial={reduced ? undefined : { opacity: 0, scale: 0.92 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: viewportAmount }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}

interface ParallaxWrapProps {
  children: ReactNode;
  speed?: number;
  className?: string;
  style?: CSSProperties;
  /** When set, parallax is off for viewports narrower than this (px). Helps mobile hero bg fill like static cover. */
  parallaxOffBelow?: number;
}

export function ParallaxWrap({
  children,
  speed = 0.15,
  className,
  style,
  parallaxOffBelow,
}: ParallaxWrapProps) {
  const reduced = useReducedMotion();
  const [parallaxOn, setParallaxOn] = useState(() =>
    typeof parallaxOffBelow !== "number",
  );
  useLayoutEffect(() => {
    if (typeof parallaxOffBelow !== "number") return;
    const mq = window.matchMedia(`(min-width: ${parallaxOffBelow}px)`);
    const sync = () => setParallaxOn(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [parallaxOffBelow]);

  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [`${-speed * 100}px`, `${speed * 100}px`]);

  const useParallax = !reduced && parallaxOn;

  return (
    <div ref={ref} className={className} style={{ overflow: "hidden", ...style }}>
      <motion.div style={useParallax ? { y } : undefined}>{children}</motion.div>
    </div>
  );
}

interface CountUpProps {
  value: string;
  duration?: number;
  className?: string;
  style?: CSSProperties;
}

export function CountUp({ value, duration = 1.5, className, style }: CountUpProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const numericMatch = value.match(/^([\d,.\s]+)(.*)/);
  const [displayed, setDisplayed] = useState(reduced ? value : "0");

  useEffect(() => {
    if (!isInView || reduced || !numericMatch) return;

    const rawNum = numericMatch[1].replace(/[\s,]/g, "");
    const suffix = numericMatch[2] ?? "";
    const target = parseFloat(rawNum);
    if (isNaN(target)) return;

    const isFloat = rawNum.includes(".");
    const start = performance.now();
    const durationMs = duration * 1000;

    let raf: number;
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;

      if (isFloat) {
        setDisplayed(current.toFixed(1) + suffix);
      } else {
        setDisplayed(Math.round(current).toLocaleString() + suffix);
      }

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setDisplayed(value);
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration, isInView, numericMatch, reduced, value]);

  const renderedValue =
    reduced || !isInView || !numericMatch || Number.isNaN(parseFloat(numericMatch[1].replace(/[\s,]/g, "")))
      ? value
      : displayed;

  return (
    <span ref={ref} className={className} style={style}>
      {renderedValue}
    </span>
  );
}
