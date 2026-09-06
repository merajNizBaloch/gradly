"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Crop, RotateCcw, Settings2, Wand2, X } from "lucide-react";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function LogoEditor() {
  const [logo, setLogo] = useState("");
  const [processedLogo, setProcessedLogo] = useState("");
  const [removeWhite, setRemoveWhite] = useState(false);
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [ready, setReady] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);

  const effectiveLogo = removeWhite && processedLogo ? processedLogo : logo;

  const applyToPreview = () => {
    const image = document.querySelector<HTMLImageElement>('img[alt="School logo"]');
    if (image) {
      image.style.transform = `translate(${x}%, ${y}%) scale(${zoom / 100})`;
      image.style.transformOrigin = "center center";
      image.style.transition = "transform 160ms ease";
      if (effectiveLogo && image.src !== effectiveLogo) image.src = effectiveLogo;
    }

    const paper = document.querySelector<HTMLElement>(".gradly-paper");
    if (paper && effectiveLogo) {
      paper.style.backgroundImage = `linear-gradient(rgba(255,255,255,.90),rgba(255,255,255,.90)),url("${effectiveLogo}")`;
      paper.style.backgroundRepeat = "no-repeat";
      paper.style.backgroundPosition = "center center";
      paper.style.backgroundSize = `${48 * zoom / 100}% auto`;
    }
  };

  const detectLogo = () => {
    const input = document.querySelector<HTMLInputElement>('input[type="file"][accept="image/*"]');
    const image = document.querySelector<HTMLImageElement>('img[alt="School logo"]');
    if (!logo && image?.src && !image.src.startsWith("data:,") && image.src !== window.location.href) {
      setLogo(image.src);
      setReady(true);
    }
    if (input) {
      const uploadButton = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((button) => {
        const text = button.textContent?.trim() ?? "";
        return text.includes("School logo") || text.includes("Add school logo");
      });
      if (uploadButton && !uploadButton.dataset.gradlyLogoEditor) {
        uploadButton.dataset.gradlyLogoEditor = "true";
        uploadButton.insertAdjacentElement("afterend", hostRef.current!);
      }
    }
  };

  useEffect(() => {
    const input = document.querySelector<HTMLInputElement>('input[type="file"][accept="image/*"]');
    const onChange = () => {
      const file = input?.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        setLogo(String(reader.result));
        setProcessedLogo("");
        setRemoveWhite(false);
        setZoom(100);
        setX(0);
        setY(0);
        setReady(true);
        setOpen(false);
      };
      reader.readAsDataURL(file);
    };

    input?.addEventListener("change", onChange);
    const observer = new MutationObserver(detectLogo);
    observer.observe(document.body, { childList: true, subtree: true });
    detectLogo();

    return () => {
      input?.removeEventListener("change", onChange);
      observer.disconnect();
    };
  }, [logo]);

  useEffect(() => {
    applyToPreview();
  }, [effectiveLogo, zoom, x, y]);

  const removeWhiteBackground = () => {
    if (!logo) return;
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < pixels.data.length; i += 4) {
        const r = pixels.data[i];
        const g = pixels.data[i + 1];
        const b = pixels.data[i + 2];
        const distance = Math.max(r, g, b) - Math.min(r, g, b);
        if (r > 238 && g > 238 && b > 238 && distance < 18) pixels.data[i + 3] = 0;
      }
      context.putImageData(pixels, 0, 0);
      setProcessedLogo(canvas.toDataURL("image/png"));
      setRemoveWhite(true);
      setReady(true);
    };
    image.src = logo;
  };

  const reset = () => {
    setZoom(100);
    setX(0);
    setY(0);
    setRemoveWhite(false);
    setProcessedLogo("");
  };

  if (!ready) return <div ref={hostRef} className="hidden" />;

  return (
    <div ref={hostRef} className="relative inline-flex" data-gradly-logo-editor-host>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="ml-2 inline-flex items-center gap-1.5 border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:border-gray-500 hover:bg-gray-50"
        aria-expanded={open}
      >
        <Settings2 size={15} />
        Edit logo
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[310px] rounded-xl border border-gray-200 bg-white p-4 text-left shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-black text-gray-900">Logo editor</div>
              <div className="text-[11px] text-gray-500">Adjust the logo without leaving Gradly.</div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="grid h-7 w-7 place-items-center rounded-md text-gray-500 hover:bg-gray-100" aria-label="Close logo editor"><X size={15} /></button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setOpen(true)} className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700"><Crop size={14} /> Crop / Adjust</button>
            <button
              type="button"
              onClick={removeWhiteBackground}
              className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold ${removeWhite ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-gray-50 text-gray-700"}`}
            >
              {removeWhite ? <Check size={14} /> : <Wand2 size={14} />}
              {removeWhite ? "White BG removed" : "Remove white BG"}
            </button>
          </div>

          <div className="mt-4 space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <label className="block text-xs font-bold text-gray-700">Zoom <span className="float-right font-normal text-gray-500">{zoom}%</span>
              <input className="mt-1 w-full accent-gray-700" type="range" min="60" max="180" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
            </label>
            <label className="block text-xs font-bold text-gray-700">Horizontal <span className="float-right font-normal text-gray-500">{x}%</span>
              <input className="mt-1 w-full accent-gray-700" type="range" min="-20" max="20" value={x} onChange={(e) => setX(clamp(Number(e.target.value), -20, 20))} />
            </label>
            <label className="block text-xs font-bold text-gray-700">Vertical <span className="float-right font-normal text-gray-500">{y}%</span>
              <input className="mt-1 w-full accent-gray-700" type="range" min="-20" max="20" value={y} onChange={(e) => setY(clamp(Number(e.target.value), -20, 20))} />
            </label>
          </div>

          <button type="button" onClick={reset} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"><RotateCcw size={14} /> Reset logo adjustments</button>
        </div>
      )}
    </div>
  );
}
