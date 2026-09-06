"use client";

import { BarChart3, FileText, School, PenLine } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

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
  const [mount, setMount] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const findSidebar = () => {
      const sidebar = document.querySelector<HTMLElement>("section.no-print.space-y-4");
      if (sidebar) setMount(sidebar);
    };

    findSidebar();
    const observer = new MutationObserver(findSidebar);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!mount) return;

    const panels = Array.from(mount.children).filter(
      (node): node is HTMLElement => node instanceof HTMLElement && !node.hasAttribute("data-gradly-sidebar-tabs")
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
    </div>,
    mount
  );
}
