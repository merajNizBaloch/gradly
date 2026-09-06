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
    <footer className="pointer-events-none fixed bottom-4 right-4 z-50 no-print print:hidden sm:bottom-5 sm:right-5">
      <a
        href="https://techcraftsolution.com"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Made with love by TechCraft"
        className="pointer-events-auto group flex items-center gap-2 rounded-full border border-black/5 bg-white/90 px-3 py-2 shadow-lg shadow-black/10 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      >
        <span className="text-[10px] font-medium text-gray-500">Made with</span>
        <span
          className="grid h-7 w-7 place-items-center rounded-full bg-gray-50 transition-transform duration-300 group-hover:scale-110"
          style={{ color: themeColor }}
        >
          <Heart size={14} fill="currentColor" strokeWidth={1.8} />
        </span>
        <span className="pr-1 text-xs font-semibold text-gray-600">by TechCraft</span>
      </a>
    </footer>
  );
}
