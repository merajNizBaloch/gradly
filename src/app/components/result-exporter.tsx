"use client";

import { useEffect, useState } from "react";
import { Download, FileImage, FileText, X } from "lucide-react";

const EXPORT_BUTTON_TEXT = "Download / Print";
type ExportFormat = "pdf" | "jpg" | "png";

type ExportSize = { width: number; height: number };
type JsPdfConstructor = new (options: Record<string, unknown>) => any;

function triggerDownload(dataUrl: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function dataUrlFromCanvas(canvas: HTMLCanvasElement, type: "image/png" | "image/jpeg") {
  return canvas.toDataURL(type, type === "image/jpeg" ? 0.95 : undefined);
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

async function loadJsPdf() {
  await readScript("https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js");
  const value = (window as Window & { jspdf?: { jsPDF: JsPdfConstructor } }).jspdf;
  if (!value?.jsPDF) throw new Error("PDF exporter is unavailable.");
  return value.jsPDF;
}

function getExportSize(source: HTMLElement): ExportSize {
  const rect = source.getBoundingClientRect();
  return {
    width: Math.max(1, Math.round(rect.width)),
    height: Math.max(1, Math.round(rect.height)),
  };
}

function copyComputedStyles(source: Element, target: Element) {
  if (!(source instanceof HTMLElement) || !(target instanceof HTMLElement)) return;

  const computed = window.getComputedStyle(source);
  for (let index = 0; index < computed.length; index += 1) {
    const property = computed.item(index);
    if (property.startsWith("--")) continue;

    const value = computed.getPropertyValue(property);
    if (!value || /\b(?:lab|oklab|lch|oklch)\(/i.test(value)) continue;

    try {
      target.style.setProperty(property, value);
    } catch {
      // Ignore declarations the browser does not allow inline.
    }
  }

  target.removeAttribute("class");

  const sourceChildren = Array.from(source.children);
  const targetChildren = Array.from(target.children);
  sourceChildren.forEach((child, index) => {
    const targetChild = targetChildren[index];
    if (targetChild) copyComputedStyles(child, targetChild);
  });
}

function absoluteUrl(value: string) {
  try {
    return new URL(value, window.location.href).toString();
  } catch {
    return value;
  }
}

async function imageUrlToDataUrl(url: string): Promise<string> {
  if (!url || url.startsWith("data:") || url.startsWith("blob:")) return url;

  const resolved = absoluteUrl(url);
  const response = await fetch(resolved, { credentials: "same-origin", cache: "force-cache" });
  if (!response.ok) throw new Error(`Unable to load image (${response.status}).`);

  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to prepare result image for export."));
    reader.readAsDataURL(blob);
  });
}

function extractBackgroundUrls(value: string) {
  const urls: string[] = [];
  const regex = /url\((['\"]?)(.*?)\1\)/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(value))) urls.push(match[2]);
  return urls;
}

async function inlineImages(root: HTMLElement) {
  const imageElements = Array.from(root.querySelectorAll<HTMLImageElement>("img"));

  await Promise.all(imageElements.map(async (image) => {
    const source = image.getAttribute("src") || "";
    if (!source) return;

    try {
      const dataUrl = await imageUrlToDataUrl(source);
      image.setAttribute("src", dataUrl);
      image.removeAttribute("srcset");
      image.setAttribute("crossorigin", "anonymous");
    } catch {
      throw new Error("A result image could not be prepared for export. Please replace the saved image and try again.");
    }
  }));

  const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];
  for (const element of elements) {
    const background = element.style.backgroundImage;
    if (!background || !/url\(/i.test(background)) continue;

    const urls = extractBackgroundUrls(background);
    let rewritten = background;

    for (const sourceUrl of urls) {
      try {
        const dataUrl = await imageUrlToDataUrl(sourceUrl);
        rewritten = rewritten.replace(sourceUrl, dataUrl);
      } catch {
        throw new Error("A result image could not be prepared for export. Please replace the saved image and try again.");
      }
    }

    element.style.backgroundImage = rewritten;
  }
}

async function buildIsolatedClone(source: HTMLElement) {
  const size = getExportSize(source);
  const clone = source.cloneNode(true) as HTMLElement;

  clone.querySelectorAll(".no-print").forEach((node) => node.remove());
  copyComputedStyles(source, clone);

  clone.style.width = `${size.width}px`;
  clone.style.height = `${size.height}px`;
  clone.style.maxWidth = "none";
  clone.style.maxHeight = "none";
  clone.style.margin = "0";
  clone.style.boxShadow = "none";
  clone.style.position = "relative";
  clone.style.left = "0";
  clone.style.top = "0";

  // Remove all classes so Tailwind stylesheets cannot introduce unsupported
  // lab()/oklab() declarations during serialization.
  clone.removeAttribute("class");
  await inlineImages(clone);

  return { clone, size };
}

async function renderToCanvas(source: HTMLElement): Promise<{ canvas: HTMLCanvasElement; size: ExportSize }> {
  const { clone, size } = await buildIsolatedClone(source);
  const serialized = new XMLSerializer().serializeToString(clone);
  const svg = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}">`,
    `<rect width="100%" height="100%" fill="#ffffff"/>`,
    `<foreignObject x="0" y="0" width="${size.width}" height="${size.height}">`,
    `<div xmlns="http://www.w3.org/1999/xhtml" style="width:${size.width}px;height:${size.height}px;overflow:hidden;background:#ffffff;">${serialized}</div>`,
    `</foreignObject>`,
    `</svg>`,
  ].join("");

  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = new Image();
    image.decoding = "async";
    image.crossOrigin = "anonymous";

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Unable to render the result card for export."));
      image.src = objectUrl;
    });

    const scale = Math.min(3, Math.max(2, window.devicePixelRatio || 1));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(size.width * scale));
    canvas.height = Math.max(1, Math.round(size.height * scale));

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Export canvas is unavailable.");

    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size.width, size.height);
    context.drawImage(image, 0, 0, size.width, size.height);

    return { canvas, size };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function pdfSizeFromPixels(size: ExportSize) {
  const ratio = size.width / size.height;
  return ratio >= 1
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

      const { canvas, size } = await renderToCanvas(source);
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
      const { widthMm, heightMm } = pdfSizeFromPixels(size);
      const pdf = new JsPDF({
        orientation: widthMm > heightMm ? "landscape" : "portrait",
        unit: "mm",
        format: [widthMm, heightMm],
        compress: true,
      });
      pdf.addImage(dataUrlFromCanvas(canvas, "image/jpeg"), "JPEG", 0, 0, widthMm, heightMm, undefined, "FAST");
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
