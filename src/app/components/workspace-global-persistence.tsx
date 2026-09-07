"use client";

import { useEffect } from "react";

type SchoolSettings = {
  name?: string;
  motto?: string;
  address?: string;
  contact?: string;
  logo?: string;
};

type DesignSettings = {
  template?: string;
  palette?: string;
  paper?: string;
  customWidth?: string;
  customHeight?: string;
};

const SCHOOL_KEY = "gradly-global-school";
const DESIGN_KEY = "gradly-global-design";
const templateNames = ["Academic", "Modern", "Certificate", "Executive", "Minimal"];

function getEditor() {
  return Array.from(document.querySelectorAll<HTMLElement>("section.no-print")).find((section) =>
    section.className.includes("gradly-workspace-scroll") && section.querySelector("h1"),
  ) ?? null;
}

function findPanel(text: string) {
  const editor = getEditor();
  if (!editor) return null;
  return Array.from(editor.querySelectorAll<HTMLElement>(":scope > div:nth-child(2) > div")).find((node) =>
    node.textContent?.includes(text),
  ) ?? null;
}

function setNativeValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function restoreSchool(settings: SchoolSettings) {
  const panel = findPanel("School identity");
  if (!panel) return false;

  const inputs = Array.from(panel.querySelectorAll<HTMLInputElement>("input")).filter((input) => input.type !== "file");
  const values = [settings.name, settings.motto, settings.address, settings.contact];
  values.forEach((value, index) => {
    if (typeof value === "string" && inputs[index]) setNativeValue(inputs[index], value);
  });

  if (settings.logo) {
    window.dispatchEvent(new CustomEvent("gradly-school-profile", { detail: { logo: settings.logo } }));
  }
  return true;
}

function restoreDesign(settings: DesignSettings) {
  const panel = findPanel("Result card design");
  if (!panel) return false;

  let buttons = Array.from(panel.querySelectorAll<HTMLButtonElement>("button"));
  if (settings.template && templateNames.includes(settings.template)) {
    buttons.find((button) => button.textContent?.includes(settings.template!))?.click();
  }

  window.setTimeout(() => {
    const refreshed = findPanel("Result card design");
    if (!refreshed) return;
    buttons = Array.from(refreshed.querySelectorAll<HTMLButtonElement>("button"));

    if (settings.palette) {
      buttons.find((button) => (button.textContent || "").trim() === settings.palette)?.click();
    }
    if (settings.paper) {
      buttons.find((button) => (button.textContent || "").trim() === settings.paper)?.click();
    }

    if (settings.paper === "Custom") {
      window.setTimeout(() => {
        const customPanel = findPanel("Result card design");
        const inputs = customPanel
          ? Array.from(customPanel.querySelectorAll<HTMLInputElement>('input[type="number"]'))
          : [];
        if (inputs[0] && settings.customWidth) setNativeValue(inputs[0], settings.customWidth);
        if (inputs[1] && settings.customHeight) setNativeValue(inputs[1], settings.customHeight);
      }, 30);
    }
  }, 40);

  return true;
}

export default function WorkspaceGlobalPersistence() {
  useEffect(() => {
    let attempts = 0;
    let timer = 0;

    const restore = () => {
      attempts += 1;
      let school: SchoolSettings | null = null;
      let design: DesignSettings | null = null;
      try {
        const schoolRaw = localStorage.getItem(SCHOOL_KEY);
        const designRaw = localStorage.getItem(DESIGN_KEY);
        school = schoolRaw ? JSON.parse(schoolRaw) : null;
        design = designRaw ? JSON.parse(designRaw) : null;
      } catch {
        return;
      }

      const schoolDone = !school || restoreSchool(school);
      const designDone = !design || restoreDesign(design);
      if ((!schoolDone || !designDone) && attempts < 8) timer = window.setTimeout(restore, 100);
    };

    timer = window.setTimeout(restore, 320);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
