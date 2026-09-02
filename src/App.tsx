import { useEffect, useMemo, useState } from "react";
import DeckShell, { buildSlides } from "./deck/DeckShell";
import PrintDeck from "./deck/PrintDeck";

type PrintKind = "slides" | "cert" | null;

export default function App() {
  const slides = useMemo(buildSlides, []);
  const [printKind, setPrintKind] = useState<PrintKind>(null);
  const [certName, setCertName] = useState("");

  /* чтение лучшего результата экзамена для печатной версии сертификата */
  const certScore = useMemo(() => {
    try {
      const raw = localStorage.getItem("rdai-exam-v1");
      if (!raw) return 0;
      const p = JSON.parse(raw);
      return typeof p?.score === "number" ? p.score : 0;
    } catch {
      return 0;
    }
  }, [printKind]);

  useEffect(() => {
    if (!printKind) return;
    const t = window.setTimeout(() => window.print(), 400);
    const after = () => setPrintKind(null);
    window.addEventListener("afterprint", after);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("afterprint", after);
    };
  }, [printKind]);

  return (
    <>
      <div id="app-shell">
        <DeckShell onExport={() => setPrintKind("slides")} />
      </div>
      <PrintDeck
        slides={slides}
        kind={printKind}
        certName={certName}
        certScore={certScore}
      />
      {/* перехват запроса печати сертификата из панели */}
      <CertNameBridge
        onName={(n) => {
          setCertName(n);
          setPrintKind("cert");
        }}
      />
    </>
  );
}

/** слушает запрос печати сертификата из CertPanel */
function CertNameBridge({ onName }: { onName: (n: string) => void }) {
  useEffect(() => {
    const h = (e: Event) => {
      const name = (e as CustomEvent<string>).detail;
      if (typeof name === "string" && name.trim().length >= 2) onName(name.trim());
    };
    window.addEventListener("rdai:print-cert", h);
    return () => window.removeEventListener("rdai:print-cert", h);
  }, [onName]);
  return null;
}
