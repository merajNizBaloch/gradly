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
    <footer className="no-print fixed bottom-4 right-4 z-50 print:hidden">
      <a
        href="https://techcraftsolution.com"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-full border border-gray-200 bg-white/95 px-3.5 py-2 shadow-lg backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-xl"
        aria-label="Made with love by TechCraft"
      >
        <span className="text-[11px] font-medium text-gray-500">Made with</span>
        <Heart
          size={15}
          fill="currentColor"
          strokeWidth={1.8}
          style={{ color: themeColor }}
          aria-hidden="true"
        />
        <span className="text-[11px] font-extrabold tracking-wide text-gray-800">by TechCraft</span>
      </a>
    </footer>
  );
}
