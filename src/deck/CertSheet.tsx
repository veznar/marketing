import { LogoMark } from "../components/icons";

function certNumber(name: string) {
  let h = 0;
  const s = name.trim() || "anon";
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `RDA-2025-${String(1000 + (h % 9000))}`;
}

function Seal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className}>
      <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="60" cy="60" r="47" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
      <path
        d="M60 30c3 11-9 16-9 27.5A15 15 0 0 0 81 57.5c0-7-3-11.5-6.4-15.6-.8 4.4-2.7 6.8-5.8 8.4 1.5-9.4 0-15.3-8.8-20.3z"
        fill="currentColor"
      />
      <path d="M40 84h40" stroke="currentColor" strokeWidth="2" />
      <text x="60" y="99" textAnchor="middle" fontSize="9.5" fontFamily="JetBrains Mono" fill="currentColor" letterSpacing="2">
        РЕМДИЗЕЛЬ
      </text>
    </svg>
  );
}

/** Лист именного сертификата — заполняет контейнер (в экспорте: 1400×990 = A4 landscape). */
export default function CertSheet({ name, score }: { name: string; score: number }) {
  const date = new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#f3f6fa] font-body text-[#152230]">
      <div className="absolute inset-[16px] border-[3px] border-[#0b3e7d]" />
      <div className="absolute inset-[24px] border border-[#e86a10]" />

      <div className="absolute inset-0 flex flex-col items-center px-[8%] py-[5%] text-center">
        <div className="flex items-center gap-3">
          <LogoMark className="h-9 w-9 text-[#0b3e7d]" />
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#4a5b6d]">
            Ремдизель AI-Академия · КАМАЗ
          </span>
        </div>

        <p className="mt-[3%] font-display text-[46px] font-extrabold tracking-wide text-[#0b3e7d]">СЕРТИФИКАТ</p>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.3em] text-[#4a5b6d]">
          № {certNumber(name)} · подтверждает, что
        </p>

        <p className="mt-[2.4%] max-w-[85%] truncate border-b-2 border-[#e86a10] px-8 pb-1 font-display text-[30px] font-bold">
          {name.trim() || "Фамилия Имя Отчество"}
        </p>

        <p className="mt-[2.2%] max-w-[78%] text-[15px] leading-relaxed text-[#33465a]">
          успешно завершил(а) курс «ИИ в маркетинге: от стратегии до тактики» — 16 академических часов,
          сквозной кейс «Ремдизель» (дочерняя структура КАМАЗ): продуктовая и маркетинговая стратегия
          пожарной техники на шасси КАМАЗ, включая робототехнику, — и сдал(а) финальное задание у
          ИИ-экзаменатора.
        </p>

        <div className="mt-auto flex w-full items-end justify-between px-[4%]">
          <div className="text-left">
            <p className="w-[170px] border-t border-[#33465a] pt-1.5 text-[11px] text-[#33465a]">Директор академии</p>
            <p className="mt-2 font-mono text-[10px] text-[#4a5b6d]">Дата: {date}</p>
          </div>
          <p className="font-mono text-[12px] uppercase tracking-[0.2em] text-[#0b3e7d]">Экзамен: {score}/100</p>
          <div className="text-right">
            <p className="w-[170px] border-t border-[#33465a] pt-1.5 text-[11px] text-[#33465a]">ИИ-экзаменатор RDA</p>
          </div>
        </div>
      </div>

      <Seal className="absolute bottom-[9%] right-[6%] h-[19%] w-auto -rotate-12 text-[#e86a10] opacity-90" />
    </div>
  );
}
