import { useEffect, useLayoutEffect, useRef, useState } from "react";

// useLayoutEffect warns during SSR; effects never run server-side anyway.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Animates a number to `target` over `duration`ms with an ease-out curve:
 * from 0 on first mount, from the previous value on later changes. Returns
 * the in-flight value; render it through whatever formatter the caller
 * already uses (currency, percent, …).
 *
 * SSR renders the final value (no mismatch — the animation kicks off in a
 * layout effect before first paint), and prefers-reduced-motion users always
 * see final values immediately.
 */
export function useCountUp(target: number, duration = 600): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(0);
  const frameRef = useRef(0);

  useIsomorphicLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      fromRef.current = target;
      setValue(target);
      return;
    }

    const from = fromRef.current;
    if (from === target) {
      setValue(target);
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setValue(from + (target - from) * eased);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    setValue(from);
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return value;
}
