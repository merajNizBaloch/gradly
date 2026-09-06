"use client";

import html2canvas from "html2canvas-pro";
import { Download, FileImage, FileText } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";

type Format = "png" | "jpg" | "pdf";
type Position = { top: number; right: number };

function sanitizeFileName(value: string) {
  return value.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "result";
}

function getFileName() {
  const card = document.querySelector<HTMLElement>(".gradly-paper");
  const text = card?.textContent?.replace(/\s+/g, " ").trim() || "";
  const match = text.match(/Student\s+([^·|]+?)(?:\s+Father|\s+Roll\s+Number|\s+Class\s*&\s*Section)/i);
  return `gradly-${sanitizeFileName(match?.[1]?.trim() || "student-result")}`;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function canvasToBlob(canvas: HTMLCanvasElement, type: "image/png" | "image/jpeg", quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) return resolve(blob);
        reject(new Error(type === "image/jpeg" ? "Could not create JPG image." : "Could not create PNG image."));
      }, type, quality);
    } catch (error) {
      if (error instanceof DOMException && error.name === "SecurityError") {
        reject(new Error("The browser blocked an image during export."));
        return;
      }
      reject(error);
    }
  });
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error("Could not read image."));
    reader.readAsDataURL(blob);
  });
}

async function fetchImageBlob(src: string) {
  const url = new URL(src, window.location.href);
  const sameOrigin = url.origin === window.location.origin;
  const response = sameOrigin
    ? await fetch(url.toString(), { cache: "no-store", credentials: "same-origin" })
    : await fetch(`/api/image-proxy?url=${encodeURIComponent(url.toString())}`, { cache: "no-store", credentials: "same-origin" });

  if (!response.ok) throw new Error(`Image request failed with ${response.status}`);
  const type = response.headers.get("content-type") || "";
  if (!type.toLowerCase().startsWith("image/")) throw new Error("The fetched resource is not an image");
  return response.blob();
}

async function inlineImages(clone: HTMLElement) {
  const images = Array.from(clone.querySelectorAll<HTMLImageElement>("img"));
  await Promise.all(
    images.map(async (image) => {
      const src = (image.getAttribute("src") || "").trim();
      image.removeAttribute("srcset");
      image.removeAttribute("sizes");
      if (!src || /^(?:data|blob):/i.test(src)) return;
      try {
        image.src = await blobToDataUrl(await fetchImageBlob(src));
      } catch {
        image.removeAttribute("src");
      }
    }),
  );

  const svgImages = Array.from(clone.querySelectorAll<SVGImageElement>("svg image"));
  await Promise.all(
    svgImages.map(async (image) => {
      const href = (image.getAttribute("href") || image.getAttributeNS("http://www.w3.org/1999/xlink", "href") || "").trim();
      if (!href || /^(?:data|blob):/i.test(href)) return;
      try {
        image.setAttribute("href", await blobToDataUrl(await fetchImageBlob(href)));
        image.removeAttributeNS("http://www.w3.org/1999/xlink", "href");
      } catch {
        image.remove();
      }
    }),
  );
}

function stripExternalImageStyles(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>("*").forEach((element) => {
    const style = element.getAttribute("style");
    if (!style) return;
    const cleaned = style.replace(/(background(?:-image)?\s*:\s*)[^;]*url\((?!\s*[\"']?(?:data|blob):)[^)]*\)/gi, "$1none");
    element.setAttribute("style", cleaned);
  });
}

async function renderCard() {
  const card = document.querySelector<HTMLElement>(".gradly-paper");
  if (!card) throw new Error("The result card is not ready for download.");

  const rect = card.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  const scale = Math.min(3, Math.max(2, window.devicePixelRatio || 1));
  const clone = card.cloneNode(true) as HTMLElement;

  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.minHeight = `${height}px`;
  clone.style.margin = "0";
  clone.style.transform = "none";
  clone.style.boxShadow = "none";
  clone.style.position = "fixed";
  clone.style.left = "-100000px";
  clone.style.top = "0";
  clone.style.zIndex = "-1";
  clone.querySelectorAll<HTMLElement>(".no-print, [data-gradly-download-menu]").forEach((element) => element.remove());

  document.body.appendChild(clone);

  try {
    await inlineImages(clone);
    stripExternalImageStyles(clone);

    const canvas = await html2canvas(clone, {
      width,
      height,
      scale,
      useCORS: true,
      allowTaint: false,
      foreignObjectRendering: false,
      backgroundColor: "#ffffff",
      imageTimeout: 15000,
      logging: false,
      onclone: (clonedDocument) => {
        clonedDocument.querySelectorAll<HTMLElement>(".no-print, [data-gradly-download-menu]").forEach((element) => element.remove());
      },
    });

    return { canvas, pixelRatio: scale };
  } finally {
    clone.remove();
  }
}

function concatBytes(...parts: Uint8Array[]) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function asciiBytes(value: string) {
  return new TextEncoder().encode(value);
}

async function createPdfBlob(canvas: HTMLCanvasElement, pixelRatio: number) {
  const jpegBlob = await canvasToBlob(canvas, "image/jpeg", 0.98);
  const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
  const pageWidthPt = ((canvas.width / pixelRatio) / 96) * 72;
  const pageHeightPt = ((canvas.height / pixelRatio) / 96) * 72;
  const contentBytes = asciiBytes(`q\n${pageWidthPt} 0 0 ${pageHeightPt} 0 0 cm\n/Im0 Do\nQ\n`);
  const header = asciiBytes("%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n");
  const objects = [
    asciiBytes("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"),
    asciiBytes("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"),
    asciiBytes(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidthPt} ${pageHeightPt}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`),
    concatBytes(asciiBytes(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`), jpegBytes, asciiBytes("\nendstream\nendobj\n")),
    concatBytes(asciiBytes(`5 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`), contentBytes, asciiBytes("endstream\nendobj\n")),
  ];
  const chunks: Uint8Array[] = [header];
  const offsets: number[] = [0];
  let cursor = header.length;
  objects.forEach((object, index) => {
    offsets[index + 1] = cursor;
    chunks.push(object);
    cursor += object.length;
  });
  const xrefOffset = cursor;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index <= objects.length; index += 1) {
    xref += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  const trailer = asciiBytes(`${xref}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);
  return new Blob([...chunks, trailer], { type: "application/pdf" });
}

async function exportResult(format: Format) {
  const { canvas, pixelRatio } = await renderCard();
  const baseName = getFileName();
  if (format === "png") {
    downloadBlob(await canvasToBlob(canvas, "image/png"), `${baseName}.png`);
    return;
  }
  if (format === "jpg") {
    downloadBlob(await canvasToBlob(canvas, "image/jpeg", 0.95), `${baseName}.jpg`);
    return;
  }
  downloadBlob(await createPdfBlob(canvas, pixelRatio), `${baseName}.pdf`);
}

function formatMeta(format: Format) {
  if (format === "png") return { label: "PNG", description: "High-quality image", icon: FileImage };
  if (format === "jpg") return { label: "JPG", description: "Compressed image for sharing", icon: FileImage };
  return { label: "PDF", description: "Full result card document", icon: FileText };
}

function setDownloadButtonLabel(button: HTMLButtonElement) {
  for (const node of Array.from(button.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE && /download\s*\/\s*print/i.test(node.textContent || "")) {
      node.textContent = "Download";
      return;
    }
  }
}

export default function ResultDownload() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<Format | null>(null);
  const [error, setError] = useState("");
  const [position, setPosition] = useState<Position>({ top: 0, right: 0 });
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const findButton = () => {
      const navigation = document.querySelector<HTMLElement>("[data-gradly-workflow-navigation]");
      if (!navigation) return;
      const button = Array.from(navigation.querySelectorAll<HTMLButtonElement>("button")).find((candidate) => /download\s*\/\s*print/i.test(candidate.textContent || ""));
      if (!button) return;
      setDownloadButtonLabel(button);
      button.setAttribute("aria-haspopup", "menu");
      button.setAttribute("title", "Download result as PNG, JPG or PDF");
      cleanupRef.current?.();
      const onClick = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        const rect = button.getBoundingClientRect();
        setPosition({ top: Math.min(rect.bottom + 8, Math.max(12, window.innerHeight - 250)), right: Math.max(12, window.innerWidth - rect.right) });
        setError("");
        setOpen((current) => !current);
      };
      button.addEventListener("click", onClick, true);
      cleanupRef.current = () => button.removeEventListener("click", onClick, true);
    };

    findButton();
    const observer = new MutationObserver(findButton);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => { cleanupRef.current?.(); observer.disconnect(); };
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-gradly-download-menu]")) return;
      setOpen(false);
    };
    const reposition = () => setOpen(false);
    document.addEventListener("mousedown", close, true);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("mousedown", close, true);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open]);

  const download = async (format: Format) => {
    setBusy(format);
    setError("");
    try {
      await exportResult(format);
      setOpen(false);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Download failed. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  if (!open && !error) return null;
  return createPortal(
    <div data-gradly-download-menu role="menu" aria-label="Download result format" className="fixed z-[120] w-[290px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl" style={{ top: position.top, right: position.right }}>
      <div className="px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#17365D] text-white"><Download size={15} /></span>
          <div><p className="text-xs font-black text-slate-900">Download result</p><p className="text-[10px] text-slate-400">Choose a file format</p></div>
        </div>
      </div>
      <div className="space-y-1">
        {(["png", "jpg", "pdf"] as Format[]).map((format) => {
          const meta = formatMeta(format); const Icon = meta.icon; const isBusy = busy === format;
          return <button key={format} type="button" role="menuitem" disabled={busy !== null} onClick={() => download(format)} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">{isBusy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#17365D]" /> : <Icon size={16} />}</span>
            <span className="min-w-0 flex-1"><span className="block text-[11px] font-black text-slate-800">{meta.label}</span><span className="block text-[9px] leading-4 text-slate-400">{isBusy ? "Preparing download…" : meta.description}</span></span>
          </button>;
        })}
      </div>
      {error && <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-semibold leading-4 text-red-700">{error}</div>}
    </div>,
    document.body,
  );
}
