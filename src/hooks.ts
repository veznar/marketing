import { useEffect, useRef, useState } from "react";

/* ---------- прогресс обучения (localStorage) ---------- */

const PROGRESS_KEY = "rdai-progress-v1";

export function useProgress(total: number) {
  const [done, setDone] = useState<boolean[]>(() => {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr.slice(0, total).map(Boolean);
      }
    } catch {
      /* noop */
    }
    return Array(total).fill(false);
  });

  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(done));
    } catch {
      /* noop */
    }
  }, [done]);

  const toggle = (i: number) =>
    setDone((d) => d.map((v, j) => (j === i ? !v : v)));

  const count = done.filter(Boolean).length;
  const pct = total ? Math.round((count / total) * 100) : 0;
  return { done, toggle, count, pct };
}

/* ---------- scroll reveal ---------- */

export function useReveal<T extends HTMLElement>(threshold = 0.12) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, inView };
}
