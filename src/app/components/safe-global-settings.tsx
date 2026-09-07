"use client";

import { Check, ImagePlus, LayoutTemplate, Palette, School, Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type PaperName = "A4" | "A5" | "Letter" | "Legal" | "Custom";
type SchoolProfile = {
  name: string;
  motto: string;
  address: string;
  contact: string;
  logo: string;
};
type Theme = { name: string; ink: string; wash: string; accent: string };
type DesignTemplate = { name: string; description: string; themes: Theme[] };
type DesignState = { template: string; palette: string; paper: PaperName; customWidth?: string; customHeight?: string };

type Panel = "school" | "design" | null;

const SCHOOL_KEY = "gradly-global-school";
const PROFILE_KEY = "gradly-school-profile";
const DESIGN_KEY = "gradly-global-design";

const defaultSchool: SchoolProfile = {
  name: "Horizon Grammar School",
  motto: "Excellence · Character · Future",
  address: "Main Campus · Quetta, Balochistan",
  contact: "+92 300 0000000 · info@school.edu",
  logo: "",
};

const designs: DesignTemplate[] = [
  {
    name: "Academic",
    description: "Formal institutional report",
    themes: [
      { name: "Navy", ink: "#17365D", wash: "#F3F6F9", accent: "#17365D" },
      { name: "Emerald", ink: "#155E4A", wash: "#F1F8F5", accent: "#167A5B" },
      { name: "Burgundy", ink: "#6B2435", wash: "#FBF3F5", accent: "#9B3A50" },
      { name: "Plum", ink: "#4B315F", wash: "#F7F3F9", accent: "#74518B" },
    ],
  },
  {
    name: "Modern",
    description: "Contemporary rounded layout",
    themes: [
      { name: "Ocean", ink: "#155E75", wash: "#F0F9FA", accent: "#0E7490" },
      { name: "Forest", ink: "#1F5A43", wash: "#F1F8F4", accent: "#2D7A5B" },
      { name: "Coral", ink: "#9A3F3F", wash: "#FFF5F3", accent: "#C15B52" },
      { name: "Indigo", ink: "#4338A8", wash: "#F3F4FF", accent: "#5B5BD6" },
    ],
  },
  {
    name: "Certificate",
    description: "Ornate ceremonial layout",
    themes: [
      { name: "Antique Gold", ink: "#5B3A20", wash: "#FBF6EE", accent: "#A9793D" },
      { name: "Jade", ink: "#14532D", wash: "#F2F8F3", accent: "#4D8B63" },
      { name: "Crimson", ink: "#641E2B", wash: "#FBF2F4", accent: "#A54A5A" },
      { name: "Royal Blue", ink: "#253B73", wash: "#F2F5FB", accent: "#5D74B4" },
    ],
  },
  {
    name: "Executive",
    description: "Luxury leadership report",
    themes: [
      { name: "Charcoal", ink: "#252525", wash: "#F5F5F3", accent: "#6B6B66" },
      { name: "Midnight", ink: "#172554", wash: "#F1F4FA", accent: "#3D5A9B" },
      { name: "Wine", ink: "#5C1F35", wash: "#FBF2F6", accent: "#9A4968" },
      { name: "Plum", ink: "#31233D", wash: "#F6F1F8", accent: "#74558A" },
    ],
  },
  {
    name: "Minimal",
    description: "Clean compact academic",
    themes: [
      { name: "Slate", ink: "#334155", wash: "#F8FAFC", accent: "#64748B" },
      { name: "Teal", ink: "#115E59", wash: "#F0FDFA", accent: "#0F766E" },
      { name: "Olive", ink: "#465A32", wash: "#F5F8F0", accent: "#6C824D" },
      { name: "Rose", ink: "#7A3E4B", wash: "#FFF6F7", accent: "#A95D6C" },
    ],
  },
];

function loadSchool(): SchoolProfile {
  try {
    const global = JSON.parse(localStorage.getItem(SCHOOL_KEY) || "{}");
    const profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
    return { ...defaultSchool, ...global, ...profile, logo: profile.logo || global.logo || "" };
  } catch {
    return defaultSchool;
  }
}

function loadDesign(): DesignState {
  try {
    const saved = JSON.parse(localStorage.getItem(DESIGN_KEY) || "{}");
    return { template: "Academic", palette: "Navy", paper: "A4", ...saved };
  } catch {
    return { template: "Academic", palette: "Navy", paper: "A4" };
  }
}

function applyWorkflowShape() {
  const nav = document.querySelector<HTMLElement>("aside.no-print nav");
  if (!nav) return;
  const buttons = Array.from(nav.querySelectorAll<HTMLButtonElement>("button"));
  const find = (label: string) => buttons.find((button) => (button.textContent || "").includes(label));
  const institution = find("Institution");
  const design = find("Design");
  if (institution) institution.style.display = "none";
  if (design) design.style.display = "none";
  ["Student", "Marks", "Finalize"].forEach((label, index) => {
    const button = find(label);
    if (!button) return;
    button.style.display = "";
    const number = button.querySelector<HTMLElement>("span.min-w-0 > span:first-child");
    if (number) number.textContent = String(index + 1).padStart(2, "0");
  });

  const title = document.querySelector<HTMLElement>("section.no-print h1")?.textContent?.trim();
  if (title === "Institution" || title === "Design") find("Student")?.click();

  const aside = document.querySelector<HTMLElement>("aside.no-print");
  const heading = aside ? Array.from(aside.querySelectorAll("h2")).find((node) => node.textContent?.includes("Academic workflow")) : null;
  if (heading) heading.textContent = "Student result";
  const description = heading?.nextElementSibling as HTMLElement | null;
  if (description) description.textContent = "Enter student details, marks, then finalize the record.";
}

function uploadToDataUrl(file: File | undefined, onDone: (value: string) => void) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => onDone(String(reader.result));
  reader.readAsDataURL(file);
}

export default function SafeGlobalSettings() {
  const [panel, setPanel] = useState<Panel>(null);
  const [school, setSchool] = useState<SchoolProfile>(defaultSchool);
  const [design, setDesign] = useState<DesignState>({ template: "Academic", palette: "Navy", paper: "A4" });
  const schoolSnapshot = useRef<SchoolProfile>(defaultSchool);
  const designSnapshot = useRef<DesignState>({ template: "Academic", palette: "Navy", paper: "A4" });

  useEffect(() => {
    setSchool(loadSchool());
    setDesign(loadDesign());
    const timer = window.setTimeout(applyWorkflowShape, 120);
    return () => window.clearTimeout(timer);
  }, []);

  const activeTemplate = useMemo(
    () => designs.find((item) => item.name === design.template) || designs[0],
    [design.template],
  );

  const openSchool = () => {
    const current = loadSchool();
    schoolSnapshot.current = current;
    setSchool(current);
    setPanel("school");
  };

  const openDesign = () => {
    const current = loadDesign();
    designSnapshot.current = current;
    setDesign(current);
    setPanel("design");
  };

  const saveSchool = () => {
    try {
      localStorage.setItem(SCHOOL_KEY, JSON.stringify(school));
      localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...school, zoom: 100, x: 0, y: 0, removeWhite: false }));
    } catch {}
    setPanel(null);
    window.location.reload();
  };

  const saveDesign = () => {
    try { localStorage.setItem(DESIGN_KEY, JSON.stringify(design)); } catch {}
    setPanel(null);
    window.location.reload();
  };

  const cancel = () => {
    if (panel === "school") setSchool(schoolSnapshot.current);
    if (panel === "design") setDesign(designSnapshot.current);
    setPanel(null);
  };

  return (
    <>
      <div className="no-print fixed right-[235px] top-[17px] z-[70] hidden items-center gap-2 sm:flex">
        <button onClick={openSchool} className="flex items-center gap-2 rounded-xl bg-[#17365D] px-3.5 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-[#102d50]">
          <School size={15} /> School
        </button>
        <button onClick={openDesign} className="flex items-center gap-2 rounded-xl border border-[#d9d5cc] bg-white px-3.5 py-2.5 text-xs font-black text-slate-600 shadow-sm transition hover:border-[#17365D]/30 hover:text-[#17365D]">
          <LayoutTemplate size={15} /> Design
        </button>
      </div>

      <div className="no-print fixed bottom-4 left-1/2 z-[70] flex -translate-x-1/2 gap-2 sm:hidden">
        <button onClick={openSchool} className="flex items-center gap-2 rounded-xl bg-[#17365D] px-4 py-3 text-xs font-black text-white shadow-xl"><School size={15} /> School</button>
        <button onClick={openDesign} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 shadow-xl"><LayoutTemplate size={15} /> Design</button>
      </div>

      {panel && (
        <div className="no-print fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) cancel(); }}>
          <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/40 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">{panel === "school" ? "School profile" : "Result card design"}</p>
                <h2 className="mt-1 text-lg font-black text-slate-900">{panel === "school" ? "Branding & printed identity" : "Templates & appearance"}</h2>
              </div>
              <button onClick={cancel} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500" aria-label="Close"><X size={17} /></button>
            </div>

            {panel === "school" ? (
              <div className="grid min-h-0 flex-1 overflow-auto lg:grid-cols-[minmax(320px,.8fr)_minmax(420px,1.2fr)]">
                <div className="space-y-4 overflow-auto p-5">
                  {[
                    ["School name", "name"], ["Motto", "motto"], ["Address", "address"], ["Contact", "contact"],
                  ].map(([label, key]) => (
                    <label key={key} className="block">
                      <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-500">{label}</span>
                      <input value={school[key as keyof SchoolProfile]} onChange={(event) => setSchool((current) => ({ ...current, [key]: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm font-semibold outline-none focus:border-[#17365D] focus:ring-4 focus:ring-[#17365D]/10" />
                    </label>
                  ))}

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-500">Logo</p><p className="mt-1 text-[10px] text-slate-400">Transparent PNG works best.</p></div><ImagePlus size={18} className="text-slate-400" /></div>
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3 text-[11px] font-extrabold text-slate-600"><Upload size={14} /> Upload school logo<input type="file" accept="image/*" className="hidden" onChange={(event) => uploadToDataUrl(event.target.files?.[0], (logo) => setSchool((current) => ({ ...current, logo })))} /></label>
                    {school.logo && <div className="mt-3 grid min-h-32 place-items-center rounded-xl border border-slate-200 bg-white p-4"><img src={school.logo} alt="School logo preview" className="max-h-24 max-w-full object-contain" /></div>}
                  </div>
                </div>

                <div className="border-t border-slate-200 bg-slate-50 p-5 lg:border-l lg:border-t-0">
                  <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">Printed identity preview</p>
                    <div className="mt-5 rounded-xl border-4 p-6" style={{ borderColor: "#17365D" }}>
                      <div className="flex items-center gap-4 border-b-2 pb-4" style={{ borderColor: "#17365D" }}>
                        <div className="grid h-16 w-16 place-items-center overflow-hidden border bg-white" style={{ borderColor: "#17365D" }}>{school.logo ? <img src={school.logo} alt="School logo" className="h-full w-full object-contain" /> : <School size={28} className="text-[#17365D]" />}</div>
                        <div><h3 className="font-serif text-2xl font-bold text-[#17365D]">{school.name || "School name"}</h3><p className="mt-1 text-xs italic text-slate-500">{school.motto}</p><p className="mt-1 text-[10px] text-slate-500">{school.address} · {school.contact}</p></div>
                      </div>
                      <div className="mt-5 grid grid-cols-2 gap-3">{["Student information", "Examination", "Marks table", "Result summary"].map((item) => <div key={item} className="rounded-lg bg-slate-50 p-4 text-xs font-bold text-slate-400">{item}</div>)}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid min-h-0 flex-1 overflow-auto lg:grid-cols-[minmax(430px,1fr)_minmax(420px,1fr)]">
                <div className="overflow-auto p-5">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {designs.map((item) => {
                      const selected = design.template === item.name;
                      const theme = item.themes[0];
                      return <button key={item.name} onClick={() => setDesign((current) => ({ ...current, template: item.name, palette: item.themes[0].name }))} className={`overflow-hidden rounded-xl border text-left transition ${selected ? "border-[#17365D] ring-1 ring-[#17365D]/10 shadow-md" : "border-slate-200 hover:border-slate-300"}`}><div className="h-28 p-2.5" style={{ backgroundColor: theme.wash }}><div className="h-full rounded-md border bg-white p-2" style={{ borderColor: theme.ink }}><div className="h-2 w-20 rounded" style={{ backgroundColor: theme.ink }} /><div className="mt-3 space-y-2">{[1,2,3,4].map((row) => <div key={row} className="h-1.5 rounded bg-slate-200" />)}</div></div></div><div className="flex items-center justify-between p-3"><div><p className="text-xs font-black text-slate-700">{item.name}</p><p className="mt-0.5 text-[9px] text-slate-400">{item.description}</p></div>{selected && <span className="grid h-6 w-6 place-items-center rounded-full bg-[#17365D] text-white"><Check size={13} /></span>}</div></button>;
                    })}
                  </div>

                  <div className="mt-5 rounded-xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-center gap-2"><Palette size={14} className="text-[#17365D]" /><p className="text-xs font-black text-slate-700">Color system</p></div>
                    <div className="flex flex-wrap gap-2">{activeTemplate.themes.map((theme) => <button key={theme.name} onClick={() => setDesign((current) => ({ ...current, palette: theme.name }))} className={`flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-black ${design.palette === theme.name ? "border-slate-900 bg-slate-50" : "border-slate-200"}`}><span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: theme.ink }} />{theme.name}{design.palette === theme.name && <Check size={12} />}</button>)}</div>
                  </div>

                  <div className="mt-5 rounded-xl border border-slate-200 p-4">
                    <p className="mb-3 text-xs font-black text-slate-700">Paper format</p>
                    <div className="grid grid-cols-3 gap-2">{(["A4","A5","Letter","Legal","Custom"] as PaperName[]).map((paper) => <button key={paper} onClick={() => setDesign((current) => ({ ...current, paper }))} className={`rounded-xl border px-3 py-2.5 text-xs font-black ${design.paper === paper ? "border-[#17365D] bg-[#17365D] text-white" : "border-slate-200 bg-slate-50 text-slate-600"}`}>{paper}</button>)}</div>
                    {design.paper === "Custom" && <div className="mt-3 grid grid-cols-2 gap-3"><input type="number" placeholder="Width mm" value={design.customWidth || "210"} onChange={(e) => setDesign((current) => ({ ...current, customWidth: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><input type="number" placeholder="Height mm" value={design.customHeight || "297"} onChange={(e) => setDesign((current) => ({ ...current, customHeight: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></div>}
                  </div>
                </div>

                <div className="border-t border-slate-200 bg-slate-50 p-5 lg:border-l lg:border-t-0">
                  <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">Design preview</p>
                    {(() => { const theme = activeTemplate.themes.find((item) => item.name === design.palette) || activeTemplate.themes[0]; return <div className="mx-auto mt-5 max-w-sm rounded-xl border-[6px] bg-white p-5 shadow-lg" style={{ borderColor: theme.ink }}><div className="flex items-center gap-3 border-b-2 pb-3" style={{ borderColor: theme.ink }}><div className="h-12 w-12 rounded-full" style={{ backgroundColor: theme.wash, border: `1px solid ${theme.accent}` }} /><div className="flex-1"><div className="h-2 w-32 rounded" style={{ backgroundColor: theme.ink }} /><div className="mt-2 h-1.5 w-20 rounded bg-slate-200" /></div></div><div className="mt-5 space-y-3">{[1,2,3,4,5].map((row) => <div key={row} className="flex gap-2"><div className="h-2 flex-1 rounded bg-slate-200" /><div className="h-2 w-12 rounded" style={{ backgroundColor: theme.wash }} /></div>)}</div><div className="mt-5 h-16 rounded" style={{ backgroundColor: theme.wash }} /></div>; })()}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
              <button onClick={cancel} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600">Cancel</button>
              <button onClick={panel === "school" ? saveSchool : saveDesign} className="rounded-xl bg-[#17365D] px-5 py-2.5 text-sm font-black text-white">Save & apply</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
