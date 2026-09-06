"use client";

import { BarChart3, FileText, PenLine, School } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type TabId = "school" | "marks" | "remarks" | "design";

const tabs: { id: TabId; label: string; shortLabel: string; icon: typeof School }[] = [
  { id: "school", label: "School Details", shortLabel: "School", icon: School },
  { id: "marks", label: "Marks", shortLabel: "Marks", icon: BarChart3 },
  { id: "remarks", label: "Remarks & Signatures", shortLabel: "Remarks", icon: PenLine },
  { id: "design", label: "Design", shortLabel: "Design", icon: FileText },
];

const panelGroups: Record<TabId, string[]> = {
  school: ["School details", "Student details"],
  marks: ["Subjects & marks"],
  remarks: ["Signatures"],
  design: ["Templates & Design"],
};

export default function SidebarTabs() {
  const [active, setActive] = useState<TabId>("school");
  const [mount, setMount] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const sidebar = document.querySelector<HTMLElement>("section.no-print.space-y-4");
    if (!sidebar) return;

    const slot = document.createElement("div");
    slot.setAttribute("data-gradly-sidebar-tabs-slot", "true");
    sidebar.insertBefore(slot, sidebar.firstElementChild);
    setMount(slot);

    return () => {
      slot.remove();
    };
  }, []);

  useEffect(() => {
    if (!mount) return;
    const sidebar = mount.parentElement;
    if (!sidebar) return;

    const panels = Array.from(sidebar.children).filter(
      (node): node is HTMLElement =>
        node instanceof HTMLElement &&
        node !== mount &&
        !node.hasAttribute("data-gradly-sidebar-tabs-slot")
    );

    panels.forEach((panel) => {
      const title = panel.querySelector(".mb-4")?.textContent?.trim() ?? "";
      const visible = panelGroups[active].some((name) => title.includes(name));
      panel.style.display = visible ? "" : "none";
    });

    return () => panels.forEach((panel) => (panel.style.display = ""));
  }, [active, mount]);

  if (!mount) return null;

  return createPortal(
    <div
      data-gradly-sidebar-tabs
      className="relative z-20 overflow-hidden rounded-2xl border border-[#d7d9dd] bg-[#111827] p-1.5 shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
    >
      <div className="flex items-center gap-2 px-2 pb-1.5 pt-1">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/55">
          Result workspace
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1">
        {tabs.map(({ id, label, shortLabel, icon: Icon }) => {
          const selected = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              title={label}
              aria-label={label}
              aria-pressed={selected}
              className={`group relative flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 transition-all duration-200 ${
                selected
                  ? "bg-white text-[#17365D] shadow-md"
                  : "text-white/65 hover:bg-white/10 hover:text-white"
              }`}
            >
              {selected && (
                <span className="absolute inset-x-4 -bottom-1 h-0.5 rounded-full bg-[#17365D]" />
              )}
              <span
                className={`grid h-7 w-7 place-items-center rounded-lg transition ${
                  selected ? "bg-[#edf2f8]" : "bg-white/5 group-hover:bg-white/10"
                }`}
              >
                <Icon size={15} strokeWidth={2.2} />
              </span>
              <span className="text-[9px] font-extrabold leading-none sm:hidden">{shortLabel}</span>
              <span className="hidden text-[9px] font-extrabold leading-none sm:block">{label}</span>
            </button>
          );
        })}
      </div>
    </div>,
    mount
  );
}
