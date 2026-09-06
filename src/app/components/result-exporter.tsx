"use client";

import { useEffect, useState } from "react";
import { Download, FileImage, FileText, X } from "lucide-react";

const EXPORT_BUTTON_TEXT = "Download / Print";
type ExportFormat = "pdf" | "jpg" | "png";

type Html2Canvas = (element: HTMLElement, options?: Record<string, unknown>) => Promise<HTMLCanvasElement>;

type ExportWindow = Window & {
  html2canvas?: Html2Canvas;
  jspdf?: { jsPDF: new (options: Record<string, unknown>) => any };
};

function dataUrlFromCanvas(canvas: HTMLCanvasElement, type: "image/png" | "image/jpeg") {
  return canvas.toDataURL(type, type === "image/jpeg" ? 0.95 : undefined);
}

function triggerDownload(dataUrl: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function readScript(url: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src=\"${url}\"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") resolve();
      else {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Unable to load export library.")), { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    }, { once: true });
    script.addEventListener("error", () => reject(new Error("Unable to load export library.")), { once: true });
    document.head.appendChild(script);
  });
}

async function loadHtml2Canvas() {
  await readScript("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js");
  const value = (window as ExportWindow).html2canvas;
  if (!value) throw new Error("Export renderer is unavailable.");
  return value;
}

async function loadJsPdf() {
  await readScript("https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js");
  const value = (window as ExportWindow).jspdf;
  if (!value?.jsPDF) throw new Error("PDF exporter is unavailable.");
  return value.jsPDF;
}

function getPdfSizeMm(source: HTMLElement, canvas: HTMLCanvasElement) {
  const computed = window.getComputedStyle(source);
  const cssPxToMm = (value: string) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed * 25.4 / 96 : 0;
  };

  const widthMm = computed.width.endsWith("px") ? cssPxToMm(computed.width) : Number.parseFloat(computed.width);
  const heightMm = computed.height.endsWith("px") ? cssPxToMm(computed.height) : Number.parseFloat(computed.height);

  if (widthMm > 0 && heightMm > 0) return { widthMm, heightMm };

  const ratio = canvas.width / canvas.height;
  return ratio >= 1 ? { widthMm: 297, heightMm: 210 } : { widthMm: 210, heightMm: 297 };
}

function copyComputedStyles(source: Element, target: Element) {
  if (!(source instanceof HTMLElement) || !(target instanceof HTMLElement)) return;

  const computed = window.getComputedStyle(source);
  for (let index = 0; index < computed.length; index += 1) {
    const property = computed.item(index);
    const value = computed.getPropertyValue(property);
    if (!value) continue;

    try {
      target.style.setProperty(property, value, computed.getPropertyPriority(property));
    } catch {
      // Ignore browser-specific properties that cannot be assigned inline.
    }
  }

  const sourceChildren = Array.from(source.children);
  const targetChildren = Array.from(target.children);
  sourceChildren.forEach((child, index) => {
    const targetChild = targetChildren[index];
    if (targetChild) copyComputedStyles(child, targetChild);
  });
}

function prepareIsolatedExport(source: HTMLElement) {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.position = "fixed";
  host.style.left = "-100000px";
  host.style.top = "0";
  host.style.zIndex = "-1";
  host.style.pointerEvents = "none";
  host.style.background = "#ffffff";
  host.style.margin = "0";
  host.style.padding = "0";

  const clone = source.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(".no-print").forEach((node) => node.remove());

  host.appendChild(clone);
  document.body.appendChild(host);

  copyComputedStyles(source, clone);
  clone.style.boxShadow = "none";
  clone.style.position = "relative";
  clone.style.left = "0";
  clone.style.top = "0";
  clone.style.margin = "0";

  return { host, clone };
}

export default function ResultExporter() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<ExportFormat | "">("");
  const [error, setError] = useState("");

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest<HTMLButtonElement>("button");
      if (!button || button.textContent?.trim() !== EXPORT_BUTTON_TEXT) return;

      event.preventDefault();
      event.stopPropagation();
      setError("");
      setOpen(true);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  const exportResult = async (format: ExportFormat) => {
    setBusy(format);
    setError("");

    let isolated: { host: HTMLElement; clone: HTMLElement } | null = null;

    try {
      const source = document.querySelector<HTMLElement>(".gradly-paper");
      if (!source) throw new Error("Result card could not be found.");

      isolated = prepareIsolatedExport(source);
      const html2canvas = await loadHtml2Canvas();

      const canvas = await html2canvas(isolated.clone, {
        backgroundColor: "#ffffff",
        scale: Math.min(3, Math.max(2, window.devicePixelRatio || 1)),
        useCORS: true,
        allowTaint: false,
        imageTimeout: 15000,
        logging: false,
        removeContainer: true,
      });

      const filenameBase = `gradly-result-${new Date().toISOString().slice(0, 10)}`;

      if (format === "png") {
        triggerDownload(dataUrlFromCanvas(canvas, "image/png"), `${filenameBase}.png`);
        setOpen(false);
        return;
      }

      if (format === "jpg") {
        triggerDownload(dataUrlFromCanvas(canvas, "image/jpeg"), `${filenameBase}.jpg`);
        setOpen(false);
        return;
      }

      const JsPDF = await loadJsPdf();
      const { widthMm, heightMm } = getPdfSizeMm(source, canvas);
      const pdf = new JsPDF({
        orientation: widthMm > heightMm ? "landscape" : "portrait",
        unit: "mm",
        format: [widthMm, heightMm],
        compress: true,
      });
      const imageData = dataUrlFromCanvas(canvas, "image/jpeg");
      pdf.addImage(imageData, "JPEG", 0, 0, widthMm, heightMm, undefined, "FAST");
      pdf.save(`${filenameBase}.pdf`);
      setOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not export the result.");
    } finally {
      isolated?.host.remove();
      setBusy("");
    }
  };

  return (
    <>
      {open && (
        <div
          className="no-print fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) setOpen(false);
          }}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="export-result-title" className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Export result</p>
                <h2 id="export-result-title" className="mt-1 text-lg font-black text-slate-900">Choose a file format</h2>
              </div>
              <button type="button" aria-label="Close export options" onClick={() => !busy && setOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50">
                <X size={17} />
              </button>
            </div>

            <div className="grid gap-2 p-5">
              <button type="button" disabled={!!busy} onClick={() => exportResult("pdf")} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-[#17365D] hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-600"><FileText size={19} /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold text-slate-900">PDF</span><span className="text-[11px] text-slate-500">Best for printing and sharing.</span></span>
                <Download size={16} className="text-slate-400" />
              </button>

              <button type="button" disabled={!!busy} onClick={() => exportResult("jpg")} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-[#17365D] hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600"><FileImage size={19} /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold text-slate-900">JPG</span><span className="text-[11px] text-slate-500">Smaller image file for quick sharing.</span></span>
                <Download size={16} className="text-slate-400" />
              </button>

              <button type="button" disabled={!!busy} onClick={() => exportResult("png")} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-[#17365D] hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-600"><FileImage size={19} /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold text-slate-900">PNG</span><span className="text-[11px] text-slate-500">Higher-quality image with sharp text.</span></span>
                <Download size={16} className="text-slate-400" />
              </button>

              {busy && <p className="pt-2 text-center text-[10px] font-semibold text-slate-500">Generating {busy.toUpperCase()}…</p>}
              {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[10px] font-semibold leading-4 text-red-700">{error}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
