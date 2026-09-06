"use client";

import { Download, FileImage, FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Format = "png" | "jpg" | "pdf";

type Position = {
  top: number;
  right: number;
};

function sanitizeFileName(value: string) {
  return (
    value
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "result"
  );
}

function getFileName() {
  const card = document.querySelector<HTMLElement>(".gradly-paper");
  const text = card?.textContent?.replace(/\s+/g, " ").trim() || "";
  const match = text.match(
    /Student\s+([^·|]+?)(?:\s+Father|\s+Roll\s+Number|\s+Class\s*&\s*Section)/i,
  );
  const studentName = match?.[1]?.trim();

  return `gradly-${sanitizeFileName(studentName || "student-result")}`;
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

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(
          new Error(
            `Could not create ${type.includes("jpeg") ? "JPG" : "PNG"} image.`,
          ),
        );
      },
      type,
      quality,
    );
  });
}

async function renderCard() {
  const card = document.querySelector<HTMLElement>(".gradly-paper");
  if (!card) throw new Error("The result card is not ready for download.");

  const { toCanvas } = await import("html-to-image");
  const pixelRatio = Math.min(3, Math.max(2, window.devicePixelRatio || 1));

  try {
    const canvas = await toCanvas(card, {
      backgroundColor: "#ffffff",
      pixelRatio,
      cacheBust: true,
      skipFonts: true,
      filter: (node) => {
        if (node instanceof HTMLElement) {
          return !node.classList.contains("no-print") &&
            !node.hasAttribute("data-gradly-download-menu");
        }
        return true;
      },
    });

    if (!canvas.width || !canvas.height) {
      throw new Error("The result card produced an empty image.");
    }

    return { canvas, pixelRatio };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown rendering error.";
    throw new Error(
      `Could not render the result card. ${message}`,
    );
  }
}

async function exportResult(format: Format) {
  const { canvas, pixelRatio } = await renderCard();
  const baseName = getFileName();

  if (format === "png") {
    const blob = await canvasToBlob(canvas, "image/png");
    downloadBlob(blob, `${baseName}.png`);
    return;
  }

  if (format === "jpg") {
    const blob = await canvasToBlob(canvas, "image/jpeg", 0.95);
    downloadBlob(blob, `${baseName}.jpg`);
    return;
  }

  const widthPx = canvas.width / pixelRatio;
  const heightPx = canvas.height / pixelRatio;
  const widthMm = (widthPx / 96) * 25.4;
  const heightMm = (heightPx / 96) * 25.4;

  if (
    !Number.isFinite(widthMm) ||
    !Number.isFinite(heightMm) ||
    widthMm <= 0 ||
    heightMm <= 0
  ) {
    throw new Error("The result card has an invalid size for PDF export.");
  }

  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({
    orientation: widthMm > heightMm ? "landscape" : "portrait",
    unit: "mm",
    format: [widthMm, heightMm],
    compress: true,
  });

  const imageData = canvas.toDataURL("image/jpeg", 0.98);
  pdf.addImage(
    imageData,
    "JPEG",
    0,
    0,
    widthMm,
    heightMm,
    undefined,
    "FAST",
  );
  pdf.save(`${baseName}.pdf`);
}

function formatMeta(format: Format) {
  if (format === "png") {
    return {
      label: "PNG",
      description: "High-quality image",
      icon: FileImage,
    };
  }

  if (format === "jpg") {
    return {
      label: "JPG",
      description: "Compressed image for sharing",
      icon: FileImage,
    };
  }

  return {
    label: "PDF",
    description: "Full result card document",
    icon: FileText,
  };
}

function setDownloadButtonLabel(button: HTMLButtonElement) {
  for (const node of Array.from(button.childNodes)) {
    if (
      node.nodeType === Node.TEXT_NODE &&
      /download\s*\/\s*print/i.test(node.textContent || "")
    ) {
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
      const navigation = document.querySelector<HTMLElement>(
        "[data-gradly-workflow-navigation]",
      );
      if (!navigation) return;

      const buttons = Array.from(
        navigation.querySelectorAll<HTMLButtonElement>("button"),
      );
      const button = buttons.find((candidate) =>
        /download\s*\/\s*print/i.test(candidate.textContent || ""),
      );
      if (!button) return;

      setDownloadButtonLabel(button);
      button.setAttribute("aria-haspopup", "menu");
      button.setAttribute(
        "title",
        "Download result as PNG, JPG or PDF",
      );

      cleanupRef.current?.();

      const onClick = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const rect = button.getBoundingClientRect();
        setPosition({
          top: Math.min(
            rect.bottom + 8,
            Math.max(12, window.innerHeight - 250),
          ),
          right: Math.max(12, window.innerWidth - rect.right),
        });
        setError("");
        setOpen((current) => !current);
      };

      button.addEventListener("click", onClick, true);
      cleanupRef.current = () =>
        button.removeEventListener("click", onClick, true);
    };

    findButton();
    const observer = new MutationObserver(findButton);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      cleanupRef.current?.();
      observer.disconnect();
    };
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
      setError(
        value instanceof Error
          ? value.message
          : "Download failed. Please try again.",
      );
    } finally {
      setBusy(null);
    }
  };

  if (!open && !error) return null;

  return createPortal(
    <div
      data-gradly-download-menu
      role="menu"
      aria-label="Download result format"
      className="fixed z-[120] w-[290px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"
      style={{ top: position.top, right: position.right }}
    >
      <div className="px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#17365D] text-white">
            <Download size={15} />
          </span>
          <div>
            <p className="text-xs font-black text-slate-900">Download result</p>
            <p className="text-[10px] text-slate-400">Choose a file format</p>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        {(["png", "jpg", "pdf"] as Format[]).map((format) => {
          const meta = formatMeta(format);
          const Icon = meta.icon;
          const isBusy = busy === format;

          return (
            <button
              key={format}
              type="button"
              role="menuitem"
              disabled={busy !== null}
              onClick={() => download(format)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
                {isBusy ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#17365D]" />
                ) : (
                  <Icon size={16} />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-black text-slate-800">{meta.label}</span>
                <span className="block text-[9px] leading-4 text-slate-400">
                  {isBusy ? "Preparing download…" : meta.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-semibold leading-4 text-red-700">
          {error}
        </div>
      )}
    </div>,
    document.body,
  );
}
