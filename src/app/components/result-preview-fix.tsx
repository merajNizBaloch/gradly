"use client";

import { useEffect } from "react";

const TEXT_FIELDS = ["school", "motto", "address", "contact"] as const;

type DraftValues = Record<(typeof TEXT_FIELDS)[number], string>;

function readDraft(dialog: HTMLElement | null): DraftValues | null {
  if (!dialog) return null;
  const inputs = Array.from(dialog.querySelectorAll<HTMLInputElement>("input[type='text']"));
  if (inputs.length < 4) return null;
  return {
    school: inputs[0]?.value ?? "",
    motto: inputs[1]?.value ?? "",
    address: inputs[2]?.value ?? "",
    contact: inputs[3]?.value ?? "",
  };
}

function replaceText(root: HTMLElement, from: string, to: string) {
  if (!from || from === to) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node = walker.nextNode();
  while (node) {
    if (node.nodeValue?.includes(from)) nodes.push(node as Text);
    node = walker.nextNode();
  }
  nodes.forEach((text) => {
    text.nodeValue = text.nodeValue?.split(from).join(to) ?? text.nodeValue;
  });
}

function buildPreview(source: HTMLElement, target: HTMLElement, values: DraftValues) {
  const width = Math.max(1, source.offsetWidth || source.getBoundingClientRect().width);
  const height = Math.max(1, source.offsetHeight || source.getBoundingClientRect().height);
  if (!width || !height) return;

  const clone = source.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("script,button,input,textarea,select,.no-print").forEach((node) => node.remove());

  const baseInputs = Array.from(document.querySelectorAll<HTMLInputElement>("section.no-print.space-y-4 input"));
  const base = {
    school: baseInputs[0]?.value ?? "",
    motto: baseInputs[1]?.value ?? "",
    address: baseInputs[2]?.value ?? "",
    contact: baseInputs[3]?.value ?? "",
  };

  replaceText(clone, base.school, values.school);
  replaceText(clone, base.motto, values.motto);
  replaceText(clone, base.address, values.address);
  replaceText(clone, base.contact, values.contact);

  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.minWidth = `${width}px`;
  clone.style.minHeight = `${height}px`;
  clone.style.maxWidth = "none";
  clone.style.maxHeight = "none";
  clone.style.flex = "none";
  clone.style.margin = "0";
  clone.style.boxShadow = "none";
  clone.style.transform = "none";
  clone.style.zoom = "1";
  clone.style.aspectRatio = "auto";

  const frame = document.createElement("div");
  frame.style.position = "absolute";
  frame.style.inset = "12px";
  frame.style.overflow = "hidden";
  frame.style.display = "flex";
  frame.style.alignItems = "flex-start";
  frame.style.justifyContent = "center";

  const host = document.createElement("div");
  host.style.position = "relative";
  host.style.width = `${width}px`;
  host.style.height = `${height}px`;
  host.style.flex = "0 0 auto";
  host.style.transformOrigin = "top left";
  host.style.setProperty("--gradly-preview-scale", "1");
  host.appendChild(clone);
  frame.appendChild(host);
  target.replaceChildren(frame);

  const fit = () => {
    const availableWidth = Math.max(1, target.clientWidth - 24);
    const availableHeight = Math.max(1, target.clientHeight - 24);
    const scale = Math.min(1, availableWidth / width, availableHeight / height);
    host.style.transform = `scale(${scale})`;
    frame.style.alignItems = "flex-start";
    frame.style.justifyContent = "center";
  };

  fit();
  return fit;
}

function findOverlayTarget(): { dialog: HTMLElement; target: HTMLElement } | null {
  const dialog = document.querySelector<HTMLElement>("[role='dialog'][aria-labelledby='gradly-school-dialog-title']");
  if (!dialog) return null;
  const labels = Array.from(dialog.querySelectorAll("span"));
  const label = labels.find((el) => el.textContent?.trim() === "Printed result preview");
  const panel = label?.parentElement?.parentElement;
  const target = panel?.querySelector<HTMLElement>("[data-gradly-preview-target]");
  return target ? { dialog, target } : null;
}

function fitMainCard() {
  const source = document.querySelector<HTMLElement>(".gradly-paper");
  const shell = source?.closest<HTMLElement>(".print-shell");
  if (!source || !shell) return;

  source.style.flex = "0 0 auto";
  source.style.flexShrink = "0";
  source.style.maxWidth = "none";
  source.style.width = source.style.width || "210mm";
  source.style.height = source.style.height || "297mm";

  const rect = source.getBoundingClientRect();
  const width = Math.max(1, rect.width / (parseFloat(getComputedStyle(source).zoom || "1") || 1));
  const height = Math.max(1, rect.height / (parseFloat(getComputedStyle(source).zoom || "1") || 1));

  if (window.innerWidth <= 640) {
    const scale = Math.min(1, Math.max(0.05, (window.innerWidth - 24) / width));
    source.style.zoom = String(scale);
    shell.style.height = `${height * scale + 16}px`;
    shell.style.overflow = "hidden";
    shell.style.display = "flex";
    shell.style.justifyContent = "center";
  } else {
    source.style.zoom = "1";
    shell.style.height = "auto";
    shell.style.overflow = "auto";
    shell.style.display = "flex";
    shell.style.justifyContent = "center";
  }
}

export default function ResultPreviewFix() {
  useEffect(() => {
    let frame = 0;
    let resizeObserver: ResizeObserver | null = null;
    let lastValues = "";

    const refresh = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        fitMainCard();
        const found = findOverlayTarget();
        if (!found) return;

        const values = readDraft(found.dialog);
        const source = document.querySelector<HTMLElement>(".gradly-paper");
        if (!values || !source) return;
        const signature = JSON.stringify(values);
        if (signature !== lastValues || !found.target.hasAttribute("data-gradly-preview-ready")) {
          lastValues = signature;
          const fit = buildPreview(source, found.target, values);
          resizeObserver?.disconnect();
          if (fit) {
            resizeObserver = new ResizeObserver(() => fit());
            resizeObserver.observe(found.target);
          }
          found.target.setAttribute("data-gradly-preview-ready", "true");
        }
      });
    };

    const onDraftInput = (event: Event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || input.type !== "text") return;
      const dialog = input.closest("[role='dialog'][aria-labelledby='gradly-school-dialog-title']");
      if (!dialog) return;
      lastValues = "";
      refresh();
    };

    const mutationObserver = new MutationObserver(() => refresh());
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("input", onDraftInput, true);
    document.addEventListener("change", onDraftInput, true);
    window.addEventListener("resize", refresh);
    window.visualViewport?.addEventListener("resize", refresh);
    refresh();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      mutationObserver.disconnect();
      document.removeEventListener("input", onDraftInput, true);
      document.removeEventListener("change", onDraftInput, true);
      window.removeEventListener("resize", refresh);
      window.visualViewport?.removeEventListener("resize", refresh);
    };
  }, []);

  return null;
}