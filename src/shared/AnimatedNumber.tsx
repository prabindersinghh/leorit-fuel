import { useEffect, useRef, useState } from "react";
import { fmt } from "../theme";

/** honour prefers-reduced-motion — snap instead of count */
function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

interface Props {
  value: number;
  /** format the resolved number; defaults to en-IN integer */
  format?: (n: number) => string;
  /** ms; 0 disables */
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Eases toward `value`. Numbers count, they do not snap — but restrained,
 * and instant when the OS asks for reduced motion. Always tabular.
 */
export default function AnimatedNumber({
  value,
  format = fmt,
  duration = 520,
  className,
  style,
}: Props) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (duration === 0 || prefersReducedMotion()) {
      setDisplay(value);
      return;
    }
    fromRef.current = display;
    startRef.current = null;
    const from = fromRef.current;
    const delta = value - from;
    if (Math.abs(delta) < 0.5) {
      setDisplay(value);
      return;
    }

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const t = Math.min(1, (now - startRef.current) / duration);
      setDisplay(from + delta * easeOut(t));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return (
    <span
      className={"tnum" + (className ? " " + className : "")}
      style={style}
    >
      {format(display)}
    </span>
  );
}
