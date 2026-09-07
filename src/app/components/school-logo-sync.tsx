"use client";

import { useEffect, useRef } from "react";

type SchoolProfileDetail = {
  logo?: string;
};

const STORAGE_KEY = "gradly-school-profile";
const DIALOG_SELECTOR = "[role='dialog'][aria-labelledby='gradly-school-dialog-title']";

function getSchoolLogoInput() {
  const sidebar = document.querySelector<HTMLElement>("section.no-print.space-y-4");
  return sidebar?.querySelector<HTMLInputElement>('input[type="file"][accept="image/*"]') ?? null;
}

async function dataUrlToFile(dataUrl: string) {
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error("Could not read the school logo.");

  const blob = await response.blob();
  const subtype = blob.type.split("/")[1] || "png";
  const extension = subtype === "jpeg" ? "jpg" : subtype.replace(/[^a-z0-9.+-]/gi, "") || "png";

  return new File([blob], `gradly-school-logo.${extension}`, {
    type: blob.type || "image/png",
  });
}

async function pushLogoIntoResultState(dataUrl: string) {
  const input = getSchoolLogoInput();
  if (!input) return false;

  const file = await dataUrlToFile(dataUrl);
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

export default function SchoolLogoSync() {
  const lastAppliedLogo = useRef("");
  const dialogWasOpen = useRef(false);

  useEffect(() => {
    let disposed = false;

    const syncLogo = async (logo: string | undefined) => {
      if (!logo || logo === lastAppliedLogo.current) return;

      try {
        const applied = await pushLogoIntoResultState(logo);
        if (!disposed && applied) lastAppliedLogo.current = logo;
      } catch {
        // Keep the result editor usable even if a malformed stored image is encountered.
      }
    };

    const restoreSavedLogo = () => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (!stored) return;
        const profile = JSON.parse(stored) as SchoolProfileDetail;
        void syncLogo(profile.logo);
      } catch {
        // Ignore unavailable or invalid local storage data.
      }
    };

    const onProfile = (event: Event) => {
      const detail = (event as CustomEvent<SchoolProfileDetail>).detail;
      void syncLogo(detail?.logo);
    };

    window.addEventListener("gradly-school-profile", onProfile as EventListener);
    window.addEventListener("gradly-school-profile-draft", onProfile as EventListener);

    restoreSavedLogo();

    const observer = new MutationObserver(() => {
      const dialogIsOpen = Boolean(document.querySelector(DIALOG_SELECTOR));

      if (dialogWasOpen.current && !dialogIsOpen) {
        restoreSavedLogo();
      } else if (!dialogIsOpen && !lastAppliedLogo.current) {
        restoreSavedLogo();
      }

      dialogWasOpen.current = dialogIsOpen;
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      disposed = true;
      observer.disconnect();
      window.removeEventListener("gradly-school-profile", onProfile as EventListener);
      window.removeEventListener("gradly-school-profile-draft", onProfile as EventListener);
    };
  }, []);

  return null;
}
