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
  const fields = {
    school: dialog.querySelector<HTMLInputElement>("[data-gradly-school-field='school']"),
    motto: dialog.querySelector<HTMLInputElement>("[data-gradly-school-field='motto']"),
    address: dialog.querySelector<HTMLInputElement>("[data-gradly-school-field='address']"),
    contact: dialog.querySelector<HTMLInputElement>("[data-gradly-school-field='contact']"),
  };
  return {
    school: fields.school?.value ?? "",
    motto: fields.motto?.value ?? "",
    address: fields.address?.value ?? "",
    contact: fields.contact?.value ?? "",
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
  const sourceRect = source.getBoundingClientRect();
  const width = Math.max(1, sourceRect.width);
  const height = Math.max(1, sourceRect.height);
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

  target.innerHTML = "";
  target.style.position = "relative";
  target.style.overflow = "hidden";
  target.style.minHeight = "330px";

  const frame = document.createElement("div");
  frame.style.position = "absolute";
  frame.style.left = "12px";
  frame.style.top = "12px";
  frame.style.right = "12px";
  frame.style.bottom = "12px";
  frame.style.overflow = "hidden";

  const host = document.createElement("div");
  host.style.position = "absolute";
  host.style.left = "0";
  host.style.top = "0";
  host.style.width = `${width}px`;
  host.style.height = `${height}px`;
  host.style.transformOrigin = "top left";
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
    let raf = 0;
    let retryTimer = 0;
    let lastSignature = "";
    let fitPreview: (() => void) | null = null;
    let observedTarget: HTMLElement | null = null;

    const refresh = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        fitMainCard();

        const dialog = getDialog();
        const target = getPreviewTarget(dialog);
        const source = document.querySelector<HTMLElement>(".gradly-paper");

        if (!dialog || !target || !source) {
          retryTimer = window.setTimeout(refresh, 120);
          return;
        }

        const values = getDraft(dialog);
        const signature = JSON.stringify(values) + `|${source.offsetWidth}|${source.offsetHeight}|${target.clientWidth}|${target.clientHeight}`;
        if (signature !== lastSignature || observedTarget !== target || target.children.length === 0) {
          lastSignature = signature;
          observedTarget = target;
          fitPreview = renderPreview(source, target, values);
        }
        fitPreview?.();
      });
    };

    const onInput = (event: Event) => {
      const target = event.target;
      if (target instanceof HTMLInputElement && target.closest("[role='dialog'][aria-labelledby='gradly-school-dialog-title']")) {
        lastSignature = "";
        refresh();
      }
    };

    const observer = new MutationObserver(() => refresh());
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("input", onInput, true);
    document.addEventListener("change", onInput, true);
    window.addEventListener("resize", refresh);
    window.visualViewport?.addEventListener("resize", refresh);
    refresh();

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(retryTimer);
      observer.disconnect();
      document.removeEventListener("input", onInput, true);
      document.removeEventListener("change", onInput, true);
      window.removeEventListener("resize", refresh);
      window.visualViewport?.removeEventListener("resize", refresh);
    };
  }, []);

  return null;
}
