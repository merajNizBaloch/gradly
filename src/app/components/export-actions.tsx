"use client";

import html2canvas from "html2canvas-pro";
import { Download, FileImage, FileText } from "lucide-react";
import { useState } from "react";
import type { DesignSettings } from "./workspace-model";

type Format = "png" | "jpg" | "pdf";

function safeName(value: string) {
  return value.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "student-result";
}

function paperSizeMm(design: DesignSettings) {
  if (design.paperSize === "a5") return { width: 148, height: 210 };
  if (design.paperSize === "letter") return { width: 215.9, height: 279.4 };
  if (design.paperSize === "legal") return { width: 215.9, height: 355.6 };
  if (design.paperSize === "custom") {
    return {
      width: Math.max(80, Number(design.customWidth) || 210),
      height: Math.max(100, Number(design.customHeight) || 297),
    };
  }
  return { width: 210, height: 297 };
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

async function renderCard() {
  const card = document.querySelector<HTMLElement>(".gradly-paper");
  if (!card) throw new Error("The result card is not ready yet.");

  return html2canvas(card, {
    scale: Math.min(3, Math.max(2, window.devicePixelRatio || 1)),
    useCORS: true,
    allowTaint: false,
    backgroundColor: "#ffffff",
    logging: false,
    imageTimeout: 15000,
  });
}

export default function ExportActions({ student, design }: { student: string; design: DesignSettings }) {
  const [busy, setBusy] = useState<Format | null>(null);
  const [error, setError] = useState("");

  const exportFile = async (format: Format) => {
    setBusy(format);
    setError("");
    try {
      const canvas = await renderCard();
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
