import pptxgen from "pptxgenjs";
import { ALL_LESSONS, BLOCKS, CJM_STAGES, COURSE, MARKET_FORECAST, PRODUCT_SPECS, YEAR_PLAN } from "../data/course";
import type { Slide } from "./slides";

// Цветовая палитра для PPTX
const C = {
  ink: "111827",      // тёмный текст
  panel: "F3F4F6",    // светлый фон панелей
  edge: "D1D5DB",     // границы
  steel: "6B7280",    // серый текст
  fog: "374151",      // основной текст
  kblue: "2563EB",    // синий
  kice: "3B82F6",     // голубой
  kdeep: "1E40AF",    // тёмно-синий
  kamber: "F97316",   // оранжевый
  kamber2: "FB923C",  // светло-оранжевый
  mint: "10B981",     // зелёный
  white: "FFFFFF",
  bg: "FFFFFF",       // белый фон слайда
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export async function exportPptx(slides: Slide[], onProgress?: (done: number, total: number) => void): Promise<void> {
  const pptx = new pptxgen();
  
  // Настройки презентации
  pptx.defineLayout({ name: "CUSTOM", width: 13.333, height: 7.5 });
  pptx.layout = "CUSTOM";
  pptx.author = COURSE.org;
  pptx.company = "КАМАЗ";
  pptx.subject = COURSE.title;
  pptx.title = COURSE.title;

  const total = slides.length;

  for (let i = 0; i < total; i++) {
    const slide = slides[i];
    const pptxSlide = pptx.addSlide();
    
    // Белый фон для всех слайдов
    pptxSlide.background = { color: C.bg };

    // Рендерим слайд в зависимости от типа
    switch (slide.kind) {
      case "title":
        renderTitleSlide(pptxSlide);
        break;
      case "method":
        renderMethodSlide(pptxSlide);
        break;
      case "agenda":
        renderAgendaSlide(pptxSlide);
        break;
      case "case":
        renderCaseSlide(pptxSlide);
        break;
      case "product":
        renderProductSlide(pptxSlide);
        break;
      case "math":
        renderMathSlide(pptxSlide);
        break;
      case "stack":
        renderStackSlide(pptxSlide);
        break;
      case "block":
        renderBlockSlide(pptxSlide, slide.blockId);
        break;
      case "blockSummary":
        renderBlockSummarySlide(pptxSlide, slide.blockId);
        break;
      case "lesson":
        renderLessonSlide(pptxSlide, slide.lessonId, slide.part);
        break;
      case "exam":
        renderExamSlide(pptxSlide);
        break;
      case "cert":
        renderCertSlide(pptxSlide);
        break;
      case "plan":
        renderPlanSlide(pptxSlide);
        break;
      case "takeaways":
        renderTakeawaysSlide(pptxSlide);
        break;
      case "final":
        renderFinalSlide(pptxSlide);
        break;
    }

    // Номер слайда внизу справа
    pptxSlide.addText(`${i + 1} / ${total}`, {
      x: 12.3, y: 7.1, w: 1, h: 0.3,
      fontSize: 8, color: C.steel, align: "right",
      fontFace: "Arial",
    });

    onProgress?.(i + 1, total);
    
    // Даём браузеру передышку
    if (i % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  // Сохраняем файл
  await pptx.writeFile({ fileName: "remdiesel-ii-v-marketinge-slaidy.pptx" });
}

// ============ Рендереры слайдов ============

function addKicker(slide: any, text: string, color: string = C.kamber, y: number = 0.5) {
  slide.addShape("rect", {
    x: 0.5, y: y - 0.05, w: 0.1, h: 0.1,
    fill: { color },
  });
  slide.addText(text.toUpperCase(), {
    x: 0.7, y: y - 0.05, w: 10, h: 0.3,
    fontSize: 8, color, bold: true,
    fontFace: "Arial",
  });
}

function addTitle(slide: any, text: string, y: number = 1.2, size: number = 28, color: string = C.ink) {
  slide.addText(text, {
    x: 0.5, y, w: 12, h: 1.5,
    fontSize: size, color, bold: true,
    fontFace: "Arial",
    valign: "top",
  });
}

function renderTitleSlide(slide: any) {
  addKicker(slide, `Обучающая платформа · B2B · ${COURSE.hours} академических часов`);
  
  slide.addText("ИИ в маркетинге:", {
    x: 0.5, y: 1.5, w: 6, h: 1,
    fontSize: 42, color: C.ink, bold: true,
    fontFace: "Arial",
  });
  
  slide.addText("от стратегии", {
    x: 0.5, y: 2.5, w: 3, h: 0.8,
    fontSize: 32, color: C.kice, bold: true,
    fontFace: "Arial",
  });
  
  slide.addText("до тактики", {
    x: 3.5, y: 2.5, w: 3, h: 0.8,
    fontSize: 32, color: C.kamber, bold: true,
    fontFace: "Arial",
  });

  slide.addText("Курс-презентация для маркетологов B2B, продуктовых менеджеров и стратегов. 16 уроков, каждый разбит на 5 слайдов-частей.", {
    x: 0.5, y: 3.5, w: 6, h: 1,
    fontSize: 12, color: C.steel,
    fontFace: "Arial",
  });

  // Карточка кейса
  slide.addShape("rect", {
    x: 0.5, y: 4.8, w: 6, h: 1.8,
    fill: { color: C.panel },
    line: { color: C.edge, width: 1 },
  });
  
  slide.addShape("rect", {
    x: 0.5, y: 4.8, w: 0.1, h: 1.8,
    fill: { color: C.kamber },
  });

  slide.addText("СКВОЗНОЙ КЕЙС // «РЕМДИЗЕЛЬ» × КАМАЗ", {
    x: 0.8, y: 5, w: 5.5, h: 0.3,
    fontSize: 8, color: C.steel, bold: true,
    fontFace: "Arial",
  });

  slide.addText("Продуктовая и маркетинговая стратегия пожарной техники на шасси КАМАЗ — 20% рынка РФ к 2032 году.", {
    x: 0.8, y: 5.4, w: 5.5, h: 1,
    fontSize: 11, color: C.fog,
    fontFace: "Arial",
  });

  // Чипы
  slide.addShape("rect", {
    x: 0.5, y: 6.8, w: 1.2, h: 0.4,
    fill: { color: C.kice + "20" },
    line: { color: C.kice, width: 1 },
  });
  slide.addText("16 УРОКОВ", {
    x: 0.5, y: 6.8, w: 1.2, h: 0.4,
    fontSize: 8, color: C.kice, align: "center", valign: "middle",
    fontFace: "Arial",
  });

  slide.addShape("rect", {
    x: 1.8, y: 6.8, w: 1.2, h: 0.4,
    fill: { color: C.kamber + "20" },
    line: { color: C.kamber, width: 1 },
  });
  slide.addText("4 БЛОКА", {
    x: 1.8, y: 6.8, w: 1.2, h: 0.4,
    fontSize: 8, color: C.kamber, align: "center", valign: "middle",
    fontFace: "Arial",
  });
}

function renderMethodSlide(slide: any) {
  addKicker(slide, "Навигация по презентации");
  addTitle(slide, "Каждый урок — 5 слайдов, которые дополняют основной", 1, 28);

  const steps = [
    { n: "01", t: "Постановка", d: "Задача урока и место шага в сквозном кейсе" },
    { n: "02", t: "Технология", d: "Какой ИИ-инструмент применяется" },
    { n: "03", t: "Промт", d: "Готовый промт с разбором структуры" },
    { n: "04", t: "Ход решения", d: "Лог агента и живые демонстрации" },
    { n: "05", t: "Результат", d: "Решение кейса в цифрах и артефакты" },
  ];

  steps.forEach((s, i) => {
    const x = 0.5 + i * 2.5;
    
    slide.addShape("rect", {
      x, y: 3, w: 2.3, h: 2.5,
      fill: { color: C.panel },
      line: { color: C.edge, width: 1 },
    });

    slide.addText(s.n, {
      x, y: 3.2, w: 2.3, h: 0.6,
      fontSize: 24, color: C.kamber, bold: true, align: "center",
      fontFace: "Arial",
    });

    slide.addText(s.t, {
      x, y: 3.9, w: 2.3, h: 0.4,
      fontSize: 12, color: C.ink, bold: true, align: "center",
      fontFace: "Arial",
    });

    slide.addText(s.d, {
      x: x + 0.1, y: 4.4, w: 2.1, h: 0.9,
      fontSize: 9, color: C.steel, align: "center",
      fontFace: "Arial",
    });
  });

  slide.addText("Справа на слайдах урока живёт доска кейса — каркас основного слайда. Каждая следующая часть заполняет один слот.", {
    x: 0.5, y: 5.8, w: 12, h: 0.8,
    fontSize: 11, color: C.fog,
    fontFace: "Arial",
  });
}

function renderAgendaSlide(slide: any) {
  addKicker(slide, "Программа · 16 академических часов");
  addTitle(slide, "Маршрут курса", 1, 28);

  BLOCKS.forEach((b, i) => {
    const y = 2.5 + i * 1.2;
    
    slide.addShape("rect", {
      x: 0.5, y, w: 12, h: 1,
      fill: { color: C.panel },
      line: { color: C.edge, width: 1 },
    });

    slide.addShape("rect", {
      x: 0.5, y, w: 0.1, h: 1,
      fill: { color: b.accent.replace("#", "") },
    });

    slide.addText(`0${b.id}`, {
      x: 0.8, y, w: 0.8, h: 1,
      fontSize: 20, color: b.accent.replace("#", ""), bold: true, valign: "middle",
      fontFace: "Arial",
    });

    slide.addText(b.title, {
      x: 1.7, y, w: 6, h: 0.5,
      fontSize: 14, color: C.ink, bold: true, valign: "middle",
      fontFace: "Arial",
    });

    slide.addText(b.task, {
      x: 1.7, y: y + 0.5, w: 6, h: 0.4,
      fontSize: 10, color: C.steel, valign: "middle",
      fontFace: "Arial",
    });

    slide.addText(`${b.hours} ак. ч · ${b.lessons.length > 0 ? `${b.lessons.length} уроков × 5 слайдов` : "экзамен + сертификат"}`, {
      x: 8, y, w: 4, h: 1,
      fontSize: 9, color: C.steel, align: "right", valign: "middle",
      fontFace: "Arial",
    });
  });
}

function renderCaseSlide(slide: any) {
  addKicker(slide, "Сквозной кейс // «Ремдизель» — дочерняя структура КАМАЗ");
  addTitle(slide, "Пожарная техника на шасси КАМАЗ: 20% рынка РФ к 2032 году", 1, 24);

  // Карточка цели
  slide.addShape("rect", {
    x: 0.5, y: 2.5, w: 12, h: 1.5,
    fill: { color: C.panel },
    line: { color: C.edge, width: 1 },
  });

  slide.addShape("rect", {
    x: 0.5, y: 2.5, w: 0.1, h: 1.5,
    fill: { color: C.kamber },
  });

  slide.addText("ЦЕЛЬ КЕЙСА", {
    x: 0.8, y: 2.7, w: 11, h: 0.3,
    fontSize: 8, color: C.kamber2, bold: true,
    fontFace: "Arial",
  });

  slide.addText("Разработать продуктовую и маркетинговую стратегию пожарной техники на шасси КАМАЗ (включая робототехнику) для захвата 20% рынка РФ к 2032 году.", {
    x: 0.8, y: 3.1, w: 11, h: 0.7,
    fontSize: 12, color: C.ink,
    fontFace: "Arial",
  });

  // Карточки информации
  const cells = [
    { k: "Компания", v: "«Ремдизель», дочерняя структура КАМАЗ" },
    { k: "Продукт", v: "АЦ + роботизированный лафетный ствол" },
    { k: "Сегменты", v: "МЧС РФ · ТЭК · аэропорты" },
    { k: "Цель 2032", v: "20% рынка" },
  ];

  cells.forEach((c, i) => {
    const x = 0.5 + (i % 2) * 6.2;
    const y = 4.5 + Math.floor(i / 2) * 1.5;

    slide.addShape("rect", {
      x, y, w: 6, h: 1.3,
      fill: { color: C.panel },
      line: { color: C.edge, width: 1 },
    });

    slide.addShape("rect", {
      x, y, w: 0.1, h: 1.3,
      fill: { color: i % 2 === 0 ? C.kice : C.kamber2 },
    });

    slide.addText(c.k.toUpperCase(), {
      x: x + 0.3, y: y + 0.15, w: 5.5, h: 0.3,
      fontSize: 8, color: C.steel,
      fontFace: "Arial",
    });

    slide.addText(c.v, {
      x: x + 0.3, y: y + 0.5, w: 5.5, h: 0.6,
      fontSize: 11, color: C.fog, bold: true,
      fontFace: "Arial",
    });
  });
}

function renderProductSlide(slide: any) {
  addKicker(slide, "Продукт сквозного кейса", C.kice);
  addTitle(slide, "«КАМАЗ-Щит» РТ-80", 1, 28);

  slide.addText("«Технологии, которые спасают. Интеллект, который защищает»", {
    x: 0.5, y: 2, w: 12, h: 0.5,
    fontSize: 12, color: C.steel, italic: true,
    fontFace: "Arial",
  });

  PRODUCT_SPECS.forEach((s, i) => {
    const x = 0.5 + (i % 3) * 4.2;
    const y = 2.8 + Math.floor(i / 3) * 1.8;

    slide.addShape("rect", {
      x, y, w: 4, h: 1.5,
      fill: { color: C.panel },
      line: { color: C.edge, width: 1 },
    });

    slide.addText(s.k.toUpperCase(), {
      x: x + 0.2, y: y + 0.2, w: 3.6, h: 0.3,
      fontSize: 8, color: C.steel,
      fontFace: "Arial",
    });

    slide.addText(s.v, {
      x: x + 0.2, y: y + 0.6, w: 3.6, h: 0.7,
      fontSize: 13, color: C.kice, bold: true,
      fontFace: "Arial",
    });
  });
}

function renderMathSlide(slide: any) {
  addKicker(slide, "Математика цели");
  addTitle(slide, "45 млрд → 77 млрд: цена 20% рынка", 1, 28);

  // График
  slide.addShape("rect", {
    x: 0.5, y: 2.5, w: 7, h: 4.5,
    fill: { color: C.panel },
    line: { color: C.edge, width: 1 },
  });

  slide.addText("РЫНОК ПОЖАРНОЙ ТЕХНИКИ РФ, МЛРД ₽", {
    x: 0.7, y: 2.7, w: 6.5, h: 0.3,
    fontSize: 8, color: C.steel,
    fontFace: "Arial",
  });

  // Столбцы графика
  const max = 80;
  MARKET_FORECAST.forEach((m, i) => {
    const h = (m.value / max) * 3;
    const x = 1 + i * 0.7;
    const y = 6.5 - h;
    const hot = i === 0 || i === MARKET_FORECAST.length - 1;

    slide.addShape("rect", {
      x, y, w: 0.5, h,
      fill: { color: hot ? C.kamber : C.kblue },
    });

    if (hot) {
      slide.addText(String(m.value), {
        x, y: y - 0.3, w: 0.5, h: 0.3,
        fontSize: 9, color: C.ink, bold: true, align: "center",
        fontFace: "Arial",
      });
    }

    slide.addText(String(m.year).slice(2), {
      x, y: 6.6, w: 0.5, h: 0.3,
      fontSize: 7, color: C.steel, align: "center",
      fontFace: "Arial",
    });
  });

  // Карточки с цифрами
  const facts = [
    { v: "45 млрд ₽", d: "объём рынка 2024", c: C.kice },
    { v: "7% CAGR", d: "ежегодный рост", c: C.kamber2 },
    { v: "450–500 ед./год", d: "план продаж для 20%", c: C.mint },
  ];

  facts.forEach((f, i) => {
    const y = 2.5 + i * 1.5;

    slide.addShape("rect", {
      x: 8, y, w: 4.5, h: 1.3,
      fill: { color: C.panel },
      line: { color: C.edge, width: 1 },
    });

    slide.addShape("rect", {
      x: 8, y, w: 0.1, h: 1.3,
      fill: { color: f.c },
    });

    slide.addText(f.v, {
      x: 8.3, y: y + 0.15, w: 4, h: 0.5,
      fontSize: 16, color: f.c, bold: true,
      fontFace: "Arial",
    });

    slide.addText(f.d, {
      x: 8.3, y: y + 0.7, w: 4, h: 0.4,
      fontSize: 10, color: C.steel,
      fontFace: "Arial",
    });
  });
}

function renderStackSlide(slide: any) {
  addKicker(slide, "Технологические требования курса", C.kice);
  addTitle(slide, "Стек платформы и AI-контура", 1, 28);

  const cols = [
    { title: "Платформа и фронтенд", items: ["React.js / Next.js", "TailwindCSS", "Framer Motion", "Docker + Kubernetes"] },
    { title: "AI-контур", items: ["LangChain / LlamaIndex", "OpenAI API", "YandexGPT / GigaChat", "Multi-Agent Simulation"] },
    { title: "Данные и интеграции", items: ["PostgreSQL", "Jira / Notion API", "zakupki.gov.ru", "Telegram"] },
  ];

  cols.forEach((c, i) => {
    const x = 0.5 + i * 4.2;

    slide.addShape("rect", {
      x, y: 2.5, w: 4, h: 4.5,
      fill: { color: C.panel },
      line: { color: C.edge, width: 1 },
    });

    slide.addText(c.title.toUpperCase(), {
      x: x + 0.2, y: 2.7, w: 3.6, h: 0.4,
      fontSize: 11, color: C.kice, bold: true,
      fontFace: "Arial",
    });

    c.items.forEach((item, j) => {
      slide.addText(`• ${item}`, {
        x: x + 0.2, y: 3.3 + j * 0.8, w: 3.6, h: 0.6,
        fontSize: 10, color: C.fog,
        fontFace: "Arial",
      });
    });
  });
}

function renderBlockSlide(slide: any, blockId: number) {
  const b = BLOCKS.find((x) => x.id === blockId)!;
  
  addKicker(slide, `${b.code} · ${b.hours} академических часа`, b.accent.replace("#", ""));
  
  slide.addText(b.title, {
    x: 0.5, y: 1.5, w: 12, h: 1.5,
    fontSize: 36, color: C.ink, bold: true,
    fontFace: "Arial",
  });

  slide.addText(`Задача: ${b.task.toLowerCase()}.`, {
    x: 0.5, y: 3, w: 12, h: 0.8,
    fontSize: 14, color: C.fog,
    fontFace: "Arial",
  });

  if (b.lessons.length > 0) {
    b.lessons.forEach((l, i) => {
      const y = 4 + i * 0.7;

      slide.addShape("rect", {
        x: 0.5, y, w: 12, h: 0.6,
        fill: { color: C.panel },
        line: { color: C.edge, width: 1 },
      });

      slide.addShape("rect", {
        x: 0.5, y, w: 0.1, h: 0.6,
        fill: { color: b.accent.replace("#", "") + "55" },
      });

      slide.addText(l.num, {
        x: 0.8, y, w: 0.8, h: 0.6,
        fontSize: 12, color: b.accent.replace("#", ""), bold: true, valign: "middle",
        fontFace: "Arial",
      });

      slide.addText(l.title, {
        x: 1.7, y, w: 8, h: 0.6,
        fontSize: 11, color: C.fog, valign: "middle",
        fontFace: "Arial",
      });

      slide.addText("5 СЛАЙДОВ", {
        x: 10, y, w: 2, h: 0.6,
        fontSize: 8, color: C.steel, align: "right", valign: "middle",
        fontFace: "Arial",
      });
    });
  } else {
    slide.addText("Финальное задание: слушатель пишет собственный промт для «виртуального тестирования» и получает оценку ИИ-экзаменатора по 5 критериям. Порог зачёта — 70 баллов; после зачёта генерируется именной PDF-сертификат.", {
      x: 0.5, y: 4, w: 12, h: 2,
      fontSize: 12, color: C.fog,
      fontFace: "Arial",
    });
  }
}

function renderBlockSummarySlide(slide: any, blockId: number) {
  const b = BLOCKS.find((x) => x.id === blockId)!;
  const kpis: Record<number, { kpi: [string, string][]; line: string }> = {
    1: { kpi: [["Рынок 2024", "45 млрд руб."], ["Сегментов ЦА", "3"], ["RICE топ-гипотезы", "850"], ["Патентные заявки", "2"]], line: "Рынок обоснован, сегменты выбраны, гипотеза защищена патентом." },
    2: { kpi: [["JTBD-инсайт", "обзор + термо-защита"], ["ТТХ ствола", "80 м · 360°"], ["User Stories", "24"], ["Уязвимость №1", "ЭМИ / перегрев"]], line: "Продукт спроектирован от болей ЦА: PRD, бэклог и стресс-тест." },
    3: { kpi: [["Бюджет 2025", "40 / 30 / 30"], ["Алерт по тендеру", "< 30 мин"], ["Постов в месяц", "12"], ["KPI года", "5% рынка"]], line: "Упаковка, каналы, автоворонка и сервис собраны в годовой план." },
  };
  const r = kpis[blockId];

  addKicker(slide, `${b.code} · контрольная точка`, b.accent.replace("#", ""));
  addTitle(slide, `Итоги: ${b.title.toLowerCase()}`, 1, 28);

  slide.addText(r.line, {
    x: 0.5, y: 2, w: 12, h: 0.8,
    fontSize: 12, color: C.fog,
    fontFace: "Arial",
  });

  r.kpi.forEach((kv, i) => {
    const x = 0.5 + i * 3.1;

    slide.addShape("rect", {
      x, y: 3, w: 3, h: 2,
      fill: { color: C.panel },
      line: { color: C.edge, width: 1 },
    });

    slide.addShape("rect", {
      x, y: 3, w: 3, h: 0.1,
      fill: { color: b.accent.replace("#", "") },
    });

    slide.addText(kv[0].toUpperCase(), {
      x: x + 0.2, y: 3.3, w: 2.6, h: 0.3,
      fontSize: 8, color: C.steel,
      fontFace: "Arial",
    });

    slide.addText(kv[1], {
      x: x + 0.2, y: 3.7, w: 2.6, h: 1,
      fontSize: 14, color: b.accent.replace("#", ""), bold: true,
      fontFace: "Arial",
    });
  });
}

function renderLessonSlide(slide: any, lessonId: string, part: number) {
  const lesson = ALL_LESSONS.find((l) => l.id === lessonId)!;
  const block = BLOCKS.find((b) => b.lessons.some((l) => l.id === lessonId))!;
  const accent = block.accent.replace("#", "");

  // Номер урока
  slide.addText(lesson.num, {
    x: 0.5, y: 0.5, w: 1.5, h: 1.5,
    fontSize: 36, color: accent, bold: true,
    fontFace: "Arial",
  });

  // Заголовок
  slide.addText(`${block.code} · ${block.title} · урок ${lesson.num}`, {
    x: 2.2, y: 0.5, w: 8, h: 0.3,
    fontSize: 8, color: C.steel,
    fontFace: "Arial",
  });

  slide.addText(lesson.title, {
    x: 2.2, y: 0.9, w: 8, h: 0.8,
    fontSize: 18, color: C.ink, bold: true,
    fontFace: "Arial",
  });

  // Степпер частей
  const parts = ["Постановка", "Технология", "Промт", "Ход", "Итог"];
  parts.forEach((p, i) => {
    const x = 10.5 + i * 0.6;
    
    slide.addShape("rect", {
      x, y: 0.5, w: 0.5, h: 0.3,
      fill: { color: i === part ? accent : i < part ? accent + "66" : C.edge },
      line: { color: i === part ? accent : C.edge, width: 1 },
    });

    slide.addText(i < part ? "✓" : String(i + 1), {
      x, y: 0.5, w: 0.5, h: 0.3,
      fontSize: 8, color: i === part ? C.white : i < part ? accent : C.steel,
      align: "center", valign: "middle", bold: true,
      fontFace: "Arial",
    });
  });

  // Контент части
  const contentY = 2;
  
  if (part === 0) {
    slide.addShape("rect", {
      x: 0.5, y: contentY, w: 12, h: 2,
      fill: { color: C.panel },
      line: { color: C.edge, width: 1 },
    });

    slide.addShape("rect", {
      x: 0.5, y: contentY, w: 0.1, h: 2,
      fill: { color: accent },
    });

    slide.addText("ЗАДАЧА УРОКА", {
      x: 0.8, y: contentY + 0.2, w: 11, h: 0.3,
      fontSize: 8, color: accent, bold: true,
      fontFace: "Arial",
    });

    slide.addText(lesson.goal, {
      x: 0.8, y: contentY + 0.6, w: 11, h: 1.2,
      fontSize: 13, color: C.ink, bold: true,
      fontFace: "Arial",
    });

    slide.addShape("rect", {
      x: 0.5, y: contentY + 2.2, w: 12, h: 2,
      fill: { color: C.panel },
      line: { color: C.edge, width: 1 },
    });

    slide.addText("ЧТО ПРОИСХОДИТ В КЕЙСЕ НА ЭТОМ ШАГЕ", {
      x: 0.8, y: contentY + 2.4, w: 11, h: 0.3,
      fontSize: 8, color: C.steel, bold: true,
      fontFace: "Arial",
    });

    slide.addText(lesson.context, {
      x: 0.8, y: contentY + 2.8, w: 11, h: 1.2,
      fontSize: 11, color: C.fog,
      fontFace: "Arial",
    });
  }

  if (part === 1) {
    slide.addShape("rect", {
      x: 0.5, y: contentY, w: 4, h: 0.4,
      fill: { color: accent },
    });

    slide.addText(lesson.tech.kind.toUpperCase(), {
      x: 0.7, y: contentY, w: 3.6, h: 0.4,
      fontSize: 9, color: C.white, bold: true, valign: "middle",
      fontFace: "Arial",
    });

    slide.addText(lesson.tech.name, {
      x: 4.7, y: contentY, w: 8, h: 0.4,
      fontSize: 13, color: C.ink, bold: true, valign: "middle",
      fontFace: "Arial",
    });

    slide.addText(lesson.tech.note, {
      x: 0.5, y: contentY + 0.6, w: 12, h: 1,
      fontSize: 11, color: C.fog,
      fontFace: "Arial",
    });

    slide.addShape("rect", {
      x: 0.5, y: contentY + 1.8, w: 12, h: 3,
      fill: { color: C.panel },
      line: { color: C.edge, width: 1 },
    });

    slide.addText("КАК ЭТО РАБОТАЕТ", {
      x: 0.8, y: contentY + 2, w: 11, h: 0.3,
      fontSize: 8, color: C.steel, bold: true,
      fontFace: "Arial",
    });

    lesson.how.forEach((h, i) => {
      slide.addShape("rect", {
        x: 0.8, y: contentY + 2.5 + i * 0.8, w: 0.4, h: 0.4,
        line: { color: accent, width: 1 },
      });

      slide.addText(String(i + 1), {
        x: 0.8, y: contentY + 2.5 + i * 0.8, w: 0.4, h: 0.4,
        fontSize: 9, color: accent, align: "center", valign: "middle", bold: true,
        fontFace: "Arial",
      });

      slide.addText(h, {
        x: 1.4, y: contentY + 2.5 + i * 0.8, w: 10.5, h: 0.6,
        fontSize: 10, color: C.fog, valign: "middle",
        fontFace: "Arial",
      });
    });
  }

  if (part === 2) {
    slide.addShape("rect", {
      x: 0.5, y: contentY, w: 12, h: 3,
      fill: { color: C.panel },
      line: { color: C.edge, width: 1 },
    });

    slide.addText(`ПРОМТ УРОКА ${lesson.num}`, {
      x: 0.8, y: contentY + 0.2, w: 11, h: 0.3,
      fontSize: 8, color: C.steel, bold: true,
      fontFace: "Arial",
    });

    slide.addText(lesson.prompt, {
      x: 0.8, y: contentY + 0.6, w: 11, h: 2.2,
      fontSize: 10, color: C.kamber2,
      fontFace: "Courier New",
    });

    slide.addShape("rect", {
      x: 0.5, y: contentY + 3.2, w: 12, h: 2.5,
      fill: { color: C.panel },
      line: { color: C.edge, width: 1 },
    });

    slide.addText("РАЗБОР СТРУКТУРЫ ПРОМТА", {
      x: 0.8, y: contentY + 3.4, w: 11, h: 0.3,
      fontSize: 8, color: C.steel, bold: true,
      fontFace: "Arial",
    });

    lesson.promptNotes.forEach((n, i) => {
      slide.addShape("rect", {
        x: 0.8, y: contentY + 3.9 + i * 0.7, w: 0.15, h: 0.15,
        fill: { color: accent },
      });

      slide.addText(n, {
        x: 1.1, y: contentY + 3.8 + i * 0.7, w: 10.5, h: 0.6,
        fontSize: 10, color: C.fog, valign: "middle",
        fontFace: "Arial",
      });
    });
  }

  if (part === 3) {
    slide.addShape("rect", {
      x: 0.5, y: contentY, w: 6, h: 5,
      fill: { color: C.panel },
      line: { color: C.edge, width: 1 },
    });

    slide.addText(`ЛОГ АГЕНТА · УРОК ${lesson.num}`, {
      x: 0.8, y: contentY + 0.2, w: 5.5, h: 0.3,
      fontSize: 8, color: C.steel, bold: true,
      fontFace: "Arial",
    });

    let logY = contentY + 0.6;
    lesson.process.forEach((s) => {
      if (s.t === "out") {
        slide.addShape("rect", {
          x: 0.8, y: logY, w: 5.4, h: 0.8,
          fill: { color: C.kamber + "20" },
          line: { color: C.kamber, width: 1 },
        });

        slide.addText(s.text, {
          x: 1, y: logY + 0.1, w: 5, h: 0.6,
          fontSize: 9, color: C.kamber2, bold: true,
          fontFace: "Courier New",
        });

        logY += 1;
      } else {
        const prefix = s.t === "ai" ? "AI > " : "... ";
        const color = s.t === "ai" ? C.kice : C.steel;

        slide.addText(prefix + s.text, {
          x: 0.8, y: logY, w: 5.4, h: 0.6,
          fontSize: 9, color, bold: s.t === "ai",
          fontFace: "Courier New",
        });

        logY += 0.7;
      }
    });

    // Демо-виджет справа
    if (lesson.demo) {
      slide.addShape("rect", {
        x: 6.7, y: contentY, w: 5.8, h: 5,
        fill: { color: C.panel },
        line: { color: C.edge, width: 1 },
      });

      if (lesson.demo === "market") {
        slide.addText("РЫНОК ПОЖАРНОЙ ТЕХНИКИ РФ, МЛРД ₽", {
          x: 7, y: contentY + 0.2, w: 5.2, h: 0.3,
          fontSize: 8, color: C.steel,
          fontFace: "Arial",
        });

        // Мини-график
        MARKET_FORECAST.forEach((m, i) => {
          const h = (m.value / 80) * 3;
          const x = 7.2 + i * 0.55;
          const y = contentY + 4 - h;
          const hot = i === 0 || i === MARKET_FORECAST.length - 1;

          slide.addShape("rect", {
            x, y, w: 0.4, h,
            fill: { color: hot ? C.kamber : C.kblue },
          });

          if (hot) {
            slide.addText(String(m.value), {
              x, y: y - 0.25, w: 0.4, h: 0.25,
              fontSize: 7, color: C.ink, bold: true, align: "center",
              fontFace: "Arial",
            });
          }
        });
      } else if (lesson.demo === "rice" && lesson.rice) {
        slide.addText("RICE-СКОРИНГ ГИПОТЕЗ", {
          x: 7, y: contentY + 0.2, w: 5.2, h: 0.3,
          fontSize: 8, color: C.steel,
          fontFace: "Arial",
        });

        lesson.rice.forEach((r, i) => {
          const y = contentY + 0.7 + i * 0.8;
          const w = (r.score / 850) * 4;

          slide.addText(r.name, {
            x: 7, y, w: 5.2, h: 0.3,
            fontSize: 9, color: i === 0 ? C.kamber2 : C.fog, bold: i === 0,
            fontFace: "Arial",
          });

          slide.addShape("rect", {
            x: 7, y: y + 0.35, w: 4.5, h: 0.2,
            fill: { color: C.edge },
          });

          slide.addShape("rect", {
            x: 7, y: y + 0.35, w: w, h: 0.2,
            fill: { color: i === 0 ? C.kamber : C.kblue },
          });

          slide.addText(String(r.score), {
            x: 11.7, y: y, w: 0.5, h: 0.3,
            fontSize: 9, color: i === 0 ? C.kamber : C.kice, bold: true, align: "right",
            fontFace: "Arial",
          });
        });
      } else if (lesson.demo === "budget" && lesson.channels) {
        slide.addText("РАСПРЕДЕЛЕНИЕ БЮДЖЕТА 2025", {
          x: 7, y: contentY + 0.2, w: 5.2, h: 0.3,
          fontSize: 8, color: C.steel,
          fontFace: "Arial",
        });

        const colors = [C.kamber, C.kblue, C.mint];
        lesson.channels.forEach((c, i) => {
          const y = contentY + 0.7 + i * 1.2;
          const w = (c.pct / 45) * 4;

          slide.addText(c.name, {
            x: 7, y, w: 5.2, h: 0.3,
            fontSize: 10, color: C.fog, bold: true,
            fontFace: "Arial",
          });

          slide.addShape("rect", {
            x: 7, y: y + 0.35, w: 4.5, h: 0.3,
            fill: { color: C.edge },
          });

          slide.addShape("rect", {
            x: 7, y: y + 0.35, w: w, h: 0.3,
            fill: { color: colors[i] },
          });

          slide.addText(`${c.pct}%`, {
            x: 11.7, y, w: 0.5, h: 0.3,
            fontSize: 11, color: colors[i], bold: true, align: "right",
            fontFace: "Arial",
          });
        });
      } else if (lesson.demo === "cjm") {
        slide.addText("КРИВАЯ ЭМОЦИЙ ЛПР ПО ЭТАПАМ ЗАКУПКИ", {
          x: 7, y: contentY + 0.2, w: 5.2, h: 0.3,
          fontSize: 8, color: C.steel,
          fontFace: "Arial",
        });

        // Линия графика
        CJM_STAGES.forEach((s, i) => {
          const x = 7.2 + i * 1.1;
          const y = contentY + 3 - ((s.emotion - 1) / 4) * 2;

          slide.addShape("ellipse", {
            x: x - 0.1, y: y - 0.1, w: 0.2, h: 0.2,
            fill: { color: i === 3 ? C.kamber : C.kblue },
          });

          slide.addText(s.short, {
            x, y: contentY + 3.2, w: 1, h: 0.3,
            fontSize: 7, color: i === 3 ? C.kamber2 : C.steel, align: "center",
            fontFace: "Arial",
          });
        });

        slide.addText("ГЛАВНЫЙ БАРЬЕР", {
          x: 7, y: contentY + 3.6, w: 5.2, h: 0.3,
          fontSize: 8, color: C.mint, bold: true,
          fontFace: "Arial",
        });

        slide.addText(CJM_STAGES[3].barrier, {
          x: 7, y: contentY + 3.9, w: 5.2, h: 0.8,
          fontSize: 9, color: C.fog,
          fontFace: "Arial",
        });
      }
    }
  }

  if (part === 4) {
    slide.addShape("rect", {
      x: 0.5, y: contentY, w: 12, h: 2.5,
      fill: { color: C.panel },
      line: { color: C.edge, width: 1 },
    });

    slide.addShape("rect", {
      x: 0.5, y: contentY, w: 0.1, h: 2.5,
      fill: { color: C.mint },
    });

    slide.addText("РЕШЕНИЕ КЕЙСА", {
      x: 0.8, y: contentY + 0.2, w: 11, h: 0.3,
      fontSize: 8, color: C.mint, bold: true,
      fontFace: "Arial",
    });

    slide.addText(lesson.solution, {
      x: 0.8, y: contentY + 0.6, w: 11, h: 1.7,
      fontSize: 12, color: C.ink,
      fontFace: "Arial",
    });

    // Метрики
    lesson.metrics.forEach((m, i) => {
      const x = 0.5 + i * 4.1;

      slide.addShape("rect", {
        x, y: contentY + 2.7, w: 4, h: 1.5,
        fill: { color: C.panel },
        line: { color: C.edge, width: 1 },
      });

      slide.addText(m.k.toUpperCase(), {
        x: x + 0.2, y: contentY + 2.9, w: 3.6, h: 0.3,
        fontSize: 8, color: C.steel,
        fontFace: "Arial",
      });

      slide.addText(m.v, {
        x: x + 0.2, y: contentY + 3.3, w: 3.6, h: 0.7,
        fontSize: 13, color: accent, bold: true,
        fontFace: "Arial",
      });
    });

    // Артефакты и выводы
    slide.addShape("rect", {
      x: 0.5, y: contentY + 4.4, w: 6, h: 1.5,
      fill: { color: C.panel },
      line: { color: C.edge, width: 1 },
    });

    slide.addText("АРТЕФАКТЫ УРОКА", {
      x: 0.8, y: contentY + 4.6, w: 5.5, h: 0.3,
      fontSize: 8, color: C.steel, bold: true,
      fontFace: "Arial",
    });

    lesson.artifacts.forEach((a, i) => {
      slide.addText(`↓ ${a}`, {
        x: 0.8, y: contentY + 5 + i * 0.3, w: 5.5, h: 0.3,
        fontSize: 9, color: C.fog,
        fontFace: "Arial",
      });
    });

    slide.addShape("rect", {
      x: 6.7, y: contentY + 4.4, w: 5.8, h: 1.5,
      fill: { color: C.panel },
      line: { color: C.edge, width: 1 },
    });

    slide.addText("ЗАБЕРИТЕ С СОБОЙ", {
      x: 7, y: contentY + 4.6, w: 5.2, h: 0.3,
      fontSize: 8, color: C.steel, bold: true,
      fontFace: "Arial",
    });

    lesson.takeaways.forEach((t, i) => {
      slide.addShape("rect", {
        x: 7 + i * 1.8, y: contentY + 5, w: 1.7, h: 0.4,
        fill: { color: accent + "20" },
        line: { color: accent, width: 1 },
      });

      slide.addText(t, {
        x: 7 + i * 1.8, y: contentY + 5, w: 1.7, h: 0.4,
        fontSize: 8, color: accent, align: "center", valign: "middle",
        fontFace: "Arial",
      });
    });
  }
}

function renderExamSlide(slide: any) {
  addKicker(slide, "Блок 04 · Защита проекта", C.kice);
  addTitle(slide, "Финальное задание у ИИ-экзаменатора", 1, 24);

  slide.addShape("rect", {
    x: 0.5, y: 2.5, w: 12, h: 2,
    fill: { color: C.panel },
    line: { color: C.edge, width: 1 },
  });

  slide.addShape("rect", {
    x: 0.5, y: 2.5, w: 0.1, h: 2,
    fill: { color: C.kamber },
  });

  slide.addText("ЗАДАНИЕ", {
    x: 0.8, y: 2.7, w: 11, h: 0.3,
    fontSize: 8, color: C.kamber2, bold: true,
    fontFace: "Arial",
  });

  slide.addText("Напишите собственный промт для «виртуального тестирования» роботизированного КАМАЗа (Multi-Agent Simulation, урок 2.5). Экзаменатор разберёт его по 5 критериям промт-инжиниринга. Порог зачёта — 70 баллов.", {
    x: 0.8, y: 3.1, w: 11, h: 1.2,
    fontSize: 11, color: C.fog,
    fontFace: "Arial",
  });

  const crit = [
    ["Роль и субъект", "агентам заданы роли и мотивации"],
    ["Контекст кейса", "продукт «Ремдизель», шасси КАМАЗ"],
    ["Задача и действия", "глаголы: «задайте вопросы», «найдите уязвимости»"],
    ["Критерии и ограничения", "числа: -40°C, зона 100 м, бюджет"],
    ["Формат результата", "структура вывода: таблица, ранжирование"],
  ];

  crit.forEach((c, i) => {
    const y = 4.8 + i * 0.5;

    slide.addShape("rect", {
      x: 0.5, y, w: 12, h: 0.45,
      fill: { color: i % 2 ? C.panel : C.white },
      line: { color: C.edge, width: 1 },
    });

    slide.addText(`${i + 1}. ${c[0].toUpperCase()}`, {
      x: 0.8, y, w: 4, h: 0.45,
      fontSize: 9, color: C.kice, bold: true, valign: "middle",
      fontFace: "Arial",
    });

    slide.addText(c[1], {
      x: 5, y, w: 6, h: 0.45,
      fontSize: 9, color: C.fog, valign: "middle",
      fontFace: "Arial",
    });

    slide.addText("20 Б.", {
      x: 11.2, y, w: 1, h: 0.45,
      fontSize: 9, color: C.kamber2, bold: true, align: "right", valign: "middle",
      fontFace: "Arial",
    });
  });
}

function renderCertSlide(slide: any) {
  addKicker(slide, "Блок 04 · Итог обучения", C.mint);
  addTitle(slide, "Именной PDF-сертификат", 1, 24);

  const steps = [
    ["01 · Зачёт", "Сдайте финальное задание у ИИ-экзаменатора на 70+ баллов"],
    ["02 · ФИО", "Укажите фамилию, имя и отчество на слайде сертификата"],
    ["03 · PDF", "Нажмите «Скачать PDF-сертификат»: генерируется именной документ"],
  ];

  steps.forEach((s, i) => {
    const y = 2.5 + i * 1.5;

    slide.addShape("rect", {
      x: 0.5, y, w: 12, h: 1.3,
      fill: { color: C.panel },
      line: { color: C.edge, width: 1 },
    });

    slide.addShape("rect", {
      x: 0.5, y, w: 0.1, h: 1.3,
      fill: { color: i === 2 ? C.mint : C.kice },
    });

    slide.addText(s[0], {
      x: 0.8, y: y + 0.2, w: 4, h: 0.4,
      fontSize: 11, color: C.ink, bold: true, valign: "middle",
      fontFace: "Arial",
    });

    slide.addText(s[1], {
      x: 5, y: y + 0.2, w: 7, h: 0.9,
      fontSize: 10, color: C.fog, valign: "middle",
      fontFace: "Arial",
    });
  });

  slide.addText("Сертификат подтверждает 16 академических часов курса «ИИ в маркетинге: от стратегии до тактики» и сдачу финального задания на материалах кейса «Ремдизель».", {
    x: 0.5, y: 6.5, w: 12, h: 0.8,
    fontSize: 10, color: C.fog,
    fontFace: "Arial",
  });
}

function renderPlanSlide(slide: any) {
  addKicker(slide, "Урок 3.6 · синтез всех наработок", C.mint);
  addTitle(slide, "Годовой план вывода на рынок — 2025", 1, 28);

  YEAR_PLAN.forEach((q, i) => {
    const x = 0.5 + i * 3.2;

    slide.addShape("rect", {
      x, y: 2.5, w: 3, h: 4.5,
      fill: { color: C.panel },
      line: { color: C.edge, width: 1 },
    });

    slide.addShape("rect", {
      x, y: 2.5, w: 3, h: 0.1,
      fill: { color: C.kamber },
    });

    slide.addText(q.q, {
      x: x + 0.2, y: 2.7, w: 2.6, h: 0.8,
      fontSize: 20, color: C.kamber2, bold: true,
      fontFace: "Arial",
    });

    slide.addText(q.text, {
      x: x + 0.2, y: 3.6, w: 2.6, h: 2,
      fontSize: 10, color: C.fog,
      fontFace: "Arial",
    });

    slide.addText("KPI", {
      x: x + 0.2, y: 5.8, w: 2.6, h: 0.3,
      fontSize: 8, color: C.steel, bold: true,
      fontFace: "Arial",
    });

    slide.addText(q.kpi, {
      x: x + 0.2, y: 6.1, w: 2.6, h: 0.6,
      fontSize: 9, color: C.kice, bold: true,
      fontFace: "Arial",
    });
  });

  slide.addShape("rect", {
    x: 0.5, y: 7.2, w: 12, h: 0.1,
    fill: { color: C.kamber },
  });

  slide.addText("«Технологии, которые спасают. Интеллект, который защищает». KPI 2025 года — 5% доли рынка: первый шаг к 20% к 2032-му.", {
    x: 0.5, y: 7.3, w: 12, h: 0.15,
    fontSize: 10, color: C.ink,
    fontFace: "Arial",
  });
}

function renderTakeawaysSlide(slide: any) {
  addKicker(slide, "Финишная прямая", C.kice);
  addTitle(slide, "Что вы уносите с курса", 1, 28);

  const cats = [
    { t: "Стратегия", c: C.kice, items: ["Рыночная модель до 2032", "3 сегмента с паспортами ЛПР", "RICE-приоритизация гипотез"] },
    { t: "Продукт", c: C.kamber, items: ["JTBD-гайд и инсайты", "CJM с планом против барьеров", "PRD: 80 м · 360° · < 2 мин"] },
    { t: "Тактика", c: C.mint, items: ["Рендеры и лендинг", "Медиаплан 40 / 30 / 30", "Автоворонка тендеров"] },
    { t: "Навыки ИИ", c: C.kice, items: ["Chain of Thought", "RAG по патентам", "Multi-Agent Simulation"] },
  ];

  cats.forEach((cat, i) => {
    const x = 0.5 + i * 3.2;

    slide.addShape("rect", {
      x, y: 2.5, w: 3, h: 4.5,
      fill: { color: C.panel },
      line: { color: C.edge, width: 1 },
    });

    slide.addText(cat.t.toUpperCase(), {
      x: x + 0.2, y: 2.7, w: 2.6, h: 0.4,
      fontSize: 11, color: cat.c, bold: true,
      fontFace: "Arial",
    });

    cat.items.forEach((item, j) => {
      slide.addText(`✓ ${item}`, {
        x: x + 0.2, y: 3.3 + j * 1, w: 2.6, h: 0.8,
        fontSize: 10, color: C.fog,
        fontFace: "Arial",
      });
    });
  });
}

function renderFinalSlide(slide: any) {
  addKicker(slide, "Финал · Защита проекта");

  slide.addText("Технологии, которые спасают.", {
    x: 0.5, y: 2, w: 12, h: 1,
    fontSize: 36, color: C.ink, bold: true, align: "center",
    fontFace: "Arial",
  });

  slide.addText("Интеллект, который защищает.", {
    x: 0.5, y: 3, w: 12, h: 1,
    fontSize: 36, color: C.kamber, bold: true, align: "center",
    fontFace: "Arial",
  });

  slide.addText("Кейс «Ремдизель» собран: рынок 45 млрд ₽, продукт «КАМАЗ-Щит» РТ-80, годовой план и траектория к 20% рынка к 2032 году.", {
    x: 2, y: 4.5, w: 9, h: 1,
    fontSize: 12, color: C.steel, align: "center",
    fontFace: "Arial",
  });

  slide.addText("РЕМДИЗЕЛЬ AI-АКАДЕМИЯ · ДОЧЕРНЯЯ СТРУКТУРА КАМАЗ · 2025", {
    x: 0.5, y: 6.5, w: 12, h: 0.3,
    fontSize: 8, color: C.steel, align: "center",
    fontFace: "Arial",
  });
}
