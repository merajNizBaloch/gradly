"use client";

import { useEffect } from "react";

type DraftValues = { school: string; motto: string; address: string; contact: string };

function getDialog(): HTMLElement | null {
  return document.querySelector<HTMLElement>("[role='dialog'][aria-labelledby='gradly-school-dialog-title']");
}

function getPreviewTarget(dialog: HTMLElement | null): HTMLElement | null {
  return dialog?.querySelector<HTMLElement>("[data-gradly-preview-target]") ?? null;
}

function getDraft(dialog: HTMLElement): DraftValues {
  return {
    school: dialog.querySelector<HTMLInputElement>("[data-gradly-school-field='school']")?.value ?? "",
    motto: dialog.querySelector<HTMLInputElement>("[data-gradly-school-field='motto']")?.value ?? "",
    address: dialog.querySelector<HTMLInputElement>("[data-gradly-school-field='address']")?.value ?? "",
    contact: dialog.querySelector<HTMLInputElement>("[data-gradly-school-field='contact']")?.value ?? "",
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
  for (const text of nodes) {
    text.nodeValue = (text.nodeValue ?? "").split(from).join(to);
  }
}

function renderPreview(source: HTMLElement, target: HTMLElement, values: DraftValues): (() => void) | null {
  const rect = source.getBoundingClientRect();
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);
  if (width < 10 || height < 10) return null;

  const clone = source.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("script,button,input,textarea,select,.no-print").forEach((node) => node.remove());

  const baseInputs = Array.from(document.querySelectorAll<HTMLInputElement>("section.no-print.space-y-4 input"));
  replaceText(clone, baseInputs[0]?.value ?? "", values.school);
  replaceText(clone, baseInputs[1]?.value ?? "", values.motto);
  replaceText(clone, baseInputs[2]?.value ?? "", values.address);
  replaceText(clone, baseInputs[3]?.value ?? "", values.contact);

  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.minWidth = `${width}px`;
  clone.style.minHeight = `${height}px`;
  clone.style.maxWidth = "none";
  clone.style.maxHeight = "none";
  clone.style.margin = "0";
  clone.style.flex = "none";
  clone.style.transform = "none";
  clone.style.zoom = "1";

  target.replaceChildren();
  target.style.position = "relative";
  target.style.overflow = "hidden";
  target.style.minHeight = "330px";

  const frame = document.createElement("div");
  frame.style.cssText = "position:absolute;left:12px;top:12px;right:12px;bottom:12px;overflow:hidden;";

  const host = document.createElement("div");
  host.style.cssText = `position:absolute;left:0;top:0;width:${width}px;height:${height}px;transform-origin:top left;`;
  host.appendChild(clone);
  frame.appendChild(host);
  target.appendChild(frame);

  const fit = () => {
    const availableWidth = Math.max(1, frame.clientWidth);
    const availableHeight = Math.max(1, frame.clientHeight);
    const scale = Math.min(1, availableWidth / width, availableHeight / height);
    host.style.transform = `scale(${scale})`;
    host.style.left = `${Math.max(0, (availableWidth - width * scale) / 2)}px`;
    host.style.top = `${Math.max(0, (availableHeight - height * scale) / 2)}px`;
  };

  fit();
  return fit;
}

function fitMainCard() {
  const source = document.querySelector<HTMLElement>(".gradly-paper");
  const shell = source?.closest<HTMLElement>(".print-shell");
  if (!source || !shell) return;

  source.style.flex = "0 0 auto";
  source.style.flexShrink = "0";
  source.style.maxWidth = "none";

  const width = source.offsetWidth;
  const height = source.offsetHeight;
  if (!width || !height) return;

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
    let frameId = 0;
    let fitPreview: (() => void) | null = null;
    let renderQueued = false;
    let lastSignature = "";
    let lastTarget: HTMLElement | null = null;

    const refresh = () => {
      if (renderQueued) return;
      renderQueued = true;
      frameId = requestAnimationFrame(() => {
        renderQueued = false;
        fitMainCard();

        const dialog = getDialog();
        const target = getPreviewTarget(dialog);
        const source = document.querySelector<HTMLElement>(".gradly-paper");

        if (!dialog || !target || !source) {
          fitPreview = null;
          return;
        }

        const values = getDraft(dialog);
        const signature = `${values.school}|${values.motto}|${values.address}|${values.contact}|${source.offsetWidth}|${source.offsetHeight}|${target.clientWidth}|${target.clientHeight}`;

        if (signature !== lastSignature || lastTarget !== target || target.childElementCount === 0) {
          lastSignature = signature;
          lastTarget = target;
          fitPreview = renderPreview(source, target, values);
        }

        fitPreview?.();
      });
    };

    const onInput = (event: Event) => {
      const element = event.target;
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        if (element.closest("[role='dialog'][aria-labelledby='gradly-school-dialog-title']")) {
          lastSignature = "";
          refresh();
        }
      }
    };

    const onClick = () => {
      window.setTimeout(refresh, 0);
      window.setTimeout(refresh, 120);
    };

    window.addEventListener("resize", refresh);
    window.visualViewport?.addEventListener("resize", refresh);
    document.addEventListener("input", onInput, true);
    document.addEventListener("change", onInput, true);
    document.addEventListener("click", onClick, true);
    refresh();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", refresh);
      window.visualViewport?.removeEventListener("resize", refresh);
      document.removeEventListener("input", onInput, true);
      document.removeEventListener("change", onInput, true);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return null;
}
