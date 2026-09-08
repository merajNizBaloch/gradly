"use client";

import { Eye, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function MobileCardPreview() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !hostRef.current) return;

    const host = hostRef.current;
    host.replaceChildren();
    setReady(false);

    const source = document.querySelector<HTMLElement>('[data-gradly-export-id="live-result"]');
    if (!source) return;

    const clone = source.cloneNode(true) as HTMLElement;
    clone.removeAttribute("data-gradly-export-id");
    clone.setAttribute("data-gradly-mobile-preview-copy", "true");

    const paper = clone.querySelector<HTMLElement>(".gradly-paper");
    if (paper) {
      paper.style.setProperty("animation", "none", "important");
      paper.style.setProperty("transition", "none", "important");
    }

    host.appendChild(clone);
    setReady(true);

    return () => {
      host.replaceChildren();
    };
  }, [open]);

  if (pathname !== "/") return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="gradly-mobile-preview-trigger no-print fixed z-[145] hidden items-center gap-2 bg-[#0F4AA8] px-4 py-3 text-xs font-black text-white shadow-[0_14px_36px_rgba(15,74,168,.32)] max-md:flex"
        aria-label="Preview result card"
      >
        <Eye size={16} />
        Preview Card
      </button>

      {open && (
        <div
          className="gradly-mobile-preview-overlay no-print fixed inset-0 z-[210] hidden bg-slate-950/70 max-md:block"
          onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}
        >
          <div className="flex h-[100dvh] w-full flex-col bg-[#EAF1F7]">
            <div className="flex shrink-0 items-center justify-between border-b border-[#D8E3F0] bg-white px-4 py-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#11B8B2]">Result preview</p>
                <p className="mt-0.5 text-sm font-black text-[#0B3477]">Current result card</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-11 w-11 place-items-center border border-[#D8E3F0] bg-white text-slate-600"
                aria-label="Close result preview"
              >
                <X size={18} />
              </button>
            </div>

            <div className="gradly-mobile-preview-body min-h-0 flex-1 overflow-auto p-3">
              {!ready && <div className="grid min-h-56 place-items-center bg-white text-sm font-bold text-slate-500">Preparing preview…</div>}
              <div ref={hostRef} className="gradly-mobile-preview-host mx-auto w-full" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
