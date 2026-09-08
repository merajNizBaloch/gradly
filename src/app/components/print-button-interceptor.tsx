"use client";

import { useEffect } from "react";
import { printResultCard } from "./print-result-card";
import type { DesignSettings } from "./workspace-model";

const DESIGN_KEY = "gradly-design-v2";
const FALLBACK_DESIGN: DesignSettings = {
  template: "academic",
  theme: "academic-navy",
  paperSize: "a4",
  customWidth: "210",
  customHeight: "297",
};

function currentDesign(): DesignSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(DESIGN_KEY) || "null");
    return saved ? { ...FALLBACK_DESIGN, ...saved } : FALLBACK_DESIGN;
  } catch {
    return FALLBACK_DESIGN;
  }
}

export default function PrintButtonInterceptor() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const button = target.closest<HTMLButtonElement>("header.no-print button");
      if (!button) return;
      if (!button.textContent?.trim().includes("Print")) return;

      // Stop the original React onClick (window.print) before it reaches the button.
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      void printResultCard(currentDesign()).catch((error) => {
        window.alert(error instanceof Error ? error.message : "Could not print the result card.");
      });
    };

    window.addEventListener("click", handleClick, true);
    return () => window.removeEventListener("click", handleClick, true);
  }, []);

  return null;
}
