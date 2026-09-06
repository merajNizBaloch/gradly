"use client";

import { BarChart3, FileText, School, PenLine } from "lucide-react";
import { useEffect, useState } from "react";

type TabId = "school" | "marks" | "remarks" | "design";

const tabs: { id: TabId; label: string; icon: typeof School }[] = [
  { id: "school", label: "School Details", icon: School },
  { id: "marks", label: "Marks", icon: BarChart3 },
  { id: "remarks", label: "Remarks & Signatures", icon: PenLine },
  { id: "design", label: "Design", icon: FileText },
];

const panelGroups: Record<TabId, string[]> = {
  school: ["School details", "Student details"],
  marks: ["Subjects & marks"],
  remarks: ["Signatures"],
  design: ["Templates & Design"],
};

export default function SidebarTabs() {
  const [active, setActive] = useState<TabId>("school");

  useEffect(() => {
    const sidebar = document.querySelector<HTMLElement>("section.no-print.space-y-4");
    if (!sidebar) return;

    const panels = Array.from(sidebar.children).filter(
      (node): node is HTMLElement => node instanceof HTMLElement && !node.hasAttribute("data-gradly-sidebar-tabs")
    );

    const sync = (tab: TabId) => {
      panels.forEach((panel) => {
        const title = panel.querySelector(".mb-4")?.textContent?.trim() ?? "";
        const visible = panelGroups[tab].some((name) => title.includes(name));
        panel.style.display = visible ? "" : "none";
      });
    };

    sync(active);
    return () => panels.forEach((panel) => (panel.style.display = ""));
  }, [active]);

  return (
    <div
      data-gradly-sidebar-tabs
      className="sticky top-0 z-20 mb-1 overflow-hidden rounded-2xl border border-[#d9d9d4] bg-white/95 p-1.5 shadow-sm backdrop-blur"
    >
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
        {tabs.map(({ id, label, icon: Icon }) => {
          const selected = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[10px] font-bold transition sm:text-[11px] ${
                selected
                  ? "bg-[#17365D] text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
              aria-pressed={selected}
            >
              <Icon size={14} />
              <span className="leading-tight">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
