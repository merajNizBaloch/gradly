"use client";

import { Crown, Landmark, LayoutPanelTop, Sparkles } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

type PremiumStyle = "base" | "heritage" | "editorial" | "signature";
type BaseTemplate = "academic" | "modern" | "certificate" | "executive" | "minimal";

const STORAGE_KEY = "gradly-result-card-style";
const templateNames: Array<[BaseTemplate, string]> = [
  ["academic", "Academic"],
  ["modern", "Modern"],
  ["certificate", "Certificate"],
  ["executive", "Executive"],
  ["minimal", "Minimal"],
];

const premiumStyles: Array<{
  id: PremiumStyle;
  name: string;
  description: string;
  icon: typeof Sparkles;
}> = [
  { id: "base", name: "Refined", description: "Upgraded native layout", icon: Sparkles },
  { id: "heritage", name: "Heritage", description: "Formal institutional classic", icon: Landmark },
  { id: "editorial", name: "Editorial", description: "Modern grid-led report", icon: LayoutPanelTop },
  { id: "signature", name: "Signature", description: "Premium executive finish", icon: Crown },
];

function findDesignLibrary() {
  return Array.from(document.querySelectorAll<HTMLElement>("div.no-print")).find((element) => {
    const text = element.textContent || "";
    return text.includes("Design library") && text.includes("Choose a result card style");
  }) ?? null;
}

function detectTemplate(library: HTMLElement | null): BaseTemplate {
  if (!library) return "academic";
  const selected = Array.from(library.querySelectorAll<HTMLButtonElement>("button")).find((button) =>
    (button.textContent || "").includes("Selected"),
  );
  const text = selected?.textContent || "";
  return templateNames.find(([, label]) => text.includes(label))?.[0] ?? "academic";
}

function directChildContaining(card: HTMLElement, ...needles: string[]) {
  return Array.from(card.children).find((child): child is HTMLElement => {
    if (!(child instanceof HTMLElement)) return false;
    const text = child.textContent || "";
    return needles.every((needle) => text.includes(needle));
  }) ?? null;
}

function setData(element: HTMLElement | null | undefined, name: string, value: string) {
  if (!element) return;
  if (element.dataset[name] !== value) element.dataset[name] = value;
}

function setVar(card: HTMLElement, name: string, value: string) {
  if (!value) return;
  if (card.style.getPropertyValue(name) !== value) card.style.setProperty(name, value);
}

function decorateCard(card: HTMLElement, template: BaseTemplate, premiumStyle: PremiumStyle) {
  setData(card, "gradlyEnhanced", "true");
  setData(card, "gradlyBaseTemplate", template);
  setData(card, "gradlyDesign", premiumStyle);

  const schoolHeading = card.querySelector<HTMLHeadingElement>("h2");
  const header = schoolHeading?.closest<HTMLElement>(".relative");
  const headerRow = header?.querySelector<HTMLElement>("div.flex.items-center.gap-4");
  const logoBox = headerRow?.firstElementChild instanceof HTMLElement ? headerRow.firstElementChild : null;
  const reportBlock = headerRow?.lastElementChild instanceof HTMLElement ? headerRow.lastElementChild : null;
  const student = directChildContaining(card, "Father / Guardian", "Roll Number");
  const marks = card.querySelector<HTMLTableElement>("table")?.parentElement;
  const summary = directChildContaining(card, "Overall Grade", "Class Position", "Result");
  const remarks = directChildContaining(card, "Principal's Remarks");
  const verification = directChildContaining(card, "Official Verification");
  const signatures = directChildContaining(card, "Class Teacher", "Principal / Head");

  setData(header, "gradlySection", "header");
  setData(headerRow, "gradlySection", "headerRow");
  setData(logoBox, "gradlySection", "logo");
  setData(reportBlock, "gradlySection", "reportMeta");
  setData(student, "gradlySection", "student");
  setData(marks, "gradlySection", "marks");
  setData(summary, "gradlySection", "summary");
  setData(remarks, "gradlySection", "remarks");
  setData(verification, "gradlySection", "verification");
  setData(signatures, "gradlySection", "signatures");

  const ink = card.style.borderColor || getComputedStyle(card).borderTopColor || "#17365D";
  const accent = logoBox?.style.borderColor || header?.style.borderColor || ink;
  const wash = remarks?.style.backgroundColor || "#F6F8FA";
  setVar(card, "--gradly-ink", ink);
  setVar(card, "--gradly-accent", accent);
  setVar(card, "--gradly-wash", wash);
}

export default function ResultCardStyles() {
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [premiumStyle, setPremiumStyle] = useState<PremiumStyle>("base");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as PremiumStyle | null;
      if (saved && premiumStyles.some((style) => style.id === saved)) setPremiumStyle(saved);
    } catch {
      // Keep the editor usable when local storage is unavailable.
    }
  }, []);

  useEffect(() => {
    let disposed = false;
    let raf = 0;

    const refresh = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (disposed) return;

        const library = findDesignLibrary();
        if (library) {
          let slot = library.querySelector<HTMLElement>("[data-gradly-premium-style-slot]");
          if (!slot) {
            slot = document.createElement("div");
            slot.dataset.gradlyPremiumStyleSlot = "true";
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
    const timer = window.setInterval(refresh, 500);
    window.addEventListener("resize", refresh);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.clearInterval(timer);
      window.removeEventListener("resize", refresh);
      document.querySelector("[data-gradly-premium-style-slot]")?.remove();
    };
  }, [premiumStyle]);

  const chooseStyle = (style: PremiumStyle) => {
    setPremiumStyle(style);
    try {
      window.localStorage.setItem(STORAGE_KEY, style);
    } catch {
      // Selection still works for the current session.
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
          padding: 18px 20px !important;
          margin-top: 0 !important;
          border-width: 0 0 2px !important;
          background: linear-gradient(180deg, rgba(255,255,255,.98), rgba(248,250,252,.94)) !important;
        }
        .gradly-paper[data-gradly-enhanced="true"] [data-gradly-section="logo"] {
          height: 72px !important;
          width: 72px !important;
          padding: 5px;
          border-width: 1px !important;
          background: #fff !important;
        }
        .gradly-paper[data-gradly-enhanced="true"] [data-gradly-section="header"] h2 {
          font-size: 28px !important;
          line-height: 1.08 !important;
          letter-spacing: -.02em;
        }
        .gradly-paper[data-gradly-enhanced="true"] [data-gradly-section="reportMeta"] {
          min-width: 165px;
          padding-left: 16px;
          border-left: 1px solid var(--gradly-accent);
        }
        .gradly-paper[data-gradly-enhanced="true"] [data-gradly-section="student"] {
          margin-top: 20px !important;
          padding: 16px 18px;
          border: 1px solid color-mix(in srgb, var(--gradly-accent) 25%, #d8dee6);
          background: rgba(255,255,255,.78);
        }
        .gradly-paper[data-gradly-enhanced="true"] [data-gradly-section="marks"] {
          margin-top: 20px !important;
          border-width: 1px !important;
          border-color: color-mix(in srgb, var(--gradly-ink) 72%, #d8dee6) !important;
        }
        .gradly-paper[data-gradly-enhanced="true"] [data-gradly-section="marks"] thead {
          background: var(--gradly-ink) !important;
          color: #fff !important;
        }
        .gradly-paper[data-gradly-enhanced="true"] [data-gradly-section="marks"] thead th {
          color: #fff !important;
          font-size: 10px !important;
          text-transform: uppercase;
          letter-spacing: .08em;
          font-weight: 800 !important;
        }
        .gradly-paper[data-gradly-enhanced="true"] [data-gradly-section="marks"] tbody tr:nth-child(even) {
          background: color-mix(in srgb, var(--gradly-wash) 62%, #fff) !important;
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
          border: 1px solid color-mix(in srgb, var(--gradly-accent) 30%, #d7dde4);
          padding: 12px 10px !important;
          background: color-mix(in srgb, var(--gradly-wash) 68%, #fff);
        }
        .gradly-paper[data-gradly-enhanced="true"] [data-gradly-section="remarks"] {
          margin-top: 18px !important;
          padding: 15px 17px !important;
          border-left-width: 4px !important;
        }
        .gradly-paper[data-gradly-enhanced="true"] [data-gradly-section="verification"] {
          margin-top: 18px !important;
          padding: 12px 0 0 !important;
        }
        .gradly-paper[data-gradly-enhanced="true"] [data-gradly-section="signatures"] {
          margin-top: 26px !important;
          padding-top: 18px !important;
        }

        /* Academic — stronger institutional hierarchy. */
        .gradly-paper[data-gradly-base-template="academic"][data-gradly-design="base"] {
          border-width: 3px !important;
        }
        .gradly-paper[data-gradly-base-template="academic"][data-gradly-design="base"] [data-gradly-section="header"] {
          background: linear-gradient(90deg, var(--gradly-wash), #fff 55%) !important;
          border-bottom-width: 3px !important;
        }
        .gradly-paper[data-gradly-base-template="academic"][data-gradly-design="base"] [data-gradly-section="summary"] > div {
          border-top: 3px solid var(--gradly-ink);
        }

        /* Modern — soft card-based composition with a strong masthead. */
        .gradly-paper[data-gradly-base-template="modern"][data-gradly-design="base"] {
          border-width: 1px !important;
          border-radius: 26px;
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
        .gradly-paper[data-gradly-base-template="modern"][data-gradly-design="base"] [data-gradly-section="reportMeta"] {
          border-left-color: rgba(255,255,255,.35);
        }
        .gradly-paper[data-gradly-base-template="modern"][data-gradly-design="base"] [data-gradly-section="student"],
        .gradly-paper[data-gradly-base-template="modern"][data-gradly-design="base"] [data-gradly-section="marks"],
        .gradly-paper[data-gradly-base-template="modern"][data-gradly-design="base"] [data-gradly-section="remarks"] {
          border-radius: 16px;
          overflow: hidden;
        }
        .gradly-paper[data-gradly-base-template="modern"][data-gradly-design="base"] [data-gradly-section="summary"] > div {
          border-radius: 14px;
        }

        /* Certificate — restrained ceremonial styling instead of heavy ornament. */
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
        .gradly-paper[data-gradly-base-template="certificate"][data-gradly-design="base"] [data-gradly-section="marks"] thead {
          background: transparent !important;
          color: var(--gradly-ink) !important;
          border-bottom: 2px solid var(--gradly-ink);
        }
        .gradly-paper[data-gradly-base-template="certificate"][data-gradly-design="base"] [data-gradly-section="marks"] thead th {
          color: var(--gradly-ink) !important;
        }

        /* Executive — decisive masthead and premium summary rail. */
        .gradly-paper[data-gradly-base-template="executive"][data-gradly-design="base"] {
          border-width: 2px !important;
          border-top-width: 10px !important;
        }
        .gradly-paper[data-gradly-base-template="executive"][data-gradly-design="base"] [data-gradly-section="header"] {
          background: var(--gradly-ink) !important;
          border: 0 !important;
          margin-left: -8px;
          margin-right: -8px;
        }
        .gradly-paper[data-gradly-base-template="executive"][data-gradly-design="base"] [data-gradly-section="header"] h2,
        .gradly-paper[data-gradly-base-template="executive"][data-gradly-design="base"] [data-gradly-section="header"] p {
          color: #fff !important;
        }
        .gradly-paper[data-gradly-base-template="executive"][data-gradly-design="base"] [data-gradly-section="reportMeta"] {
          border-left-color: rgba(255,255,255,.3);
        }
        .gradly-paper[data-gradly-base-template="executive"][data-gradly-design="base"] [data-gradly-section="summary"] {
          background: var(--gradly-ink);
          gap: 1px;
        }
        .gradly-paper[data-gradly-base-template="executive"][data-gradly-design="base"] [data-gradly-section="summary"] > div {
          border: 0;
          background: var(--gradly-ink);
          color: #fff;
        }

        /* Minimal — quieter, more typographic, less boxed. */
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
        }
        .gradly-paper[data-gradly-base-template="minimal"][data-gradly-design="base"] [data-gradly-section="marks"] {
          border-left: 0 !important;
          border-right: 0 !important;
        }
        .gradly-paper[data-gradly-base-template="minimal"][data-gradly-design="base"] [data-gradly-section="marks"] thead {
          background: transparent !important;
          border-bottom: 2px solid var(--gradly-ink);
        }
        .gradly-paper[data-gradly-base-template="minimal"][data-gradly-design="base"] [data-gradly-section="marks"] thead th {
          color: var(--gradly-ink) !important;
        }
        .gradly-paper[data-gradly-base-template="minimal"][data-gradly-design="base"] [data-gradly-section="summary"] > div {
          background: transparent;
          border: 0;
          border-top: 2px solid var(--gradly-ink);
        }

        /* Heritage — official, timeless, balanced. */
        .gradly-paper[data-gradly-design="heritage"] {
          border: 8px double var(--gradly-ink) !important;
          background-color: #fffdf8 !important;
          padding: 30px !important;
        }
        .gradly-paper[data-gradly-design="heritage"]::before,
        .gradly-paper[data-gradly-design="heritage"]::after {
          content: "";
          position: absolute;
          z-index: 0;
          width: 44px;
          height: 44px;
          pointer-events: none;
        }
        .gradly-paper[data-gradly-design="heritage"]::before {
          left: 14px;
          top: 14px;
          border-left: 2px solid var(--gradly-accent);
          border-top: 2px solid var(--gradly-accent);
        }
        .gradly-paper[data-gradly-design="heritage"]::after {
          right: 14px;
          bottom: 14px;
          border-right: 2px solid var(--gradly-accent);
          border-bottom: 2px solid var(--gradly-accent);
        }
        .gradly-paper[data-gradly-design="heritage"] [data-gradly-section="header"] {
          background: transparent !important;
          border-bottom: 1px solid var(--gradly-ink) !important;
          padding-top: 22px !important;
          padding-bottom: 22px !important;
        }
        .gradly-paper[data-gradly-design="heritage"] [data-gradly-section="header"] h2 {
          font-size: 30px !important;
          letter-spacing: .04em !important;
          text-transform: uppercase;
        }
        .gradly-paper[data-gradly-design="heritage"] [data-gradly-section="logo"] {
          border-radius: 50% !important;
          border-width: 2px !important;
        }
        .gradly-paper[data-gradly-design="heritage"] [data-gradly-section="student"] {
          border: 0;
          border-top: 1px solid #ded8cb;
          border-bottom: 1px solid #ded8cb;
          background: transparent;
        }
        .gradly-paper[data-gradly-design="heritage"] [data-gradly-section="marks"] thead {
          background: transparent !important;
          border-top: 2px solid var(--gradly-ink);
          border-bottom: 2px solid var(--gradly-ink);
        }
        .gradly-paper[data-gradly-design="heritage"] [data-gradly-section="marks"] thead th {
          color: var(--gradly-ink) !important;
        }
        .gradly-paper[data-gradly-design="heritage"] [data-gradly-section="summary"] > div {
          background: transparent;
          border: 1px solid #d8d0c1;
        }
        .gradly-paper[data-gradly-design="heritage"] [data-gradly-section="remarks"] {
          background: transparent !important;
          border: 1px solid #d8d0c1 !important;
          border-left: 4px solid var(--gradly-accent) !important;
        }

        /* Editorial — contemporary Swiss-inspired hierarchy. */
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
        .gradly-paper[data-gradly-design="editorial"] [data-gradly-section="headerRow"] {
          align-items: flex-start !important;
        }
        .gradly-paper[data-gradly-design="editorial"] [data-gradly-section="header"] h2 {
          font-family: ui-sans-serif, system-ui, sans-serif !important;
          font-size: 32px !important;
          font-weight: 900 !important;
          letter-spacing: -.045em !important;
        }
        .gradly-paper[data-gradly-design="editorial"] [data-gradly-section="logo"] {
          border: 0 !important;
          border-radius: 0 !important;
          width: 64px !important;
          height: 64px !important;
          padding: 0;
        }
        .gradly-paper[data-gradly-design="editorial"] [data-gradly-section="reportMeta"] {
          border: 0;
          padding: 10px 12px;
          background: var(--gradly-ink);
          color: #fff;
        }
        .gradly-paper[data-gradly-design="editorial"] [data-gradly-section="reportMeta"] p {
          color: #fff !important;
        }
        .gradly-paper[data-gradly-design="editorial"] [data-gradly-section="student"] {
          border: 0;
          border-bottom: 1px solid #dce1e7;
          padding: 18px 0;
          background: transparent;
        }
        .gradly-paper[data-gradly-design="editorial"] [data-gradly-section="marks"] {
          border: 0 !important;
          border-top: 1px solid var(--gradly-ink) !important;
          border-bottom: 1px solid var(--gradly-ink) !important;
        }
        .gradly-paper[data-gradly-design="editorial"] [data-gradly-section="marks"] thead {
          background: var(--gradly-ink) !important;
        }
        .gradly-paper[data-gradly-design="editorial"] [data-gradly-section="summary"] {
          grid-template-columns: 1.2fr 1fr 1fr !important;
          border-top: 5px solid var(--gradly-ink) !important;
          padding-top: 8px;
        }
        .gradly-paper[data-gradly-design="editorial"] [data-gradly-section="summary"] > div {
          background: transparent;
          border: 0;
          text-align: left;
        }
        .gradly-paper[data-gradly-design="editorial"] [data-gradly-section="remarks"] {
          background: var(--gradly-wash) !important;
          border: 0 !important;
          border-left: 8px solid var(--gradly-accent) !important;
        }

        /* Signature — polished premium presentation. */
        .gradly-paper[data-gradly-design="signature"] {
          border: 2px solid var(--gradly-ink) !important;
          border-top-width: 12px !important;
          padding: 26px !important;
          background: #fff !important;
        }
        .gradly-paper[data-gradly-design="signature"] [data-gradly-section="header"] {
          border: 0 !important;
          border-radius: 0 !important;
          background: var(--gradly-ink) !important;
          padding: 22px !important;
          margin-left: -10px;
          margin-right: -10px;
        }
        .gradly-paper[data-gradly-design="signature"] [data-gradly-section="header"] h2,
        .gradly-paper[data-gradly-design="signature"] [data-gradly-section="header"] p {
          color: #fff !important;
        }
        .gradly-paper[data-gradly-design="signature"] [data-gradly-section="logo"] {
          border-radius: 14px !important;
          border: 0 !important;
          padding: 6px;
        }
        .gradly-paper[data-gradly-design="signature"] [data-gradly-section="reportMeta"] {
          border-left: 1px solid rgba(255,255,255,.32);
        }
        .gradly-paper[data-gradly-design="signature"] [data-gradly-section="student"] {
          border-radius: 14px;
          background: var(--gradly-wash);
          border-color: transparent;
        }
        .gradly-paper[data-gradly-design="signature"] [data-gradly-section="marks"] {
          border-radius: 12px;
          overflow: hidden;
        }
        .gradly-paper[data-gradly-design="signature"] [data-gradly-section="summary"] {
          background: var(--gradly-ink);
          border-radius: 12px;
          overflow: hidden;
          gap: 1px;
        }
        .gradly-paper[data-gradly-design="signature"] [data-gradly-section="summary"] > div {
          border: 0;
          background: var(--gradly-ink);
          color: #fff;
        }
        .gradly-paper[data-gradly-design="signature"] [data-gradly-section="remarks"] {
          border-radius: 12px;
          border: 0 !important;
          border-left: 5px solid var(--gradly-accent) !important;
        }
      `}</style>

      {mount && createPortal(
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
                  className={`rounded-xl border p-2.5 text-left transition ${selected ? "border-[#17365D] bg-[#17365D] text-white shadow-sm" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`grid h-7 w-7 place-items-center rounded-lg ${selected ? "bg-white/15" : "bg-gray-100 text-[#17365D]"}`}><Icon size={14} /></span>
                    <span className="text-[10px] font-black">{style.name}</span>
                  </div>
                  <p className={`mt-2 text-[9px] leading-4 ${selected ? "text-white/70" : "text-gray-400"}`}>{style.description}</p>
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
