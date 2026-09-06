"use client";

import { Minus, Plus, RotateCcw } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

export default function OverlayZoom() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const [zoom, setZoom] = useState(200);
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
        setZoom(200);
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
      host.style.left = "50%";
      host.style.top = "50%";
      host.style.transformOrigin = "center center";
      host.style.transform = `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${base * zoom / 100})`;
    };

    applyTransform();
    const observer = new MutationObserver(applyTransform);
    observer.observe(target, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [target, zoom, position]);

  useEffect(() => {
    if (!target) return;

    const surface = target;
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startPosition = { x: 0, y: 0 };

    const onPointerDown = (event: PointerEvent) => {
      const element = event.target as HTMLElement | null;
      if (element?.closest("button, input, a, select, textarea")) return;
      if (event.button !== 0) return;

      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      startPosition = position;
      surface.setPointerCapture?.(event.pointerId);
      surface.style.cursor = "grabbing";
      event.preventDefault();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      setPosition({
        x: startPosition.x + event.clientX - startX,
        y: startPosition.y + event.clientY - startY,
      });
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      surface.releasePointerCapture?.(event.pointerId);
      surface.style.cursor = "grab";
    };

    surface.style.cursor = "grab";
    surface.addEventListener("pointerdown", onPointerDown);
    surface.addEventListener("pointermove", onPointerMove);
    surface.addEventListener("pointerup", onPointerUp);
    surface.addEventListener("pointercancel", onPointerUp);

    return () => {
      surface.style.cursor = "";
      surface.removeEventListener("pointerdown", onPointerDown);
      surface.removeEventListener("pointermove", onPointerMove);
      surface.removeEventListener("pointerup", onPointerUp);
      surface.removeEventListener("pointercancel", onPointerUp);
    };
  }, [target, position]);

  if (!portalHost) return null;

  const changeZoom = (amount: number) => setZoom((value) => Math.min(400, Math.max(50, value + amount)));
  const resetZoom = () => setZoom(200);
  const resetPosition = () => setPosition({ x: 0, y: 0 });

  return createPortal(
    <div className="pointer-events-none absolute right-3 top-3 z-[100] flex items-center gap-1 rounded-xl border border-slate-200/90 bg-white/95 p-1 shadow-xl backdrop-blur">
      <button type="button" onClick={() => changeZoom(-10)} className="pointer-events-auto grid h-7 w-7 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 active:scale-95" aria-label="Zoom out" title="Zoom out"><Minus size={14} /></button>
      <button type="button" onClick={resetZoom} className="pointer-events-auto min-w-[48px] rounded-lg px-1.5 py-1 text-[10px] font-extrabold text-slate-600 hover:bg-slate-100" aria-label="Reset zoom" title="Reset zoom">{zoom}%</button>
      <button type="button" onClick={() => changeZoom(10)} className="pointer-events-auto grid h-7 w-7 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 active:scale-95" aria-label="Zoom in" title="Zoom in"><Plus size={14} /></button>
      <button type="button" onClick={resetZoom} className="pointer-events-auto ml-0.5 grid h-7 w-7 place-items-center rounded-lg border-l border-slate-200 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Reset zoom" title="Reset zoom"><RotateCcw size={12} /></button>
    </div>,
    portalHost,
  );
}
