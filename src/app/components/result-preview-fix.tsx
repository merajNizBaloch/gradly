"use client";

import { useEffect } from "react";

type Size = { width: number; height: number };

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

function getCardSize(source: HTMLElement): Size {
  const previousZoom = source.style.zoom;
  const previousTransform = source.style.transform;
  source.style.zoom = "1";
  source.style.transform = "none";
  const rect = source.getBoundingClientRect();
  const width = Math.max(1, source.offsetWidth || rect.width);
  const height = Math.max(1, source.offsetHeight || rect.height);
  source.style.zoom = previousZoom;
  source.style.transform = previousTransform;
  return { width, height };
}

function findPreviewTarget(): HTMLElement | null {
  const label = Array.from(document.querySelectorAll<HTMLElement>("span")).find(
    (item) => item.textContent?.trim() === "Printed result preview",
  );
  if (!label) return null;
  const panel = label.closest("div.flex.min-h-0.flex-col");
  if (!panel) return null;
  return panel.querySelector<HTMLElement>("[data-gradly-fixed-preview]")
    ?? panel.querySelector<HTMLElement>("div.mx-auto.h-full.w-full.overflow-hidden");
}

function preparePreviewLayout(target: HTMLElement) {
  const scrollArea = target.parentElement;
  const previewRoot = scrollArea?.parentElement;
  if (!scrollArea || !previewRoot) return;

  const mobile = window.matchMedia("(max-width: 767px)").matches;

  previewRoot.style.width = "100%";
  previewRoot.style.minWidth = "0";
  previewRoot.style.height = mobile ? "58vh" : "100%";
  previewRoot.style.maxHeight = mobile ? "58vh" : "100%";
  previewRoot.style.display = "flex";
  previewRoot.style.flexDirection = "column";
  previewRoot.style.minHeight = mobile ? "360px" : "0";

  scrollArea.style.width = "100%";
  scrollArea.style.height = "100%";
  scrollArea.style.minWidth = "0";
  scrollArea.style.minHeight = "0";
  scrollArea.style.overflow = "hidden";
  scrollArea.style.display = "flex";
  scrollArea.style.alignItems = "stretch";
  scrollArea.style.justifyContent = "stretch";
  scrollArea.style.boxSizing = "border-box";

  target.style.position = "relative";
  target.style.width = "100%";
  target.style.height = "100%";
  target.style.minWidth = "0";
  target.style.minHeight = "0";
  target.style.overflow = "hidden";
  target.style.display = "block";
  target.style.padding = "12px";
  target.style.boxSizing = "border-box";
}

function buildFixedPreview(source: HTMLElement, target: HTMLElement) {
  const { width, height } = getCardSize(source);
  if (width < 20 || height < 20) return;

  const clone = source.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("script,button,input,textarea,select,.no-print").forEach((node) => node.remove());

  const dialog = target.closest("[role='dialog']");
  const draftInputs = dialog
    ? Array.from(dialog.querySelectorAll<HTMLInputElement>("input[type='text']"))
    : [];
  const draftValues = draftInputs.slice(0, 4).map((input) => input.value);
  const baseInputs = Array.from(
    document.querySelectorAll<HTMLInputElement>("section.no-print.space-y-4 input[type='text']"),
  );
  baseInputs.slice(0, 4).forEach((input, index) => {
    replaceText(clone, input.value, draftValues[index] ?? input.value);
  });

  const editorLogo = dialog?.querySelector<HTMLImageElement>("img[alt='School logo editor']");
  const cloneLogo = clone.querySelector<HTMLImageElement>("img[alt='School logo']");
  if (editorLogo && cloneLogo) cloneLogo.src = editorLogo.src;

  clone.dataset.gradlyFixedPreviewCard = "true";
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
  clone.style.zoom = "1";
  clone.style.aspectRatio = "auto";

  const host = document.createElement("div");
  host.dataset.gradlyFixedPreviewCard = "true";
  host.style.position = "absolute";
  host.style.left = "50%";
  host.style.top = "50%";
  host.style.width = `${width}px`;
  host.style.height = `${height}px`;
  host.style.minWidth = `${width}px`;
  host.style.minHeight = `${height}px`;
  host.style.flex = "0 0 auto";
  host.style.transformOrigin = "center center";
  host.appendChild(clone);

  target.replaceChildren(host);
  target.dataset.gradlyFixedPreview = "true";

  const scale = () => {
    const availableWidth = Math.max(1, target.clientWidth - 24);
    const availableHeight = Math.max(1, target.clientHeight - 24);
    const factor = Math.min(1, availableWidth / width, availableHeight / height);
    host.style.transform = `translate(-50%, -50%) scale(${factor})`;
  };

  requestAnimationFrame(scale);
  return scale;
}

function fitMainCard(source: HTMLElement) {
  const shell = source.closest<HTMLElement>(".print-shell");
  if (!shell) return;

  const { width, height } = getCardSize(source);
  const mobile = window.matchMedia("(max-width: 640px)").matches;

  source.style.flex = "0 0 auto";
  source.style.flexShrink = "0";
  source.style.maxWidth = "none";
  source.style.maxHeight = "none";
  source.style.transform = "none";

  if (!mobile) {
    source.style.zoom = "1";
    shell.style.width = "100%";
    shell.style.height = "auto";
    shell.style.minHeight = "0";
    shell.style.overflow = "auto";
    shell.style.display = "flex";
    shell.style.justifyContent = "center";
    shell.style.alignItems = "flex-start";
    return;
  }

  const factor = Math.min(1, Math.max(1, window.innerWidth - 24) / width);
  source.style.zoom = String(factor);
  shell.style.width = "100%";
  shell.style.height = `${Math.ceil(height * factor) + 12}px`;
  shell.style.minHeight = `${Math.ceil(height * factor) + 12}px`;
  shell.style.overflow = "hidden";
  shell.style.display = "flex";
  shell.style.justifyContent = "center";
  shell.style.alignItems = "flex-start";
}

export default function ResultPreviewFix() {
  useEffect(() => {
    const style = document.createElement("style");
    style.dataset.gradlyFixedCardStyle = "true";
    style.textContent = `
      .gradly-paper { flex: 0 0 auto !important; flex-shrink: 0 !important; max-width: none !important; max-height: none !important; }
      .print-shell { min-width: 0 !important; }
      [data-gradly-fixed-preview] { min-width: 0 !important; max-width: 100% !important; }
      [data-gradly-fixed-preview-card] { flex: 0 0 auto !important; }
    `;
    document.head.appendChild(style);

    let frame = 0;
    let targetObserver: MutationObserver | null = null;
    let lastSourceSize = "";

    const refresh = (forcePreviewRebuild = false) => {
      const source = document.querySelector<HTMLElement>(".gradly-paper");
      if (!source) return;
      fitMainCard(source);

      const dialog = document.querySelector<HTMLElement>("[role='dialog'][aria-labelledby='gradly-school-dialog-title']");
      const target = findPreviewTarget();
      if (!dialog || !target) {
        targetObserver?.disconnect();
        targetObserver = null;
        lastSourceSize = "";
        return;
      }

      preparePreviewLayout(target);
      const { width, height } = getCardSize(source);
      const size = `${width}x${height}`;
      const owned = Boolean(target.querySelector("[data-gradly-fixed-preview-card]"));

      if (forcePreviewRebuild || !owned || size !== lastSourceSize) {
        const scale = buildFixedPreview(source, target);
        if (scale) {
          const resizeObserver = new ResizeObserver(scale);
          resizeObserver.observe(target);
          window.setTimeout(() => resizeObserver.disconnect(), 600000);
        }
      }
      lastSourceSize = size;

      if (!targetObserver) {
        targetObserver = new MutationObserver(() => {
          if (!target.querySelector("[data-gradly-fixed-preview-card]")) {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => refresh());
          }
        });
        targetObserver.observe(target, { childList: true, subtree: true });
      }
    };

    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => refresh());
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    const onDraftInput = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      const dialog = target.closest("[role='dialog'][aria-labelledby='gradly-school-dialog-title']");
      if (!dialog || target.type !== "text") return;
      lastSourceSize = "";
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => refresh(true));
    };

    document.addEventListener("input", onDraftInput, true);
    document.addEventListener("change", onDraftInput, true);

    const interval = window.setInterval(refresh, 300);
    const onResize = () => refresh();
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    refresh();

    return () => {
      observer.disconnect();
      targetObserver?.disconnect();
      window.clearInterval(interval);
      cancelAnimationFrame(frame);
      document.removeEventListener("input", onDraftInput, true);
      document.removeEventListener("change", onDraftInput, true);
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      style.remove();
    };
  }, []);

  return null;
}
