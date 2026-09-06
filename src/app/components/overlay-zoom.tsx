"use client";

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Minus, Plus, RotateCcw } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

export default function OverlayZoom() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const [zoom, setZoom] = useState(100);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const find = () => {
      const dialog = document.querySelector<HTMLElement>("[role='dialog'][aria-labelledby='gradly-school-dialog-title']");
      const next = dialog?.querySelector<HTMLElement>("[data-gradly-preview-target]") ?? null;
      setTarget(next);

      if (next?.parentElement) {
        const host = next.parentElement;
        if (getComputedStyle(host).position === "static") host.style.position = "relative";
        setPortalHost(host);
      } else {
        setPortalHost(null);
      }

      if (!next) {
        setZoom(100);
        setPosition({ x: 0, y: 0 });
      }
    };

    const observer = new MutationObserver(find);
    observer.observe(document.body, { childList: true, subtree: true });
    find();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!target) return;
    const applyTransform = () => {
      const host = target.querySelector<HTMLElement>("div > div");
      if (!host) return;
      const base = Number(host.dataset.gradlyBaseScale || "1");
      host.dataset.gradlyBaseScale = String(base);
      host.style.transform = `translate(${position.x}px, ${position.y}px) scale(${base * zoom / 100})`;
      host.style.transformOrigin = "top left";
    };

    applyTransform();
    const observer = new MutationObserver(applyTransform);
    observer.observe(target, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [target, zoom, position]);

  if (!portalHost) return null;

  const changeZoom = (amount: number) => setZoom((value) => Math.min(150, Math.max(60, value + amount)));
  const move = (x: number, y: number) => setPosition((value) => ({ x: value.x + x, y: value.y + y }));
  const resetZoom = () => setZoom(100);
  const resetPosition = () => setPosition({ x: 0, y: 0 });

  return createPortal(
    <div className="pointer-events-none absolute right-3 top-3 z-[100] flex flex-col items-end gap-1.5">
      <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-slate-200/90 bg-white/95 p-1 shadow-xl backdrop-blur">
        <button type="button" onClick={() => changeZoom(-10)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 active:scale-95" aria-label="Zoom out" title="Zoom out"><Minus size={14} /></button>
        <button type="button" onClick={resetZoom} className="min-w-[42px] rounded-lg px-1.5 py-1 text-[10px] font-extrabold text-slate-600 hover:bg-slate-100" aria-label="Reset zoom" title="Reset zoom">{zoom}%</button>
        <button type="button" onClick={() => changeZoom(10)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 active:scale-95" aria-label="Zoom in" title="Zoom in"><Plus size={14} /></button>
        <button type="button" onClick={resetZoom} className="ml-0.5 grid h-7 w-7 place-items-center rounded-lg border-l border-slate-200 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Reset zoom" title="Reset zoom"><RotateCcw size={12} /></button>
      </div>

      <div className="pointer-events-auto rounded-xl border border-slate-200/90 bg-white/95 p-1 shadow-xl backdrop-blur">
        <div className="grid grid-cols-3 items-center gap-0.5">
          <span />
          <button type="button" onClick={() => move(0, -20)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 active:scale-95" aria-label="Move card up" title="Move card up"><ArrowUp size={14} /></button>
          <span />
          <button type="button" onClick={() => move(-20, 0)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 active:scale-95" aria-label="Move card left" title="Move card left"><ArrowLeft size={14} /></button>
          <button type="button" onClick={resetPosition} className="grid h-7 w-7 place-items-center rounded-lg text-[9px] font-extrabold text-slate-500 transition hover:bg-slate-100 active:scale-95" aria-label="Center card" title="Center card">C</button>
          <button type="button" onClick={() => move(20, 0)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 active:scale-95" aria-label="Move card right" title="Move card right"><ArrowRight size={14} /></button>
          <span />
          <button type="button" onClick={() => move(0, 20)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 active:scale-95" aria-label="Move card down" title="Move card down"><ArrowDown size={14} /></button>
          <span />
        </div>
      </div>
    </div>,
    portalHost,
  );
}
