"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const replacements: Array<[string, string]> = [
  ["Opening Gradly browser database…", "Opening Gradly…"],
  ["Browser record ·", "Result ·"],
  ["Local academic result studio", "Academic result studio"],
  ["Saved locally", "Saved results"],
  ["Restored your unsaved changes after refresh.", "Changes restored."],
  ["Loaded from this browser database.", "Result loaded."],
  ["Restored your in-progress result after refresh.", "Draft restored."],
  ["Saved in IndexedDB. Refreshing this page will keep the current result filled in.", "Result saved."],
  ["This result is not saved in this browser.", "This result could not be found."],
  ["Could not open browser storage.", "Could not load your saved work."],
  ["Could not save in this browser.", "Could not save the result."],
  ["All input fields, photos and signatures auto-save locally while you work.", "Enter the student details, then continue to marks."],
  ["The photo also survives a page refresh", "You can replace the photo anytime"],
  ["Browser database save", "Save result"],
  ["Saved records, the active draft, student photos and signatures use IndexedDB on this device. Nothing is sent to Supabase.", "Save this result so you can edit or download it later."],
  ["Open saved browser results", "Open saved results"],
  ["Browser Archive", "Saved Results"],
  ["Local archive", "Results"],
  ["Records, photos, remarks and signatures are stored in IndexedDB on this browser.", "Manage your saved student results."],
  ["Local academic records", "Academic records"],
  ["Loading browser results…", "Loading results…"],
  ["No saved browser results", "No saved results"],
  ["Could not read saved browser results.", "Could not load saved results."],
  ["Choose a format. The file is created entirely in this browser from the saved result.", "Choose a format to download this result."],
  ["IndexedDB is not available in this browser.", "Saved results are not available on this device."],
  ["Could not open browser database.", "Could not load saved results."],
  ["Browser storage upgrade is blocked. Close other Gradly tabs and try again.", "Please close other Gradly tabs and try again."],
  ["Browser database request failed.", "Could not complete the request."],
  ["Browser database transaction failed.", "Could not save your changes."],
  ["Browser database transaction was cancelled.", "The change was cancelled."],
];

function hideDeveloperOnlyStorageCard() {
  const labels = Array.from(document.querySelectorAll<HTMLElement>("p"));
  const label = labels.find((item) => item.textContent?.trim() === "IndexedDB storage");
  const card = label?.parentElement?.parentElement;
  if (card) card.style.display = "none";
}

function cleanVisibleCopy() {
  if (!document.body) return;

  hideDeveloperOnlyStorageCard();

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node) {
    let value = node.nodeValue || "";
    let nextValue = value;

    for (const [from, to] of replacements) {
      if (nextValue.includes(from)) nextValue = nextValue.split(from).join(to);
    }

    if (nextValue !== value) node.nodeValue = nextValue;
    node = walker.nextNode();
  }
}

export default function UserFacingCopy() {
  const pathname = usePathname();

  useEffect(() => {
    const timers: number[] = [];
    const schedule = (delays: number[]) => {
      for (const delay of delays) timers.push(window.setTimeout(cleanVisibleCopy, delay));
    };

    schedule([0, 80, 300, 800]);

    const onInteraction = () => schedule([0, 180, 650]);
    const onResultsChanged = () => schedule([0, 120, 400]);

    window.addEventListener("click", onInteraction, true);
    window.addEventListener("gradly-local-results-changed", onResultsChanged as EventListener);
    window.addEventListener("pageshow", cleanVisibleCopy);

    return () => {
      window.removeEventListener("click", onInteraction, true);
      window.removeEventListener("gradly-local-results-changed", onResultsChanged as EventListener);
      window.removeEventListener("pageshow", cleanVisibleCopy);
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [pathname]);

  return null;
}
