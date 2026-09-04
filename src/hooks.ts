import { useCallback, useEffect, useState } from "react";

const KEY = "rdai-progress-v1";

export function useProgress(total: number) {
  const [done, setDone] = useState<boolean[]>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return Array.from({ length: total }, (_, i) => Boolean(arr[i]));
      }
    } catch {
      /* noop */
    }
    return Array(total).fill(false);
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(done));
    } catch {
      /* noop */
    }
  }, [done]);

  const toggle = useCallback((i: number) => {
    setDone((d) => d.map((v, idx) => (idx === i ? !v : v)));
  }, []);

  const count = done.filter(Boolean).length;
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return { done, toggle, count, pct };
}
