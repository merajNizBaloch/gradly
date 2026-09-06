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
    <footer className="no-print border-t border-[#d9d9d4] bg-[#fbfbf9] px-5 py-5 text-center print:hidden">
      <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 sm:text-sm">
        Made with
        <Heart size={14} fill="currentColor" strokeWidth={1.8} style={{ color: themeColor }} aria-label="love" />
        by
        <a
          href="https://techcraftsolution.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-gray-700 transition hover:underline"
        >
          TechCraft
        </a>
      </p>
    </footer>
  );
}
