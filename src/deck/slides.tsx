import { useEffect, useRef, useState } from "react";
import { ALL_LESSONS, AGENT_SCENARIOS, BLOCKS, CJM_STAGES, COURSE, IMAGES, MARKET_FORECAST, PRODUCT_SPECS, YEAR_PLAN, type Lesson, type Step } from "../data/course";
import { IconArrow, IconBot, IconCheck, IconCopy, IconDoc, IconDownload, IconFlame, IconGauge, IconMedal, IconPlay, IconReset, IconRoute, IconSend, IconShield, IconSpark, IconTarget, IconWrench, LogoMark } from "../components/icons";

export type Slide =
  | { kind: "title" } | { kind: "method" } | { kind: "agenda" } | { kind: "case" }
  | { kind: "product" } | { kind: "math" } | { kind: "stack" }
  | { kind: "block"; blockId: number } | { kind: "lesson"; lessonId: string; part: number }
  | { kind: "blockSummary"; blockId: number } | { kind: "exam" } | { kind: "cert" }
  | { kind: "plan" } | { kind: "takeaways" } | { kind: "final" };

type Props = { slide: Slide; goTo?: (i: number) => void; index?: number };
export const PART_LABELS = ["Постановка", "Технология", "Промт", "Ход решения", "Результат"];

function Kicker({ children, color = "#f97316" }: { children: React.ReactNode; color?: string }) {
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
        await navigator.clipboard.writeText(text);
        setOk(true);
        setTimeout(() => setOk(false), 1400);
      }}
      className={`flex items-center gap-1.5 rounded border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${ok ? "border-mint text-mint" : "border-edge text-steel hover:border-kice hover:text-kice"}`}
    >
      {ok ? <IconCheck className="h-3.5 w-3.5" /> : <IconCopy className="h-3.5 w-3.5" />}
      {ok ? "Скопировано" : "Копировать"}
    </button>
  );
}

function Chip({ children, color = "#3b82f6" }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider" style={{ borderColor: `${color}66`, color, background: `${color}14` }}>
      {children}
    </span>
  );
}

function MarketChart() {
  const max = 80;
  return (
    <div className="border border-edge bg-panel p-4">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-steel">Рынок пожарной техники РФ, млрд ₽</p>
        <p className="font-mono text-[10px] uppercase tracking-widest text-kamber">CAGR 7%</p>
      </div>
      <svg viewBox="0 0 560 190" className="mt-3 w-full">
        {[20, 40, 60, 80].map((g) => (
          <g key={g}>
            <line x1="30" x2="550" y1={170 - (g / max) * 150} y2={170 - (g / max) * 150} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3 5" />
            <text x="2" y={174 - (g / max) * 150} fontSize="9" fill="#6b7280" fontFamily="JetBrains Mono">{g}</text>
          </g>
        ))}
        {MARKET_FORECAST.map((p, i) => {
          const h = (p.value / max) * 150;
          const x = 40 + i * 57;
          const hot = i === 0 || i === MARKET_FORECAST.length - 1;
          return (
            <g key={p.year}>
              <rect x={x} y={170 - h} width="34" height={h} fill={hot ? "#f97316" : "#2563eb"} opacity={hot ? 1 : 0.75} />
              {hot && <text x={x + 17} y={162 - h} fontSize="11" fontWeight="700" fill="#111827" textAnchor="middle" fontFamily="JetBrains Mono">{p.value}</text>}
              <text x={x + 17} y={184} fontSize="8.5" fill="#6b7280" textAnchor="middle" fontFamily="JetBrains Mono">{String(p.year).slice(2)}</text>
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

function RiceTable({ lesson }: { lesson: Lesson }) {
  const rows = lesson.rice ?? [];
  return (
    <div className="border border-edge bg-panel p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-steel">RICE-скоринг гипотез</p>
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
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-sm bg-gray-100">
              <div className={`h-full ${i === 0 ? "bg-kamber" : "bg-kblue"}`} style={{ width: `${(r.score / 850) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BudgetBars({ lesson }: { lesson: Lesson }) {
  const rows = lesson.channels ?? [];
  const colors = ["#f97316", "#3b82f6", "#10b981"];
  return (
    <div className="border border-edge bg-panel p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-steel">Распределение бюджета 2025</p>
      <div className="mt-4 space-y-3.5">
        {rows.map((c, i) => (
          <div key={i}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[12.5px] font-semibold text-fog">{c.name}</p>
              <span className="font-display text-base font-bold tabular-nums" style={{ color: colors[i] }}>{c.pct}%</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-sm bg-gray-100">
              <div className="h-full" style={{ width: `${c.pct}%`, background: colors[i] }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepLine({ s }: { s: Step }) {
  if (s.t === "log") return <p className="flex gap-2.5"><span className="shrink-0 select-none text-gray-300">··</span><span className="text-steel">{s.text}</span></p>;
  if (s.t === "ai") return <p className="flex gap-2.5"><span className="mt-0.5 h-fit shrink-0 rounded-sm bg-kdeep/10 px-1 font-bold text-kice">AI</span><span className="text-fog">{s.text}</span></p>;
  return <p className="border border-kamber/50 bg-kamber/10 px-3 py-2 font-bold text-kamber2">{s.text}</p>;
}

function AgentTerminal({ scenarioId }: { scenarioId: string }) {
  const scenario = AGENT_SCENARIOS.find((s) => s.id === scenarioId)!;
  const [shown, setShown] = useState(0);
  const [running, setRunning] = useState(false);
  const finished = shown >= scenario.steps.length;

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setShown((s) => {
        if (s >= scenario.steps.length) { setRunning(false); return s; }
        return s + 1;
      });
    }, 720);
    return () => clearInterval(t);
  }, [running, scenario]);

  return (
    <div className="flex flex-col border border-edge bg-panel">
      <div className="flex items-center gap-2 border-b border-edge px-3.5 py-2.5">
        <span className="h-2 w-2 bg-alarm/80" />
        <span className="h-2 w-2 bg-kamber/80" />
        <span className="h-2 w-2 bg-mint/80" />
        <span className="ml-2 truncate font-mono text-[10px] uppercase tracking-[0.18em] text-steel">{scenario.name} · {scenario.lesson}</span>
        <span className={`ml-auto shrink-0 font-mono text-[9px] uppercase tracking-widest ${running ? "text-kamber" : finished ? "text-mint" : "text-steel"}`}>
          {running ? "выполняется" : finished ? "завершено" : "ожидание"}
        </span>
      </div>
      <div className="max-h-56 min-h-[9rem] flex-1 space-y-2 overflow-y-auto p-3.5 font-mono text-[11.5px] leading-relaxed">
        {shown === 0 && <p className="text-steel">// запустите агента — шаги появятся последовательно</p>}
        {scenario.steps.slice(0, shown).map((s, i) => <div key={i}><StepLine s={s} /></div>)}
      </div>
      <div className="flex items-center gap-2.5 border-t border-edge px-3.5 py-2.5">
        <button onClick={() => { setShown(0); setRunning(true); }} disabled={running} className="flex items-center gap-1.5 rounded bg-kamber px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white disabled:opacity-50">
          <IconPlay className="h-3.5 w-3.5" /> {finished ? "Ещё раз" : "Запустить"}
        </button>
        <button onClick={() => { setRunning(false); setShown(0); }} className="flex items-center gap-1.5 rounded border border-edge px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-steel">
          <IconReset className="h-3.5 w-3.5" /> Сброс
        </button>
        <span className="ml-auto font-mono text-[9px] uppercase tracking-widest text-steel">{Math.min(shown, scenario.steps.length)}/{scenario.steps.length}</span>
      </div>
    </div>
  );
}

function CjmBoard() {
  const [sel, setSel] = useState(3);
  const W = 520, H = 120;
  const px = (i: number) => 40 + i * ((W - 80) / (CJM_STAGES.length - 1));
  const py = (e: number) => H - 14 - ((e - 1) / 4) * (H - 34);
  const st = CJM_STAGES[sel];

  return (
    <div className="border border-edge bg-panel p-4">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-steel">CJM закупки · эмоции ЛПР по этапам</p>
        <p className="font-mono text-[10px] uppercase tracking-widest text-kice">урок 2.2</p>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full">
        <line x1="20" x2={W - 20} y1={py(3)} y2={py(3)} stroke="#e5e7eb" strokeDasharray="4 4" />
        <polyline points={CJM_STAGES.map((s, i) => `${px(i)},${py(s.emotion)}`).join(" ")} fill="none" stroke="#2563eb" strokeWidth="2" />
        {CJM_STAGES.map((s, i) => (
          <g key={s.id} onClick={() => setSel(i)} className="cursor-pointer">
            <circle cx={px(i)} cy={py(s.emotion)} r={i === sel ? 7 : 5} fill={i === sel ? "#f97316" : "#ffffff"} stroke={i === sel ? "#fb923c" : "#3b82f6"} strokeWidth="2" />
            <text x={px(i)} y={H - 2} fontSize="9" fill={i === sel ? "#fb923c" : "#6b7280"} textAnchor="middle" fontFamily="JetBrains Mono">{s.short}</text>
          </g>
        ))}
      </svg>
      <div className="mt-2 border-t border-edge pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[13px] font-bold text-ink">Этап {sel + 1}/5 · {st.name}</p>
          <Chip color={st.emotion <= 2 ? "#ef4444" : st.emotion === 3 ? "#fb923c" : "#10b981"}>эмоция ЛПР: {st.emotion}/5</Chip>
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
      </div>
    </div>
  );
}

function Demo({ lesson }: { lesson: Lesson }) {
  switch (lesson.demo) {
    case "market": return <MarketChart />;
    case "rice": return <RiceTable lesson={lesson} />;
    case "budget": return <BudgetBars lesson={lesson} />;
    case "cjm": return <CjmBoard />;
    case "focus": return <AgentTerminal scenarioId="focus" />;
    case "tender": return <AgentTerminal scenarioId="tender" />;
    case "blueprint": return (
      <figure className="border border-edge bg-panel p-1.5">
        <img src={IMAGES.blueprint} alt="Чертёж" className="block w-full object-cover" />
        <figcaption className="px-1.5 py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-steel">Компоновка шасси 6×6 · схема к PRD</figcaption>
      </figure>
    );
    default: return null;
  }
}

function MasterBoard({ lesson, part, accent }: { lesson: Lesson; part: number; accent: string }) {
  const slots = [
    { label: "Цель урока", fill: lesson.goal },
    { label: "Технология", fill: lesson.tech.kind },
    { label: "Промт", fill: "зафиксирован" },
    { label: "Ход решения", fill: `${lesson.process.length} шагов` },
    { label: "Результат", fill: lesson.metrics[0]?.v ?? "" },
  ];
  return (
    <aside className="hidden h-fit border border-edge bg-panel lg:block">
      <div className="border-b border-edge px-4 py-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-steel">Доска кейса · урок {lesson.num}</p>
        <p className="mt-0.5 font-display text-[12px] font-bold leading-snug text-ink">Основной слайд урока</p>
      </div>
      <ul className="p-3">
        {slots.map((s, i) => {
          const state = i < part ? "done" : i === part ? "active" : "pending";
          return (
            <li key={i} className="relative pb-3 pl-6 last:pb-0">
              {i < slots.length - 1 && <span className="absolute left-[9px] top-5 h-full w-px bg-edge" />}
              <span className={`absolute left-0 top-0.5 flex h-[19px] w-[19px] items-center justify-center rounded-full border text-[9px] font-bold ${state === "done" ? "border-transparent text-white" : state === "active" ? "border-current text-current" : "border-edge text-steel"}`} style={state === "done" ? { background: accent } : state === "active" ? { color: accent } : undefined}>
                {state === "done" ? <IconCheck className="h-3 w-3" /> : i + 1}
              </span>
              <p className={`text-[11px] font-bold uppercase tracking-wider ${state === "pending" ? "text-steel/70" : "text-fog"}`}>{s.label}</p>
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

function LessonSlide({ lesson, part, goTo }: { lesson: Lesson; part: number; goTo?: (i: number) => void }) {
  const block = BLOCKS.find((b) => b.lessons.some((l) => l.id === lesson.id))!;
  const nextLesson = ALL_LESSONS[ALL_LESSONS.findIndex((l) => l.id === lesson.id) + 1];

  const jumpToNext = () => {
    if (!goTo || !nextLesson) return;
    let idx = 7;
    for (const b of BLOCKS) {
      idx += 1;
      for (const l of b.lessons) {
        if (l.id === nextLesson.id) { goTo(idx); return; }
        idx += 5;
      }
      if (b.id < 4) idx += 1;
    }
  };

  return (
    <div className="mx-auto flex h-full max-w-7xl flex-col px-4 py-6 sm:px-6 md:py-8">
      <header className="flex flex-wrap items-start gap-x-6 gap-y-3">
        <p className="font-display text-4xl font-extrabold leading-none md:text-5xl" style={{ color: block.accent }}>{lesson.num}</p>
        <div className="min-w-[200px] flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-steel">{block.code} · {block.title} · урок {lesson.num}</p>
          <h2 className="mt-1 font-display text-lg font-bold leading-tight text-ink md:text-2xl">{lesson.title}</h2>
        </div>
        <div className="flex items-center gap-1">
          {PART_LABELS.map((p, i) => (
            <span key={p} className="flex items-center gap-1">
              <span className="flex h-6 items-center rounded-sm px-2 font-mono text-[9px] font-bold uppercase tracking-widest" style={i === part ? { background: block.accent, color: "#ffffff" } : i < part ? { border: `1px solid ${block.accent}66`, color: block.accent } : { border: "1px solid #e5e7eb", color: "#6b7280" }}>
                {i < part ? "✓" : i + 1} <span className="ml-1 hidden xl:inline">{p}</span>
              </span>
              {i < 4 && <span className="h-px w-2 bg-edge" />}
            </span>
          ))}
        </div>
      </header>

      <div className="mt-5 grid min-h-0 flex-1 gap-5 lg:grid-cols-[1fr_290px]">
        <div className="min-h-0 overflow-y-auto pr-1">
          {part === 0 && (
            <div className="space-y-4">
              <div className="border border-edge bg-panel p-5">
                <Kicker color={block.accent}>Задача урока</Kicker>
                <p className="mt-3 text-[15px] font-semibold leading-relaxed text-ink">{lesson.goal}</p>
              </div>
              <div className="border border-edge bg-panel p-5">
                <Kicker color="#6b7280">Что происходит в кейсе на этом шаге</Kicker>
                <p className="mt-3 text-[14px] leading-relaxed text-fog">{lesson.context}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Chip color={block.accent}>{block.hours} ак. часа на блок</Chip>
                <Chip color="#3b82f6">формат: технология → промт → решение</Chip>
                <Chip color="#f97316">часть 2 → технология</Chip>
              </div>
            </div>
          )}

          {part === 1 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-sm px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-white" style={{ background: block.accent }}>{lesson.tech.kind}</span>
                <p className="text-[15px] font-bold text-ink">{lesson.tech.name}</p>
              </div>
              <p className="max-w-3xl text-[14px] leading-relaxed text-fog">{lesson.tech.note}</p>
              <div className="border border-edge bg-panel p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-steel">Как это работает</p>
                <ol className="mt-3 space-y-3">
                  {lesson.how.map((h, i) => (
                    <li key={i} className="flex gap-3.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border font-mono text-[11px] font-bold" style={{ borderColor: `${block.accent}66`, color: block.accent }}>{i + 1}</span>
                      <p className="pt-1 text-[13.5px] leading-relaxed text-fog">{h}</p>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="flex flex-wrap gap-2">
                {lesson.tools.map((t) => <Chip key={t} color={block.accent}>{t}</Chip>)}
              </div>
            </div>
          )}

          {part === 2 && (
            <div className="space-y-4">
              <div className="border border-edge bg-panel">
                <div className="flex items-center justify-between gap-3 border-b border-edge px-4 py-2.5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-steel">промт урока {lesson.num}</p>
                  <CopyBtn text={lesson.prompt} />
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
              <div className="border border-edge bg-panel p-4">
                <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-steel"><IconBot className="h-4 w-4" /> Лог агента · урок {lesson.num}</p>
                <div className="mt-3 space-y-2.5 font-mono text-[11.5px] leading-relaxed">
                  {lesson.process.map((s, i) => <StepLine key={i} s={s} />)}
                </div>
              </div>
              {lesson.demo && <div className="min-w-0"><Demo lesson={lesson} /></div>}
            </div>
          )}

          {part === 4 && (
            <div className="space-y-4">
              <div className="border border-edge bg-panel p-5">
                <Kicker color="#10b981">Решение кейса</Kicker>
                <p className="mt-3 text-[14.5px] leading-relaxed text-ink">{lesson.solution}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {lesson.metrics.map((m) => (
                  <div key={m.k} className="border border-edge bg-panel px-4 py-3">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-steel">{m.k}</p>
                    <p className="mt-1 font-display text-[15px] font-bold leading-snug" style={{ color: block.accent }}>{m.v}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border border-edge bg-panel p-4">
                  <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-steel"><IconDoc className="h-4 w-4" /> Артефакты урока</p>
                  <ul className="mt-2.5 space-y-1.5">
                    {lesson.artifacts.map((a) => <li key={a} className="flex items-center gap-2 text-[13px] text-fog"><IconDownload className="h-3.5 w-3.5 shrink-0 text-kamber" /> {a}</li>)}
                  </ul>
                </div>
                <div className="border border-edge bg-panel p-4">
                  <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-steel"><IconSpark className="h-4 w-4" /> Заберите с собой</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {lesson.takeaways.map((t) => <Chip key={t} color={block.accent}>{t}</Chip>)}
                  </div>
                  {nextLesson && (
                    <button onClick={jumpToNext} className="group mt-4 flex items-center gap-2 font-mono text-[10.5px] font-bold uppercase tracking-widest text-kice hover:text-ink">
                      Следующий урок: {nextLesson.num} {nextLesson.title}
                      <IconArrow className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        <MasterBoard lesson={lesson} part={part} accent={block.accent} />
      </div>
    </div>
  );
}

// Экзамен и сертификат
const EXAM_CRITERIA = [
  { key: "role", label: "Роль и субъект", test: (t: string) => /(ты|вы)\s*(—|–|-|:)|роль|действуй как|представь,? что/i.test(t), tip: "Задайте агентам роли" },
  { key: "context", label: "Контекст кейса", test: (t: string) => /ремдизель|кам.?аз|пожар|шасси|мчс|робот/i.test(t), tip: "Добавьте контекст" },
  { key: "task", label: "Задача и действия", test: (t: string) => /проанализируй|сгенерируй|оцени|составь|найди|построй/i.test(t), tip: "Сформулируйте действия" },
  { key: "limits", label: "Критерии и ограничения", test: (t: string) => /\d+\s*(%|м|шт|лет|руб|°C)|rice|критери/i.test(t), tip: "Дайте рамки" },
  { key: "format", label: "Формат результата", test: (t: string) => /список|таблиц|структур|формат|шаг/i.test(t), tip: "Требуйте структуру" },
];

function evaluatePrompt(text: string) {
  const t = text.trim();
  const tooShort = t.length < 30;
  const marks = EXAM_CRITERIA.map((c) => ({ ...c, hit: !tooShort && c.test(t) }));
  const score = tooShort ? 0 : marks.filter((m) => m.hit).length * 20;
  const passed = score >= 70;
  return { marks, score, passed };
}

function ExamPanel() {
  const [text, setText] = useState("");
  const [report, setReport] = useState<ReturnType<typeof evaluatePrompt> | null>(null);

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
      <div className="space-y-3.5">
        <div className="border border-edge bg-panel p-4">
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-kamber"><IconBot className="h-4 w-4" /> Финальное задание · 2 ак. часа</p>
          <p className="mt-2.5 text-[13px] leading-relaxed text-fog">Напишите <span className="font-bold text-ink">собственный промт</span> для «виртуального тестирования» роботизированного КАМАЗа.</p>
          <ul className="mt-3 space-y-1.5">
            {EXAM_CRITERIA.map((c) => (
              <li key={c.key} className="flex items-center justify-between text-[12.5px] text-steel">
                <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rotate-45 bg-kblue" /> {c.label}</span>
                <span className="font-mono text-[10px]">20 б.</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex min-h-0 flex-col border border-edge bg-panel">
        <div className="flex items-center justify-between border-b border-edge px-4 py-2.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-steel">ваш промт</p>
          <span className="font-mono text-[10px] text-steel">{text.trim().length} симв.</span>
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Вы — три агента: директор завода, главный инженер и начальник пожарной охраны…" className="min-h-[110px] w-full flex-1 resize-none bg-transparent p-4 font-mono text-[12.5px] leading-relaxed text-ink placeholder:text-steel/50 focus:outline-none" />
        <div className="flex items-center gap-3 border-t border-edge px-4 py-3">
          <button onClick={() => setReport(evaluatePrompt(text))} disabled={!text.trim()} className="flex items-center gap-2 rounded bg-kblue px-4 py-2 font-mono text-[10.5px] font-bold uppercase tracking-widest text-white disabled:opacity-40">
            <IconSend className="h-4 w-4" /> ИИ-экзаменатору
          </button>
        </div>
        {report && (
          <div className="border-t border-edge bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-kice">Заключение экзаменатора</p>
              <span className={`rounded border px-2.5 py-0.5 font-mono text-[10.5px] font-bold uppercase tracking-widest ${report.passed ? "border-mint text-mint" : "border-alarm text-alarm"}`}>{report.score} / 100 · {report.passed ? "Зачёт" : "Доработка"}</span>
            </div>
            <div className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {report.marks.map((m) => (
                <div key={m.key}>
                  <p className={`flex items-center gap-2 text-[12px] font-semibold ${m.hit ? "text-fog" : "text-steel"}`}>
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${m.hit ? "border-mint bg-mint/20 text-mint" : "border-alarm/70 text-alarm"}`}>{m.hit ? <IconCheck className="h-2.5 w-2.5" /> : <span className="text-[8px] leading-none">!</span>}</span>
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

function CertPanel() {
  const [name, setName] = useState(() => { try { return localStorage.getItem("rdai-name") ?? ""; } catch { return ""; } });
  const [exam] = useState(() => { try { const r = localStorage.getItem("rdai-exam-v1"); return r ? JSON.parse(r) : null; } catch { return null; } });
  const passed = Boolean(exam?.passed);

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[340px_1fr]">
      <div className="space-y-3.5">
        <div className="border border-edge bg-panel p-4">
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-kamber"><IconMedal className="h-4 w-4" /> Выдача сертификата</p>
          <label className="mt-3 block">
            <span className="font-mono text-[9.5px] uppercase tracking-widest text-steel">ФИО слушателя</span>
            <input value={name} onChange={(e) => { setName(e.target.value); try { localStorage.setItem("rdai-name", e.target.value); } catch {} }} placeholder="Соколов Дмитрий Андреевич" className="mt-1 w-full rounded border border-edge bg-white px-3 py-2 text-[13px] text-ink placeholder:text-steel/50 focus:border-kice focus:outline-none" />
          </label>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="border border-edge bg-white px-2.5 py-2">
              <p className="font-mono text-[8.5px] uppercase tracking-widest text-steel">Курс</p>
              <p className="text-[11.5px] font-semibold text-fog">16 ак. часов</p>
            </div>
            <div className="border border-edge bg-white px-2.5 py-2">
              <p className="font-mono text-[8.5px] uppercase tracking-widest text-steel">Экзамен</p>
              <p className={`text-[11.5px] font-semibold ${passed ? "text-mint" : "text-steel"}`}>{passed ? `${exam?.score}/100 · сдан` : "не сдан"}</p>
            </div>
          </div>
          <button onClick={() => passed && name.trim().length >= 2 && window.dispatchEvent(new CustomEvent("rdai:export-cert", { detail: name.trim() }))} disabled={!passed || name.trim().length < 2} className="mt-3.5 flex w-full items-center justify-center gap-2 rounded bg-kamber px-3 py-2.5 font-mono text-[10.5px] font-bold uppercase tracking-widest text-white disabled:opacity-40">
            <IconDownload className="h-4 w-4" /> Скачать PDF-сертификат
          </button>
        </div>
      </div>
      <div className="border border-edge bg-panel p-2.5">
        <div className="relative aspect-[1414/1000] w-full overflow-hidden bg-white text-[#152230]">
          <div className="absolute inset-[8px] border-2 border-[#1e40af]" />
          <div className="absolute inset-[13px] border border-[#f97316]" />
          <div className="absolute inset-0 flex flex-col items-center px-[6%] py-[4.5%] text-center">
            <div className="flex items-center gap-2">
              <LogoMark className="h-5 w-5 text-[#1e40af]" />
              <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-[#4a5b6d]">Ремдизель AI-Академия · КАМАЗ</span>
            </div>
            <p className="mt-[3%] font-display text-[clamp(16px,2.6vw,30px)] font-extrabold tracking-wide text-[#1e40af]">СЕРТИФИКАТ</p>
            <p className="mt-[2.2%] max-w-[82%] truncate border-b-2 border-[#f97316] px-5 pb-0.5 font-display text-[clamp(12px,1.8vw,21px)] font-bold">{name.trim() || "Фамилия Имя Отчество"}</p>
            <p className="mt-[2%] max-w-[78%] text-[clamp(8px,0.95vw,11.5px)] leading-relaxed text-[#33465a]">успешно завершил(а) курс «ИИ в маркетинге: от стратегии до тактики» — 16 академических часов</p>
            <div className="mt-auto flex w-full items-end justify-between px-[3%]">
              <p className="w-[26%] border-t border-[#33465a] pt-1 text-left text-[8px] text-[#33465a]">Директор академии</p>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#1e40af]">Экзамен: {exam?.score ?? 0}/100</p>
              <p className="w-[26%] border-t border-[#33465a] pt-1 text-right text-[8px] text-[#33465a]">ИИ-экзаменатор RDA</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SlideContent({ slide, goTo, index }: Props) {
  switch (slide.kind) {
    case "title": return (
      <div className="relative flex h-full items-center">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[7fr_5fr]">
          <div>
            <Kicker>Обучающая платформа · B2B · {COURSE.hours} академических часов</Kicker>
            <h1 className="mt-5 font-display font-extrabold leading-[1.05] text-ink">
              <span className="block text-[clamp(26px,3.8vw,52px)]">ИИ в маркетинге:</span>
              <span className="block text-[clamp(22px,3.1vw,42px)] text-kice">от стратегии <span className="text-kamber">до тактики</span></span>
            </h1>
            <p className="mt-5 max-w-xl text-[14.5px] leading-relaxed text-steel">Курс-презентация для маркетологов B2B, продуктовых менеджеров и стратегов. 16 уроков, каждый разбит на 5 слайдов-частей.</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {goTo && <button onClick={() => goTo(1)} className="group flex items-center gap-2.5 rounded bg-kblue px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-white hover:bg-kdeep">Начать курс <IconArrow className="h-4 w-4" /></button>}
              <div className="flex flex-wrap gap-2"><Chip color="#3b82f6">16 уроков</Chip><Chip color="#f97316">4 блока</Chip><Chip color="#10b981">сквозной кейс КАМАЗ</Chip></div>
            </div>
            <div className="mt-7 border-l-2 border-kamber pl-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-steel">Сквозной кейс // «Ремдизель» × КАМАЗ</p>
              <p className="mt-1.5 text-[14px] font-semibold leading-snug text-fog">Продуктовая и маркетинговая стратегия пожарной техники на шасси КАМАЗ — <span className="text-kamber">20% рынка РФ к 2032 году</span>.</p>
            </div>
          </div>
          <figure className="relative hidden border border-edge bg-panel p-2 sm:block">
            <img src={IMAGES.hero} alt="Роботизированный пожарный автомобиль" className="block w-full object-cover" />
          </figure>
        </div>
      </div>
    );
    case "method": return (
      <div className="mx-auto flex h-full max-w-7xl flex-col justify-center px-4 py-8 sm:px-6">
        <Kicker>Навигация по презентации</Kicker>
        <h2 className="mt-3 font-display text-2xl font-bold text-ink md:text-4xl">Каждый урок — 5 слайдов, которые дополняют основной</h2>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-steel">Справа на слайдах урока живёт <span className="text-fog">доска кейса</span> — каркас основного слайда. Каждая следующая часть заполняет один слот.</p>
        <div className="mt-8 grid gap-3 md:grid-cols-5">
          {[["01", "Постановка", "Задача урока"], ["02", "Технология", "Какой ИИ-инструмент"], ["03", "Промт", "Готовый промт"], ["04", "Ход решения", "Лог агента и демо"], ["05", "Результат", "Решение кейса в цифрах"]].map(([n, t, d], i) => (
            <div key={n} className="border border-edge bg-panel p-4">
              <p className="font-display text-2xl font-extrabold text-kamber">{n}</p>
              <p className="mt-2 font-display text-[13px] font-bold uppercase tracking-wide text-ink">{t}</p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-steel">{d}</p>
            </div>
          ))}
        </div>
      </div>
    );
    case "agenda": return (
      <div className="mx-auto flex h-full max-w-7xl flex-col justify-center px-4 py-8 sm:px-6">
        <Kicker>Программа · 16 академических часов</Kicker>
        <h2 className="mt-3 font-display text-2xl font-bold text-ink md:text-4xl">Маршрут курса</h2>
        <div className="mt-8 space-y-3">
          {BLOCKS.map((b) => (
            <div key={b.id} className="flex w-full items-center gap-5 border border-edge bg-panel px-5 py-4" style={{ borderLeft: `3px solid ${b.accent}` }}>
              <span className="font-display text-2xl font-extrabold md:text-3xl" style={{ color: b.accent }}>0{b.id}</span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-display text-[15px] font-bold text-ink md:text-lg">{b.title}</span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-steel">{b.hours} ак. ч · {b.lessons.length > 0 ? `${b.lessons.length} уроков × 5 слайдов` : "экзамен + сертификат"}</span>
                </span>
                <span className="mt-1 block truncate text-[12.5px] text-steel">{b.task}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
    case "case": return (
      <div className="mx-auto flex h-full max-w-7xl flex-col justify-center px-4 py-8 sm:px-6">
        <Kicker>Сквозной кейс // «Ремдизель» — дочерняя структура КАМАЗ</Kicker>
        <h2 className="mt-3 max-w-3xl font-display text-2xl font-bold leading-tight text-ink md:text-4xl">Пожарная техника на шасси КАМАЗ: <span className="text-kamber">20% рынка РФ к 2032 году</span></h2>
        <div className="mt-8 grid gap-5 lg:grid-cols-[5fr_7fr]">
          <div className="border border-edge bg-panel p-5">
            <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-steel"><IconFlame className="h-4 w-4 text-kamber" /> Бриф кейса</p>
            <dl className="mt-4 space-y-3">
              {[["Компания", "«Ремдизель», дочерняя структура КАМАЗ"], ["Продукт", "АЦ + роботизированный лафетный ствол"], ["Целевые сегменты", "МЧС РФ · ТЭК и металлургия · аэропорты"], ["Цель 2032", "20% рынка пожарной техники России"]].map(([k, v]) => (
                <div key={k} className="border-l-2 border-edge pl-3">
                  <dt className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-steel">{k}</dt>
                  <dd className="mt-0.5 text-[13px] font-semibold leading-snug text-fog">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <MarketChart />
        </div>
      </div>
    );
    case "product": return (
      <div className="mx-auto grid h-full max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-2">
        <figure className="border border-edge bg-panel p-2">
          <img src={IMAGES.turret} alt="Роботизированный лафетный ствол" className="block w-full object-cover" />
        </figure>
        <div>
          <Kicker color="#3b82f6">Продукт сквозного кейса</Kicker>
          <h2 className="mt-3 font-display text-2xl font-bold leading-tight text-ink md:text-4xl">«КАМАЗ-Щит» РТ-80</h2>
          <p className="mt-2 text-[14px] italic text-steel">«Технологии, которые спасают. Интеллект, который защищает»</p>
          <dl className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {PRODUCT_SPECS.map((s) => (
              <div key={s.k} className="border border-edge bg-panel px-3 py-2.5">
                <dt className="font-mono text-[8.5px] uppercase tracking-[0.18em] text-steel">{s.k}</dt>
                <dd className="mt-0.5 text-[12px] font-bold leading-snug text-kice">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    );
    case "math": return (
      <div className="mx-auto flex h-full max-w-7xl flex-col justify-center px-4 py-8 sm:px-6">
        <Kicker>Математика цели</Kicker>
        <h2 className="mt-3 font-display text-2xl font-bold text-ink md:text-4xl">45 млрд → 77 млрд: цена 20% рынка</h2>
        <div className="mt-7 grid gap-5 lg:grid-cols-[7fr_5fr]">
          <MarketChart />
          <div className="space-y-3">
            {[["45 млрд ₽", "объём рынка пожарной техники в 2024 году", "#3b82f6"], ["7% CAGR", "ежегодный рост на госпрограммах", "#f97316"], ["450–500 ед./год", "столько машин должен продавать «Ремдизель»", "#10b981"]].map(([v, d, c]) => (
              <div key={v} className="border border-edge bg-panel px-4 py-3.5" style={{ borderLeft: `3px solid ${c}` }}>
                <p className="font-display text-lg font-bold" style={{ color: c }}>{v}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-steel">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
    case "stack": return (
      <div className="mx-auto flex h-full max-w-7xl flex-col justify-center px-4 py-8 sm:px-6">
        <Kicker color="#3b82f6">Технологические требования курса</Kicker>
        <h2 className="mt-3 font-display text-2xl font-bold text-ink md:text-4xl">Стек платформы и AI-контура</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { icon: <IconGauge className="h-5 w-5" />, title: "Платформа и фронтенд", items: ["React.js / Next.js", "TailwindCSS", "Docker + Kubernetes"] },
            { icon: <IconBot className="h-5 w-5" />, title: "AI-контур", items: ["LangChain / LlamaIndex", "OpenAI API", "YandexGPT / GigaChat"] },
            { icon: <IconWrench className="h-5 w-5" />, title: "Данные и интеграции", items: ["PostgreSQL", "Jira / Notion API", "zakupki.gov.ru"] },
          ].map((c) => (
            <div key={c.title} className="border border-edge bg-panel p-5">
              <p className="flex items-center gap-2.5 font-display text-[13px] font-bold uppercase tracking-wide text-kice">{c.icon} {c.title}</p>
              <ul className="mt-4 space-y-2.5">
                {c.items.map((it) => <li key={it} className="flex gap-2.5 text-[13px] leading-relaxed text-fog"><span className="mt-2 h-1 w-1 shrink-0 rotate-45 bg-kamber" /> {it}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
    case "block": {
      const b = BLOCKS.find((x) => x.id === slide.blockId)!;
      return (
        <div className="relative flex h-full items-center">
          <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
            <Kicker color={b.accent}>{b.code} · {b.hours} академических часа</Kicker>
            <h2 className="mt-4 max-w-2xl font-display text-3xl font-extrabold leading-tight text-ink md:text-5xl">{b.title}</h2>
            <p className="mt-3 text-[15px] text-steel">Задача: <span className="text-fog">{b.task.toLowerCase()}.</span></p>
            {b.lessons.length > 0 && (
              <div className="mt-8 max-w-3xl space-y-1.5">
                {b.lessons.map((l) => (
                  <div key={l.id} className="flex w-full items-center gap-4 border border-edge/70 bg-panel px-4 py-2.5" style={{ borderLeft: `3px solid ${b.accent}55` }}>
                    <span className="font-display text-sm font-bold" style={{ color: b.accent }}>{l.num}</span>
                    <span className="flex-1 text-[13.5px] text-fog">{l.title}</span>
                    <span className="hidden font-mono text-[9.5px] uppercase tracking-widest text-steel sm:block">5 слайдов</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }
    case "blockSummary": {
      const b = BLOCKS.find((x) => x.id === slide.blockId)!;
      const kpis: Record<number, { kpi: [string, string][]; line: string }> = {
        1: { kpi: [["Рынок 2024", "45 млрд ₽"], ["Сегментов ЦА", "3"], ["RICE топ-гипотезы", "850"], ["Патентные заявки", "2"]], line: "Рынок обоснован, сегменты выбраны, гипотеза защищена патентом." },
        2: { kpi: [["JTBD-инсайт", "обзор + термо-защита"], ["ТТХ ствола", "80 м · 360°"], ["User Stories", "24"], ["Уязвимость №1", "ЭМИ / перегрев"]], line: "Продукт спроектирован от болей ЦА: PRD, бэклог и стресс-тест." },
        3: { kpi: [["Бюджет 2025", "40 / 30 / 30"], ["Алерт по тендеру", "< 30 мин"], ["Постов в месяц", "12"], ["KPI года", "5% рынка"]], line: "Упаковка, каналы, автоворонка и сервис собраны в годовой план." },
      };
      const r = kpis[slide.blockId];
      return (
        <div className="mx-auto flex h-full max-w-7xl flex-col justify-center px-4 py-8 sm:px-6">
          <Kicker color={b.accent}>{b.code} · контрольная точка</Kicker>
          <h2 className="mt-3 font-display text-2xl font-bold text-ink md:text-4xl">Итоги: {b.title.toLowerCase()}</h2>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-steel">{r.line}</p>
          <div className="mt-7 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {r.kpi.map((k) => (
              <div key={k[0]} className="border border-edge bg-panel px-4 py-3.5">
                <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-steel">{k[0]}</p>
                <p className="mt-1 font-display text-lg font-bold leading-snug" style={{ color: b.accent }}>{k[1]}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "lesson": {
      const lesson = ALL_LESSONS.find((l) => l.id === slide.lessonId)!;
      return <LessonSlide lesson={lesson} part={slide.part} goTo={goTo} />;
    }
    case "exam": return (
      <div className="mx-auto flex h-full max-w-7xl flex-col justify-center px-4 py-6 sm:px-6 md:py-8">
        <Kicker color="#3b82f6">Блок 04 · Защита проекта{index !== undefined ? ` · слайд ${index + 1}` : ""}</Kicker>
        <h2 className="mb-5 mt-2 font-display text-xl font-bold text-ink md:text-3xl">Финальное задание у ИИ-экзаменатора</h2>
        <ExamPanel />
      </div>
    );
    case "cert": return (
      <div className="mx-auto flex h-full max-w-7xl flex-col justify-center px-4 py-6 sm:px-6 md:py-8">
        <Kicker color="#10b981">Блок 04 · Итог обучения{index !== undefined ? ` · слайд ${index + 1}` : ""}</Kicker>
        <h2 className="mb-5 mt-2 font-display text-xl font-bold text-ink md:text-3xl">Именной PDF-сертификат</h2>
        <CertPanel />
      </div>
    );
    case "plan": return (
      <div className="mx-auto flex h-full max-w-7xl flex-col justify-center px-4 py-8 sm:px-6">
        <Kicker color="#10b981">Урок 3.6 · синтез всех наработок</Kicker>
        <h2 className="mt-3 font-display text-2xl font-bold text-ink md:text-4xl">Годовой план вывода на рынок — 2025</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {YEAR_PLAN.map((q, i) => (
            <div key={q.q} className="border border-edge bg-panel p-5">
              <p className="font-display text-3xl font-extrabold text-kamber">{q.q}</p>
              <p className="mt-3 text-[13px] leading-relaxed text-fog">{q.text}</p>
              <p className="mt-4 border-t border-edge pt-3 font-mono text-[10px] uppercase tracking-widest text-mint">KPI: {q.kpi}</p>
            </div>
          ))}
        </div>
      </div>
    );
    case "takeaways": return (
      <div className="mx-auto flex h-full max-w-7xl flex-col justify-center px-4 py-8 sm:px-6">
        <Kicker color="#3b82f6">Финишная прямая</Kicker>
        <h2 className="mt-3 font-display text-2xl font-bold text-ink md:text-4xl">Что вы уносите с курса</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: <IconTarget className="h-5 w-5" />, t: "Стратегия", color: "#3b82f6", items: ["Рыночная модель до 2032", "3 сегмента с паспортами ЛПР", "RICE-приоритизация гипотез"] },
            { icon: <IconRoute className="h-5 w-5" />, t: "Продукт", color: "#f97316", items: ["JTBD-гайд и инсайты", "CJM с планом против барьеров", "PRD: 80 м · 360° · < 2 мин"] },
            { icon: <IconFlame className="h-5 w-5" />, t: "Тактика", color: "#10b981", items: ["Рендеры и лендинг", "Медиаплан 40 / 30 / 30", "Автоворонка тендеров"] },
            { icon: <IconBot className="h-5 w-5" />, t: "Навыки ИИ", color: "#3b82f6", items: ["Chain of Thought", "RAG по патентам", "Multi-Agent Simulation"] },
          ].map((c) => (
            <div key={c.t} className="border border-edge bg-panel p-5">
              <p className="flex items-center gap-2.5 font-display text-[13px] font-bold uppercase tracking-wide" style={{ color: c.color }}>{c.icon} {c.t}</p>
              <ul className="mt-3.5 space-y-2">
                {c.items.map((it) => <li key={it} className="flex gap-2.5 text-[12.5px] leading-snug text-fog"><IconCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {it}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
    case "final": return (
      <div className="relative flex h-full items-center">
        <div className="mx-auto w-full max-w-4xl px-4 py-10 text-center sm:px-6">
          <LogoMark className="mx-auto h-14 w-14 text-kblue" />
          <h2 className="mt-6 font-display text-3xl font-extrabold leading-tight text-ink md:text-5xl">Технологии, которые спасают.<br /><span className="text-kamber">Интеллект, который защищает.</span></h2>
          <p className="mx-auto mt-5 max-w-xl text-[14px] leading-relaxed text-steel">Кейс «Ремдизель» собран: рынок 45 млрд ₽, продукт «КАМАЗ-Щит» РТ-80, годовой план и траектория к 20% рынка к 2032 году.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 font-mono text-[10.5px] uppercase tracking-[0.18em] text-steel">
            <Chip color="#3b82f6">← → — навигация</Chip>
            <Chip color="#f97316">PDF — экспорт</Chip>
            <Chip color="#10b981">сертификат — после зачёта</Chip>
          </div>
        </div>
      </div>
    );
  }
}
