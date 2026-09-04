import type { ReactElement } from "react";

export const PDF_W = 1400;
export const PDF_H = 990;

const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));
const nextFrame = () =>
  new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

async function waitImages(root: HTMLElement, timeout = 2500): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  if (imgs.length === 0) return;
  await Promise.race([
    Promise.all(
      imgs.map(
        (img) =>
          new Promise<void>((res) => {
            if (img.complete) return res();
            img.addEventListener("load", () => res(), { once: true });
            img.addEventListener("error", () => res(), { once: true });
          })
      )
    ),
    sleep(timeout),
  ]);
}

/**
 * Рендерит элементы по очереди во внеэкранный контейнер 1400×990 (пропорции A4 landscape),
 * снимает каждый через html2canvas-pro и собирает настоящий PDF-файл (jsPDF).
 * Файл скачивается напрямую — без системного диалога печати.
 */
export async function exportElementsToPdf(
  elements: ReactElement[],
  fileName: string,
  onProgress?: (done: number, total: number) => void,
  isCancelled?: () => boolean
): Promise<boolean> {
  const [{ jsPDF }, html2canvasPro, ReactDOMClient] = await Promise.all([
    import("jspdf"),
    import("html2canvas-pro"),
    import("react-dom/client"),
  ]);
  const html2canvas = html2canvasPro.default;

  const holder = document.createElement("div");
  holder.setAttribute("aria-hidden", "true");
  holder.style.cssText = [
    "position:fixed",
    "left:-100000px",
    "top:0",
    `width:${PDF_W}px`,
    `height:${PDF_H}px`,
    "overflow:hidden",
    "background:#0a0f16",
    "z-index:-1",
    "pointer-events:none",
  ].join(";");
  document.body.appendChild(holder);
  document.body.classList.add("exporting");

  const root = ReactDOMClient.createRoot(holder);
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });

  try {
    for (let i = 0; i < elements.length; i++) {
      if (isCancelled?.()) return false;
      root.render(elements[i]);
      await nextFrame();
      await sleep(140);
      await waitImages(holder);
      const canvas = await html2canvas(holder, {
        width: PDF_W,
        height: PDF_H,
        scale: 1.4,
        useCORS: true,
        backgroundColor: "#0a0f16",
        logging: false,
      });
      if (i > 0) pdf.addPage("a4", "landscape");
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.85), "JPEG", 0, 0, 297, 210, undefined, "FAST");
      onProgress?.(i + 1, elements.length);
      await sleep(12);
    }
    if (isCancelled?.()) return false;
    pdf.save(fileName);
    return true;
  } finally {
    root.unmount();
    holder.remove();
    document.body.classList.remove("exporting");
  }
}
