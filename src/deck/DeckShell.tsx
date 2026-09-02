import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LogoMark } from "../components/icons";
import { ALL_LESSONS, BLOCKS, COURSE } from "../data/course";
import { useProgress } from "../hooks";
import CertSheet from "./CertSheet";
import { exportElementsToPdf } from "./exportPdf";
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
    case "title":
      return "Титульный лист";
    case "method":
      return "Как устроен курс";
    case "agenda":
      return "Программа · 4 блока";
    case "case":
      return "Сквозной кейс «Ремдизель»";
    case "product":
      return "Продукт: КАМАЗ-Щит РТ-80";
    case "math":
      return "Рыночная математика";
    case "stack":
      return "Технологический стек";
    case "block":
      return BLOCKS.find((b) => b.id === s.blockId)?.title ?? "";
    case "blockSummary":
      return `Итоги блока 0${s.blockId}`;
    case "lesson": {
      const l = ALL_LESSONS.find((x) => x.id === s.lessonId)!;
      const parts = ["Постановка", "Технология", "Промт", "Ход решения", "Результат"];
      return `${l.num} ${l.title} · ${parts[s.part]}`;
    }
    case "exam":
      return "Экзамен у ИИ-экзаменатора";
    case "cert":
      return "Именной сертификат";
    case "plan":
      return "Годовой план 2025";
    case "takeaways":
      return "Что вы уносите с курса";
    case "final":
      return "Финал";
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
  const [dir, setDir] = useState<1 | -1>(1);
  const [toc, setToc] = useState(false);

  const progress = useProgress(ALL_LESSONS.length);

  /* ---------- экспорт PDF (генерация файла, без диалога печати) ---------- */
  const [pdfJob, setPdfJob] = useState<{ done: number; total: number } | null>(null);
  const [pdfMsg, setPdfMsg] = useState<"done" | "error" | null>(null);
  const busyRef = useRef(false);
  const cancelRef = useRef(false);
  const msgTimer = useRef<number | null>(null);

  const flash = useCallback((m: "done" | "error") => {
    setPdfMsg(m);
    if (msgTimer.current) window.clearTimeout(msgTimer.current);
    msgTimer.current = window.setTimeout(() => setPdfMsg(null), m === "done" ? 2000 : 3000);
  }, []);

  const exportSlides = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    cancelRef.current = false;
    setPdfMsg(null);
    setPdfJob({ done: 0, total: slides.length });
    try {
      const els = slides.map((s, i) => <SlideContent key={i} slide={s} print />);
      const ok = await exportElementsToPdf(
        els,
        "remdiesel-ii-v-marketinge-slaidy.pdf",
        (d, t) => setPdfJob({ done: d, total: t }),
        () => cancelRef.current
      );
      setPdfJob(null);
      if (ok) flash("done");
    } catch {
      setPdfJob(null);
      flash("error");
    } finally {
      busyRef.current = false;
    }
  }, [slides, flash]);

  /* сертификат: событие из CertPanel (слайд 95) */
  useEffect(() => {
    const h = (e: Event) => {
      const name = (e as CustomEvent<string>).detail;
      if (typeof name !== "string" || name.trim().length < 2 || busyRef.current) return;
      let score = 0;
      try {
        const raw = localStorage.getItem("rdai-exam-v1");
        if (raw) score = (JSON.parse(raw) as { score?: number })?.score ?? 0;
      } catch {
        /* noop */
      }
      busyRef.current = true;
      cancelRef.current = false;
      setPdfMsg(null);
      setPdfJob({ done: 0, total: 1 });
      const fileName = `sertifikat-${name.trim().replace(/\s+/g, "-").toLowerCase()}.pdf`;
      exportElementsToPdf(
        [<CertSheet key="cert" name={name.trim()} score={score} />],
        fileName,
        (d, t) => setPdfJob({ done: d, total: t }),
        () => cancelRef.current
      )
        .then((ok) => {
          setPdfJob(null);
          if (ok) flash("done");
        })
        .catch(() => {
          setPdfJob(null);
          flash("error");
        })
        .finally(() => {
          busyRef.current = false;
        });
    };
    window.addEventListener("rdai:export-cert", h);
    return () => window.removeEventListener("rdai:export-cert", h);
  }, [flash]);

  const go = useCallback(
    (n: number, d?: 1 | -1) => {
      setIdx((cur) => {
        const next = Math.max(0, Math.min(slides.length - 1, n));
        setDir(d ?? (next >= cur ? 1 : -1));
        return next;
      });
    },
    [slides.length]
  );

  const next = useCallback(() => setIdx((c) => {
    const n = Math.min(slides.length - 1, c + 1);
    setDir(1);
    return n;
  }), [slides.length]);
  const prev = useCallback(() => setIdx((c) => {
    const n = Math.max(0, c - 1);
    setDir(-1);
    return n;
  }), []);

  /* hash sync */
  useEffect(() => {
    history.replaceState(null, "", `#/${idx + 1}`);
  }, [idx]);

  /* прогресс: урок пройден, когда показана его 5-я часть */
  useEffect(() => {
    const s = slides[idx];
    if (s.kind === "lesson" && s.part === 4) {
      const lessonIdx = ALL_LESSONS.findIndex((l) => l.id === s.lessonId);
      if (lessonIdx >= 0 && !progress.done[lessonIdx]) progress.toggle(lessonIdx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  /* клавиатура */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === "TEXTAREA" || tag === "INPUT";
      if (e.key === "Escape") {
        setToc(false);
        return;
      }
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
          go(0, -1);
          break;
        case "End":
          e.preventDefault();
          go(slides.length - 1, 1);
          break;
        case "o":
        case "O":
        case "т":
        case "Т":
          setToc((t) => !t);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, go, slides.length]);

  /* свайп */
  useEffect(() => {
    let x0: number | null = null;
    const down = (e: TouchEvent) => {
      x0 = e.touches[0].clientX;
    };
    const up = (e: TouchEvent) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 60) (dx < 0 ? next : prev)();
      x0 = null;
    };
    window.addEventListener("touchstart", down, { passive: true });
    window.addEventListener("touchend", up, { passive: true });
    return () => {
      window.removeEventListener("touchstart", down);
      window.removeEventListener("touchend", up);
    };
  }, [next, prev]);

  const cur = slides[idx];
  const group = slideGroup(cur);
  const pct = progress.pct;

  const groups = useMemo(() => {
    const g: { title: string; items: { idx: number; label: string }[] }[] = [
      { title: "Вступление", items: [] },
      { title: "Блок 01 · Стратегический маркетинг", items: [] },
      { title: "Блок 02 · Продуктовый маркетинг", items: [] },
      { title: "Блок 03 · Тактический маркетинг", items: [] },
      { title: "Блок 04 · Защита и итоги", items: [] },
    ];
    slides.forEach((s, i) => {
      const bucket =
        s.kind === "lesson" || s.kind === "block" || s.kind === "blockSummary"
          ? (s.kind === "lesson"
              ? BLOCKS.find((b) => b.lessons.some((l) => l.id === s.lessonId))
              : BLOCKS.find((b) => b.id === s.blockId))?.id ?? 0
          : 0;
      g[bucket === 0 ? 0 : bucket].items.push({ idx: i, label: slideLabel(s) });
    });
    return g.filter((x) => x.items.length > 0);
  }, [slides]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-ink">
      {/* верхняя панель */}
      <div className="fixed inset-x-0 top-0 z-40 border-b border-edge/70 bg-ink/90 backdrop-blur-md">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <button onClick={() => go(0, -1)} className="flex items-center gap-2.5">
            <LogoMark className="h-7 w-7 text-kblue" />
            <span className="hidden leading-tight sm:block">
              <span className="block font-display text-[11px] font-bold tracking-wide text-snow">РЕМДИЗЕЛЬ</span>
              <span className="block font-mono text-[8px] uppercase tracking-[0.22em] text-steel">AI-академия · {COURSE.hours} ч</span>
            </span>
          </button>

          <div className="mx-2 hidden h-6 w-px bg-edge md:block" />
          <p className="hidden truncate font-mono text-[10px] uppercase tracking-[0.18em] text-steel md:block">
            {group !== "—" && <span className="text-kamber">{group} · </span>}
            {slideLabel(cur)}
          </p>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex" title={`Пройдено ${pct}% уроков`}>
              <svg viewBox="0 0 28 28" className="h-6 w-6 -rotate-90">
                <circle cx="14" cy="14" r="11" fill="none" stroke="#223040" strokeWidth="3" />
                <circle
                  cx="14" cy="14" r="11" fill="none"
                  stroke={pct >= 100 ? "#37c98b" : "#ff7a1f"}
                  strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 11}
                  strokeDashoffset={2 * Math.PI * 11 * (1 - pct / 100)}
                  style={{ transition: "stroke-dashoffset .5s ease" }}
                />
              </svg>
              <span className="font-mono text-[11px] text-fog">{pct}%</span>
            </div>
            <button
              onClick={() => setToc((t) => !t)}
              className={`rounded border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                toc ? "border-kamber text-kamber" : "border-edge text-steel hover:border-steel hover:text-fog"
              }`}
            >
              Содержание [O]
            </button>
            <button
              onClick={exportSlides}
              disabled={busyRef.current}
              className="rounded bg-kamber px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink transition-colors hover:bg-kamber2 disabled:cursor-wait disabled:opacity-60"
            >
              {pdfJob ? `PDF ${pdfJob.done}/${pdfJob.total}` : `PDF · ${slides.length} сл.`}
            </button>
          </div>
        </div>
        {/* полоса прогресса */}
        <div className="h-0.5 w-full bg-panel2">
          <div
            className="h-full bg-gradient-to-r from-kdeep via-kblue to-kamber transition-all duration-500"
            style={{ width: `${((idx + 1) / slides.length) * 100}%` }}
          />
        </div>
      </div>

      {/* слайд */}
      <main className="flex flex-1 items-stretch pb-24 pt-14">
        <div
          key={idx}
          className={`relative min-h-[calc(100dvh-14.5rem)] w-full ${
            dir === 1 ? "deck-enter-l" : "deck-enter-r"
          }`}
        >
          <SlideContent slide={cur} goTo={go} />
        </div>
      </main>

      {/* нижняя навигация */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-edge/70 bg-ink/90 backdrop-blur-md">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <button
            onClick={prev}
            disabled={idx === 0}
            className="flex items-center gap-2 rounded border border-edge px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-fog transition-colors hover:border-kice hover:text-kice disabled:cursor-not-allowed disabled:opacity-30"
          >
            <span aria-hidden>←</span> Назад
          </button>
          <button
            onClick={next}
            disabled={idx === slides.length - 1}
            className="flex items-center gap-2 rounded bg-kblue px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-snow transition-colors hover:bg-kice hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
          >
            Далее <span aria-hidden>→</span>
          </button>

          <p className="ml-2 hidden font-mono text-[10px] uppercase tracking-[0.18em] text-steel lg:block">
            ← → · пробел · [O] содержание
          </p>

          <div className="ml-auto flex items-center gap-3">
            {cur.kind === "lesson" && (
              <span className="hidden font-mono text-[10px] uppercase tracking-widest text-kamber sm:block">
                часть {cur.part + 1}/5
              </span>
            )}
            <span className="font-display text-lg font-bold tabular-nums text-snow">
              {String(idx + 1).padStart(3, "0")}
              <span className="text-steel"> / {slides.length}</span>
            </span>
          </div>
        </div>
      </div>

      {/* содержание */}
      <div
        className={`fixed inset-0 z-50 transition-colors ${toc ? "bg-ink/70 backdrop-blur-sm" : "pointer-events-none bg-transparent"}`}
        onClick={() => setToc(false)}
      >
        <aside
          className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-edge bg-coal shadow-2xl transition-transform duration-300 ${
            toc ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-edge px-5 py-4">
            <p className="font-display text-sm font-bold text-snow">Содержание презентации</p>
            <button
              onClick={() => setToc(false)}
              className="rounded border border-edge px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-steel hover:text-fog"
            >
              Esc
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {groups.map((g) => (
              <div key={g.title} className="mb-4">
                <p className="px-2 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-kamber">{g.title}</p>
                <ul>
                  {g.items.map((it) => (
                    <li key={it.idx}>
                      <button
                        onClick={() => {
                          go(it.idx);
                          setToc(false);
                        }}
                        className={`flex w-full items-baseline gap-2.5 rounded px-2 py-1.5 text-left transition-colors ${
                          it.idx === idx ? "bg-panel2 text-snow" : "text-steel hover:bg-panel hover:text-fog"
                        }`}
                      >
                        <span className="font-mono text-[10px] tabular-nums text-steel">
                          {String(it.idx + 1).padStart(3, "0")}
                        </span>
                        <span className="text-[12.5px] leading-snug">{it.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-edge px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-steel">
            {slides.length} слайдов · 16 ак. часов
          </div>
        </aside>
      </div>

      {/* оверлей генерации PDF */}
      {pdfJob && (
        <div className="fixed bottom-24 right-4 z-[60] w-72 border border-edge bg-coal shadow-2xl sm:right-6">
          <div className="hazard h-1.5" />
          <div className="p-4">
            <p className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-kamber">
              Генерация PDF
              <span className="blink inline-block h-2 w-2 bg-kamber" />
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden bg-panel2">
              <div
                className="h-full bg-gradient-to-r from-kblue to-kamber transition-all duration-300"
                style={{ width: `${pdfJob.total ? (pdfJob.done / pdfJob.total) * 100 : 0}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-steel">
              <span className="tabular-nums">
                {String(pdfJob.done).padStart(3, "0")} / {String(pdfJob.total).padStart(3, "0")} слайдов
              </span>
              <button
                onClick={() => {
                  cancelRef.current = true;
                }}
                className="text-alarm transition-colors hover:text-snow"
              >
                Отмена
              </button>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-steel">
              Файл скачается автоматически. Не закрывайте вкладку.
            </p>
          </div>
        </div>
      )}
      {pdfMsg && !pdfJob && (
        <div
          className={`fixed bottom-24 right-4 z-[60] w-72 border px-4 py-3 shadow-2xl sm:right-6 ${
            pdfMsg === "done" ? "border-mint/60 bg-[#0d2018]" : "border-alarm/60 bg-[#241012]"
          }`}
        >
          <p className={`font-mono text-[11px] font-bold uppercase tracking-widest ${pdfMsg === "done" ? "text-mint" : "text-alarm"}`}>
            {pdfMsg === "done" ? "✓ PDF сохранён" : "Ошибка экспорта"}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-steel">
            {pdfMsg === "done"
              ? "Файл в папке загрузок браузера."
              : "Попробуйте ещё раз — генерация повторяема."}
          </p>
        </div>
      )}
    </div>
  );
}
