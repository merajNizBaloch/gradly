import { paperPresets, type DesignSettings } from "./workspace-model";

function paperCssSize(design: DesignSettings) {
  if (design.paperSize === "custom") {
    return {
      width: `${Math.max(80, Number(design.customWidth) || 210)}mm`,
      height: `${Math.max(100, Number(design.customHeight) || 297)}mm`,
    };
  }

  const preset = paperPresets[design.paperSize];
  return { width: preset.width, height: preset.height };
}

function copyDocumentStyles(source: Document, target: Document) {
  const pending: Promise<void>[] = [];

  source.querySelectorAll<HTMLStyleElement | HTMLLinkElement>("style, link[rel='stylesheet']").forEach((node) => {
    if (node instanceof HTMLStyleElement) {
      const style = target.createElement("style");
      style.textContent = node.textContent;
      target.head.appendChild(style);
      return;
    }

    const link = target.createElement("link");
    link.rel = "stylesheet";
    link.href = node.href;
    pending.push(new Promise<void>((resolve) => {
      link.onload = () => resolve();
      link.onerror = () => resolve();
    }));
    target.head.appendChild(link);
  });

  return pending;
}

async function waitForImages(document: Document) {
  const images = Array.from(document.images);
  await Promise.all(images.map(async (image) => {
    if (image.complete) {
      try { await image.decode(); } catch {}
      return;
    }

    await new Promise<void>((resolve) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => resolve(), { once: true });
    });
  }));
}

export async function printResultCard(design: DesignSettings) {
  const sourceScope = document.querySelector<HTMLElement>("[data-gradly-export-id='live-result']");
  const sourcePaper = sourceScope?.querySelector<HTMLElement>(".gradly-paper");

  if (!sourceScope || !sourcePaper) {
    throw new Error("The result card is not ready to print yet.");
  }

  // Open synchronously from the click event so normal popup protection does not block printing.
  const printWindow = window.open("", "gradly-result-print", "popup=yes,width=1000,height=900");
  if (!printWindow) {
    throw new Error("The print window was blocked. Allow popups for Gradly and try again.");
  }

  const printDocument = printWindow.document;
  const paper = paperCssSize(design);

  printDocument.open();
  printDocument.write("<!doctype html><html><head><meta charset='utf-8'><title>Gradly Result</title></head><body></body></html>");
  printDocument.close();

  const base = printDocument.createElement("base");
  base.href = `${window.location.origin}/`;
  printDocument.head.prepend(base);

  const stylesheetLoads = copyDocumentStyles(document, printDocument);

  // This style is intentionally appended last. It neutralizes every website-layout
  // print rule and turns the popup into exactly one physical result-card page.
  const isolation = printDocument.createElement("style");
  isolation.textContent = `
    @page { size: ${paper.width} ${paper.height}; margin: 0; }
    html, body {
      width: ${paper.width} !important;
      height: ${paper.height} !important;
      min-width: 0 !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
      background: #fff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body { display: block !important; }
    .gradly-print-document {
      display: block !important;
      width: ${paper.width} !important;
      height: ${paper.height} !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
      background: #fff !important;
    }
    .gradly-print-document .gradly-paper {
      display: flex !important;
      width: ${paper.width} !important;
      height: ${paper.height} !important;
      min-width: ${paper.width} !important;
      min-height: ${paper.height} !important;
      max-width: ${paper.width} !important;
      max-height: ${paper.height} !important;
      margin: 0 !important;
      box-shadow: none !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
      overflow: hidden !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .gradly-print-document .gradly-paper,
    .gradly-print-document .gradly-paper * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    @media print {
      html, body, .gradly-print-document {
        width: ${paper.width} !important;
        height: ${paper.height} !important;
        margin: 0 !important;
        padding: 0 !important;
      }
    }
  `;
  printDocument.head.appendChild(isolation);

  const printScope = printDocument.createElement("div");
  printScope.className = "gradly-signature-scope gradly-print-document";
  const signatureStyle = sourceScope.getAttribute("style");
  if (signatureStyle) printScope.setAttribute("style", signatureStyle);
  printScope.appendChild(sourcePaper.cloneNode(true));
  printDocument.body.appendChild(printScope);

  await Promise.all(stylesheetLoads);
  await waitForImages(printDocument);
  try { await printDocument.fonts?.ready; } catch {}

  printWindow.focus();
  printWindow.addEventListener("afterprint", () => printWindow.close(), { once: true });
  // Give the print document one paint after fonts/images/styles have settled.
  await new Promise<void>((resolve) => printWindow.requestAnimationFrame(() => resolve()));
  printWindow.print();
}
