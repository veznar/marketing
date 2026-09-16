import { useCallback, useEffect, useMemo, useState } from "react";
import { ALL_LESSONS, BLOCKS, COURSE } from "../data/course";
import { useProgress } from "../hooks";
import { LogoMark } from "../components/icons";
import type { Slide } from "./slides";
import SlideContent from "./slides";

export function buildSlides(): Slide[] {
  const list: Slide[] = [];
  list.push({ kind: "title" });
  list.push({ kind: "method" });
  list.push({ kind: "agenda" });
  list.push({ kind: "case" });
  list.push({ kind: "product" });
  list.push({ kind: "math" });
  list.push({ kind: "stack" });
  for (const b of BLOCKS) {
    list.push({ kind: "block", blockId: b.id });
    for (const l of b.lessons) {
      for (let part = 0; part < 5; part++) {
        list.push({ kind: "lesson", lessonId: l.id, part });
      }
    }
    if (b.id < 4) list.push({ kind: "blockSummary", blockId: b.id });
  }
  list.push({ kind: "block", blockId: 4 });
  list.push({ kind: "exam" });
  list.push({ kind: "cert" });
  list.push({ kind: "plan" });
  list.push({ kind: "takeaways" });
  list.push({ kind: "final" });
  return list;
}

export function slideLabel(s: Slide): string {
  switch (s.kind) {
    case "title": return "Титульный лист";
    case "method": return "Как устроен курс";
    case "agenda": return "Программа · 4 блока";
    case "case": return "Сквозной кейс «Ремдизель»";
    case "product": return "Продукт: КАМАЗ-Щит РТ-80";
    case "math": return "Рыночная математика";
    case "stack": return "Технологический стек";
    case "block": return BLOCKS.find((b) => b.id === s.blockId)?.title ?? "";
    case "blockSummary": return `Итоги блока 0${s.blockId}`;
    case "lesson": {
      const l = ALL_LESSONS.find((x) => x.id === s.lessonId)!;
      const parts = ["Постановка", "Технология", "Промт", "Ход решения", "Результат"];
      return `${l.num} ${l.title} · ${parts[s.part]}`;
    }
    case "exam": return "Экзамен у ИИ-экзаменатора";
    case "cert": return "Именной сертификат";
    case "plan": return "Годовой план 2025";
    case "takeaways": return "Что вы уносите с курса";
    case "final": return "Финал";
  }
}

export function slideGroup(s: Slide): string {
  switch (s.kind) {
    case "block":
    case "blockSummary":
      return BLOCKS.find((b) => b.id === s.blockId)?.code ?? "";
    case "lesson":
      return BLOCKS.find((b) => b.lessons.some((l) => l.id === s.lessonId))?.code ?? "";
    default:
      return "—";
  }
}

function readHash(total: number): number {
  const m = window.location.hash.match(/#\/?s?(\d+)/i);
  if (!m) return 0;
  const n = parseInt(m[1], 10) - 1;
  return n >= 0 && n < total ? n : 0;
}

export default function DeckShell() {
  const slides = useMemo(buildSlides, []);
  const [idx, setIdx] = useState(() => readHash(slides.length));
  const progress = useProgress(ALL_LESSONS.length);

  const go = useCallback((n: number) => {
    setIdx(Math.max(0, Math.min(slides.length - 1, n)));
  }, [slides.length]);

  const next = useCallback(() => setIdx((c) => Math.min(slides.length - 1, c + 1)), [slides.length]);
  const prev = useCallback(() => setIdx((c) => Math.max(0, c - 1)), []);

  useEffect(() => {
    history.replaceState(null, "", `#/${idx + 1}`);
  }, [idx]);

  useEffect(() => {
    const s = slides[idx];
    if (s.kind === "lesson" && s.part === 4) {
      const lessonIdx = ALL_LESSONS.findIndex((l) => l.id === s.lessonId);
      if (lessonIdx >= 0 && !progress.done[lessonIdx]) progress.toggle(lessonIdx);
    }
  }, [idx, slides, progress]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === "TEXTAREA" || tag === "INPUT";
      if (typing) return;
      if (e.key === " " && tag === "BUTTON") return;
      switch (e.key) {
        case "ArrowRight":
        case "PageDown":
        case " ":
          e.preventDefault();
          next();
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          prev();
          break;
        case "Home":
          e.preventDefault();
          go(0);
          break;
        case "End":
          e.preventDefault();
          go(slides.length - 1);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, go, slides.length]);

  const cur = slides[idx];
  const group = slideGroup(cur);

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* верхняя панель */}
      <div className="fixed inset-x-0 top-0 z-40 border-b border-edge bg-white/95 backdrop-blur-sm">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <button onClick={() => go(0)} className="flex items-center gap-2.5">
            <LogoMark className="h-7 w-7 text-kblue" />
            <span className="hidden leading-tight sm:block">
              <span className="block font-display text-[11px] font-bold tracking-wide text-ink">РЕМДИЗЕЛЬ</span>
              <span className="block font-mono text-[8px] uppercase tracking-[0.22em] text-steel">AI-академия · {COURSE.hours} ч</span>
            </span>
          </button>

          <div className="mx-2 hidden h-6 w-px bg-edge md:block" />
          <p className="hidden truncate font-mono text-[10px] uppercase tracking-[0.18em] text-steel md:block">
            {group !== "—" && <span className="text-kamber">{group} · </span>}
            {slideLabel(cur)}
          </p>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex" title={`Пройдено ${progress.pct}% уроков`}>
              <svg viewBox="0 0 28 28" className="h-6 w-6 -rotate-90">
                <circle cx="14" cy="14" r="11" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <circle
                  cx="14" cy="14" r="11" fill="none"
                  stroke={progress.pct >= 100 ? "#10b981" : "#f97316"}
                  strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 11}
                  strokeDashoffset={2 * Math.PI * 11 * (1 - progress.pct / 100)}
                />
              </svg>
              <span className="font-mono text-[11px] text-fog">{progress.pct}%</span>
            </div>
            <button
              onClick={async () => {
                const { exportDeckPdf } = await import("./pdfDoc");
                await exportDeckPdf(slides);
              }}
              className="rounded bg-kblue px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white hover:bg-kdeep"
            >
              PDF
            </button>
            <button
              onClick={async () => {
                const { exportPptx } = await import("./pptxExport");
                await exportPptx(slides);
              }}
              className="rounded bg-kamber px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white hover:bg-kamber2"
            >
              PPTX
            </button>
          </div>
        </div>
        <div className="h-0.5 w-full bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-kdeep via-kblue to-kamber"
            style={{ width: `${((idx + 1) / slides.length) * 100}%` }}
          />
        </div>
      </div>

      {/* слайд */}
      <main className="flex flex-1 items-stretch pb-24 pt-14">
        <div className="relative min-h-[calc(100vh-14.5rem)] w-full">
          <SlideContent slide={cur} goTo={go} index={idx} />
        </div>
      </main>

      {/* нижняя навигация */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-edge bg-white/95 backdrop-blur-sm">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <button
            onClick={prev}
            disabled={idx === 0}
            className="flex items-center gap-2 rounded border border-edge px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-fog hover:border-kice hover:text-kice disabled:cursor-not-allowed disabled:opacity-30"
          >
            <span aria-hidden>←</span> Назад
          </button>
          <button
            onClick={next}
            disabled={idx === slides.length - 1}
            className="flex items-center gap-2 rounded bg-kblue px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white hover:bg-kdeep disabled:cursor-not-allowed disabled:opacity-30"
          >
            Далее <span aria-hidden>→</span>
          </button>

          <p className="ml-2 hidden font-mono text-[10px] uppercase tracking-[0.18em] text-steel lg:block">
            ← → · пробел — навигация
          </p>

          <div className="ml-auto flex items-center gap-3">
            {cur.kind === "lesson" && (
              <span className="hidden font-mono text-[10px] uppercase tracking-widest text-kamber sm:block">
                часть {cur.part + 1}/5
              </span>
            )}
            <span className="font-display text-lg font-bold tabular-nums text-ink">
              {String(idx + 1).padStart(3, "0")}
              <span className="text-steel"> / {slides.length}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
