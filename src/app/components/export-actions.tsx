"use client";

import html2canvas from "html2canvas-pro";
import { Download, FileImage, FileText } from "lucide-react";
import { useState } from "react";
import type { DesignSettings } from "./workspace-model";

type Format = "png" | "jpg" | "pdf";

const MASTER_WIDTH_MM = 210;
const MASTER_HEIGHT_MM = 297;

function safeName(value: string) {
  return value.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "student-result";
}

function paperSizeMm(design: DesignSettings) {
  if (design.paperSize === "a5") return { width: 148, height: 210 };
  if (design.paperSize === "letter") return { width: 215.9, height: 279.4 };
  if (design.paperSize === "legal") return { width: 215.9, height: 355.6 };
  if (design.paperSize === "custom") {
    return {
      width: Math.max(80, Number(design.customWidth) || MASTER_WIDTH_MM),
      height: Math.max(100, Number(design.customHeight) || MASTER_HEIGHT_MM),
    };
  }
  return { width: MASTER_WIDTH_MM, height: MASTER_HEIGHT_MM };
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 800);
}

function canvasBlob(canvas: HTMLCanvasElement, type: "image/png" | "image/jpeg", quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not create the download file.")), type, quality);
  });
}

function concatBytes(...parts: Uint8Array[]) {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(length);
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

function bytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

async function createPdfBlob(canvas: HTMLCanvasElement, design: DesignSettings) {
  const jpegBlob = await canvasBlob(canvas, "image/jpeg", 0.98);
  const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
  const page = paperSizeMm(design);
  const pageWidthPt = page.width * 72 / 25.4;
  const pageHeightPt = page.height * 72 / 25.4;
  const content = asciiBytes(`q\n${pageWidthPt} 0 0 ${pageHeightPt} 0 0 cm\n/Im0 Do\nQ\n`);
  const header = asciiBytes("%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n");
  const objects = [
    asciiBytes("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"),
    asciiBytes("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"),
    asciiBytes(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidthPt} ${pageHeightPt}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`),
    concatBytes(
      asciiBytes(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`),
      jpegBytes,
      asciiBytes("\nendstream\nendobj\n"),
    ),
    concatBytes(
      asciiBytes(`5 0 obj\n<< /Length ${content.length} >>\nstream\n`),
      content,
      asciiBytes("endstream\nendobj\n"),
    ),
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
  return new Blob([...chunks, trailer].map(bytesToArrayBuffer), { type: "application/pdf" });
}

async function waitForImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(images.map((image) => {
    if (image.complete) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const finish = () => resolve();
      image.addEventListener("load", finish, { once: true });
      image.addEventListener("error", finish, { once: true });
      window.setTimeout(finish, 4000);
    });
  }));
}

function sourceScope(targetId?: string) {
  if (targetId) {
    return document.querySelector<HTMLElement>(`[data-gradly-export-id="${CSS.escape(targetId)}"]`);
  }
  return document.querySelector<HTMLElement>(".gradly-signature-scope");
}

function prepareMasterClone(targetId?: string) {
  const source = sourceScope(targetId);
  if (!source) throw new Error("The selected result card is not ready yet.");

  const clone = source.cloneNode(true) as HTMLElement;
  const host = document.createElement("div");
  host.setAttribute("data-gradly-export-host", "true");
  host.style.setProperty("position", "fixed", "important");
  host.style.setProperty("left", "0", "important");
  host.style.setProperty("top", "0", "important");
  host.style.setProperty("width", `${MASTER_WIDTH_MM}mm`, "important");
  host.style.setProperty("height", `${MASTER_HEIGHT_MM}mm`, "important");
  host.style.setProperty("overflow", "hidden", "important");
  host.style.setProperty("pointer-events", "none", "important");
  host.style.setProperty("z-index", "-2147483647", "important");
  host.style.setProperty("background", "#ffffff", "important");
  host.appendChild(clone);
  document.body.appendChild(host);

  clone.style.setProperty("display", "block", "important");
  clone.style.setProperty("width", `${MASTER_WIDTH_MM}mm`, "important");
  clone.style.setProperty("height", `${MASTER_HEIGHT_MM}mm`, "important");
  clone.style.setProperty("margin", "0", "important");
  clone.style.setProperty("padding", "0", "important");

  const shell = clone.querySelector<HTMLElement>(".gradly-card-scroll");
  if (shell) {
    shell.style.setProperty("display", "block", "important");
    shell.style.setProperty("width", `${MASTER_WIDTH_MM}mm`, "important");
    shell.style.setProperty("height", `${MASTER_HEIGHT_MM}mm`, "important");
    shell.style.setProperty("min-height", `${MASTER_HEIGHT_MM}mm`, "important");
    shell.style.setProperty("overflow", "hidden", "important");
    shell.style.setProperty("margin", "0", "important");
    shell.style.setProperty("padding", "0", "important");
    shell.style.setProperty("background", "#ffffff", "important");
  }

  const centering = shell?.firstElementChild as HTMLElement | null;
  if (centering) {
    centering.style.setProperty("display", "block", "important");
    centering.style.setProperty("width", `${MASTER_WIDTH_MM}mm`, "important");
    centering.style.setProperty("height", `${MASTER_HEIGHT_MM}mm`, "important");
    centering.style.setProperty("min-width", "0", "important");
    centering.style.setProperty("margin", "0", "important");
    centering.style.setProperty("padding", "0", "important");
  }

  const card = clone.querySelector<HTMLElement>(".gradly-paper");
  if (!card) {
    host.remove();
    throw new Error("The result card could not be prepared for download.");
  }

  card.style.setProperty("position", "relative", "important");
  card.style.setProperty("display", "flex", "important");
  card.style.setProperty("width", `${MASTER_WIDTH_MM}mm`, "important");
  card.style.setProperty("height", `${MASTER_HEIGHT_MM}mm`, "important");
  card.style.setProperty("min-height", `${MASTER_HEIGHT_MM}mm`, "important");
  card.style.setProperty("max-width", "none", "important");
  card.style.setProperty("aspect-ratio", "auto", "important");
  card.style.setProperty("overflow", "hidden", "important");
  card.style.setProperty("margin", "0", "important");
  card.style.setProperty("box-shadow", "none", "important");
  card.style.setProperty("animation", "none", "important");
  card.style.setProperty("transition", "none", "important");

  const master = Array.from(card.children).find((child) => child.tagName !== "STYLE") as HTMLElement | undefined;
  if (master) {
    master.style.setProperty("--gradly-paper-scale", "1", "important");
    master.style.setProperty("position", "absolute", "important");
    master.style.setProperty("left", "0", "important");
    master.style.setProperty("top", "0", "important");
    master.style.setProperty("width", `${MASTER_WIDTH_MM}mm`, "important");
    master.style.setProperty("height", `${MASTER_HEIGHT_MM}mm`, "important");
    master.style.setProperty("min-width", `${MASTER_WIDTH_MM}mm`, "important");
    master.style.setProperty("min-height", `${MASTER_HEIGHT_MM}mm`, "important");
    master.style.setProperty("max-width", "none", "important");
    master.style.setProperty("max-height", "none", "important");
    master.style.setProperty("transform", "none", "important");
    master.style.setProperty("transform-origin", "top left", "important");
  }

  return { host, card };
}

function fitMasterToPaper(master: HTMLCanvasElement, design: DesignSettings) {
  const page = paperSizeMm(design);
  const pixelsPerMm = master.width / MASTER_WIDTH_MM;
  const width = Math.max(1, Math.round(page.width * pixelsPerMm));
  const height = Math.max(1, Math.round(page.height * pixelsPerMm));
  const output = document.createElement("canvas");
  output.width = width;
  output.height = height;

  const context = output.getContext("2d");
  if (!context) throw new Error("Could not prepare the result image.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);

  const scale = Math.min(width / master.width, height / master.height);
  const drawWidth = master.width * scale;
  const drawHeight = master.height * scale;
  const x = (width - drawWidth) / 2;
  const y = (height - drawHeight) / 2;
  context.drawImage(master, x, y, drawWidth, drawHeight);
  return output;
}

async function renderCard(targetId: string | undefined, design: DesignSettings) {
  if (document.fonts?.ready) {
    try { await document.fonts.ready; } catch {}
  }

  const { host, card } = prepareMasterClone(targetId);
  try {
    await waitForImages(host);
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

    const masterCanvas = await html2canvas(card, {
      scale: Math.min(3, Math.max(2, window.devicePixelRatio || 1)),
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 15000,
      scrollX: 0,
      scrollY: 0,
    });

    return fitMasterToPaper(masterCanvas, design);
  } finally {
    host.remove();
  }
}

export default function ExportActions({
  student,
  design,
  targetId,
}: {
  student: string;
  design: DesignSettings;
  targetId?: string;
}) {
  const [busy, setBusy] = useState<Format | null>(null);
  const [error, setError] = useState("");

  const exportFile = async (format: Format) => {
    setBusy(format);
    setError("");
    try {
      const canvas = await renderCard(targetId, design);
      const fileName = `gradly-${safeName(student)}`;

      if (format === "png") {
        downloadBlob(await canvasBlob(canvas, "image/png"), `${fileName}.png`);
      } else if (format === "jpg") {
        downloadBlob(await canvasBlob(canvas, "image/jpeg", 0.95), `${fileName}.jpg`);
      } else {
        downloadBlob(await createPdfBlob(canvas, design), `${fileName}.pdf`);
      }
    } catch (value) {
      setError(value instanceof Error ? value.message : "Download failed. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {([
          ["pdf", "PDF", FileText],
          ["png", "PNG", FileImage],
          ["jpg", "JPG", FileImage],
        ] as const).map(([format, label, Icon]) => (
          <button
            key={format}
            type="button"
            onClick={() => exportFile(format)}
            disabled={busy !== null}
            className="flex items-center justify-center gap-2 border border-[#D8E3F0] bg-white px-3 py-3 text-xs font-black text-[#0F4AA8] transition hover:border-[#1D9BF0] hover:bg-[#F4FAFF] disabled:cursor-wait disabled:opacity-50"
          >
            {busy === format ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#BFD5EA] border-t-[#0F4AA8]" /> : <Icon size={14} />}
            {label}
          </button>
        ))}
      </div>
      <p className="flex items-center gap-1.5 text-[10px] text-slate-400"><Download size={11} /> Downloads are created in your browser; no result data is uploaded.</p>
      {error && <p className="border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-600">{error}</p>}
    </div>
  );
}
