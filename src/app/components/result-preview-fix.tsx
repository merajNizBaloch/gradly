"use client";

import { useEffect } from "react";

function replaceText(root: HTMLElement, from: string, to: string) {
  if (!from || from === to) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node: Node | null = walker.nextNode();
  while (node) {
    if (node.nodeValue?.includes(from)) nodes.push(node as Text);
    node = walker.nextNode();
  }
  nodes.forEach((text) => {
    text.nodeValue = text.nodeValue?.split(from).join(to) ?? text.nodeValue;
  });
}

function findPreviewTarget(): HTMLElement | null {
  const labels = Array.from(document.querySelectorAll<HTMLElement>("span"));
  const label = labels.find((item) => item.textContent?.trim() === "Printed result preview");
  if (!label) return null;
  const panel = label.closest("div.flex.min-h-0.flex-col");
  return panel?.querySelector<HTMLElement>("[data-gradly-fixed-preview]") ?? null;
}

function buildPreview(source: HTMLElement, target: HTMLElement) {
  const rect = source.getBoundingClientRect();
  const width = Math.max(1, rect.width || source.offsetWidth);
  const height = Math.max(1, rect.height || source.offsetHeight);
  if (width < 20 || height < 20) return false;

  const clone = source.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("script,button,input,textarea,select,.no-print").forEach((node) => node.remove());

  const dialog = target.closest("[role='dialog']");
  const fields = dialog ? Array.from(dialog.querySelectorAll<HTMLInputElement>("input[type='text']")) : [];
  const values = fields.slice(0, 4).map((input) => input.value);
  const sourceFields = Array.from(document.querySelectorAll<HTMLInputElement>("section.no-print.space-y-4 input[type='text']"));
  const baseValues = sourceFields.slice(0, 4).map((input) => input.value);
  baseValues.forEach((base, index) => replaceText(clone, base, values[index] ?? base));

  const editorLogo = dialog?.querySelector<HTMLImageElement>("img[alt='School logo editor']");
  const cloneLogo = clone.querySelector<HTMLImageElement>("img[alt='School logo']");
  if (editorLogo && cloneLogo) cloneLogo.src = editorLogo.src;
  if (!editorLogo && cloneLogo && !cloneLogo.src) cloneLogo.remove();

  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.minWidth = `${width}px`;
  clone.style.minHeight = `${height}px`;
  clone.style.maxWidth = "none";
  clone.style.maxHeight = "none";
  clone.style.flex = "0 0 auto";
  clone.style.margin = "0";
  clone.style.boxShadow = "none";
  clone.style.transform = "none";
  clone.style.aspectRatio = "auto";

  const host = document.createElement("div");
  host.style.width = `${width}px`;
  host.style.height = `${height}px`;
  host.style.flex = "0 0 auto";
  host.style.transformOrigin = "top left";
  host.appendChild(clone);

  target.replaceChildren(host);
  target.style.position = "relative";
  target.style.overflow = "auto";
  target.style.display = "flex";
  target.style.alignItems = "flex-start";
  target.style.justifyContent = "center";
  target.style.padding = "12px";
  target.style.boxSizing = "border-box";

  const scale = () => {
    const availableWidth = Math.max(1, target.clientWidth - 24);
    const availableHeight = Math.max(1, target.clientHeight - 24);
    const factor = Math.min(1, availableWidth / width, availableHeight / height);
    host.style.transform = `scale(${factor})`;
    host.style.marginBottom = `${Math.max(0, height * factor - height)}px`;
  };
  scale();
  return true;
}

export default function ResultPreviewFix() {
  useEffect(() => {
    const style = document.createElement("style");
    style.setAttribute("data-gradly-fixed-card-style", "true");
    style.textContent = `
      .gradly-paper {
        flex: 0 0 auto !important;
        flex-shrink: 0 !important;
        max-width: none !important;
      }
      .print-shell {
        min-width: 0 !important;
        overflow: auto !important;
      }
    `;
    document.head.appendChild(style);

    let frame = 0;
    let lastSourceSize = "";
    let lastModalState = false;

    const refresh = () => {
      const source = document.querySelector<HTMLElement>(".gradly-paper");
      if (!source) return;
      const dialog = document.querySelector<HTMLElement>("[role='dialog'][aria-labelledby='gradly-school-dialog-title']");
      const target = findPreviewTarget();
      const rect = source.getBoundingClientRect();
      const size = `${Math.round(rect.width)}x${Math.round(rect.height)}`;
      const modalState = Boolean(dialog && target);
      if (modalState && (size !== lastSourceSize || !lastModalState || target?.childElementCount === 0)) {
        buildPreview(source, target!);
      }
      lastSourceSize = size;
      lastModalState = modalState;
    };

    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(refresh);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });
    const interval = window.setInterval(refresh, 350);
    const onResize = () => refresh();
    window.addEventListener("resize", onResize);
    refresh();

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      style.remove();
    };
  }, []);

  return null;
}
