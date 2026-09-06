"use client";

import { Check, ChevronLeft, ChevronRight, Download, Plus, Printer, RotateCcw, UserRound, BarChart3, PenLine } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type Step = 1 | 2 | 3;
const steps = [
  { id: 1 as Step, label: "Student details", short: "Student", icon: UserRound, matches: ["Student details"] },
  { id: 2 as Step, label: "Marks", short: "Marks", icon: BarChart3, matches: ["Subjects & marks"] },
  { id: 3 as Step, label: "Remarks & signatures", short: "Remarks", icon: PenLine, matches: ["Signatures", "Remarks"] },
];

function findPanels() {
  const sidebar = document.querySelector<HTMLElement>("section.no-print.space-y-4");
  if (!sidebar) return [] as HTMLElement[];
  return Array.from(sidebar.children).filter((node): node is HTMLElement => node instanceof HTMLElement && !node.hasAttribute("data-gradly-sidebar-tabs-slot") && !node.hasAttribute("data-gradly-step-workflow") && !node.hasAttribute("data-gradly-step-navigation"));
}
function panelText(panel: HTMLElement) { return panel.textContent?.replace(/\s+/g, " ").trim() ?? ""; }
function panelTitle(panel: HTMLElement) { return panel.querySelector(".mb-4")?.textContent?.trim() ?? panelText(panel).slice(0, 120); }
function findPanel(...needles: string[]) { return findPanels().find(p => { const text = panelText(p).toLowerCase(); const title = panelTitle(p).toLowerCase(); return needles.some(n => text.includes(n.toLowerCase()) || title.includes(n.toLowerCase())); }); }

function isStudentComplete() {
  const panel = findPanel("Student details");
  if (!panel) return false;
  return Array.from(panel.querySelectorAll<HTMLInputElement>("input")).filter(i => i.value.trim()).length >= 4;
}
function isMarksComplete() {
  const panel = findPanel("Subjects & marks", "Subject");
  if (!panel) return false;
  const rows = Array.from(panel.querySelectorAll<HTMLElement>("tbody tr"));
  if (!rows.length) return false;
  return rows.every(row => {
    const inputs = Array.from(row.querySelectorAll<HTMLInputElement>("input"));
    if (inputs.length < 3) return false;
    const textInputs = inputs.filter(i => i.type === "text");
    const numberInputs = inputs.filter(i => i.type === "number");
    const name = (textInputs[0] ?? inputs[0])?.value.trim() ?? "";
    const total = Number((numberInputs[0] ?? inputs[1])?.value);
    const obtained = Number((numberInputs[1] ?? inputs[2])?.value);
    return Boolean(name) && Number.isFinite(total) && total > 0 && Number.isFinite(obtained) && obtained >= 0 && obtained <= total;
  });
}
function isRemarksComplete() {
  const panel = findPanel("Signatures", "Remarks");
  if (!panel) return false;
  const hasText = Array.from(panel.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea")).some(f => f.value.trim());
  const hasSignature = Array.from(panel.querySelectorAll<HTMLImageElement>("img")).some(img => Boolean(img.src));
  return hasText || hasSignature;
}

export default function ResultStepWorkflow() {
  const [topMount, setTopMount] = useState<HTMLElement | null>(null);
  const [bottomMount, setBottomMount] = useState<HTMLElement | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [completed, setCompleted] = useState<Record<Step, boolean>>({ 1: false, 2: false, 3: false });
  const [finished, setFinished] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const refresh = () => setCompleted({ 1: isStudentComplete(), 2: isMarksComplete(), 3: isRemarksComplete() });

  useEffect(() => {
    const sidebar = document.querySelector<HTMLElement>("section.no-print.space-y-4");
    if (!sidebar) return;
    const top = document.createElement("div"); top.setAttribute("data-gradly-step-workflow", "true"); sidebar.insertBefore(top, sidebar.firstElementChild);
    const bottom = document.createElement("div"); bottom.setAttribute("data-gradly-step-navigation", "true"); sidebar.appendChild(bottom);
    setTopMount(top); setBottomMount(bottom);
    return () => { top.remove(); bottom.remove(); };
  }, []);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    document.addEventListener("input", onChange, true); document.addEventListener("change", onChange, true);
    const observer = new MutationObserver(refresh); observer.observe(document.body, { subtree: true, childList: true });
    return () => { document.removeEventListener("input", onChange, true); document.removeEventListener("change", onChange, true); observer.disconnect(); };
  }, []);

  useEffect(() => {
    const enforce = () => {
      const panels = findPanels(); const active = steps[step - 1].matches;
      panels.forEach(panel => { panel.style.display = active.some(name => panelText(panel).toLowerCase().includes(name.toLowerCase())) ? "" : "none"; });
      const oldTabs = document.querySelector<HTMLElement>("[data-gradly-sidebar-tabs]"); if (oldTabs) oldTabs.style.display = "none";
    };
    enforce(); const observer = new MutationObserver(enforce); const sidebar = document.querySelector("section.no-print.space-y-4"); if (sidebar) observer.observe(sidebar, { childList: true, subtree: true });
    const timer = window.setInterval(enforce, 250); return () => { observer.disconnect(); window.clearInterval(timer); };
  }, [step, topMount, bottomMount]);

  const currentComplete = completed[step];
  const progress = useMemo(() => finished ? 100 : step === 1 ? 33 : step === 2 ? 66 : 100, [step, finished]);
  const goNext = () => { refresh(); if (step < 3) setStep(v => (v + 1) as Step); else setFinished(true); };
  const goBack = () => { if (finished) { setFinished(false); setStep(3); } else if (step > 1) setStep(v => (v - 1) as Step); };
  const startAnother = () => { window.location.href = "/"; };
  const print = () => { setDownloadOpen(false); window.setTimeout(() => window.print(), 80); };
  if (!topMount || !bottomMount) return null;

  const header = createPortal(<div className="mb-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" data-gradly-step-workflow>
    <div className="border-b border-slate-100 px-4 pb-3 pt-4"><div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Create result</p><h2 className="mt-1 text-sm font-black text-slate-900">{finished ? "Result ready" : `Step ${step} of 3`}</h2></div>{!finished && <span className="text-[10px] font-bold text-slate-400">{progress}%</span>}</div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#17365D] transition-all duration-300" style={{ width: `${progress}%` }}/></div></div>
    {!finished && <div className="space-y-1.5 p-2">{steps.map(({id,label,icon:Icon}) => { const active=id===step; const done=completed[id] || id<step; return <button key={id} type="button" disabled={id>step || (id<step && !completed[id])} onClick={()=>id<=step&&setStep(id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${active?"bg-[#17365D] text-white shadow-sm":done?"bg-emerald-50 text-emerald-800":"bg-slate-50 text-slate-400"}`}><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${active?"bg-white/10":done?"bg-emerald-100":"bg-white"}`}>{done?<Check size={15}/>:<Icon size={15}/>}</span><span className="min-w-0 flex-1"><span className="block text-[11px] font-black">{label}</span><span className={`block text-[9px] ${active?"text-white/60":done?"text-emerald-600":"text-slate-400"}`}>{active?"Complete this step to continue":done?"Completed":"Locked until previous step"}</span></span>{active&&<span className="h-2 w-2 rounded-full bg-emerald-300"/>}</button>; })}</div>}
  </div>, topMount);

  const navigation = createPortal(<div className="sticky bottom-3 z-20 mt-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur" data-gradly-step-navigation>
    {!finished ? <div className="flex items-center justify-between gap-3"><button type="button" onClick={goBack} disabled={step===1} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-bold text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"><ChevronLeft size={14}/>Back</button><div className="text-center"><p className="text-[9px] font-bold text-slate-400">{currentComplete?"Ready to continue":"Complete the form above"}</p><p className="text-[9px] font-black text-slate-700">Step {step} of 3</p></div><button type="button" onClick={goNext} disabled={!currentComplete} className="inline-flex items-center gap-1.5 rounded-xl bg-[#17365D] px-4 py-2.5 text-[10px] font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-35">{step===3?"Finish result":"Continue"}<ChevronRight size={14}/></button></div> : <div><div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3"><div className="flex items-start gap-2"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-600 text-white"><Check size={16}/></span><div><p className="text-xs font-black text-emerald-900">All steps completed</p><p className="mt-0.5 text-[10px] leading-4 text-emerald-700">Your result card is ready. Choose how you want to output it.</p></div></div></div><div className="relative mt-3"><button type="button" onClick={()=>setDownloadOpen(v=>!v)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#17365D] px-3 py-3 text-[11px] font-extrabold text-white shadow-sm hover:shadow-md"><Download size={15}/>Download / Print</button>{downloadOpen&&<div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"><button type="button" onClick={print} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[10px] font-bold text-slate-700 hover:bg-slate-50"><Download size={14}/>Save as PDF</button><button type="button" onClick={print} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[10px] font-bold text-slate-700 hover:bg-slate-50"><Printer size={14}/>Print result</button></div>}</div><button type="button" onClick={startAnother} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-extrabold text-slate-700 hover:bg-slate-50"><Plus size={14}/>Add another result</button><button type="button" onClick={goBack} className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg px-3 py-2 text-[10px] font-bold text-slate-400 hover:bg-slate-50"><RotateCcw size={12}/>Review step 3</button></div>}
  </div>, bottomMount);
  return <>{header}{navigation}</>;
}
