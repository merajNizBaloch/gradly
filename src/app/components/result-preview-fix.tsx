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
  const label = Array.from(document.querySelectorAll<HTMLElement>("span")).find(
    (item) => item.textContent?.trim() === "Printed result preview",
  );
  if (!label) return null;

  const panel = label.closest("div.flex.min-h-0.flex-col");
  if (!panel) return null;

  return (
    panel.querySelector<HTMLElement>("[data-gradly-fixed-preview]") ??
    panel.querySelector<HTMLElement>("div.mx-auto.h-full.w-full.overflow-hidden")
  );
}

function getCardSize(source: HTMLElement) {
  return {
    width: Math.max(1, source.offsetWidth),
    height: Math.max(1, source.offsetHeight),
  };
}

function fitMainCard(source: HTMLElement) {
  const shell = source.closest<HTMLElement>(".print-shell");
  if (!shell) return;

  const { width, height } = getCardSize(source);
  const mobile = window.matchMedia("(max-width: 640px)").matches;

  source.style.flex = "0 0 auto";
  source.style.flexShrink = "0";
  source.style.maxWidth = "none";

  if (!mobile) {
    source.style.transform = "none";
    source.style.transformOrigin = "top center";
    shell.style.height = "auto";
    shell.style.minHeight = "0";
    shell.style.overflow = "auto";
    shell.style.display = "flex";
    shell.style.justifyContent = "center";
    shell.style.alignItems = "flex-start";
    return;
  }

  // Keep the document at its real print dimensions, but visually scale the
  // complete card on small screens so it fits the viewport without reflowing
  // its typography, columns, or spacing.
  const availableWidth = Math.max(1, window.innerWidth - 24);
  const factor = Math.min(1, availableWidth / width);

  source.style.transformOrigin = "top center";
  source.style.transform = `scale(${factor})`;
  shell.style.display = "flex";
  shell.style.justifyContent = "center";
  shell.style.alignItems = "flex-start";
  shell.style.overflow = "hidden";
  shell.style.width = "100%";
  shell.style.height = `${Math.ceil(height * factor) + 12}px`;
  shell.style.minHeight = `${Math.ceil(height * factor) + 12}px`;
}

function buildPreview(source: HTMLElement, target: HTMLElement) {
  const { width, height } = getCardSize(source);
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
  host.dataset.gradlyFixedPreviewCard = "true";
  host.style.width = `${width}px`;
  host.style.height = `${height}px`;
  host.style.flex = "0 0 auto";
  host.style.transformOrigin = "top left";
  host.appendChild(clone);

  target.replaceChildren(host);
  target.dataset.gradlyFixedPreview = "true";
  target.style.position = "relative";
  target.style.overflow = "hidden";
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
      }
      @media print {
        .gradly-paper {
          transform: none !important;
        }
        .print-shell {
          display: block !important;
          width: auto !important;
          height: auto !important;
          min-height: 0 !important;
          overflow: visible !important;
        }
      }
    `;
    document.head.appendChild(style);

    let frame = 0;
    let lastSourceSize = "";
    let lastModalState = false;

    const refresh = () => {
      const source = document.querySelector<HTMLElement>(".gradly-paper");
      if (!source) return;

      fitMainCard(source);

      const dialog = document.querySelector<HTMLElement>("[role='dialog'][aria-labelledby='gradly-school-dialog-title']");
      const target = findPreviewTarget();
      const { width, height } = getCardSize(source);
      const size = `${width}x${height}`;
      const modalState = Boolean(dialog && target);
      const hasFixedPreview = Boolean(target?.querySelector("[data-gradly-fixed-preview-card]"));

      if (modalState && (!hasFixedPreview || size !== lastSourceSize || !lastModalState)) {
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
