"use client";

import { Minus, Plus, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

export default function OverlayZoom() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    const find = () => {
      const dialog = document.querySelector<HTMLElement>("[role='dialog'][aria-labelledby='gradly-school-dialog-title']");
      const next = dialog?.querySelector<HTMLElement>("[data-gradly-preview-target]") ?? null;
      setTarget(next);
      if (!next) setZoom(100);
    };
    const observer = new MutationObserver(find);
    observer.observe(document.body, { childList: true, subtree: true });
    find();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!target) return;
    const host = target.querySelector<HTMLElement>("div > div");
    if (!host) return;
    const base = Number(host.dataset.gradlyBaseScale || "1");
    host.dataset.gradlyBaseScale = String(base);
    host.style.transform = `scale(${base * zoom / 100})`;
  }, [target, zoom]);

  useEffect(() => {
    if (!target) return;
    const observer = new MutationObserver(() => {
      const host = target.querySelector<HTMLElement>("div > div");
      if (!host) return;
      if (!host.dataset.gradlyBaseScale) {
        const match = host.style.transform.match(/scale\\(([^)]+)\\)/);
        host.dataset.gradlyBaseScale = match?.[1] || "1";
      }
      const base = Number(host.dataset.gradlyBaseScale || "1");
      host.style.transform = `scale(${base * zoom / 100})`;
    });
    observer.observe(target, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [target, zoom]);

  if (!target) return null;

  const change = (amount: number) => setZoom((value) => Math.min(150, Math.max(60, value + amount)));
  const reset = () => setZoom(100);

  return (
    <div className="pointer-events-none absolute right-4 top-4 z-20 flex items-center gap-1 rounded-xl border border-slate-200/90 bg-white/95 p-1 shadow-lg backdrop-blur">
      <button type="button" onClick={() => change(-10)} className="pointer-events-auto grid h-7 w-7 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100" aria-label="Zoom out" title="Zoom out"><Minus size={14} /></button>
      <button type="button" onClick={reset} className="pointer-events-auto min-w-[42px] rounded-lg px-1.5 py-1 text-[10px] font-extrabold text-slate-600 hover:bg-slate-100" aria-label="Reset zoom" title="Reset zoom">{zoom}%</button>
      <button type="button" onClick={() => change(10)} className="pointer-events-auto grid h-7 w-7 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100" aria-label="Zoom in" title="Zoom in"><Plus size={14} /></button>
      <button type="button" onClick={reset} className="pointer-events-auto ml-0.5 grid h-7 w-7 place-items-center rounded-lg border-l border-slate-200 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Reset zoom" title="Reset zoom"><RotateCcw size={12} /></button>
    </div>
  );
}
