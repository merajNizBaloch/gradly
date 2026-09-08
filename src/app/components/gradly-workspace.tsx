"use client";

import {
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  FileText,
  HardDrive,
  ImagePlus,
  Plus,
  Printer,
  School,
  Settings2,
  Trash2,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import DesignDropdown from "./design-dropdown";
import ExportActions from "./export-actions";
import {
  clearLocalDraft,
  createLocalReportId,
  getLocalResult,
  readLocalDraft,
  saveLocalDraft,
  saveLocalResult,
  type LocalDraft,
} from "./local-results";
import RemarksFields from "./remarks-fields";
import ResultCardWithSignatures from "./result-card-with-signatures";
import SchoolSettingsModal from "./school-settings";
import SignatureFields from "./signature-fields";
import {
  defaultBands,
  defaultSchool,
  getGrade,
  initialSubjects,
  type Band,
  type DesignSettings,
  type SchoolSettings,
  type StepId,
  type Subject,
} from "./workspace-model";

const SCHOOL_KEY = "gradly-school-profile-v2";
const DESIGN_KEY = "gradly-design-v2";

const steps: Array<{ id: StepId; label: string; description: string; icon: LucideIcon }> = [
  { id: "student", label: "Student", description: "Student profile", icon: UserRound },
  { id: "marks", label: "Marks", description: "Subjects & scores", icon: BarChart3 },
  { id: "finalize", label: "Finalize", description: "Save & download", icon: CheckCircle2 },
];

const defaultDesign: DesignSettings = {
  template: "academic",
  theme: "academic-navy",
  paperSize: "a4",
  customWidth: "210",
  customHeight: "297",
};

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[.15em] text-slate-400">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full border border-[#D8E3F0] bg-white px-3.5 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#0F4AA8] focus:ring-4 focus:ring-[#1D9BF0]/10" />
    </label>
  );
}

function SectionIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#11B8B2]">{eyebrow}</p>
      <h2 className="mt-1 font-serif text-xl font-bold text-[#0B3477]">{title}</h2>
      <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
    </div>
  );
}

export default function GradlyWorkspace() {
  const searchParams = useSearchParams();
  const editReportId = searchParams.get("edit");
  const photoRef = useRef<HTMLInputElement>(null);

  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeStep, setActiveStep] = useState<StepId>("student");
  const [schoolOpen, setSchoolOpen] = useState(false);
  const [school, setSchool] = useState<SchoolSettings>(defaultSchool);
  const [design, setDesign] = useState<DesignSettings>(defaultDesign);
  const [student, setStudent] = useState("Ayesha Khan");
  const [father, setFather] = useState("Muhammad Imran Khan");
  const [roll, setRoll] = useState("HGS-2026-0148");
  const [klass, setKlass] = useState("Grade 8 — Section A");
  const [session, setSession] = useState("2025–26");
  const [exam, setExam] = useState("Annual Examination");
  const [dob, setDob] = useState("2012-08-17");
  const [attendance, setAttendance] = useState(94);
  const [position, setPosition] = useState(3);
  const [photo, setPhoto] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [bands, setBands] = useState<Band[]>(defaultBands);
  const [gradingDraft, setGradingDraft] = useState<Band[]>(defaultBands);
  const [gradingOpen, setGradingOpen] = useState(false);
  const [teacherRemarks, setTeacherRemarks] = useState("");
  const [principalRemarks, setPrincipalRemarks] = useState("");
  const [teacherSignature, setTeacherSignature] = useState("");
  const [principalSignature, setPrincipalSignature] = useState("");
  const [savedId, setSavedId] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  const applyDraft = (draft: LocalDraft) => {
    setStudent(draft.student ?? "");
    setFather(draft.father ?? "");
    setRoll(draft.roll ?? "");
    setKlass(draft.klass ?? "");
    setSession(draft.session ?? "");
    setExam(draft.exam ?? "");
    setDob(draft.dob ?? "");
    setAttendance(Number(draft.attendance ?? 0));
    setPosition(Number(draft.position ?? 0));
    setPhoto(draft.photo ?? "");
    setSubjects(Array.isArray(draft.subjects) && draft.subjects.length ? draft.subjects : initialSubjects);
    setBands(Array.isArray(draft.bands) && draft.bands.length ? draft.bands : defaultBands);
    setGradingDraft(Array.isArray(draft.bands) && draft.bands.length ? draft.bands : defaultBands);
    setTeacherRemarks(draft.teacherRemarks ?? "");
    setPrincipalRemarks(draft.principalRemarks ?? "");
    setTeacherSignature(draft.teacherSignature ?? "");
    setPrincipalSignature(draft.principalSignature ?? "");
  };

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const savedSchool = JSON.parse(localStorage.getItem(SCHOOL_KEY) || "null");
        const savedDesign = JSON.parse(localStorage.getItem(DESIGN_KEY) || "null");
        if (savedSchool) setSchool({ ...defaultSchool, ...savedSchool });
        if (savedDesign) setDesign({ ...defaultDesign, ...savedDesign });

        if (editReportId) {
          const result = await getLocalResult(editReportId);
          if (!active) return;
          if (!result) {
            setSaveError("This result is not saved in this browser.");
          } else {
            setSchool(result.school);
            setDesign(result.design);
            applyDraft(result);
            setSavedId(result.report_id);
            setSaveMessage("Loaded from this browser database.");
          }
        } else {
          const draft = readLocalDraft();
          if (draft && active) applyDraft(draft);
        }
      } catch (error) {
        if (active) setSaveError(error instanceof Error ? error.message : "Could not open browser storage.");
      } finally {
        if (active) setHydrated(true);
      }
    })();

    return () => { active = false; };
  }, [editReportId]);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(SCHOOL_KEY, JSON.stringify(school)); } catch {}
  }, [school, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(DESIGN_KEY, JSON.stringify(design)); } catch {}
  }, [design, hydrated]);

  useEffect(() => {
    if (!hydrated || editReportId) return;
    const timer = window.setTimeout(() => {
      saveLocalDraft({ school, design, student, father, roll, klass, session, exam, dob, attendance, position, photo, subjects, bands, teacherRemarks, principalRemarks, teacherSignature, principalSignature });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [hydrated, editReportId, school, design, student, father, roll, klass, session, exam, dob, attendance, position, photo, subjects, bands, teacherRemarks, principalRemarks, teacherSignature, principalSignature]);

  const totals = useMemo(() => {
    const total = subjects.reduce((sum, item) => sum + Math.max(0, item.total), 0);
    const obtained = subjects.reduce((sum, item) => sum + Math.min(Math.max(0, item.obtained), Math.max(0, item.total)), 0);
    const percent = total ? (obtained / total) * 100 : 0;
    const result: "PASS" | "FAIL" = subjects.length > 0 && subjects.every((item) => item.total > 0 && (item.obtained / item.total) * 100 >= 40) ? "PASS" : "FAIL";
    return { total, obtained, percent, result, grade: getGrade(percent, bands) };
  }, [subjects, bands]);

  const currentIndex = steps.findIndex((step) => step.id === activeStep);

  const updateSubject = (id: number, key: "name" | "total" | "obtained", value: string) => {
    setSubjects((current) => current.map((item) => item.id === id ? { ...item, [key]: key === "name" ? value : Number(value) } : item));
  };

  const readPhoto = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
  };

  const saveResult = async () => {
    setSaving(true);
    setSaveError("");
    setSaveMessage("");
    try {
      const now = new Date().toISOString();
      const reportId = savedId || editReportId || createLocalReportId();
      const saved = await saveLocalResult({
        report_id: reportId,
        created_at: now,
        updated_at: now,
        school,
        design,
        student,
        father,
        roll,
        klass,
        session,
        exam,
        dob,
        attendance,
        position,
        photo,
        subjects,
        bands,
        teacherRemarks,
        principalRemarks,
        teacherSignature,
        principalSignature,
        totals,
      });
      setSavedId(saved.report_id);
      clearLocalDraft();
      setSaveMessage("Saved in IndexedDB on this browser, including photos and signatures.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save in this browser.");
    } finally {
      setSaving(false);
    }
  };

  const nextStudent = () => {
    setStudent("");
    setFather("");
    setRoll("");
    setDob("");
    setAttendance(0);
    setPosition(0);
    setPhoto("");
    setTeacherRemarks("");
    setPrincipalRemarks("");
    setTeacherSignature("");
    setPrincipalSignature("");
    setSubjects((current) => current.map((item) => ({ ...item, obtained: 0 })));
    setSavedId("");
    setSaveMessage("");
    setSaveError("");
    clearLocalDraft();
    setActiveStep("student");
  };

  if (!hydrated) {
    return <main className="grid min-h-screen place-items-center bg-[#F4F8FC]"><div className="border border-[#D8E3F0] bg-white p-7 text-center"><img src="/gradly-logo.svg" alt="Gradly" className="mx-auto h-11 w-11" /><p className="mt-3 text-sm font-bold text-[#0B3477]">Opening Gradly browser database…</p></div></main>;
  }

  return (
    <main className="min-h-screen bg-[#F4F8FC] text-[#17324D]">
      <header className="no-print sticky top-0 z-50 border-b border-[#D8E3F0] bg-white/95 backdrop-blur-xl">
        <div className="h-1 bg-gradient-to-r from-[#0F4AA8] via-[#1D9BF0] to-[#11B8B2]" />
        <div className="mx-auto flex min-h-[70px] max-w-[1800px] items-center justify-between gap-4 px-4 sm:px-6 xl:px-8">
          <div className="flex min-w-0 items-center gap-3"><img src="/gradly-logo.svg" alt="Gradly logo" className="h-11 w-11 shrink-0" /><div className="min-w-0"><div className="font-serif text-xl font-bold text-[#0B3477]">Gradly</div><p className="truncate text-[11px] font-medium text-slate-400">{savedId ? `Browser record · ${savedId}` : "Local academic result studio"}</p></div></div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setSchoolOpen(true)} className="flex items-center gap-2 bg-[#0F4AA8] px-3.5 py-2.5 text-xs font-black text-white"><School size={15} /><span className="hidden sm:inline">School</span></button>
            <Link href="/results" className="hidden items-center gap-2 border border-[#D8E3F0] bg-white px-3.5 py-2.5 text-xs font-bold text-slate-600 sm:flex"><HardDrive size={15} /> Saved locally</Link>
            <button type="button" onClick={() => window.print()} className="flex items-center gap-2 border border-[#D8E3F0] bg-white px-3.5 py-2.5 text-xs font-black text-slate-700"><Printer size={15} /><span className="hidden sm:inline">Print</span></button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1800px] gap-4 px-4 py-4 sm:px-6 xl:h-[calc(100vh-75px)] xl:grid-cols-[210px_430px_minmax(0,1fr)] xl:px-8">
        <aside className="no-print flex flex-col bg-gradient-to-b from-[#0B3477] to-[#0F4AA8] p-3 text-white shadow-[0_18px_50px_rgba(15,74,168,.18)] xl:h-full">
          <div className="border-b border-white/10 px-3 pb-4 pt-2"><p className="text-[9px] font-black uppercase tracking-[.22em] text-[#6FE1DB]">Create result</p><h2 className="mt-2 font-serif text-xl font-bold">Student result</h2></div>
          <nav className="mt-3 space-y-1.5">
            {steps.map((step, index) => { const Icon = step.icon; const selected = activeStep === step.id; return (
              <button key={step.id} type="button" onClick={() => setActiveStep(step.id)} className={`flex w-full items-center gap-3 px-3 py-3 text-left transition ${selected ? "bg-white text-[#0F4AA8]" : "text-white/75 hover:bg-white/[.08]"}`}>
                <span className={`grid h-9 w-9 place-items-center ${selected ? "bg-[#EAF6FF] text-[#1D9BF0]" : "bg-white/[.08]"}`}><Icon size={16} /></span>
                <span className="min-w-0 flex-1"><span className="block text-[9px] font-black uppercase tracking-[.16em] opacity-50">{String(index + 1).padStart(2, "0")}</span><span className="block text-xs font-black">{step.label}</span><span className="block text-[9px] opacity-45">{step.description}</span></span>
                <ChevronRight size={14} />
              </button>
            ); })}
          </nav>
          <div className="mt-auto border-t border-white/15 px-1 pt-3">
            <div className="flex items-center justify-between"><div><p className="text-[8px] font-black uppercase tracking-[.15em] text-white/45">Live result</p><p className="mt-0.5 font-serif text-lg font-bold">{totals.percent.toFixed(1)}%</p></div><span className="text-[10px] font-black">{totals.result}</span></div>
            <div className="mt-1 flex justify-between text-[9px] text-white/45"><span>Grade {totals.grade}</span><span>{subjects.length} subjects</span></div>
          </div>
        </aside>

        <section className="no-print border border-[#D8E3F0] bg-white shadow-[0_18px_55px_rgba(15,74,168,.07)] xl:h-full xl:overflow-y-auto">
          <div className="sticky top-0 z-20 border-b border-[#E4ECF5] bg-white/95 px-5 py-4 backdrop-blur"><p className="text-[9px] font-black uppercase tracking-[.2em] text-[#11B8B2]">Step {currentIndex + 1} of 3</p><h1 className="mt-1 font-serif text-2xl font-bold text-[#0B3477]">{steps[currentIndex].label}</h1><p className="mt-1 text-xs text-slate-400">{steps[currentIndex].description}</p></div>
          <div className="p-5">
            {activeStep === "student" && <div className="space-y-5">
              <SectionIntro eyebrow="Student record" title="Student & examination" description="Text fields auto-save as a lightweight browser draft while you work." />
              <Field label="Student name" value={student} onChange={setStudent} />
              <Field label="Father / Guardian" value={father} onChange={setFather} />
              <div className="grid grid-cols-2 gap-3"><Field label="Roll number" value={roll} onChange={setRoll} /><Field label="Class & section" value={klass} onChange={setKlass} /></div>
              <div className="grid grid-cols-2 gap-3"><Field label="Session" value={session} onChange={setSession} /><Field label="Exam" value={exam} onChange={setExam} /></div>
              <Field label="Date of birth" value={dob} onChange={setDob} type="date" />
              <div className="grid grid-cols-2 gap-3"><Field label="Attendance %" value={String(attendance)} onChange={(v) => setAttendance(Number(v))} type="number" /><Field label="Class position" value={String(position)} onChange={(v) => setPosition(Number(v))} type="number" /></div>
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={(e) => readPhoto(e.target.files?.[0])} />
              <button type="button" onClick={() => photoRef.current?.click()} className="flex w-full items-center gap-3 border border-dashed border-[#C9D8E7] bg-[#F8FBFF] p-4 text-left"><span className="grid h-12 w-10 place-items-center overflow-hidden border bg-white">{photo ? <img src={photo} alt="Student" className="h-full w-full object-cover" /> : <ImagePlus size={18} />}</span><span><span className="block text-xs font-black text-slate-700">{photo ? "Student photo added" : "Add student photo"}</span><span className="text-[10px] text-slate-400">Photo is persisted when you save the result</span></span></button>
            </div>}

            {activeStep === "marks" && <div className="space-y-5">
              <SectionIntro eyebrow="Academic performance" title="Subjects & marks" description="Percentage, grade, and result calculate automatically." />
              <div className="overflow-hidden border border-[#D8E3F0] bg-white"><div className="grid grid-cols-[1fr_62px_62px_32px] gap-2 border-b bg-[#F7FAFD] px-3 py-2.5 text-[9px] font-black uppercase text-slate-400"><span>Subject</span><span>Max</span><span>Obt.</span><span /></div>{subjects.map((item) => <div key={item.id} className="grid grid-cols-[1fr_62px_62px_32px] gap-2 border-t border-[#EDF2F7] px-3 py-2.5"><input value={item.name} onChange={(e) => updateSubject(item.id, "name", e.target.value)} className="min-w-0 px-2 py-2 text-sm font-semibold outline-none" /><input type="number" value={item.total} onChange={(e) => updateSubject(item.id, "total", e.target.value)} className="border border-[#D8E3F0] px-2 py-2 text-center text-xs font-bold" /><input type="number" value={item.obtained} onChange={(e) => updateSubject(item.id, "obtained", e.target.value)} className="border border-[#D8E3F0] px-2 py-2 text-center text-xs font-bold" /><button type="button" onClick={() => setSubjects((current) => current.filter((s) => s.id !== item.id))} className="grid place-items-center text-slate-300 hover:text-rose-500"><Trash2 size={14} /></button></div>)}</div>
              <button type="button" onClick={() => setSubjects((current) => [...current, { id: Date.now(), name: "New Subject", total: 100, obtained: 0 }])} className="flex w-full items-center justify-center gap-2 border border-[#D8E3F0] bg-white py-2.5 text-xs font-black text-slate-600"><Plus size={15} /> Add subject</button>
              <button type="button" onClick={() => { setGradingDraft(bands.map((b) => ({ ...b }))); setGradingOpen(true); }} className="flex w-full items-center justify-between border border-[#D8E3F0] bg-[#F8FBFF] p-4 text-left"><span className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center bg-white text-[#0F4AA8]"><Settings2 size={15} /></span><span><span className="block text-xs font-black">Grading system</span><span className="text-[10px] text-slate-400">Customize grade thresholds</span></span></span><ChevronRight size={15} /></button>
            </div>}

            {activeStep === "finalize" && <div className="space-y-5">
              <SectionIntro eyebrow="Final actions" title="Save or download this result" description="Add remarks and signatures, then save the complete record into IndexedDB or export it." />
              <div className="grid grid-cols-3 gap-2">{[["Percentage", `${totals.percent.toFixed(1)}%`], ["Grade", totals.grade], ["Result", totals.result]].map(([label, value]) => <div key={label} className="border border-[#D8E3F0] bg-white p-3 text-center"><p className="text-[8px] font-black uppercase text-slate-400">{label}</p><p className="mt-1 text-sm font-black text-[#0F4AA8]">{value}</p></div>)}</div>
              <RemarksFields teacher={teacherRemarks} principal={principalRemarks} onTeacherChange={setTeacherRemarks} onPrincipalChange={setPrincipalRemarks} />
              <SignatureFields teacher={teacherSignature} principal={principalSignature} onTeacherChange={setTeacherSignature} onPrincipalChange={setPrincipalSignature} />

              <div className="border border-[#D8E3F0] bg-[#F8FBFF] p-4">
                <div className="flex items-start gap-3"><HardDrive className="mt-0.5 text-[#0F4AA8]" size={18} /><div><p className="text-xs font-black text-slate-800">Browser database save</p><p className="mt-1 text-[10px] leading-4 text-slate-500">Saved records, student photos and signatures use IndexedDB on this device. Nothing is sent to Supabase.</p></div></div>
                <button type="button" onClick={saveResult} disabled={saving} className="mt-3 flex w-full items-center justify-center gap-2 bg-[#0F4AA8] px-4 py-3 text-sm font-black text-white disabled:cursor-wait disabled:opacity-60"><HardDrive size={16} /> {saving ? "Saving…" : savedId ? "Update browser save" : "Save to this browser"}</button>
              </div>

              {saveMessage && <div className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700">{saveMessage}</div>}
              {saveError && <div className="border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-600">{saveError}</div>}

              <div className="border-t border-[#E4ECF5] pt-4"><p className="mb-2 text-[9px] font-black uppercase tracking-[.16em] text-slate-400">Download result</p><ExportActions student={student} design={design} targetId="live-result" /></div>

              {savedId && <button type="button" onClick={nextStudent} className="flex w-full items-center justify-center gap-2 border border-[#0F4AA8] bg-white px-4 py-3 text-sm font-black text-[#0F4AA8]"><UserRound size={16} /> Start next student</button>}
              <Link href="/results" className="flex w-full items-center justify-center gap-2 border border-[#D8E3F0] bg-white px-4 py-3 text-sm font-black text-slate-600"><FileText size={16} /> Open saved browser results</Link>
            </div>}
          </div>

          <div className="sticky bottom-0 flex items-center justify-between border-t border-[#E4ECF5] bg-white/95 px-5 py-4 backdrop-blur"><button type="button" disabled={currentIndex === 0} onClick={() => setActiveStep(steps[Math.max(0, currentIndex - 1)].id)} className="border border-[#D8E3F0] bg-white px-4 py-2.5 text-xs font-black text-slate-600 disabled:opacity-40">Previous</button>{activeStep !== "finalize" ? <button type="button" onClick={() => setActiveStep(steps[currentIndex + 1].id)} className="flex items-center gap-2 bg-[#0F4AA8] px-4 py-2.5 text-xs font-black text-white">Next <ChevronRight size={14} /></button> : <span className="text-[10px] font-bold text-slate-400">Use the actions above</span>}</div>
        </section>

        <section className="min-h-[680px] overflow-hidden border border-[#D8E3F0] bg-[#EAF1F7] shadow-[0_18px_55px_rgba(15,74,168,.07)] xl:h-full">
          <div className="no-print flex items-center justify-between gap-3 border-b border-[#D8E3F0] bg-white px-4 py-3"><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-[#11B8B2]">Live preview</p><p className="mt-0.5 text-xs font-bold text-slate-500">Design, remarks, signatures and paper size update instantly.</p></div><DesignDropdown value={design} onChange={setDesign} /></div>
          <ResultCardWithSignatures exportId="live-result" teacherSignature={teacherSignature} principalSignature={principalSignature} school={school} design={design} student={student} father={father} roll={roll} klass={klass} session={session} exam={exam} dob={dob} attendance={attendance} position={position} photo={photo} subjects={subjects} bands={bands} teacherRemarks={teacherRemarks} principalRemarks={principalRemarks} verificationUrl="" />
        </section>
      </div>

      <SchoolSettingsModal open={schoolOpen} value={school} onChange={setSchool} onClose={() => setSchoolOpen(false)} />

      {gradingOpen && <div className="no-print fixed inset-0 z-[160] grid place-items-center bg-slate-950/55 p-3" onMouseDown={(event) => event.target === event.currentTarget && setGradingOpen(false)}><div className="w-full max-w-lg bg-white p-5 shadow-2xl"><h2 className="font-serif text-xl font-bold text-[#0B3477]">Grading system</h2><div className="mt-4 space-y-2">{gradingDraft.map((band, index) => <div key={`${band.grade}-${index}`} className="grid grid-cols-[70px_80px_1fr] gap-2"><input value={band.grade} onChange={(e) => setGradingDraft((current) => current.map((item, i) => i === index ? { ...item, grade: e.target.value } : item))} className="border border-[#D8E3F0] px-2 py-2 text-sm" /><input type="number" value={band.min} onChange={(e) => setGradingDraft((current) => current.map((item, i) => i === index ? { ...item, min: Number(e.target.value) } : item))} className="border border-[#D8E3F0] px-2 py-2 text-sm" /><input value={band.label} onChange={(e) => setGradingDraft((current) => current.map((item, i) => i === index ? { ...item, label: e.target.value } : item))} className="border border-[#D8E3F0] px-2 py-2 text-sm" /></div>)}</div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setGradingOpen(false)} className="border px-4 py-2 text-sm font-bold">Cancel</button><button type="button" onClick={() => { setBands(gradingDraft.map((b) => ({ ...b }))); setGradingOpen(false); }} className="bg-[#0F4AA8] px-4 py-2 text-sm font-black text-white"><Check size={14} className="mr-1 inline" />Apply</button></div></div></div>}
    </main>
  );
}
