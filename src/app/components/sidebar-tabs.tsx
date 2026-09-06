"use client";

import { BarChart3, FileText, ImagePlus, PenLine, School, Upload, X, ZoomIn } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type TabId = "marks" | "remarks" | "design";
type Profile = { name: string; motto: string; address: string; contact: string; logo: string; zoom: number; x: number; y: number; removeWhite: boolean };

const STORAGE_KEY = "gradly-school-profile";
const defaultProfile: Profile = {
  name: "Horizon Grammar School",
  motto: "Excellence · Character · Future",
  address: "Main Campus · Quetta, Balochistan",
  contact: "+92 300 0000000 · info@school.edu",
  logo: "",
  zoom: 100,
  x: 0,
  y: 0,
  removeWhite: false,
};

const tabs: { id: TabId; label: string; icon: typeof BarChart3 }[] = [
  { id: "marks", label: "Marks", icon: BarChart3 },
  { id: "remarks", label: "Remarks & Signatures", icon: PenLine },
  { id: "design", label: "Design", icon: FileText },
];

const panelGroups: Record<TabId, string[]> = {
  marks: ["Subjects & marks"],
  remarks: ["Signatures"],
  design: ["Templates & Design"],
};

function loadProfile(): Profile {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (!value) return defaultProfile;
    return { ...defaultProfile, ...JSON.parse(value) };
  } catch {
    return defaultProfile;
  }
}

function removeWhiteFromImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < pixels.data.length; i += 4) {
        const r = pixels.data[i], g = pixels.data[i + 1], b = pixels.data[i + 2];
        if (r > 238 && g > 238 && b > 238) pixels.data[i + 3] = 0;
      }
      ctx.putImageData(pixels, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    image.src = dataUrl;
  });
}

function applyProfileToPage(profile: Profile) {
  const inputs = Array.from(document.querySelectorAll<HTMLInputElement>("section.no-print.space-y-4 input"));
  const values = [profile.name, profile.motto, profile.address, profile.contact];
  values.forEach((value, index) => {
    const input = inputs[index];
    if (!input) return;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  const logo = document.querySelector<HTMLImageElement>("img[alt='School logo']");
  if (logo && profile.logo) {
    logo.src = profile.logo;
    logo.style.transform = `translate(${profile.x}%, ${profile.y}%) scale(${profile.zoom / 100})`;
  }
  const paper = document.querySelector<HTMLElement>(".gradly-paper");
  if (paper) {
    paper.style.backgroundImage = profile.logo
      ? `linear-gradient(rgba(255,255,255,${profile.removeWhite ? 0.72 : 0.90}),rgba(255,255,255,${profile.removeWhite ? 0.72 : 0.90})),url(\"${profile.logo}\")`
      : "none";
    paper.style.backgroundPosition = `${50 + profile.x}% ${50 + profile.y}%`;
    paper.style.backgroundSize = `${48 * profile.zoom / 100}% auto`;
    paper.style.backgroundRepeat = "no-repeat";
  }
  window.dispatchEvent(new CustomEvent("gradly-school-profile", { detail: profile }));
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#17365D] focus:ring-4 focus:ring-[#17365D]/10" />
    </label>
  );
}

function MiniResultPreview({ profile }: { profile: Profile }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-100 p-3 shadow-inner">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Live result preview</span>
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-600">Live</span>
      </div>
      <div className="mx-auto w-full max-w-[330px] overflow-hidden rounded-lg border border-slate-300 bg-white shadow-lg">
        <div className="relative min-h-[235px] p-3 text-slate-800">
          {profile.logo && (
            <img src={profile.logo} alt="Preview school logo" className="absolute left-1/2 top-3 h-12 w-12 -translate-x-1/2 object-contain" style={{ transform: `translate(calc(-50% + ${profile.x / 2}px), ${profile.y / 2}px) scale(${profile.zoom / 150})` }} />
          )}
          <div className="pt-1 text-center">
            <div className="text-[12px] font-black uppercase tracking-wide" style={{ color: "#17365D" }}>{profile.name || "School Name"}</div>
            <div className="mt-0.5 text-[7px] font-semibold text-slate-500">{profile.motto || "School motto"}</div>
            <div className="mt-0.5 text-[6px] text-slate-400">{profile.address || "School address"} · {profile.contact || "Phone / email"}</div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-1.5 text-[6px]">
            {[["Student", "Ayesha Khan"], ["Class", "Grade 8 — A"], ["Roll No.", "HGS-2026-0148"], ["Session", "2025–26"]].map(([a,b]) => <div key={a} className="rounded border border-slate-200 bg-slate-50 p-1.5"><b>{a}</b><div className="mt-0.5 text-slate-500">{b}</div></div>)}
          </div>
          <table className="mt-3 w-full border-collapse text-[6px]"><thead><tr style={{ background: "rgba(23,54,93,.5)", color: "white" }}><th className="p-1 text-left">Subject</th><th className="p-1">Max Marks</th><th className="p-1">Obtained</th><th className="p-1">%</th><th className="p-1">Grade</th></tr></thead><tbody>{["English", "Mathematics", "Science", "Computer Science"].map((s, i) => <tr key={s} className="border-b border-slate-100"><td className="p-1">{s}</td><td className="p-1 text-center">100</td><td className="p-1 text-center">{86+i*2}</td><td className="p-1 text-center">{86+i*2}%</td><td className="p-1 text-center font-bold">A</td></tr>)}</tbody></table>
          <div className="mt-3 grid grid-cols-3 gap-1 text-center text-[7px]"><div className="rounded bg-slate-50 p-1.5"><b>86.8%</b><div className="text-slate-400">Overall</div></div><div className="rounded bg-slate-50 p-1.5"><b>A</b><div className="text-slate-400">Grade</div></div><div className="rounded bg-slate-50 p-1.5"><b>PASS</b><div className="text-slate-400">Result</div></div></div>
        </div>
      </div>
    </div>
  );
}

export default function SidebarTabs() {
  const [active, setActive] = useState<TabId>("marks");
  const [sidebarMount, setSidebarMount] = useState<HTMLElement | null>(null);
  const [topMount, setTopMount] = useState<HTMLElement | null>(null);
  const [schoolOpen, setSchoolOpen] = useState(false);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [draft, setDraft] = useState<Profile>(defaultProfile);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = loadProfile();
    setProfile(stored);
    setDraft(stored);
    setSaved(Boolean(localStorage.getItem(STORAGE_KEY)));
    applyProfileToPage(stored);

    const sidebar = document.querySelector<HTMLElement>("section.no-print.space-y-4");
    if (sidebar) {
      const slot = document.createElement("div");
      slot.setAttribute("data-gradly-sidebar-tabs-slot", "true");
      sidebar.insertBefore(slot, sidebar.firstElementChild);
      setSidebarMount(slot);
    }

    const header = document.querySelector<HTMLElement>("header.no-print");
    if (header) {
      const slot = document.createElement("div");
      slot.setAttribute("data-gradly-school-topbar-slot", "true");
      slot.className = "order-2 flex items-center";
      header.querySelector(":scope > div > div:last-child")?.appendChild(slot) || header.appendChild(slot);
      setTopMount(slot);
    }

    return () => {
      document.querySelector("[data-gradly-sidebar-tabs-slot]")?.remove();
      document.querySelector("[data-gradly-school-topbar-slot]")?.remove();
    };
  }, []);

  useEffect(() => {
    if (!sidebarMount) return;
    const sidebar = sidebarMount.parentElement;
    if (!sidebar) return;
    const panels = Array.from(sidebar.children).filter((node): node is HTMLElement => node instanceof HTMLElement && node !== sidebarMount && !node.hasAttribute("data-gradly-sidebar-tabs-slot"));
    panels.forEach((panel) => {
      const title = panel.querySelector(".mb-4")?.textContent?.trim() ?? "";
      panel.style.display = panelGroups[active].some((name) => title.includes(name)) ? "" : "none";
    });
    return () => panels.forEach((panel) => (panel.style.display = ""));
  }, [active, sidebarMount]);

  useEffect(() => {
    if (!schoolOpen) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && setSchoolOpen(false);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [schoolOpen]);

  useEffect(() => {
    if (schoolOpen) setDraft(profile);
  }, [schoolOpen, profile]);

  const draftPreview = useMemo(() => draft, [draft]);

  const chooseLogo = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const raw = String(reader.result);
      const logo = draft.removeWhite ? await removeWhiteFromImage(raw) : raw;
      setDraft((p) => ({ ...p, logo }));
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // A large image can exceed localStorage; the page still receives the profile for this session.
    }
    setProfile(draft);
    setSaved(true);
    applyProfileToPage(draft);
    setSchoolOpen(false);
  };

  const openSchool = () => setSchoolOpen(true);

  if (!sidebarMount && !topMount) return null;

  const schoolButton = topMount ? createPortal(
    <button type="button" onClick={openSchool} className="group flex items-center gap-2 rounded-xl border border-[#17365D]/15 bg-[#17365D] px-3.5 py-2 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" title="Edit school profile">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10"><School size={15} /></span>
      <span className="hidden sm:block">School</span>
      {saved && <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />}
    </button>, topMount) : null;

  const sidebar = sidebarMount ? createPortal(
    <div data-gradly-sidebar-tabs className="relative z-20 overflow-hidden rounded-2xl border border-[#d7d9dd] bg-[#111827] p-1.5 shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
      <div className="flex items-center gap-2 px-2 pb-1.5 pt-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /><span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/55">Result workspace</span></div>
      <div className="grid grid-cols-3 gap-1">
        {tabs.map(({ id, label, icon: Icon }) => {
          const selected = active === id;
          return <button key={id} type="button" onClick={() => setActive(id)} title={label} aria-label={label} aria-pressed={selected} className={`group relative flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 transition-all duration-200 ${selected ? "bg-white text-[#17365D] shadow-md" : "text-white/65 hover:bg-white/10 hover:text-white"}`}>
            <span className={`grid h-7 w-7 place-items-center rounded-lg ${selected ? "bg-[#edf2f8]" : "bg-white/5 group-hover:bg-white/10"}`}><Icon size={15} strokeWidth={2.2} /></span>
            <span className="text-[9px] font-extrabold leading-none">{id === "remarks" ? "Remarks" : label}</span>
          </button>;
        })}
      </div>
    </div>, sidebarMount) : null;

  const modal = schoolOpen ? createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-md sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && setSchoolOpen(false)}>
      <div role="dialog" aria-modal="true" aria-labelledby="gradly-school-dialog-title" className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-[#fbfbf9] px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#17365D] text-white"><School size={18} /></span><div><h2 id="gradly-school-dialog-title" className="text-base font-extrabold text-slate-900 sm:text-lg">School profile</h2><p className="text-xs text-slate-500">Edit the complete school identity and preview it before saving.</p></div></div>
          <button type="button" onClick={() => setSchoolOpen(false)} className="grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button>
        </div>

        <div className="grid min-h-0 flex-1 overflow-auto lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          <div className="space-y-4 border-b border-slate-100 p-5 sm:p-7 lg:border-b-0 lg:border-r">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between"><div><div className="text-xs font-extrabold text-slate-900">School identity</div><div className="text-[10px] text-slate-500">These values appear on the result card.</div></div><span className="rounded-full bg-white px-2 py-1 text-[9px] font-bold text-slate-400">Saved on this browser</span></div>
              <div className="space-y-3">
                <Field label="School name" value={draft.name} onChange={(v) => setDraft((p) => ({ ...p, name: v }))} placeholder="Enter school name" />
                <Field label="Motto / tagline" value={draft.motto} onChange={(v) => setDraft((p) => ({ ...p, motto: v }))} placeholder="School motto" />
                <Field label="School address" value={draft.address} onChange={(v) => setDraft((p) => ({ ...p, address: v }))} placeholder="Campus address" />
                <Field label="Phone / contact" value={draft.contact} onChange={(v) => setDraft((p) => ({ ...p, contact: v }))} placeholder="Phone, email or website" />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between"><div><div className="text-xs font-extrabold text-slate-900">School logo</div><div className="text-[10px] text-slate-500">Adjust it here and see the result live.</div></div><ImagePlus size={16} className="text-slate-400" /></div>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-xs font-bold text-slate-600 transition hover:border-[#17365D] hover:bg-slate-100"><Upload size={15} />{draft.logo ? "Replace school logo" : "Upload school logo"}<input type="file" accept="image/*" className="hidden" onChange={(e) => chooseLogo(e.target.files?.[0])} /></label>
              {draft.logo && <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-2.5"><div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-white"><img src={draft.logo} alt="School logo" className="h-full w-full object-contain" /></div><div className="min-w-0"><div className="text-[10px] font-bold text-slate-700">Logo controls</div><div className="mt-1 text-[9px] text-slate-400">Zoom, horizontal and vertical position.</div></div></div>}
              <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600"><input type="checkbox" checked={draft.removeWhite} onChange={async (e) => { const removeWhite = e.target.checked; if (removeWhite && draft.logo) { setDraft((p) => ({ ...p, removeWhite })); setDraft((p) => p); const processed = await removeWhiteFromImage(draft.logo); setDraft((p) => ({ ...p, logo: processed, removeWhite })); } else setDraft((p) => ({ ...p, removeWhite })); }} /> Remove white logo background</label>
              <div className="mt-4 space-y-3">
                <div><div className="mb-1 flex justify-between text-[10px] font-bold text-slate-500"><span className="flex items-center gap-1"><ZoomIn size={12} /> Zoom</span><span>{draft.zoom}%</span></div><input type="range" min="60" max="180" value={draft.zoom} onChange={(e) => setDraft((p) => ({ ...p, zoom: Number(e.target.value) }))} className="w-full" /></div>
                <div><div className="mb-1 flex justify-between text-[10px] font-bold text-slate-500"><span>Horizontal position</span><span>{draft.x}</span></div><input type="range" min="-25" max="25" value={draft.x} onChange={(e) => setDraft((p) => ({ ...p, x: Number(e.target.value) }))} className="w-full" /></div>
                <div><div className="mb-1 flex justify-between text-[10px] font-bold text-slate-500"><span>Vertical position</span><span>{draft.y}</span></div><input type="range" min="-25" max="25" value={draft.y} onChange={(e) => setDraft((p) => ({ ...p, y: Number(e.target.value) }))} className="w-full" /></div>
                <button type="button" onClick={() => setDraft((p) => ({ ...p, zoom: 100, x: 0, y: 0 }))} className="text-[10px] font-bold text-[#17365D] hover:underline">Reset logo adjustment</button>
              </div>
            </div>
          </div>

          <div className="bg-[#f3f4f6] p-4 sm:p-7"><div className="sticky top-0"><MiniResultPreview profile={draftPreview} /><div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-[10px] leading-4 text-blue-700">Nothing is changed on the actual result card until you press <b>Save school profile</b>. The preview above updates instantly while you edit.</div></div></div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7"><div className="text-[10px] text-slate-400">{saved ? "Profile saved locally on this browser." : "Create the school profile once; Gradly will remember it."}</div><div className="flex gap-2"><button type="button" onClick={() => setSchoolOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button><button type="button" onClick={saveProfile} className="rounded-xl bg-[#17365D] px-5 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">Save school profile</button></div></div>
      </div>
    </div>, document.body) : null;

  return <>{schoolButton}{sidebar}{modal}</>;
}
