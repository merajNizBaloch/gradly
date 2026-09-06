"use client";

import { useEffect, useState } from "react";
import { Download, FileImage, FileText, X } from "lucide-react";

const EXPORT_BUTTON_TEXT = "Download / Print";
type ExportFormat = "pdf" | "jpg" | "png";

type CanvasRenderer = (
  element: HTMLElement,
  options?: Record<string, unknown>,
) => Promise<HTMLCanvasElement>;

type JsPdfConstructor = new (options: Record<string, unknown>) => {
  addImage: (...args: unknown[]) => void;
  save: (filename: string) => void;
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
      else existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Unable to load export library.")), { once: true });
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

function convertUnsupportedColor(value: string): string {
  if (!/\b(?:lab|lch|oklab|oklch)\(/i.test(value)) return value;

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d");
    if (!context) return "rgb(128, 128, 128)";

    context.fillStyle = "#808080";
    context.fillStyle = value;
    const converted = context.fillStyle;
    return /\b(?:lab|lch|oklab|oklch)\(/i.test(converted)
      ? "rgb(128, 128, 128)"
      : converted;
  } catch {
    return "rgb(128, 128, 128)";
  }
}

const COLOR_PROPERTIES = [
  "color",
  "backgroundColor",
  "borderTopColor",
  "borderRightColor",
  "borderBottomColor",
  "borderLeftColor",
  "outlineColor",
  "textDecorationColor",
  "columnRuleColor",
  "fill",
  "stroke",
  "boxShadow",
] as const;

function sanitizeUnsupportedColors(documentRoot: Document, source: HTMLElement) {
  const nodes = [source, ...Array.from(source.querySelectorAll<HTMLElement>("*"))];

  for (const node of nodes) {
    const computed = documentRoot.defaultView?.getComputedStyle(node);
    if (!computed) continue;

    for (const property of COLOR_PROPERTIES) {
      const value = computed[property as keyof CSSStyleDeclaration];
      if (typeof value !== "string" || !/\b(?:lab|lch|oklab|oklch)\(/i.test(value)) continue;

      const cssProperty = property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
      node.style.setProperty(cssProperty, convertUnsupportedColor(value), "important");
    }
  }

  const style = documentRoot.createElement("style");
  style.textContent = `
    [style*="lab("], [style*="lch("], [style*="oklab("], [style*="oklch("] {
      color: rgb(128, 128, 128) !important;
      background-color: transparent !important;
      border-color: rgb(128, 128, 128) !important;
      box-shadow: none !important;
    }
  `;
  documentRoot.head.appendChild(style);
}

async function loadHtml2Canvas() {
  await readScript("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js");
  const value = (window as Window & { html2canvas?: CanvasRenderer }).html2canvas;
  if (!value) throw new Error("Export renderer is unavailable.");
  return value;
}

async function loadJsPdf() {
  await readScript("https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js");
  const value = (window as Window & { jspdf?: { jsPDF: JsPdfConstructor } }).jspdf;
  if (!value?.jsPDF) throw new Error("PDF exporter is unavailable.");
  return value.jsPDF;
}

function getPdfSizeMm(source: HTMLElement, canvas: HTMLCanvasElement) {
  const computed = window.getComputedStyle(source);
  const toMm = (value: string) => {
    const px = Number.parseFloat(value);
    return Number.isFinite(px) ? (px * 25.4) / 96 : 0;
  };
  const widthMm = computed.width.endsWith("px") ? toMm(computed.width) : Number.parseFloat(computed.width);
  const heightMm = computed.height.endsWith("px") ? toMm(computed.height) : Number.parseFloat(computed.height);
  if (widthMm > 0 && heightMm > 0) return { widthMm, heightMm };
  return canvas.width / canvas.height >= 1
    ? { widthMm: 297, heightMm: 210 }
    : { widthMm: 210, heightMm: 297 };
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

    try {
      const source = document.querySelector<HTMLElement>(".gradly-paper");
      if (!source) throw new Error("Result card could not be found.");

      const html2canvas = await loadHtml2Canvas();
      const canvas = await html2canvas(source, {
        backgroundColor: "#ffffff",
        scale: Math.min(3, Math.max(2, window.devicePixelRatio || 1)),
        useCORS: true,
        allowTaint: false,
        imageTimeout: 15000,
        logging: false,
        onclone: (clonedDocument: Document) => {
          const clonedSource = clonedDocument.querySelector<HTMLElement>(".gradly-paper");
          if (clonedSource) sanitizeUnsupportedColors(clonedDocument, clonedSource);
        },
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
