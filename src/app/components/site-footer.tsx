"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";

const DEFAULT_COLOR = "#17365D";

export default function SiteFooter() {
  const [themeColor, setThemeColor] = useState(DEFAULT_COLOR);

  useEffect(() => {
    const updateColor = () => {
      const card = document.querySelector<HTMLElement>(".gradly-paper");
      const color = card?.style.borderColor;
      if (color) setThemeColor(color);
    };

    updateColor();
    const observer = new MutationObserver(updateColor);
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["style"] });
    return () => observer.disconnect();
  }, []);

  return (
    <footer className="no-print border-t border-[#d9d9d4] bg-[#f8f8f6] px-5 py-7 text-center print:hidden">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-gray-400">
          <span className="h-px w-8 bg-gray-300 sm:w-10" />
          Gradly
          <span className="h-px w-8 bg-gray-300 sm:w-10" />
        </div>

        <div className="flex items-center gap-2.5 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm">
          <span className="text-xs font-medium text-gray-500">Made with</span>
          <span
            className="grid h-7 w-7 place-items-center rounded-full bg-gray-50"
            style={{ color: themeColor }}
          >
            <Heart size={14} fill="currentColor" strokeWidth={1.8} aria-label="love" />
          </span>
          <span className="text-xs font-medium text-gray-500">by</span>
          <a
            href="https://techcraftsolution.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-extrabold tracking-wide text-gray-800 transition hover:-translate-y-0.5 hover:underline"
          >
            TechCraft
          </a>
        </div>

        <div className="text-[10px] font-medium text-gray-400 sm:ml-1">
          Student Result Studio
        </div>
      </div>
    </footer>
  );
}
