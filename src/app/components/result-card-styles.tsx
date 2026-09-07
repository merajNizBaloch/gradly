"use client";

import { Crown, Landmark, LayoutPanelTop, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

type PremiumStyle = "base" | "heritage" | "editorial" | "signature";
type BaseTemplate = "academic" | "modern" | "certificate" | "executive" | "minimal";

type StyleOption = {
  id: PremiumStyle;
  name: string;
  description: string;
  icon: LucideIcon;
};

const STORAGE_KEY = "gradly-result-card-style";

const templateNames: Array<[BaseTemplate, string]> = [
  ["academic", "Academic"],
  ["modern", "Modern"],
  ["certificate", "Certificate"],
  ["executive", "Executive"],
  ["minimal", "Minimal"],
];

const premiumStyles: StyleOption[] = [
  { id: "base", name: "Refined", description: "Upgraded native layout", icon: Sparkles },
  { id: "heritage", name: "Heritage", description: "Formal institutional classic", icon: Landmark },
  { id: "editorial", name: "Editorial", description: "Modern grid-led report", icon: LayoutPanelTop },
  { id: "signature", name: "Signature", description: "Premium executive finish", icon: Crown },
];

function findDesignLibrary(): HTMLElement | null {
  return (
    Array.from(document.querySelectorAll<HTMLElement>("div.no-print")).find((element) => {
      const text = element.textContent ?? "";
      return text.includes("Design library") && text.includes("Choose a result card style");
    }) ?? null
  );
}

function detectTemplate(library: HTMLElement | null): BaseTemplate {
  if (!library) return "academic";

  const selected = Array.from(library.querySelectorAll<HTMLButtonElement>("button")).find(
    (button) => (button.textContent ?? "").includes("Selected"),
  );
  const text = selected?.textContent ?? "";
  return templateNames.find(([, label]) => text.includes(label))?.[0] ?? "academic";
}

function directChildContaining(card: HTMLElement, ...needles: string[]): HTMLElement | null {
  return (
    Array.from(card.children).find((child): child is HTMLElement => {
      if (!(child instanceof HTMLElement)) return false;
      const text = child.textContent ?? "";
      return needles.every((needle) => text.includes(needle));
    }) ?? null
  );
}

function mark(element: HTMLElement | null | undefined, section: string) {
  if (element) element.setAttribute("data-gradly-section", section);
}

function decorateCard(card: HTMLElement, template: BaseTemplate, style: PremiumStyle) {
  card.setAttribute("data-gradly-enhanced", "true");
  card.setAttribute("data-gradly-base-template", template);
  card.setAttribute("data-gradly-design", style);

  const schoolHeading = card.querySelector<HTMLHeadingElement>("h2");
  const header = schoolHeading?.closest<HTMLElement>(".relative") ?? null;
  const headerRow = header?.querySelector<HTMLElement>("div.flex.items-center.gap-4") ?? null;
  const logoBox = headerRow?.firstElementChild instanceof HTMLElement ? headerRow.firstElementChild : null;
  const reportMeta = headerRow?.lastElementChild instanceof HTMLElement ? headerRow.lastElementChild : null;
  const student = directChildContaining(card, "Father / Guardian", "Roll Number");
  const marks = card.querySelector<HTMLTableElement>("table")?.parentElement ?? null;
  const summary = directChildContaining(card, "Overall Grade", "Class Position", "Result");
  const remarks = directChildContaining(card, "Principal's Remarks");
  const verification = directChildContaining(card, "Official Verification");
  const signatures = directChildContaining(card, "Class Teacher", "Principal / Head");

  mark(header, "header");
  mark(headerRow, "header-row");
  mark(logoBox, "logo");
  mark(reportMeta, "report-meta");
  mark(student, "student");
  mark(marks, "marks");
  mark(summary, "summary");
  mark(remarks, "remarks");
  mark(verification, "verification");
  mark(signatures, "signatures");

  const computed = window.getComputedStyle(card);
  const ink = card.style.borderColor || computed.borderTopColor || "#17365D";
  const accent = logoBox?.style.borderColor || header?.style.borderColor || ink;
  const wash = remarks?.style.backgroundColor || "#F5F7FA";

  card.style.setProperty("--gradly-ink", ink);
  card.style.setProperty("--gradly-accent", accent);
  card.style.setProperty("--gradly-wash", wash);
}

export default function ResultCardStyles() {
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [premiumStyle, setPremiumStyle] = useState<PremiumStyle>("base");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (premiumStyles.some((style) => style.id === saved)) {
        setPremiumStyle(saved as PremiumStyle);
      }
    } catch {
      // Local storage is optional.
    }
  }, []);

  useEffect(() => {
    let frame = 0;
    let disposed = false;

    const refresh = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (disposed) return;

        const library = findDesignLibrary();
        if (library) {
          let slot = library.querySelector<HTMLElement>("[data-gradly-premium-style-slot]");
          if (!slot) {
            slot = document.createElement("div");
            slot.setAttribute("data-gradly-premium-style-slot", "true");
            library.appendChild(slot);
          }
          setMount((current) => (current === slot ? current : slot));
        }

        const card = document.querySelector<HTMLElement>(".gradly-paper");
        if (card) decorateCard(card, detectTemplate(library), premiumStyle);
      });
    };

    refresh();
    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    const interval = window.setInterval(refresh, 500);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      window.clearInterval(interval);
      observer.disconnect();
      document.querySelector("[data-gradly-premium-style-slot]")?.remove();
    };
  }, [premiumStyle]);

  const chooseStyle = (style: PremiumStyle) => {
    setPremiumStyle(style);
    try {
      window.localStorage.setItem(STORAGE_KEY, style);
    } catch {
      // The current selection still works without persistence.
    }

    const card = document.querySelector<HTMLElement>(".gradly-paper");
    if (card) decorateCard(card, detectTemplate(findDesignLibrary()), style);
  };

  return (
    <>
      <style jsx global>{`
        .gradly-paper[data-gradly-enhanced="true"] {
          --gradly-ink: #17365d;
          --gradly-accent: #17365d;
          --gradly-wash: #f5f7fa;
          isolation: isolate;
          color: #17202a;
        }

        .gradly-paper[data-gradly-enhanced="true"] [data-gradly-section="header"] {
          margin-top: 0 !important;
          padding: 18px 20px !important;
          border-width: 0 0 2px !important;
          background: linear-gradient(180deg, rgba(255,255,255,.98), rgba(248,250,252,.94)) !important;
        }
        .gradly-paper[data-gradly-enhanced="true"] [data-gradly-section="logo"] {
          width: 72px !important;
          height: 72px !important;
          padding: 5px;
          border-width: 1px !important;
          background: #fff !important;
        }
        .gradly-paper[data-gradly-enhanced="true"] [data-gradly-section="header"] h2 {
          font-size: 28px !important;
          line-height: 1.08 !important;
          letter-spacing: -.02em;
        }
        .gradly-paper[data-gradly-enhanced="true"] [data-gradly-section="report-meta"] {
          min-width: 165px;
          padding-left: 16px;
          border-left: 1px solid var(--gradly-accent);
        }
        .gradly-paper[data-gradly-enhanced="true"] [data-gradly-section="student"] {
          margin-top: 20px !important;
          padding: 16px 18px;
          border: 1px solid #d8dee6;
          background: rgba(255,255,255,.82);
        }
        .gradly-paper[data-gradly-enhanced="true"] [data-gradly-section="marks"] {
          margin-top: 20px !important;
          border-width: 1px !important;
        }
        .gradly-paper[data-gradly-enhanced="true"] [data-gradly-section="marks"] thead {
          background: var(--gradly-ink) !important;
          color: #fff !important;
        }
        .gradly-paper[data-gradly-enhanced="true"] [data-gradly-section="marks"] thead th {
          color: #fff !important;
          font-size: 10px !important;
          font-weight: 800 !important;
          text-transform: uppercase;
          letter-spacing: .08em;
        }
        .gradly-paper[data-gradly-enhanced="true"] [data-gradly-section="marks"] tbody tr:nth-child(even) {
          background: var(--gradly-wash) !important;
        }
        .gradly-paper[data-gradly-enhanced="true"] [data-gradly-section="marks"] tbody td {
          padding-top: 11px !important;
          padding-bottom: 11px !important;
        }
        .gradly-paper[data-gradly-enhanced="true"] [data-gradly-section="summary"] {
          margin-top: 18px !important;
          gap: 8px;
          border: 0 !important;
        }
        .gradly-paper[data-gradly-enhanced="true"] [data-gradly-section="summary"] > div {
          padding: 12px 10px !important;
          border: 1px solid #d7dde4;
          background: var(--gradly-wash);
        }
        .gradly-paper[data-gradly-enhanced="true"] [data-gradly-section="remarks"] {
          margin-top: 18px !important;
          padding: 15px 17px !important;
          border-left-width: 4px !important;
        }
        .gradly-paper[data-gradly-enhanced="true"] [data-gradly-section="verification"] {
          margin-top: 18px !important;
        }
        .gradly-paper[data-gradly-enhanced="true"] [data-gradly-section="signatures"] {
          margin-top: 26px !important;
          padding-top: 18px !important;
        }

        .gradly-paper[data-gradly-base-template="academic"][data-gradly-design="base"] {
          border-width: 3px !important;
        }
        .gradly-paper[data-gradly-base-template="academic"][data-gradly-design="base"] [data-gradly-section="header"] {
          background: linear-gradient(90deg, var(--gradly-wash), #fff 58%) !important;
          border-bottom-width: 3px !important;
        }

        .gradly-paper[data-gradly-base-template="modern"][data-gradly-design="base"] {
          border-width: 1px !important;
          border-radius: 24px;
        }
        .gradly-paper[data-gradly-base-template="modern"][data-gradly-design="base"] [data-gradly-section="header"] {
          border: 0 !important;
          border-radius: 18px !important;
          background: var(--gradly-ink) !important;
        }
        .gradly-paper[data-gradly-base-template="modern"][data-gradly-design="base"] [data-gradly-section="header"] h2,
        .gradly-paper[data-gradly-base-template="modern"][data-gradly-design="base"] [data-gradly-section="header"] p {
          color: #fff !important;
        }
        .gradly-paper[data-gradly-base-template="modern"][data-gradly-design="base"] [data-gradly-section="student"],
        .gradly-paper[data-gradly-base-template="modern"][data-gradly-design="base"] [data-gradly-section="marks"],
        .gradly-paper[data-gradly-base-template="modern"][data-gradly-design="base"] [data-gradly-section="remarks"],
        .gradly-paper[data-gradly-base-template="modern"][data-gradly-design="base"] [data-gradly-section="summary"] > div {
          border-radius: 14px;
          overflow: hidden;
        }

        .gradly-paper[data-gradly-base-template="certificate"][data-gradly-design="base"] {
          border-width: 8px !important;
          background-color: #fffdfa !important;
        }
        .gradly-paper[data-gradly-base-template="certificate"][data-gradly-design="base"] [data-gradly-section="header"] {
          padding-top: 24px !important;
          padding-bottom: 22px !important;
          background: transparent !important;
          border-bottom: 1px solid var(--gradly-accent) !important;
        }
        .gradly-paper[data-gradly-base-template="certificate"][data-gradly-design="base"] [data-gradly-section="header"] h2 {
          font-size: 30px !important;
          letter-spacing: .035em !important;
          text-transform: uppercase;
        }

        .gradly-paper[data-gradly-base-template="executive"][data-gradly-design="base"] {
          border-width: 2px !important;
          border-top-width: 10px !important;
        }
        .gradly-paper[data-gradly-base-template="executive"][data-gradly-design="base"] [data-gradly-section="header"] {
          background: var(--gradly-ink) !important;
          border: 0 !important;
        }
        .gradly-paper[data-gradly-base-template="executive"][data-gradly-design="base"] [data-gradly-section="header"] h2,
        .gradly-paper[data-gradly-base-template="executive"][data-gradly-design="base"] [data-gradly-section="header"] p {
          color: #fff !important;
        }
        .gradly-paper[data-gradly-base-template="executive"][data-gradly-design="base"] [data-gradly-section="summary"] {
          gap: 1px;
          background: var(--gradly-ink);
        }
        .gradly-paper[data-gradly-base-template="executive"][data-gradly-design="base"] [data-gradly-section="summary"] > div {
          border: 0;
          background: var(--gradly-ink);
          color: #fff;
        }

        .gradly-paper[data-gradly-base-template="minimal"][data-gradly-design="base"] {
          border: 0 !important;
          border-top: 7px solid var(--gradly-ink) !important;
        }
        .gradly-paper[data-gradly-base-template="minimal"][data-gradly-design="base"] [data-gradly-section="header"] {
          padding-left: 0 !important;
          padding-right: 0 !important;
          background: transparent !important;
          border-bottom: 1px solid #d8dde3 !important;
        }
        .gradly-paper[data-gradly-base-template="minimal"][data-gradly-design="base"] [data-gradly-section="student"] {
          padding-left: 0;
          padding-right: 0;
          border: 0;
          border-bottom: 1px solid #e2e6eb;
          background: transparent;
        }

        .gradly-paper[data-gradly-design="heritage"] {
          border: 8px double var(--gradly-ink) !important;
          padding: 30px !important;
          background-color: #fffdf8 !important;
        }
        .gradly-paper[data-gradly-design="heritage"] [data-gradly-section="header"] {
          padding-top: 22px !important;
          padding-bottom: 22px !important;
          background: transparent !important;
          border-bottom: 1px solid var(--gradly-ink) !important;
        }
        .gradly-paper[data-gradly-design="heritage"] [data-gradly-section="header"] h2 {
          font-size: 30px !important;
          text-transform: uppercase;
          letter-spacing: .04em !important;
        }
        .gradly-paper[data-gradly-design="heritage"] [data-gradly-section="logo"] {
          border-radius: 50% !important;
          border-width: 2px !important;
        }
        .gradly-paper[data-gradly-design="heritage"] [data-gradly-section="student"] {
          border-left: 0;
          border-right: 0;
          background: transparent;
        }

        .gradly-paper[data-gradly-design="editorial"] {
          border: 0 !important;
          border-left: 13px solid var(--gradly-ink) !important;
          padding: 30px 32px !important;
          background: #fff !important;
        }
        .gradly-paper[data-gradly-design="editorial"] [data-gradly-section="header"] {
          padding: 4px 0 20px !important;
          background: transparent !important;
          border-bottom: 4px solid var(--gradly-ink) !important;
        }
        .gradly-paper[data-gradly-design="editorial"] [data-gradly-section="header"] h2 {
          font-family: ui-sans-serif, system-ui, sans-serif !important;
          font-size: 32px !important;
          font-weight: 900 !important;
          letter-spacing: -.045em !important;
        }
        .gradly-paper[data-gradly-design="editorial"] [data-gradly-section="report-meta"] {
          padding: 10px 12px;
          border: 0;
          background: var(--gradly-ink);
          color: #fff;
        }
        .gradly-paper[data-gradly-design="editorial"] [data-gradly-section="report-meta"] p {
          color: #fff !important;
        }
        .gradly-paper[data-gradly-design="editorial"] [data-gradly-section="student"] {
          padding: 18px 0;
          border: 0;
          border-bottom: 1px solid #dce1e7;
          background: transparent;
        }
        .gradly-paper[data-gradly-design="editorial"] [data-gradly-section="summary"] {
          padding-top: 8px;
          border-top: 5px solid var(--gradly-ink) !important;
          grid-template-columns: 1.2fr 1fr 1fr !important;
        }
        .gradly-paper[data-gradly-design="editorial"] [data-gradly-section="summary"] > div {
          border: 0;
          background: transparent;
          text-align: left;
        }

        .gradly-paper[data-gradly-design="signature"] {
          border: 2px solid var(--gradly-ink) !important;
          border-top-width: 12px !important;
          padding: 26px !important;
          background: #fff !important;
        }
        .gradly-paper[data-gradly-design="signature"] [data-gradly-section="header"] {
          margin-left: -10px;
          margin-right: -10px;
          padding: 22px !important;
          border: 0 !important;
          border-radius: 0 !important;
          background: var(--gradly-ink) !important;
        }
        .gradly-paper[data-gradly-design="signature"] [data-gradly-section="header"] h2,
        .gradly-paper[data-gradly-design="signature"] [data-gradly-section="header"] p {
          color: #fff !important;
        }
        .gradly-paper[data-gradly-design="signature"] [data-gradly-section="student"],
        .gradly-paper[data-gradly-design="signature"] [data-gradly-section="marks"],
        .gradly-paper[data-gradly-design="signature"] [data-gradly-section="remarks"] {
          border-radius: 12px;
          overflow: hidden;
        }
        .gradly-paper[data-gradly-design="signature"] [data-gradly-section="summary"] {
          gap: 1px;
          overflow: hidden;
          border-radius: 12px;
          background: var(--gradly-ink);
        }
        .gradly-paper[data-gradly-design="signature"] [data-gradly-section="summary"] > div {
          border: 0;
          background: var(--gradly-ink);
          color: #fff;
        }
      `}</style>

      {mount &&
        createPortal(
          <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[.16em] text-gray-400">Premium collection</p>
                <p className="mt-1 text-xs font-bold text-gray-700">Presentation style</p>
              </div>
              <span className="rounded-full bg-[#17365D]/5 px-2.5 py-1 text-[9px] font-bold text-[#17365D]">New</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {premiumStyles.map((style) => {
                const Icon = style.icon;
                const selected = premiumStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => chooseStyle(style.id)}
                    className={`rounded-xl border p-2.5 text-left transition ${
                      selected
                        ? "border-[#17365D] bg-[#17365D] text-white shadow-sm"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`grid h-7 w-7 place-items-center rounded-lg ${selected ? "bg-white/15" : "bg-gray-100 text-[#17365D]"}`}>
                        <Icon size={14} />
                      </span>
                      <span className="text-[10px] font-black">{style.name}</span>
                    </div>
                    <p className={`mt-2 text-[9px] leading-4 ${selected ? "text-white/70" : "text-gray-400"}`}>
                      {style.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>,
          mount,
        )}
    </>
  );
}
