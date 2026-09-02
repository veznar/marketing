import SlideContent, { type Slide } from "./slides";

/**
 * Печать всей презентации (или одного сертификата) в PDF
 * через системный диалог браузера: каждый слайд — страница A4 landscape.
 */
export default function PrintDeck({
  slides,
  kind,
  certName,
  certScore,
}: {
  slides: Slide[];
  kind: "slides" | "cert" | null;
  certName?: string;
  certScore?: number;
}) {
  if (kind === null) return null;

  if (kind === "cert") {
    return (
      <div className="print-root">
        <div className="pslide">
          <div className="h-full w-full p-4">
            <SlideContent
              slide={{ kind: "cert" }}
              print
              certName={certName}
            />
            <span className="sr-only">Экзамен: {certScore}/100</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="print-root">
      {slides.map((s, i) => (
        <div className="pslide" key={i}>
          {/* масштабирование живого слайда под лист A4 landscape */}
          <div
            style={{
              width: "125%",
              height: "125%",
              transform: "scale(0.8)",
              transformOrigin: "top left",
              position: "absolute",
              inset: 0,
            }}
          >
            <SlideContent slide={s} print certName={certName} />
          </div>
          <div
            style={{
              position: "absolute",
              bottom: "4mm",
              left: "8mm",
              right: "8mm",
              display: "flex",
              justifyContent: "space-between",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "7pt",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#8ca0b3",
            }}
          >
            <span>ИИ в маркетинге: от стратегии до тактики · Ремдизель AI-Академия</span>
            <span>{i + 1} / {slides.length}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
