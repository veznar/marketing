import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ALL_LESSONS,
  AGENT_SCENARIOS,
  BLOCKS,
  CJM_STAGES,
  COURSE,
  IMAGES,
  MARKET_FORECAST,
  PRODUCT_SPECS,
  YEAR_PLAN,
  type Lesson,
  type Step,
} from "../data/course";
import {
  IconArrow,
  IconBot,
  IconCheck,
  IconCopy,
  IconDoc,
  IconDownload,
  IconFlame,
  IconGauge,
  IconMedal,
  IconPlay,
  IconReset,
  IconRoute,
  IconSend,
  IconShield,
  IconSpark,
  IconTarget,
  IconWrench,
  LogoMark,
} from "../components/icons";

export type Slide =
  | { kind: "title" }
  | { kind: "method" }
  | { kind: "agenda" }
  | { kind: "case" }
  | { kind: "product" }
  | { kind: "math" }
  | { kind: "stack" }
  | { kind: "block"; blockId: number }
  | { kind: "lesson"; lessonId: string; part: number }
  | { kind: "blockSummary"; blockId: number }
  | { kind: "exam" }
  | { kind: "cert" }
  | { kind: "plan" }
  | { kind: "takeaways" }
  | { kind: "final" };

type Props = {
  slide: Slide;
  goTo?: (i: number) => void;
  print?: boolean;
  certName?: string;
  onPrintCert?: (name: string) => void;
};

export const PART_LABELS = ["Постановка", "Технология", "Промт", "Ход решения", "Результат"];

/* ================= утилиты ================= */

function Kicker({ children, color = "#ffa14e" }: { children: ReactNode; color?: string }) {
  return (
    <p className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.28em]" style={{ color }}>
      <span className="inline-block h-2 w-2" style={{ background: color }} />
      {children}
    </p>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setOk(true);
        window.setTimeout(() => setOk(false), 1400);
      }}
      className={`flex items-center gap-1.5 rounded border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors ${
        ok ? "border-mint text-mint" : "border-edge text-steel hover:border-kice hover:text-kice"
      }`}
    >
      {ok ? <IconCheck className="h-3.5 w-3.5" /> : <IconCopy className="h-3.5 w-3.5" />}
      {ok ? "Скопировано" : "Копировать"}
    </button>
  );
}

function Chip({ children, color = "#7db8f5" }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider"
      style={{ borderColor: `${color}66`, color, background: `${color}14` }}
    >
      {children}
    </span>
  );
}

/* ================= виджеты ================= */

function MarketChart({ print = false }: { print?: boolean }) {
  const max = 80;
  return (
    <div className="border border-edge bg-ink/60 p-4">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-steel">Рынок пожарной техники РФ, млрд ₽</p>
        <p className="font-mono text-[10px] uppercase tracking-widest text-kamber">CAGR 7%</p>
      </div>
      <svg viewBox="0 0 560 190" className="mt-3 w-full">
        {[20, 40, 60, 80].map((g) => (
          <g key={g}>
            <line x1="30" x2="550" y1={170 - (g / max) * 150} y2={170 - (g / max) * 150} stroke="#223040" strokeWidth="1" />
            <text x="2" y={174 - (g / max) * 150} fontSize="9" fill="#8ca0b3" fontFamily="JetBrains Mono">
              {g}
            </text>
          </g>
        ))}
        {MARKET_FORECAST.map((p, i) => {
          const h = (p.value / max) * 150;
          const x = 40 + i * 57;
          const hot = i === 0 || i === MARKET_FORECAST.length - 1;
          return (
            <g key={p.year}>
              <rect
                x={x}
                y={170 - h}
                width="34"
                height={h}
                fill={hot ? "#ff7a1f" : "#2f86e6"}
                opacity={hot ? 1 : 0.75}
                className={print ? undefined : "col-grow"}
                style={print ? undefined : { animationDelay: `${i * 70}ms` }}
              />
              {hot && (
                <text x={x + 17} y={162 - h} fontSize="11" fontWeight="700" fill="#eef4fa" textAnchor="middle" fontFamily="JetBrains Mono">
                  {p.value}
                </text>
              )}
              <text x={x + 17} y={184} fontSize="8.5" fill="#8ca0b3" textAnchor="middle" fontFamily="JetBrains Mono">
                {String(p.year).slice(2)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[10px] uppercase tracking-widest text-steel">
        <span><span className="text-kamber">■</span> 2024: 45 млрд ₽</span>
        <span><span className="text-kamber">■</span> 2032: 77 млрд ₽</span>
        <span className="text-kice">20% рынка → 450–500 машин/год для «Ремдизель»</span>
      </div>
    </div>
  );
}

function RiceTable({ lesson, print = false }: { lesson: Lesson; print?: boolean }) {
  const rows = lesson.rice ?? [];
  return (
    <div className="border border-edge bg-ink/60 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-steel">RICE-скоринг гипотез (Reach × Impact × Confidence / Effort)</p>
      <div className="mt-3 space-y-2.5">
        {rows.map((r, i) => (
          <div key={i}>
            <div className="flex items-baseline justify-between gap-3">
              <p className={`text-[12px] leading-snug ${i === 0 ? "font-bold text-kamber2" : "text-fog"}`}>
                {i === 0 && <span className="mr-1.5 font-mono text-[9px] uppercase tracking-widest text-kamber">ТОП-1</span>}
                {r.name}
              </p>
              <span className={`font-mono text-[12px] font-bold tabular-nums ${i === 0 ? "text-kamber" : "text-kice"}`}>{r.score}</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-sm bg-panel2">
              <div
                className={`h-full ${print ? "" : "bar-grow"} ${i === 0 ? "bg-kamber" : "bg-kblue"}`}
                style={{ width: `${(r.score / 850) * 100}%`, animationDelay: `${i * 90}ms` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BudgetBars({ lesson, print = false }: { lesson: Lesson; print?: boolean }) {
  const rows = lesson.channels ?? [];
  const colors = ["#ff7a1f", "#7db8f5", "#37c98b"];
  return (
    <div className="border border-edge bg-ink/60 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-steel">Распределение маркетингового бюджета 2025</p>
      <div className="mt-4 space-y-3.5">
        {rows.map((c, i) => (
          <div key={i}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[12.5px] font-semibold text-fog">{c.name}</p>
              <span className="font-display text-base font-bold tabular-nums" style={{ color: colors[i] }}>
                {c.pct}%
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-sm bg-panel2">
              <div
                className={`h-full ${print ? "" : "bar-grow"}`}
                style={{ width: `${c.pct}%`, background: colors[i], animationDelay: `${i * 120}ms` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 border-t border-edge pt-3 text-[11.5px] leading-relaxed text-steel">
        Логика: в длинном B2G-цикле решение принимается на стадии формирования ТЗ — поэтому максимум бюджета уходит на
        прямой доступ к ЛПР, а цифровой след и контент «догревают» проверяющих.
      </p>
    </div>
  );
}

function StepLine({ s }: { s: Step }) {
  if (s.t === "log")
    return (
      <p className="flex gap-2.5">
        <span className="shrink-0 select-none text-edge">··</span>
        <span className="text-steel">{s.text}</span>
      </p>
    );
  if (s.t === "ai")
    return (
      <p className="flex gap-2.5">
        <span className="mt-0.5 h-fit shrink-0 rounded-sm bg-kdeep/70 px-1 font-bold text-kice">AI</span>
        <span className="text-fog">{s.text}</span>
      </p>
    );
  return (
    <p className="border border-kamber/50 bg-kamber/10 px-3 py-2 font-bold text-kamber2">{s.text}</p>
  );
}

function AgentTerminal({ scenarioId, print = false }: { scenarioId: string; print?: boolean }) {
  const scenario = AGENT_SCENARIOS.find((s) => s.id === scenarioId)!;
  const [shown, setShown] = useState(print ? scenario.steps.length : 0);
  const [running, setRunning] = useState(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const finished = shown >= scenario.steps.length;

  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => {
      setShown((s) => {
        if (s >= scenario.steps.length) {
          setRunning(false);
          return s;
        }
        return s + 1;
      });
    }, 720);
    return () => window.clearInterval(t);
  }, [running, scenario]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [shown]);

  return (
    <div className="flex flex-col border border-edge bg-ink">
      <div className="flex items-center gap-2 border-b border-edge px-3.5 py-2.5">
        <span className="h-2 w-2 bg-alarm/80" />
        <span className="h-2 w-2 bg-kamber/80" />
        <span className="h-2 w-2 bg-mint/80" />
        <span className="ml-2 truncate font-mono text-[10px] uppercase tracking-[0.18em] text-steel">
          {scenario.name} · {scenario.lesson}
        </span>
        <span className={`ml-auto shrink-0 font-mono text-[9px] uppercase tracking-widest ${print ? "text-mint" : running ? "text-kamber" : finished ? "text-mint" : "text-steel"}`}>
          {print ? "завершено" : running ? "выполняется" : finished ? "завершено" : "ожидание"}
        </span>
      </div>
      <div
        ref={bodyRef}
        className={
          print
            ? "min-h-[9rem] flex-1 space-y-2 p-3.5 font-mono text-[11.5px] leading-relaxed"
            : "max-h-56 min-h-[9rem] flex-1 space-y-2 overflow-y-auto p-3.5 font-mono text-[11.5px] leading-relaxed"
        }
      >
        {shown === 0 && <p className="text-steel">// запустите агента — шаги появятся последовательно<span className="blink text-kamber">▌</span></p>}
        {scenario.steps.slice(0, shown).map((s, i) => (
          <div key={i} className={print ? "" : "step-in"}>
            <StepLine s={s} />
          </div>
        ))}
        {running && !print && <span className="blink text-kamber">▌</span>}
      </div>
      {!print && (
        <div className="flex items-center gap-2.5 border-t border-edge px-3.5 py-2.5">
          <button
            onClick={() => {
              setShown(0);
              setRunning(true);
            }}
            disabled={running}
            className="flex items-center gap-1.5 rounded bg-kamber px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink transition-colors hover:bg-kamber2 disabled:opacity-50"
          >
            <IconPlay className="h-3.5 w-3.5" /> {finished ? "Ещё раз" : "Запустить"}
          </button>
          <button
            onClick={() => {
              setRunning(false);
              setShown(0);
            }}
            className="flex items-center gap-1.5 rounded border border-edge px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-steel transition-colors hover:text-fog"
          >
            <IconReset className="h-3.5 w-3.5" /> Сброс
          </button>
          <span className="ml-auto font-mono text-[9px] uppercase tracking-widest text-steel">
            {Math.min(shown, scenario.steps.length)}/{scenario.steps.length}
          </span>
        </div>
      )}
    </div>
  );
}

function CjmBoard({ print = false }: { print?: boolean }) {
  const [sel, setSel] = useState(3);
  const W = 520;
  const H = 120;
  const px = (i: number) => 40 + i * ((W - 80) / (CJM_STAGES.length - 1));
  const py = (e: number) => H - 14 - ((e - 1) / 4) * (H - 34);
  const st = CJM_STAGES[sel];

  return (
    <div className="border border-edge bg-ink/60 p-4">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-steel">CJM закупки · эмоции ЛПР по этапам</p>
        <p className="font-mono text-[10px] uppercase tracking-widest text-kice">урок 2.2</p>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full">
        <line x1="20" x2={W - 20} y1={py(3)} y2={py(3)} stroke="#223040" strokeDasharray="4 4" />
        <polyline
          points={CJM_STAGES.map((s, i) => `${px(i)},${py(s.emotion)}`).join(" ")}
          fill="none"
          stroke="#2f86e6"
          strokeWidth="2"
        />
        {CJM_STAGES.map((s, i) => (
          <g key={s.id} onClick={() => !print && setSel(i)} className={print ? "" : "cursor-pointer"}>
            <circle cx={px(i)} cy={py(s.emotion)} r={i === sel ? 7 : 5} fill={i === sel ? "#ff7a1f" : "#0d141d"} stroke={i === sel ? "#ffa14e" : "#7db8f5"} strokeWidth="2" />
            <text x={px(i)} y={H - 2} fontSize="9" fill={i === sel ? "#ffa14e" : "#8ca0b3"} textAnchor="middle" fontFamily="JetBrains Mono">
              {s.short}
            </text>
          </g>
        ))}
        <text x="12" y={py(5) + 3} fontSize="8" fill="#8ca0b3" fontFamily="JetBrains Mono">5</text>
        <text x="12" y={py(1) + 3} fontSize="8" fill="#8ca0b3" fontFamily="JetBrains Mono">1</text>
      </svg>

      {print ? (
        <p className="mt-2 border-t border-edge pt-3 text-[11.5px] leading-relaxed text-steel">
          5 этапов: осознание → тендер → производство → эксплуатация → утилизация. Минимум эмоций — «Эксплуатация»:
          нет обученных механиков по робототехнике. Решение: VR-тренажёр + телеметрия 24/7.
        </p>
      ) : (
        <div key={sel} className="step-in mt-2 border-t border-edge pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[13px] font-bold text-snow">Этап {sel + 1}/5 · {st.name}</p>
            <Chip color={st.emotion <= 2 ? "#e8503a" : st.emotion === 3 ? "#ffa14e" : "#37c98b"}>
              эмоция ЛПР: {st.emotion}/5
            </Chip>
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-steel">{st.emotionNote}</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <div className="border border-alarm/40 bg-alarm/10 px-3 py-2">
              <p className="font-mono text-[9px] uppercase tracking-widest text-alarm">Барьер</p>
              <p className="mt-1 text-[11.5px] leading-snug text-fog">{st.barrier}</p>
            </div>
            <div className="border border-mint/40 bg-mint/10 px-3 py-2">
              <p className="font-mono text-[9px] uppercase tracking-widest text-mint">Решение «Ремдизель»</p>
              <p className="mt-1 text-[11.5px] leading-snug text-fog">{st.solution}</p>
            </div>
          </div>
          <p className="mt-2 flex flex-wrap gap-1.5">
            {st.touch.map((t) => (
              <span key={t} className="rounded-sm bg-panel2 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-steel">
                {t}
              </span>
            ))}
          </p>
        </div>
      )}
    </div>
  );
}

function Demo({ lesson, print = false }: { lesson: Lesson; print?: boolean }) {
  switch (lesson.demo) {
    case "market":
      return <MarketChart print={print} />;
    case "rice":
      return <RiceTable lesson={lesson} print={print} />;
    case "budget":
      return <BudgetBars lesson={lesson} print={print} />;
    case "cjm":
      return <CjmBoard print={print} />;
    case "focus":
      return <AgentTerminal scenarioId="focus" print={print} />;
    case "tender":
      return <AgentTerminal scenarioId="tender" print={print} />;
    case "blueprint":
      return (
        <figure className="corners border border-edge bg-panel p-1.5">
          <img src={IMAGES.blueprint} alt="Чертёж компоновки роботизированного пожарного автомобиля" className="block w-full object-cover" />
          <figcaption className="px-1.5 py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-steel">
            Компоновка шасси 6×6 · схема к PRD · лист РД-ЩТ-2025
          </figcaption>
        </figure>
      );
    default:
      return null;
  }
}

/* ================= мастер-доска урока ================= */

function MasterBoard({ lesson, part, accent }: { lesson: Lesson; part: number; accent: string }) {
  const slots = [
    { label: "Цель урока", fill: lesson.goal },
    { label: "Технология", fill: lesson.tech.kind },
    { label: "Промт", fill: "зафиксирован · копия в буфере" },
    { label: "Ход решения", fill: `${lesson.process.length} шагов агента` },
    { label: "Результат", fill: lesson.metrics[0]?.v ?? "" },
  ];
  return (
    <aside className="corners hidden h-fit border border-edge bg-panel/80 lg:block">
      <div className="border-b border-edge px-4 py-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-steel">Доска кейса · урок {lesson.num}</p>
        <p className="mt-0.5 font-display text-[12px] font-bold leading-snug text-snow">Основной слайд урока</p>
      </div>
      <ul className="p-3">
        {slots.map((s, i) => {
          const state = i < part ? "done" : i === part ? "active" : "pending";
          return (
            <li key={i} className="relative pb-3 pl-6 last:pb-0">
              {i < slots.length - 1 && <span className="absolute left-[9px] top-5 h-full w-px bg-edge" />}
              <span
                className={`absolute left-0 top-0.5 flex h-[19px] w-[19px] items-center justify-center rounded-full border text-[9px] font-bold ${
                  state === "done"
                    ? "border-transparent text-ink"
                    : state === "active"
                      ? "border-current text-current"
                      : "border-edge text-steel"
                }`}
                style={
                  state === "done"
                    ? { background: accent }
                    : state === "active"
                      ? { color: accent, boxShadow: `0 0 0 3px ${accent}22` }
                      : undefined
                }
              >
                {state === "done" ? <IconCheck className="h-3 w-3" /> : i + 1}
              </span>
              <p className={`text-[11px] font-bold uppercase tracking-wider ${state === "pending" ? "text-steel/70" : "text-fog"}`}>
                {s.label}
                {state === "active" && <span className="blink ml-1" style={{ color: accent }}>▌</span>}
              </p>
              {state === "done" && <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-steel">{s.fill}</p>}
              {state === "pending" && <p className="mt-0.5 font-mono text-[9.5px] uppercase tracking-widest text-steel/40">заполнится на части {i + 1}</p>}
            </li>
          );
        })}
      </ul>
      <div className="border-t border-edge px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.2em] text-steel">
        {part === 4 ? <span className="text-mint">доска заполнена ✓</span> : `заполнено ${part}/5 · часть ${part + 1} — «${PART_LABELS[part]}»`}
      </div>
    </aside>
  );
}

/* ================= слайд урока ================= */

function LessonSlide({
  lesson,
  part,
  print = false,
  goTo,
}: {
  lesson: Lesson;
  part: number;
  print?: boolean;
  goTo?: (i: number) => void;
}) {
  const block = BLOCKS.find((b) => b.lessons.some((l) => l.id === lesson.id))!;
  const nextLessonIdx = ALL_LESSONS.findIndex((l) => l.id === lesson.id) + 1;
  const nextLesson = ALL_LESSONS[nextLessonIdx];

  const jumpToNext = () => {
    if (!goTo || !nextLesson) return;
    // ищем индекс первого слайда следующего урока: считаем по структуре
    let idx = 7; // вступление
    for (const b of BLOCKS) {
      idx += 1; // обложка блока
      for (const l of b.lessons) {
        if (l.id === nextLesson.id) {
          goTo(idx);
          return;
        }
        idx += 5;
      }
      if (b.id < 4) idx += 1; // итоги блока
    }
  };

  return (
    <div className="mx-auto flex h-full max-w-7xl flex-col px-4 py-6 sm:px-6 md:py-8">
      {/* шапка урока */}
      <header className="flex flex-wrap items-start gap-x-6 gap-y-3">
        <p className="font-display text-4xl font-extrabold leading-none md:text-5xl" style={{ color: block.accent }}>
          {lesson.num}
        </p>
        <div className="min-w-[200px] flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-steel">
            {block.code} · {block.title} · урок {lesson.num}
          </p>
          <h2 className="mt-1 font-display text-lg font-bold leading-tight text-snow md:text-2xl">{lesson.title}</h2>
        </div>
        {/* степпер частей */}
        <div className="flex items-center gap-1">
          {PART_LABELS.map((p, i) => (
            <span key={p} className="flex items-center gap-1">
              <span
                className="flex h-6 items-center rounded-sm px-2 font-mono text-[9px] font-bold uppercase tracking-widest transition-colors"
                style={
                  i === part
                    ? { background: block.accent, color: "#0a0f16" }
                    : i < part
                      ? { border: `1px solid ${block.accent}66`, color: block.accent }
                      : { border: "1px solid #223040", color: "#8ca0b3" }
                }
              >
                {i < part ? "✓" : i + 1} <span className="ml-1 hidden xl:inline">{p}</span>
              </span>
              {i < 4 && <span className="h-px w-2 bg-edge" />}
            </span>
          ))}
        </div>
      </header>

      <div className="mt-5 grid min-h-0 flex-1 gap-5 lg:grid-cols-[1fr_290px]">
        {/* контент части */}
        <div className="min-h-0 overflow-y-auto pr-1">
          {part === 0 && (
            <div className="space-y-4">
              <div className="corners border border-edge bg-panel p-5">
                <Kicker color={block.accent}>Задача урока</Kicker>
                <p className="mt-3 text-[15px] font-semibold leading-relaxed text-snow">{lesson.goal}</p>
              </div>
              <div className="border border-edge bg-panel/60 p-5">
                <Kicker color="#8ca0b3">Что происходит в кейсе на этом шаге</Kicker>
                <p className="mt-3 text-[14px] leading-relaxed text-fog">{lesson.context}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Chip color={block.accent}>{block.hours} ак. часа на блок</Chip>
                <Chip color="#7db8f5">формат: технология → промт → решение</Chip>
                <Chip color="#ffa14e">часть 2 → технология</Chip>
              </div>
            </div>
          )}

          {part === 1 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-sm px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-ink" style={{ background: block.accent }}>
                  {lesson.tech.kind}
                </span>
                <p className="text-[15px] font-bold text-snow">{lesson.tech.name}</p>
              </div>
              <p className="max-w-3xl text-[14px] leading-relaxed text-fog">{lesson.tech.note}</p>
              <div className="corners border border-edge bg-panel p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-steel">Как это работает</p>
                <ol className="mt-3 space-y-3">
                  {lesson.how.map((h, i) => (
                    <li key={i} className="flex gap-3.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border font-mono text-[11px] font-bold" style={{ borderColor: `${block.accent}66`, color: block.accent }}>
                        {i + 1}
                      </span>
                      <p className="pt-1 text-[13.5px] leading-relaxed text-fog">{h}</p>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="flex flex-wrap gap-2">
                {lesson.tools.map((t) => (
                  <Chip key={t} color={block.accent}>{t}</Chip>
                ))}
              </div>
            </div>
          )}

          {part === 2 && (
            <div className="space-y-4">
              <div className="corners border border-edge bg-ink">
                <div className="flex items-center justify-between gap-3 border-b border-edge px-4 py-2.5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-steel">промт урока {lesson.num} · копируйте и адаптируйте</p>
                  {!print && <CopyBtn text={lesson.prompt} />}
                </div>
                <pre className="whitespace-pre-wrap p-4 font-mono text-[12.5px] leading-relaxed text-kamber2">{lesson.prompt}</pre>
              </div>
              <div className="border border-edge bg-panel p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-steel">Разбор структуры промта</p>
                <ol className="mt-3 space-y-2.5">
                  {lesson.promptNotes.map((n, i) => (
                    <li key={i} className="flex gap-3 text-[13px] leading-relaxed text-fog">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rotate-45" style={{ background: block.accent }} />
                      {n}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {part === 3 && (
            <div className={`grid gap-4 ${lesson.demo ? "xl:grid-cols-[minmax(260px,5fr)_7fr]" : ""}`}>
              <div className="border border-edge bg-ink/70 p-4">
                <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-steel">
                  <IconBot className="h-4 w-4" /> Лог агента · урок {lesson.num}
                </p>
                <div className="mt-3 space-y-2.5 font-mono text-[11.5px] leading-relaxed">
                  {lesson.process.map((s, i) => (
                    <StepLine key={i} s={s} />
                  ))}
                </div>
              </div>
              {lesson.demo && (
                <div className="min-w-0">
                  <Demo lesson={lesson} print={print} />
                </div>
              )}
            </div>
          )}

          {part === 4 && (
            <div className="space-y-4">
              <div className="corners border border-edge bg-panel p-5">
                <Kicker color="#37c98b">Решение кейса</Kicker>
                <p className="mt-3 text-[14.5px] leading-relaxed text-snow">{lesson.solution}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {lesson.metrics.map((m) => (
                  <div key={m.k} className="border border-edge bg-ink/70 px-4 py-3">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-steel">{m.k}</p>
                    <p className="mt-1 font-display text-[15px] font-bold leading-snug" style={{ color: block.accent }}>
                      {m.v}
                    </p>
                  </div>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border border-edge bg-panel/60 p-4">
                  <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-steel">
                    <IconDoc className="h-4 w-4" /> Артефакты урока
                  </p>
                  <ul className="mt-2.5 space-y-1.5">
                    {lesson.artifacts.map((a) => (
                      <li key={a} className="flex items-center gap-2 text-[13px] text-fog">
                        <IconDownload className="h-3.5 w-3.5 shrink-0 text-kamber" /> {a}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border border-edge bg-panel/60 p-4">
                  <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-steel">
                    <IconSpark className="h-4 w-4" /> Заберите с собой
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {lesson.takeaways.map((t) => (
                      <Chip key={t} color={block.accent}>{t}</Chip>
                    ))}
                  </div>
                  {!print && nextLesson && (
                    <button
                      onClick={jumpToNext}
                      className="group mt-4 flex items-center gap-2 font-mono text-[10.5px] font-bold uppercase tracking-widest text-kice transition-colors hover:text-snow"
                    >
                      Следующий урок: {nextLesson.num} {nextLesson.title}
                      <IconArrow className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {!print && <MasterBoard lesson={lesson} part={part} accent={block.accent} />}
      </div>
    </div>
  );
}

/* ================= экзамен и сертификат ================= */

const EXAM_CRITERIA = [
  { key: "role", label: "Роль и субъект", test: (t: string) => /(ты|вы)\s*(—|–|-|:)|роль|действуй как|представь,? что/i.test(t), tip: "Задайте агентам роли: «Вы — три агента: директор завода, главный инженер, начальник охраны…»" },
  { key: "context", label: "Контекст кейса", test: (t: string) => /ремдизель|кам.?аз|пожар|шасси|мчс|робот|резервуар|лафетн/i.test(t), tip: "Добавьте контекст: «Ремдизель», шасси КАМАЗ, роботизированный ствол, резервуарный пожар." },
  { key: "task", label: "Задача и действия", test: (t: string) => /проанализируй|сгенерируй|оцени|составь|найди|построй|проведи|смоделируй|задай|презентуй|протестируй/i.test(t), tip: "Сформулируйте действия: «задайте 5 жёстких вопросов», «найдите уязвимости»." },
  { key: "limits", label: "Критерии и ограничения", test: (t: string) => /\d+\s*(%|м|шт|лет|руб|°C)|rice|критери|ограничен|бюджет|срок|не более|минимум|эми|−?\d{2}\s*°/i.test(t), tip: "Дайте рамки: −40°C, зона оператора 100 м, бюджет, срок окупаемости." },
  { key: "format", label: "Формат результата", test: (t: string) => /список|таблиц|структур|формат|шаг|json|markdown|топ|ранжируй|раздел|блок/i.test(t), tip: "Требуйте структуру: «таблица: вопрос → риск → доработка, ранжируйте по критичности»." },
];

function evaluatePrompt(text: string) {
  const t = text.trim();
  const tooShort = t.length < 30;
  const marks = EXAM_CRITERIA.map((c) => ({ ...c, hit: !tooShort && c.test(t) }));
  const score = tooShort ? 0 : marks.filter((m) => m.hit).length * 20;
  const passed = score >= 70;
  const verdict = tooShort
    ? "Промт слишком короткий — экзаменатор не смог разобрать структуру."
    : score >= 90
      ? "Отлично. Промт боевой: роли, контекст, критерии и формат на месте."
      : passed
        ? "Зачёт. Промт рабочий; подсказки ниже поднимут его до эталона."
        : "Отправлено на доработку: закройте провалы по критериям и перезапустите проверку.";
  return { marks, score, passed, verdict };
}

type ExamResult = { score: number; passed: boolean; ts: number };
const EXAM_KEY = "rdai-exam-v1";
function loadExam(): ExamResult | null {
  try {
    const raw = localStorage.getItem(EXAM_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return typeof p?.score === "number" ? p : null;
  } catch {
    return null;
  }
}

function ExamPanel({ print = false }: { print?: boolean }) {
  const [text, setText] = useState("");
  const [report, setReport] = useState<ReturnType<typeof evaluatePrompt> | null>(null);
  const [best, setBest] = useState<ExamResult | null>(loadExam);

  const submit = () => {
    const r = evaluatePrompt(text);
    setReport(r);
    setBest((prev) => {
      const next: ExamResult = prev && prev.score >= r.score ? prev : { score: r.score, passed: r.passed, ts: Date.now() };
      try {
        localStorage.setItem(EXAM_KEY, JSON.stringify(next));
      } catch { /* noop */ }
      return next;
    });
  };

  if (print) {
    return (
      <div className="space-y-3">
        <p className="text-[13px] leading-relaxed text-fog">
          Финальное задание: написать собственный промт для «виртуального тестирования» (Multi-Agent Simulation, урок 2.5).
          ИИ-экзаменатор оценивает работу по 5 критериям, по 20 баллов каждый. Порог зачёта — 70 баллов.
        </p>
        <div className="grid gap-2 sm:grid-cols-5">
          {EXAM_CRITERIA.map((c) => (
            <div key={c.key} className="border border-edge bg-ink/70 px-3 py-2.5">
              <p className="font-mono text-[9px] uppercase tracking-widest text-kice">{c.label}</p>
              <p className="mt-1 font-mono text-[11px] text-steel">20 баллов</p>
            </div>
          ))}
        </div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-steel">Интерактивный слайд платформы — выполняется в браузере</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
      <div className="space-y-3.5">
        <div className="corners border border-edge bg-panel p-4">
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-kamber">
            <IconBot className="h-4 w-4" /> Финальное задание · 2 ак. часа
          </p>
          <p className="mt-2.5 text-[13px] leading-relaxed text-fog">
            Напишите <span className="font-bold text-snow">собственный промт</span> для «виртуального тестирования»
            роботизированного КАМАЗа. Экзаменатор разберёт его по 5 критериям промт-инжиниринга.
          </p>
          <ul className="mt-3 space-y-1.5">
            {EXAM_CRITERIA.map((c) => (
              <li key={c.key} className="flex items-center justify-between text-[12.5px] text-steel">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rotate-45 bg-kblue" /> {c.label}
                </span>
                <span className="font-mono text-[10px]">20 б.</span>
              </li>
            ))}
          </ul>
        </div>
        {best && (
          <div className={`border px-4 py-3 ${best.passed ? "border-mint/60 bg-mint/10" : "border-alarm/50 bg-alarm/10"}`}>
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-steel">Лучший результат</p>
            <p className={`font-display text-xl font-bold ${best.passed ? "text-mint" : "text-alarm"}`}>{best.score} / 100</p>
            {best.passed && <p className="mt-0.5 text-[11px] text-mint">Зачёт получен → слайд 95: сертификат</p>}
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-col border border-edge bg-panel">
        <div className="flex items-center justify-between border-b border-edge px-4 py-2.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-steel">ваш промт // virtual-test.prompt</p>
          <span className="font-mono text-[10px] text-steel">{text.trim().length} симв.</span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Вы — три агента: директор завода, главный инженер и начальник пожарной охраны. Я презентую вам роботизированный пожарный автомобиль «Ремдизель» на шасси КАМАЗ…"
          className="min-h-[110px] w-full flex-1 resize-none bg-transparent p-4 font-mono text-[12.5px] leading-relaxed text-snow placeholder:text-steel/50 focus:outline-none"
        />
        <div className="flex items-center gap-3 border-t border-edge px-4 py-3">
          <button
            onClick={submit}
            disabled={!text.trim()}
            className="flex items-center gap-2 rounded bg-kblue px-4 py-2 font-mono text-[10.5px] font-bold uppercase tracking-widest text-snow transition-colors hover:bg-kice hover:text-ink disabled:opacity-40"
          >
            <IconSend className="h-4 w-4" /> ИИ-экзаменатору
          </button>
          <span className="hidden font-mono text-[9px] uppercase tracking-widest text-steel sm:block">оценка локально, без передачи данных</span>
        </div>
        {report && (
          <div className="step-in border-t border-edge bg-ink/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-kice">Заключение экзаменатора</p>
              <span className={`rounded border px-2.5 py-0.5 font-mono text-[10.5px] font-bold uppercase tracking-widest ${report.passed ? "border-mint text-mint" : "border-alarm text-alarm"}`}>
                {report.score} / 100 · {report.passed ? "Зачёт" : "Доработка"}
              </span>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-fog">{report.verdict}</p>
            <div className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {report.marks.map((m) => (
                <div key={m.key}>
                  <p className={`flex items-center gap-2 text-[12px] font-semibold ${m.hit ? "text-fog" : "text-steel"}`}>
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${m.hit ? "border-mint bg-mint/20 text-mint" : "border-alarm/70 text-alarm"}`}>
                      {m.hit ? <IconCheck className="h-2.5 w-2.5" /> : <span className="text-[8px] leading-none">!</span>}
                    </span>
                    {m.label} · {m.hit ? 20 : 0}/20
                  </p>
                  {!m.hit && <p className="ml-6 mt-0.5 text-[11px] leading-snug text-steel">↳ {m.tip}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function certId(name: string) {
  let h = 0;
  for (const ch of name.trim() || "anon") h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `RDA-2025-${String(1000 + (h % 9000))}`;
}

function SealSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className}>
      <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="60" cy="60" r="47" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
      <path d="M60 30c3 11-9 16-9 27.5A15 15 0 0 0 81 57.5c0-7-3-11.5-6.4-15.6-.8 4.4-2.7 6.8-5.8 8.4 1.5-9.4 0-15.3-8.8-20.3z" fill="currentColor" />
      <path d="M40 84h40" stroke="currentColor" strokeWidth="2" />
      <text x="60" y="99" textAnchor="middle" fontSize="9.5" fontFamily="JetBrains Mono" fill="currentColor" letterSpacing="2">РЕМДИЗЕЛЬ</text>
    </svg>
  );
}

function CertPanel({ print = false, certName, onPrintCert }: { print?: boolean; certName?: string; onPrintCert?: (n: string) => void }) {
  const [name, setName] = useState(() => {
    try {
      return localStorage.getItem("rdai-name") ?? "";
    } catch {
      return "";
    }
  });
  const [exam] = useState<ExamResult | null>(loadExam);
  const passed = Boolean(exam?.passed);
  const date = new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  const shown = print ? (certName ?? name) : name;

  const preview = (
    <div className="relative aspect-[1414/1000] w-full overflow-hidden rounded-sm bg-[#f3f6fa] text-[#152230]">
      <div className="absolute inset-[8px] border-2 border-[#0b3e7d]" />
      <div className="absolute inset-[13px] border border-[#e86a10]" />
      <div className="absolute inset-0 flex flex-col items-center px-[6%] py-[4.5%] text-center">
        <div className="flex items-center gap-2">
          <LogoMark className="h-5 w-5 text-[#0b3e7d]" />
          <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-[#4a5b6d]">Ремдизель AI-Академия · КАМАЗ</span>
        </div>
        <p className="mt-[3%] font-display text-[clamp(16px,2.6vw,30px)] font-extrabold tracking-wide text-[#0b3e7d]">СЕРТИФИКАТ</p>
        <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.28em] text-[#4a5b6d]">№ {certId(shown)} · подтверждает, что</p>
        <p className="mt-[2.2%] max-w-[82%] truncate border-b-2 border-[#e86a10] px-5 pb-0.5 font-display text-[clamp(12px,1.8vw,21px)] font-bold">
          {shown.trim() || "Фамилия Имя Отчество"}
        </p>
        <p className="mt-[2%] max-w-[78%] text-[clamp(8px,0.95vw,11.5px)] leading-relaxed text-[#33465a]">
          успешно завершил(а) курс «ИИ в маркетинге: от стратегии до тактики» — 16 академических часов, сквозной кейс
          «Ремдизель»: роботизированная пожарная техника на шасси КАМАЗ — и сдал(а) финальное задание у ИИ-экзаменатора.
        </p>
        <div className="mt-auto flex w-full items-end justify-between px-[3%]">
          <p className="w-[26%] border-t border-[#33465a] pt-1 text-left text-[8px] text-[#33465a]">Директор академии<br /><span className="font-mono">Дата: {date}</span></p>
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#0b3e7d]">Экзамен: {exam?.score ?? 0}/100</p>
          <p className="w-[26%] border-t border-[#33465a] pt-1 text-right text-[8px] text-[#33465a]">ИИ-экзаменатор RDA</p>
        </div>
      </div>
      <SealSvg className="absolute bottom-[8%] right-[5%] h-[19%] w-auto -rotate-12 text-[#e86a10] opacity-90" />
    </div>
  );

  if (print) return preview;

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[340px_1fr]">
      <div className="space-y-3.5">
        <div className="corners border border-edge bg-panel p-4">
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-kamber">
            <IconMedal className="h-4 w-4" /> Выдача сертификата
          </p>
          <label className="mt-3 block">
            <span className="font-mono text-[9.5px] uppercase tracking-widest text-steel">ФИО слушателя</span>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                try {
                  localStorage.setItem("rdai-name", e.target.value);
                } catch { /* noop */ }
              }}
              placeholder="Соколов Дмитрий Андреевич"
              className="mt-1 w-full rounded border border-edge bg-ink px-3 py-2 text-[13px] text-snow placeholder:text-steel/50 focus:border-kice focus:outline-none"
            />
          </label>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="border border-edge bg-ink/70 px-2.5 py-2">
              <p className="font-mono text-[8.5px] uppercase tracking-widest text-steel">Курс</p>
              <p className="text-[11.5px] font-semibold text-fog">16 ак. часов</p>
            </div>
            <div className="border border-edge bg-ink/70 px-2.5 py-2">
              <p className="font-mono text-[8.5px] uppercase tracking-widest text-steel">Экзамен</p>
              <p className={`text-[11.5px] font-semibold ${passed ? "text-mint" : "text-steel"}`}>{passed ? `${exam?.score}/100 · сдан` : "не сдан"}</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (passed && name.trim().length >= 2) {
                onPrintCert?.(name.trim());
                window.dispatchEvent(new CustomEvent("rdai:export-cert", { detail: name.trim() }));
              }
            }}
            disabled={!passed || name.trim().length < 2}
            className="mt-3.5 flex w-full items-center justify-center gap-2 rounded bg-kamber px-3 py-2.5 font-mono text-[10.5px] font-bold uppercase tracking-widest text-ink transition-colors hover:bg-kamber2 disabled:opacity-40"
          >
            <IconDownload className="h-4 w-4" /> Скачать PDF-сертификат
          </button>
          {!passed && (
            <p className="mt-2.5 text-[11.5px] leading-relaxed text-steel">
              Сертификат откроется после зачёта (порог — 70 баллов). Вернитесь на слайд 94 — экзамен.
            </p>
          )}
        </div>
      </div>
      <div className="corners border border-edge bg-panel p-2.5">
        {passed ? preview : (
          <div className="flex aspect-[1414/1000] w-full flex-col items-center justify-center gap-3 rounded-sm border border-dashed border-edge bg-ink/40 text-center">
            <IconShield className="h-10 w-10 text-steel" />
            <p className="max-w-xs text-[13px] leading-relaxed text-steel">
              Сертификат заблокирован до сдачи финального задания у ИИ-экзаменатора.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= остальные слайды ================= */

const BLOCK_RESUME: Record<number, { kpi: { k: string; v: string }[]; line: string }> = {
  1: {
    kpi: [
      { k: "Рынок 2024", v: "45 млрд ₽" },
      { k: "Сегментов ЦА", v: "3" },
      { k: "RICE топ-гипотезы", v: "850" },
      { k: "Патентные заявки", v: "2" },
    ],
    line: "Рынок обоснован, сегменты выбраны, гипотеза защищена патентом, бренд «КАМАЗ-Щит» утверждён.",
  },
  2: {
    kpi: [
      { k: "JTBD-инсайт", v: "обзор + термо-защита" },
      { k: "ТТХ ствола", v: "80 м · 360°" },
      { k: "User Stories", v: "24" },
      { k: "Уязвимость №1", v: "ЭМИ / перегрев" },
    ],
    line: "Продукт спроектирован от болей ЦА: PRD, бэклог и стресс-тест виртуальной комиссией.",
  },
  3: {
    kpi: [
      { k: "Бюджет 2025", v: "40 / 30 / 30" },
      { k: "Алерт по тендеру", v: "< 30 мин" },
      { k: "Постов в месяц", v: "12" },
      { k: "KPI года", v: "5% рынка" },
    ],
    line: "Упаковка, каналы, автоворонка и сервис собраны в годовой план вывода на рынок.",
  },
};

function TitleSlide({ print = false, goTo }: { print?: boolean; goTo?: (i: number) => void }) {
  return (
    <div className="relative flex h-full min-h-[540px] items-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg" />
      <div className="pointer-events-none absolute -top-32 left-1/4 h-[420px] w-[560px] rounded-full bg-kdeep/30 blur-[130px]" />
      <p className="pointer-events-none absolute right-[2%] top-1/2 hidden -translate-y-1/2 font-display text-[26rem] font-extrabold leading-none text-panel2/60 xl:block">16</p>

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[7fr_5fr]">
        <div>
          <Kicker>Обучающая платформа · B2B · {COURSE.hours} академических часов</Kicker>
          <h1 className="mt-5 font-display font-extrabold leading-[1.05] text-snow">
            <span className="block text-[clamp(26px,3.8vw,52px)]">ИИ в маркетинге:</span>
            <span className="block text-[clamp(22px,3.1vw,42px)] text-kice">
              от стратегии <span className="text-kamber">до тактики</span>
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-[14.5px] leading-relaxed text-steel">
            Курс-презентация для маркетологов B2B, продуктовых менеджеров и стратегов. Каждый из 16 уроков разбит на{" "}
            <span className="text-fog">5 слайдов-частей</span>, которые последовательно заполняют доску кейса:
            постановка → технология → промт → ход решения → результат.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {!print && goTo && (
              <button
                onClick={() => goTo(1)}
                className="group flex items-center gap-2.5 rounded bg-kblue px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-snow transition-colors hover:bg-kice hover:text-ink"
              >
                Начать курс <IconArrow className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            )}
            <div className="flex flex-wrap gap-2">
              <Chip color="#7db8f5">16 уроков</Chip>
              <Chip color="#ffa14e">4 блока</Chip>
              <Chip color="#37c98b">сквозной кейс КАМАЗ</Chip>
            </div>
          </div>
          <div className="mt-7 border-l-2 border-kamber pl-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-steel">Сквозной кейс // «Ремдизель» × КАМАЗ</p>
            <p className="mt-1.5 text-[14px] font-semibold leading-snug text-fog">
              Продуктовая и маркетинговая стратегия пожарной техники на шасси КАМАЗ (включая робототехнику) —{" "}
              <span className="text-kamber">20% рынка РФ к 2032 году</span>.
            </p>
          </div>
        </div>

        <figure className="corners relative hidden border border-edge bg-panel p-2 sm:block">
          <div className="relative overflow-hidden">
            <img src={IMAGES.hero} alt="Роботизированный пожарный автомобиль на шасси КАМАЗ" className="block w-full object-cover" />
            {!print && <div className="pointer-events-none absolute inset-0 scanline" />}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 flex items-center gap-2 border border-kice/40 bg-ink/75 px-2.5 py-1.5 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-kamber opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-kamber" />
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-snow">Линейка «КАМАЗ-Щит» · урок 3.1</span>
            </div>
          </div>
        </figure>
      </div>
      <div className="absolute inset-x-0 bottom-0">
        <div className="hazard h-1.5" />
      </div>
    </div>
  );
}

function MethodSlide() {
  const steps = [
    { n: "01", t: "Постановка", d: "Задача урока и место шага в сквозном кейсе «Ремдизель»." },
    { n: "02", t: "Технология", d: "Какой ИИ-инструмент применяется: агент, RAG, Multi-Agent, Structured Output." },
    { n: "03", t: "Промт", d: "Готовый промт с разбором структуры — копируйте и адаптируйте под свой рынок." },
    { n: "04", t: "Ход решения", d: "Лог агента и живые демонстрации: CJM, RICE, фокус-группа, тендерная воронка." },
    { n: "05", t: "Результат", d: "Решение кейса в цифрах, артефакты урока и выводы — доска кейса заполнена." },
  ];
  return (
    <div className="mx-auto flex h-full max-w-7xl flex-col justify-center px-4 py-8 sm:px-6">
      <Kicker>Навигация по презентации</Kicker>
      <h2 className="mt-3 font-display text-2xl font-bold text-snow md:text-4xl">Каждый урок — 5 слайдов, которые дополняют основной</h2>
      <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-steel">
        Справа на слайдах урока живёт <span className="text-fog">доска кейса</span> — каркас основного слайда. Каждая следующая
        часть заполняет один слот: к пятому слайду урок собран целиком.
      </p>
      <div className="mt-8 grid gap-3 md:grid-cols-5">
        {steps.map((s, i) => (
          <div key={s.n} className="corners relative border border-edge bg-panel p-4">
            <p className="font-display text-2xl font-extrabold text-kamber">{s.n}</p>
            <p className="mt-2 font-display text-[13px] font-bold uppercase tracking-wide text-snow">{s.t}</p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-steel">{s.d}</p>
            {i < 4 && <IconArrow className="absolute -right-3.5 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-kamber md:block" />}
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-edge pt-5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-steel">
        <span><span className="text-kice">← →</span> или свайп — смена слайдов</span>
        <span><span className="text-kice">Пробел</span> — вперёд</span>
        <span><span className="text-kice">[O]</span> — содержание</span>
        <span><span className="text-kice">PDF</span> — экспорт всей презентации</span>
      </div>
    </div>
  );
}

function AgendaSlide({ goTo, print = false }: { goTo?: (i: number) => void; print?: boolean }) {
  return (
    <div className="mx-auto flex h-full max-w-7xl flex-col justify-center px-4 py-8 sm:px-6">
      <Kicker>Программа · 16 академических часов</Kicker>
      <h2 className="mt-3 font-display text-2xl font-bold text-snow md:text-4xl">Маршрут курса</h2>
      <div className="mt-8 space-y-3">
        {BLOCKS.map((b, bi) => {
          const firstIdx = (() => {
            let idx = 7;
            for (let k = 0; k < bi; k++) {
              idx += 1 + BLOCKS[k].lessons.length * 5 + (BLOCKS[k].id < 4 ? 1 : 0);
            }
            return idx;
          })();
          return (
            <button
              key={b.id}
              onClick={() => !print && goTo?.(firstIdx)}
              className={`group flex w-full items-center gap-5 border border-edge bg-panel px-5 py-4 text-left transition-colors ${print ? "" : "hover:border-steel/60 hover:bg-panel2"}`}
              style={{ borderLeft: `3px solid ${b.accent}` }}
            >
              <span className="font-display text-2xl font-extrabold md:text-3xl" style={{ color: b.accent }}>
                0{b.id}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-display text-[15px] font-bold text-snow md:text-lg">{b.title}</span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-steel">{b.hours} ак. ч · {b.lessons.length > 0 ? `${b.lessons.length} уроков × 5 слайдов` : "экзамен + сертификат"}</span>
                </span>
                <span className="mt-1 block truncate text-[12.5px] text-steel">{b.task}</span>
              </span>
              {!print && <IconArrow className="h-5 w-5 shrink-0 text-steel transition-all group-hover:translate-x-1 group-hover:text-snow" />}
            </button>
          );
        })}
      </div>
      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["≈ 45 млрд ₽", "рынок пожарной техники 2024"],
          ["7% в год", "прогнозируемый рост до 2032"],
          ["450–500 ед.", "план продаж в год под 20%"],
          ["45+ артефактов", "заберёте с курса"],
        ].map(([v, k]) => (
          <div key={k} className="border border-edge bg-ink/60 px-4 py-3">
            <p className="font-display text-lg font-bold text-kamber">{v}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-steel">{k}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CaseSlide() {
  return (
    <div className="mx-auto flex h-full max-w-7xl flex-col justify-center px-4 py-8 sm:px-6">
      <Kicker>Сквозной кейс // «Ремдизель» — дочерняя структура КАМАЗ</Kicker>
      <h2 className="mt-3 max-w-3xl font-display text-2xl font-bold leading-tight text-snow md:text-4xl">
        Пожарная техника на шасси КАМАЗ: <span className="text-kamber">20% рынка РФ к 2032 году</span>
      </h2>
      <div className="mt-8 grid gap-5 lg:grid-cols-[5fr_7fr]">
        <div className="corners border border-edge bg-panel p-5">
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-steel">
            <IconFlame className="h-4 w-4 text-kamber" /> Бриф кейса
          </p>
          <dl className="mt-4 space-y-3">
            {[
              ["Компания", "«Ремдизель», дочерняя структура КАМАЗ"],
              ["Продукт", "АЦ + роботизированный лафетный ствол, линейка «КАМАЗ-Щит»"],
              ["Целевые сегменты", "МЧС РФ · ТЭК и металлургия · аэропорты и порты"],
              ["Цель 2032", "20% рынка пожарной техники России"],
              ["Промежуточная цель", "5% рынка по итогам 2025 года"],
            ].map(([k, v]) => (
              <div key={k} className="border-l-2 border-edge pl-3">
                <dt className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-steel">{k}</dt>
                <dd className="mt-0.5 text-[13px] font-semibold leading-snug text-fog">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="flex flex-col gap-5">
          <MarketChart />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-steel">Траектория доли рынка</p>
            <div className="mt-2.5 h-3 w-full overflow-hidden rounded-sm bg-panel2">
              <div className="bar-grow flex h-full items-center justify-between rounded-sm bg-gradient-to-r from-kdeep via-kblue to-kamber px-2" style={{ width: "100%" }}>
                <span className="font-mono text-[9px] font-bold text-snow">2024 · старт</span>
                <span className="font-mono text-[9px] font-bold text-ink">2032 · 20%</span>
              </div>
            </div>
            <div className="mt-1.5 flex justify-between font-mono text-[10px] text-steel">
              <span>2025: 5% — год вывода</span>
              <span>2032: 20% — цель стратегии</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductSlide() {
  return (
    <div className="mx-auto grid h-full max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-2">
      <figure className="corners border border-edge bg-panel p-2">
        <div className="relative overflow-hidden">
          <img src={IMAGES.turret} alt="Роботизированный лафетный ствол крупным планом" className="block w-full object-cover" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 font-mono text-[9px] uppercase tracking-[0.18em] text-snow">
            Узел автонаведения · тепловизор · сервоприводы
          </div>
        </div>
      </figure>
      <div>
        <Kicker color="#7db8f5">Продукт сквозного кейса</Kicker>
        <h2 className="mt-3 font-display text-2xl font-bold leading-tight text-snow md:text-4xl">«КАМАЗ-Щит» РТ-80</h2>
        <p className="mt-2 text-[14px] italic text-steel">«Технологии, которые спасают. Интеллект, который защищает»</p>
        <p className="mt-4 max-w-lg text-[13.5px] leading-relaxed text-fog">
          Роботизированный пожарный автомобиль: оператор работает из безопасной зоны до 100 м, ствол наводится по
          тепловизору, телеметрия и VR-тренажёр закрывают главный барьер CJM — дефицит обученных механиков.
        </p>
        <dl className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {PRODUCT_SPECS.map((s) => (
            <div key={s.k} className="border border-edge bg-panel/70 px-3 py-2.5">
              <dt className="font-mono text-[8.5px] uppercase tracking-[0.18em] text-steel">{s.k}</dt>
              <dd className="mt-0.5 text-[12px] font-bold leading-snug text-kice">{s.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function StackSlide() {
  const cols = [
    {
      icon: <IconGauge className="h-5 w-5" />,
      title: "Платформа и фронтенд",
      items: ["React.js / Next.js — SPA и SEO", "TailwindCSS — дизайн-система", "Framer Motion — анимации", "Docker + Kubernetes или Vercel"],
    },
    {
      icon: <IconBot className="h-5 w-5" />,
      title: "AI-контур",
      items: ["LangChain / LlamaIndex — RAG и агенты", "OpenAI API — основная модель", "YandexGPT / GigaChat — импортозамещение для контура КАМАЗ", "Multi-Agent Simulation — виртуальные фокус-группы"],
    },
    {
      icon: <IconWrench className="h-5 w-5" />,
      title: "Данные и интеграции",
      items: ["PostgreSQL — прогресс и логи промтов", "Jira / Notion API — автоматизация проектной работы", "zakupki.gov.ru — мониторинг тендеров", "Telegram — алерты менеджерам"],
    },
  ];
  return (
    <div className="mx-auto flex h-full max-w-7xl flex-col justify-center px-4 py-8 sm:px-6">
      <Kicker color="#7db8f5">Технологические требования курса</Kicker>
      <h2 className="mt-3 font-display text-2xl font-bold text-snow md:text-4xl">Стек платформы и AI-контура</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {cols.map((c) => (
          <div key={c.title} className="corners border border-edge bg-panel p-5">
            <p className="flex items-center gap-2.5 font-display text-[13px] font-bold uppercase tracking-wide text-kice">
              {c.icon} {c.title}
            </p>
            <ul className="mt-4 space-y-2.5">
              {c.items.map((it) => (
                <li key={it} className="flex gap-2.5 text-[13px] leading-relaxed text-fog">
                  <span className="mt-2 h-1 w-1 shrink-0 rotate-45 bg-kamber" /> {it}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-6 border-l-2 border-kamber pl-4 text-[13px] leading-relaxed text-steel">
        Для контура КАМАЗ приоритет — <span className="text-fog">локальные модели YandexGPT / GigaChat</span>: импортозамещение
        и хранение данных в периметре заказчика. Демо на слайдах этой презентации работают локально, без внешних API.
      </p>
    </div>
  );
}

function BlockSlide({ blockId, print = false, goTo }: { blockId: number; print?: boolean; goTo?: (i: number) => void }) {
  const b = BLOCKS.find((x) => x.id === blockId)!;
  let cursor = 7;
  const firsts: Record<string, number> = {};
  for (const blk of BLOCKS) {
    cursor += 1;
    for (const l of blk.lessons) {
      firsts[l.id] = cursor;
      cursor += 5;
    }
    if (blk.id < 4) cursor += 1;
  }
  return (
    <div className="relative flex h-full items-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" />
      <p className="pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 font-display text-[22rem] font-extrabold leading-none md:text-[30rem]" style={{ color: b.accentSoft }}>
        0{b.id}
      </p>
      <div className="relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <Kicker color={b.accent}>{b.code} · {b.hours} академических часа</Kicker>
        <h2 className="mt-4 max-w-2xl font-display text-3xl font-extrabold leading-tight text-snow md:text-5xl">{b.title}</h2>
        <p className="mt-3 text-[15px] text-steel">Задача: <span className="text-fog">{b.task.toLowerCase()}.</span></p>

        {b.lessons.length > 0 ? (
          <div className="mt-8 max-w-3xl space-y-1.5">
            {b.lessons.map((l) => (
              <button
                key={l.id}
                onClick={() => !print && goTo?.(firsts[l.id])}
                className={`group flex w-full items-center gap-4 border border-edge/70 bg-ink/60 px-4 py-2.5 text-left transition-colors ${print ? "" : "hover:bg-panel"}`}
                style={{ borderLeft: `3px solid ${b.accent}55` }}
              >
                <span className="font-display text-sm font-bold" style={{ color: b.accent }}>{l.num}</span>
                <span className="flex-1 text-[13.5px] text-fog">{l.title}</span>
                <span className="hidden font-mono text-[9.5px] uppercase tracking-widest text-steel sm:block">5 слайдов</span>
                {!print && <IconArrow className="h-4 w-4 text-steel opacity-0 transition-opacity group-hover:opacity-100" />}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-8 flex max-w-3xl flex-wrap gap-3">
            <Chip color={b.accent}>Слайд 94 · финальное задание у ИИ-экзаменатора</Chip>
            <Chip color="#37c98b">Слайд 95 · именной PDF-сертификат</Chip>
          </div>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 hazard h-1.5" />
    </div>
  );
}

function BlockSummarySlide({ blockId }: { blockId: number }) {
  const b = BLOCKS.find((x) => x.id === blockId)!;
  const r = BLOCK_RESUME[blockId];
  return (
    <div className="mx-auto flex h-full max-w-7xl flex-col justify-center px-4 py-8 sm:px-6">
      <Kicker color={b.accent}>{b.code} · контрольная точка</Kicker>
      <h2 className="mt-3 font-display text-2xl font-bold text-snow md:text-4xl">Итоги: {b.title.toLowerCase()}</h2>
      <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-steel">{r.line}</p>

      <div className="mt-7 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {r.kpi.map((k) => (
          <div key={k.k} className="corners border border-edge bg-panel px-4 py-3.5">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-steel">{k.k}</p>
            <p className="mt-1 font-display text-lg font-bold leading-snug" style={{ color: b.accent }}>{k.v}</p>
          </div>
        ))}
      </div>

      <div className="mt-7 overflow-hidden border border-edge">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-edge bg-panel font-mono text-[9.5px] uppercase tracking-[0.2em] text-steel">
              <th className="px-4 py-2.5 font-medium">Урок</th>
              <th className="hidden px-4 py-2.5 font-medium md:table-cell">Ключевой вывод</th>
              <th className="px-4 py-2.5 font-medium">Главный артефакт</th>
            </tr>
          </thead>
          <tbody>
            {b.lessons.map((l) => (
              <tr key={l.id} className="border-b border-edge/60 last:border-0 hover:bg-panel/50">
                <td className="px-4 py-2.5">
                  <span className="font-display text-[12px] font-bold" style={{ color: b.accent }}>{l.num}</span>{" "}
                  <span className="text-[12.5px] text-fog">{l.title}</span>
                </td>
                <td className="hidden px-4 py-2.5 text-[12px] text-steel md:table-cell">{l.takeaways[0]}</td>
                <td className="px-4 py-2.5 text-[12px] text-fog">{l.artifacts[0]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlanSlide() {
  return (
    <div className="mx-auto flex h-full max-w-7xl flex-col justify-center px-4 py-8 sm:px-6">
      <Kicker color="#37c98b">Урок 3.6 · синтез всех наработок</Kicker>
      <h2 className="mt-3 font-display text-2xl font-bold text-snow md:text-4xl">Годовой план вывода на рынок — 2025</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {YEAR_PLAN.map((q, i) => (
          <div key={q.q} className="corners relative border border-edge bg-panel p-5">
            <p className="font-display text-3xl font-extrabold text-kamber">{q.q}</p>
            <p className="mt-3 text-[13px] leading-relaxed text-fog">{q.text}</p>
            <p className="mt-4 border-t border-edge pt-3 font-mono text-[10px] uppercase tracking-widest text-mint">KPI: {q.kpi}</p>
            {i < 3 && <IconArrow className="absolute -right-3.5 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-kamber md:block" />}
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-edge pt-6">
        <p className="text-[14px] text-steel">
          KPI 2025 — <span className="font-display font-bold text-kamber">5% доли рынка</span>: первый шаг к 20% к 2032 году.
        </p>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-steel">«Технологии, которые спасают. Интеллект, который защищает»</p>
      </div>
    </div>
  );
}

function TakeawaysSlide() {
  const cats = [
    { icon: <IconTarget className="h-5 w-5" />, t: "Стратегия", color: "#7db8f5", items: ["Рыночная модель до 2032", "3 сегмента с паспортами ЛПР", "RICE-приоритизация гипотез", "Патентная карта и 2 заявки", "Бренд «КАМАЗ-Щит»"] },
    { icon: <IconRoute className="h-5 w-5" />, t: "Продукт", color: "#ffa14e", items: ["JTBD-гайд и инсайты расчётов", "CJM с планом против барьеров", "PRD: 80 м · 360° · < 2 мин", "Бэклог: 4 Epic, 24 истории", "Стресс-тест виртуальной комиссией"] },
    { icon: <IconFlame className="h-5 w-5" />, t: "Тактика", color: "#37c98b", items: ["Рендеры и лендинг", "Медиаплан 40 / 30 / 30", "Автоворонка тендеров", "Контент-план Telegram", "RAG-бот сервиса и годовой план"] },
    { icon: <IconBot className="h-5 w-5" />, t: "Навыки ИИ", color: "#7db8f5", items: ["Chain of Thought", "RAG по патентам и сервису", "Multi-Agent Simulation", "Structured Output (JSON/MD)", "LLM-Roleplay интервью"] },
  ];
  return (
    <div className="mx-auto flex h-full max-w-7xl flex-col justify-center px-4 py-8 sm:px-6">
      <Kicker color="#7db8f5">Финишная прямая</Kicker>
      <h2 className="mt-3 font-display text-2xl font-bold text-snow md:text-4xl">Что вы уносите с курса</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cats.map((c) => (
          <div key={c.t} className="corners border border-edge bg-panel p-5">
            <p className="flex items-center gap-2.5 font-display text-[13px] font-bold uppercase tracking-wide" style={{ color: c.color }}>
              {c.icon} {c.t}
            </p>
            <ul className="mt-3.5 space-y-2">
              {c.items.map((it) => (
                <li key={it} className="flex gap-2.5 text-[12.5px] leading-snug text-fog">
                  <IconCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {it}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Chip color="#ffa14e">45+ артефактов</Chip>
        <Chip color="#7db8f5">16 готовых промтов</Chip>
        <Chip color="#37c98b">1 сквозной кейс от брифа до годового плана</Chip>
      </div>
    </div>
  );
}

function FinalSlide() {
  return (
    <div className="relative flex h-full items-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-kdeep/30 blur-[140px]" />
      <div className="relative mx-auto w-full max-w-4xl px-4 py-10 text-center sm:px-6">
        <LogoMark className="mx-auto h-14 w-14 text-kblue" />
        <h2 className="mt-6 font-display text-3xl font-extrabold leading-tight text-snow md:text-5xl">
          Технологии, которые спасают.
          <br />
          <span className="text-kamber">Интеллект, который защищает.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[14px] leading-relaxed text-steel">
          Кейс «Ремдизель» собран: рынок 45 млрд ₽, продукт «КАМАЗ-Щит» РТ-80, годовой план и траектория к 20% рынка
          к 2032 году. Дальше — ваш рынок и ваши промты.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 font-mono text-[10.5px] uppercase tracking-[0.18em] text-steel">
          <Chip color="#7db8f5">[O] — содержание</Chip>
          <Chip color="#ffa14e">PDF — вся презентация</Chip>
          <Chip color="#37c98b">сертификат — слайд 95</Chip>
        </div>
        <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.24em] text-steel/70">
          © 2025 Ремдизель AI-Академия · дочерняя структура КАМАЗ
        </p>
      </div>
      <div className="absolute inset-x-0 bottom-0 hazard h-1.5" />
    </div>
  );
}

/* ================= роутер слайдов ================= */

export default function SlideContent({ slide, goTo, print = false, certName, onPrintCert }: Props) {
  switch (slide.kind) {
    case "title":
      return <TitleSlide print={print} goTo={goTo} />;
    case "method":
      return <MethodSlide />;
    case "agenda":
      return <AgendaSlide goTo={goTo} print={print} />;
    case "case":
      return <CaseSlide />;
    case "product":
      return <ProductSlide />;
    case "math":
      return (
        <div className="mx-auto flex h-full max-w-7xl flex-col justify-center px-4 py-8 sm:px-6">
          <Kicker>Математика цели</Kicker>
          <h2 className="mt-3 font-display text-2xl font-bold text-snow md:text-4xl">45 млрд → 77 млрд: цена 20% рынка</h2>
          <div className="mt-7 grid gap-5 lg:grid-cols-[7fr_5fr]">
            <MarketChart print={print} />
            <div className="space-y-3">
              {[
                ["45 млрд ₽", "объём рынка пожарной техники в 2024 году", "#7db8f5"],
                ["7% CAGR", "ежегодный рост на госпрограммах перевооружения МЧС и ТЭК", "#ffa14e"],
                ["450–500 ед./год", "столько машин должен продавать «Ремдизель» для 20% доли к 2032", "#37c98b"],
              ].map(([v, d, c]) => (
                <div key={v} className="border border-edge bg-panel px-4 py-3.5" style={{ borderLeft: `3px solid ${c}` }}>
                  <p className="font-display text-lg font-bold" style={{ color: c }}>{v}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-steel">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    case "stack":
      return <StackSlide />;
    case "block":
      return <BlockSlide blockId={slide.blockId} print={print} goTo={goTo} />;
    case "lesson": {
      const lesson = ALL_LESSONS.find((l) => l.id === slide.lessonId)!;
      return <LessonSlide lesson={lesson} part={slide.part} print={print} goTo={goTo} />;
    }
    case "blockSummary":
      return <BlockSummarySlide blockId={slide.blockId} />;
    case "exam":
      return (
        <div className="mx-auto flex h-full max-w-7xl flex-col justify-center px-4 py-6 sm:px-6 md:py-8">
          <Kicker color="#7db8f5">Блок 04 · Защита проекта · слайд 94</Kicker>
          <h2 className="mb-5 mt-2 font-display text-xl font-bold text-snow md:text-3xl">Финальное задание у ИИ-экзаменатора</h2>
          <ExamPanel print={print} />
        </div>
      );
    case "cert":
      return (
        <div className="mx-auto flex h-full max-w-7xl flex-col justify-center px-4 py-6 sm:px-6 md:py-8">
          <Kicker color="#37c98b">Блок 04 · Итог обучения · слайд 95</Kicker>
          <h2 className="mb-5 mt-2 font-display text-xl font-bold text-snow md:text-3xl">Именной PDF-сертификат</h2>
          <CertPanel print={print} certName={certName} onPrintCert={onPrintCert} />
        </div>
      );
    case "plan":
      return <PlanSlide />;
    case "takeaways":
      return <TakeawaysSlide />;
    case "final":
      return <FinalSlide />;
  }
}
