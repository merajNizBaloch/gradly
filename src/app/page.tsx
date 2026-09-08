"use client";

import { QRCodeSVG } from "qrcode.react";
import {
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  LayoutTemplate,
  Plus,
  Printer,
  Save,
  School,
  Settings2,
  Trash2,
  Upload,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type Subject = { id: number; name: string; total: number; obtained: number };
type Band = { grade: string; min: number; label: string };
type StepId = "student" | "marks" | "finalize";
type TemplateId = "academic" | "modern" | "certificate" | "executive" | "minimal";
type ThemeId =
  | "academic-navy" | "academic-emerald" | "academic-burgundy" | "academic-plum"
  | "modern-ocean" | "modern-forest" | "modern-coral" | "modern-indigo"
  | "certificate-gold" | "certificate-emerald" | "certificate-burgundy" | "certificate-royal"
  | "executive-charcoal" | "executive-navy" | "executive-wine" | "executive-plum"
  | "minimal-slate" | "minimal-teal" | "minimal-olive" | "minimal-rose";
type PaperSize = "a4" | "a5" | "letter" | "legal" | "custom";
type SchoolState = { name: string; motto: string; address: string; contact: string; logo: string };
type DesignState = { template: TemplateId; theme: ThemeId; paperSize: PaperSize; customWidth: string; customHeight: string };
type Theme = { id: ThemeId; name: string; ink: string; wash: string; accent: string };
type Template = { id: TemplateId; name: string; description: string; themes: Theme[] };

const SCHOOL_KEY = "gradly-global-school";
const DESIGN_KEY = "gradly-global-design-v2";
const DRAFT_KEY = "gradly-result-draft-v2";

const defaultSchool: SchoolState = {
  name: "Horizon Grammar School",
  motto: "Excellence · Character · Future",
  address: "Main Campus · Quetta, Balochistan",
  contact: "+92 300 0000000 · info@school.edu",
  logo: "",
};

const initialSubjects: Subject[] = [
  { id: 1, name: "English", total: 100, obtained: 86 },
  { id: 2, name: "Mathematics", total: 100, obtained: 91 },
  { id: 3, name: "Science", total: 100, obtained: 84 },
  { id: 4, name: "Computer Science", total: 100, obtained: 94 },
  { id: 5, name: "Social Studies", total: 100, obtained: 79 },
];

const defaultBands: Band[] = [
  { grade: "A+", min: 90, label: "Outstanding" },
  { grade: "A", min: 80, label: "Excellent" },
  { grade: "B+", min: 70, label: "Very Good" },
  { grade: "B", min: 60, label: "Good" },
  { grade: "C", min: 50, label: "Satisfactory" },
  { grade: "D", min: 40, label: "Needs Improvement" },
  { grade: "F", min: 0, label: "Fail" },
];

const templates: Template[] = [
  { id: "academic", name: "Academic", description: "Formal institutional report", themes: [
    { id: "academic-navy", name: "Navy", ink: "#17365D", wash: "#F3F6F9", accent: "#17365D" },
    { id: "academic-emerald", name: "Emerald", ink: "#155E4A", wash: "#F1F8F5", accent: "#167A5B" },
    { id: "academic-burgundy", name: "Burgundy", ink: "#6B2435", wash: "#FBF3F5", accent: "#9B3A50" },
    { id: "academic-plum", name: "Plum", ink: "#4B315F", wash: "#F7F3F9", accent: "#74518B" },
  ]},
  { id: "modern", name: "Modern", description: "Contemporary rounded layout", themes: [
    { id: "modern-ocean", name: "Ocean", ink: "#155E75", wash: "#F0F9FA", accent: "#0E7490" },
    { id: "modern-forest", name: "Forest", ink: "#1F5A43", wash: "#F1F8F4", accent: "#2D7A5B" },
    { id: "modern-coral", name: "Coral", ink: "#9A3F3F", wash: "#FFF5F3", accent: "#C15B52" },
    { id: "modern-indigo", name: "Indigo", ink: "#4338A8", wash: "#F3F4FF", accent: "#5B5BD6" },
  ]},
  { id: "certificate", name: "Certificate", description: "Formal ceremonial layout", themes: [
    { id: "certificate-gold", name: "Antique Gold", ink: "#5B3A20", wash: "#FBF6EE", accent: "#A9793D" },
    { id: "certificate-emerald", name: "Jade", ink: "#14532D", wash: "#F2F8F3", accent: "#4D8B63" },
    { id: "certificate-burgundy", name: "Crimson", ink: "#641E2B", wash: "#FBF2F4", accent: "#A54A5A" },
    { id: "certificate-royal", name: "Royal Blue", ink: "#253B73", wash: "#F2F5FB", accent: "#5D74B4" },
  ]},
  { id: "executive", name: "Executive", description: "Premium restrained report", themes: [
    { id: "executive-charcoal", name: "Charcoal", ink: "#252525", wash: "#F5F5F3", accent: "#6B6B66" },
    { id: "executive-navy", name: "Midnight", ink: "#172554", wash: "#F1F4FA", accent: "#3D5A9B" },
    { id: "executive-wine", name: "Wine", ink: "#5C1F35", wash: "#FBF2F6", accent: "#9A4968" },
    { id: "executive-plum", name: "Plum", ink: "#31233D", wash: "#F6F1F8", accent: "#74558A" },
  ]},
  { id: "minimal", name: "Minimal", description: "Compact clean report", themes: [
    { id: "minimal-slate", name: "Slate", ink: "#334155", wash: "#F8FAFC", accent: "#64748B" },
    { id: "minimal-teal", name: "Teal", ink: "#115E59", wash: "#F0FDFA", accent: "#0F766E" },
    { id: "minimal-olive", name: "Olive", ink: "#465A32", wash: "#F5F8F0", accent: "#6C824D" },
    { id: "minimal-rose", name: "Rose", ink: "#7A3E4B", wash: "#FFF6F7", accent: "#A95D6C" },
  ]},
];

const allThemes = templates.flatMap((template) => template.themes.map((theme) => ({ ...theme, templateId: template.id })));
const paperPresets = {
  a4: { label: "A4", width: "210mm", height: "297mm", ratio: 297 / 210 },
  a5: { label: "A5", width: "148mm", height: "210mm", ratio: 210 / 148 },
  letter: { label: "Letter", width: "8.5in", height: "11in", ratio: 11 / 8.5 },
  legal: { label: "Legal", width: "8.5in", height: "14in", ratio: 14 / 8.5 },
} as const;

const workflowSteps: Array<{ id: StepId; number: string; label: string; description: string; icon: LucideIcon }> = [
  { id: "student", number: "01", label: "Student", description: "Student profile", icon: UserRound },
  { id: "marks", number: "02", label: "Marks", description: "Subjects & scores", icon: BarChart3 },
  { id: "finalize", number: "03", label: "Finalize", description: "Review & export", icon: CheckCircle2 },
];

function getGrade(percent: number, bands: Band[]) {
  return [...bands].sort((a, b) => b.min - a.min).find((band) => percent >= band.min)?.grade ?? "F";
}

function autoRemark(percent: number, status: string) {
  if (status === "FAIL") return "Keep working consistently and focus on the subjects that need improvement.";
  if (percent >= 90) return "Outstanding performance. Keep aiming higher and continue your excellent work.";
  if (percent >= 80) return "Excellent performance. Continue developing consistency and curiosity.";
  if (percent >= 70) return "Very good progress. With continued effort, even stronger results are achievable.";
  if (percent >= 60) return "Good progress. Regular revision and practice will help improve further.";
  return "Satisfactory progress. More focused practice and consistent study are recommended.";
}

function readImage(file: File | undefined, setter: (value: string) => void) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => setter(String(reader.result));
  reader.readAsDataURL(file);
}

export default function Home() {
  const searchParams = useSearchParams();
  const editReportId = searchParams.get("edit");
  const schoolLogoRef = useRef<HTMLInputElement>(null);
  const studentPhotoRef = useRef<HTMLInputElement>(null);

  const [activeStep, setActiveStep] = useState<StepId>("student");
  const [schoolOpen, setSchoolOpen] = useState(false);
  const [designOpen, setDesignOpen] = useState(false);
  const [school, setSchool] = useState<SchoolState>(defaultSchool);
  const [design, setDesign] = useState<DesignState>({ template: "academic", theme: "academic-navy", paperSize: "a4", customWidth: "210", customHeight: "297" });
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
  const [bands, setBands] = useState(defaultBands);
  const [showGrading, setShowGrading] = useState(false);
  const [gradingDraft, setGradingDraft] = useState(defaultBands);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState("");
  const [saveError, setSaveError] = useState("");
  const [loadingEdit, setLoadingEdit] = useState(Boolean(editReportId));
  const [cardPulse, setCardPulse] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState("");

  const activeTemplate = useMemo(() => templates.find((item) => item.id === design.template) ?? templates[0], [design.template]);
  const activeTheme = useMemo(() => allThemes.find((item) => item.id === design.theme) ?? allThemes[0], [design.theme]);
  const totals = useMemo(() => {
    const total = subjects.reduce((sum, subject) => sum + Math.max(0, subject.total), 0);
    const obtained = subjects.reduce((sum, subject) => sum + Math.min(Math.max(0, subject.obtained), Math.max(0, subject.total)), 0);
    const percent = total ? (obtained / total) * 100 : 0;
    const result = subjects.length > 0 && subjects.every((subject) => subject.total > 0 && (subject.obtained / subject.total) * 100 >= 40) ? "PASS" : "FAIL";
    return { total, obtained, percent, grade: getGrade(percent, bands), result };
  }, [subjects, bands]);

  const paper = design.paperSize === "custom"
    ? { label: "Custom", width: `${Math.max(80, Number(design.customWidth) || 210)}mm`, height: `${Math.max(100, Number(design.customHeight) || 297)}mm`, ratio: Math.max(100, Number(design.customHeight) || 297) / Math.max(80, Number(design.customWidth) || 210) }
    : paperPresets[design.paperSize];

  useEffect(() => {
    try {
      const storedSchool = JSON.parse(localStorage.getItem(SCHOOL_KEY) || "{}");
      const storedDesign = JSON.parse(localStorage.getItem(DESIGN_KEY) || "{}");
      setSchool((current) => ({ ...current, ...storedSchool }));
      setDesign((current) => ({ ...current, ...storedDesign }));
      if (!editReportId) {
        const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
        if (draft) {
          setStudent(draft.student ?? ""); setFather(draft.father ?? ""); setRoll(draft.roll ?? ""); setKlass(draft.klass ?? "");
          setSession(draft.session ?? "2025–26"); setExam(draft.exam ?? "Annual Examination"); setDob(draft.dob ?? "");
          setAttendance(Number(draft.attendance ?? 0)); setPosition(Number(draft.position ?? 0)); setPhoto(draft.photo ?? "");
          if (Array.isArray(draft.subjects) && draft.subjects.length) setSubjects(draft.subjects);
        }
      }
    } catch {}
  }, [editReportId]);

  useEffect(() => {
    if (!editReportId) return;
    let active = true;
    (async () => {
      try {
        const response = await fetch(`/api/results/${encodeURIComponent(editReportId)}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Result not found");
        const result = data.result;
        if (!active) return;
        setSchool((current) => ({ ...current, name: result.school_name || current.name }));
        setExam(result.exam_name || ""); setSession(result.academic_session || ""); setStudent(result.student_name || "");
        setFather(result.father_guardian || ""); setRoll(result.roll_number || ""); setKlass(result.class_section || "");
        setDob(result.date_of_birth || ""); setAttendance(Number(result.attendance_present ?? 0)); setPosition(Number(result.position ?? 0));
        setPhoto(result.student_photo_url || "");
        const rows = Array.isArray(result.gradly_result_subjects) ? result.gradly_result_subjects : [];
        setSubjects(rows.map((subject: any, index: number) => ({ id: index + 1, name: subject.subject_name || "Subject", total: Number(subject.total_marks) || 0, obtained: Number(subject.obtained_marks) || 0 })));
        const storedTheme = allThemes.find((item) => item.id === result.theme || item.id === result.template);
        if (storedTheme) setDesign((current) => ({ ...current, template: storedTheme.templateId as TemplateId, theme: storedTheme.id }));
        if (Array.isArray(result.grading_scale) && result.grading_scale.length) setBands(result.grading_scale);
        setSavedId(result.report_id || editReportId);
      } catch (error) {
        if (active) setSaveError(error instanceof Error ? error.message : "Unable to load result");
      } finally {
        if (active) setLoadingEdit(false);
      }
    })();
    return () => { active = false; };
  }, [editReportId]);

  useEffect(() => {
    if (editReportId) return;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ student, father, roll, klass, session, exam, dob, attendance, position, photo, subjects }));
        setDraftSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      } catch {}
    }, 450);
    return () => window.clearTimeout(timer);
  }, [editReportId, student, father, roll, klass, session, exam, dob, attendance, position, photo, subjects]);

  const updateDesign = (patch: Partial<DesignState>) => {
    setDesign((current) => {
      const next = { ...current, ...patch };
      try { localStorage.setItem(DESIGN_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    setCardPulse(true);
    window.setTimeout(() => setCardPulse(false), 230);
  };

  const selectTemplate = (id: TemplateId) => {
    const next = templates.find((item) => item.id === id) ?? templates[0];
    updateDesign({ template: id, theme: next.themes[0].id });
  };

  const saveSchool = () => {
    try { localStorage.setItem(SCHOOL_KEY, JSON.stringify(school)); } catch {}
    setSchoolOpen(false);
  };

  const updateSubject = (id: number, key: "name" | "total" | "obtained", value: string) => {
    setSubjects((current) => current.map((subject) => subject.id === id ? { ...subject, [key]: key === "name" ? value : Number(value) } : subject));
  };

  const saveResult = async () => {
    setSaving(true); setSaveError("");
    try {
      const payload = {
        report_id: editReportId || undefined,
        school_name: school.name,
        exam_name: exam,
        academic_session: session,
        student_name: student,
        father_guardian: father,
        roll_number: roll,
        class_section: klass,
        date_of_birth: dob,
        attendance_present: attendance,
        attendance_total: 100,
        position,
        student_photo_url: photo,
        remarks: autoRemark(totals.percent, totals.result),
        template: design.template,
        theme: design.theme,
        grading_scale: bands,
        subjects: subjects.map((subject) => ({ name: subject.name, total: subject.total, obtained: subject.obtained })),
      };
      const response = await fetch(editReportId ? `/api/results/${encodeURIComponent(editReportId)}` : "/api/results", {
        method: editReportId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save result");
      setSavedId(data.result?.report_id || data.report?.report_id || editReportId || "");
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save result");
    } finally { setSaving(false); }
  };

  const nextStudent = () => {
    setStudent(""); setFather(""); setRoll(""); setDob(""); setAttendance(0); setPosition(0); setPhoto("");
    setSubjects(initialSubjects.map((subject) => ({ ...subject, obtained: 0 })));
    setSavedId(""); setSaveError(""); setActiveStep("student");
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
  };

  const verificationUrl = savedId ? `${typeof window !== "undefined" ? window.location.origin : ""}/verify/${savedId}` : "";
  const currentStepIndex = workflowSteps.findIndex((step) => step.id === activeStep);

  if (loadingEdit) {
    return <main className="grid min-h-screen place-items-center bg-[#f4f2ed] p-6"><div className="rounded-[28px] border border-[#d9d5cc] bg-[#fffdfa] p-8 text-center shadow-xl"><School className="mx-auto text-[#17365D]" /><h1 className="mt-4 font-serif text-2xl font-bold text-[#14243a]">Opening academic record</h1><p className="mt-2 text-sm text-slate-500">Loading the saved result into your workspace…</p></div></main>;
  }

  return (
    <main className="min-h-screen bg-[#f4f2ed] text-[#14243a]">
      <style jsx global>{`
        @page{size:${paper.width} ${paper.height};margin:0}
        .gradly-paper{width:${paper.width};min-height:${paper.height};aspect-ratio:${paper.ratio};box-sizing:border-box;transition:opacity .22s ease,transform .22s ease,box-shadow .22s ease}
        .gradly-paper.gradly-card-pulse{opacity:.72;transform:scale(.992);box-shadow:0 16px 46px rgba(20,36,58,.08)!important}
        @media print{html,body{width:${paper.width};min-height:${paper.height};margin:0!important;padding:0!important;background:#fff!important}.gradly-paper{width:${paper.width}!important;height:${paper.height}!important;min-height:${paper.height}!important;aspect-ratio:auto!important;box-shadow:none!important}.no-print{display:none!important}.print-shell{display:block!important;padding:0!important;margin:0!important}}
      `}</style>

      <header className="no-print sticky top-0 z-50 border-b border-[#d7d2c7] bg-[#fffdfa]/95 backdrop-blur-xl">
        <div className="h-1 bg-[#b58b48]" />
        <div className="mx-auto flex min-h-[70px] max-w-[1800px] items-center justify-between gap-4 px-4 sm:px-6 xl:px-8">
          <div className="flex min-w-0 items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-[#17365D] text-white"><School size={20} /></div><div><div className="flex items-center gap-2"><span className="font-serif text-xl font-bold">Gradly</span><span className="hidden rounded-full border border-[#ded8cc] bg-[#f8f4ec] px-2 py-0.5 text-[9px] font-black uppercase tracking-[.14em] text-[#8c6a35] sm:inline">Academic Studio</span></div><p className="truncate text-[11px] text-slate-400">{editReportId ? "Editing saved result" : "New student result"} · {student || "Untitled student"}</p></div></div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSchoolOpen(true)} className="hidden items-center gap-2 rounded-xl bg-[#17365D] px-3.5 py-2.5 text-xs font-black text-white sm:flex"><School size={15} /> School</button>
            <Link href="/results" className="hidden items-center gap-2 rounded-xl border border-[#d9d5cc] bg-white px-3.5 py-2.5 text-xs font-bold text-slate-600 sm:flex"><FileText size={15} /> Saved results</Link>
            <button onClick={() => window.print()} className="flex items-center gap-2 rounded-xl bg-[#17365D] px-4 py-2.5 text-xs font-black text-white"><Printer size={15} /><span className="hidden sm:inline">Print</span></button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1800px] gap-4 px-4 py-4 sm:px-6 xl:h-[calc(100vh-75px)] xl:grid-cols-[210px_430px_minmax(0,1fr)] xl:px-8">
        <aside className="no-print rounded-[24px] bg-[#122b49] p-3 text-white shadow-xl xl:h-full xl:overflow-y-auto">
          <div className="border-b border-white/10 px-3 pb-4 pt-2"><p className="text-[9px] font-black uppercase tracking-[.22em] text-[#d3b57c]">Create result</p><h2 className="mt-2 font-serif text-xl font-bold">Student result</h2><p className="mt-1 text-[11px] leading-5 text-white/50">Enter student details, marks, then finalize the record.</p></div>
          <nav className="mt-3 space-y-1.5">
            {workflowSteps.map((step) => { const Icon = step.icon; const selected = activeStep === step.id; return <button key={step.id} onClick={() => setActiveStep(step.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${selected ? "bg-white text-[#17365D] shadow-lg" : "text-white/70 hover:bg-white/[.08]"}`}><span className={`grid h-9 w-9 place-items-center rounded-lg ${selected ? "bg-[#f3eee4] text-[#9a743b]" : "bg-white/[.08]"}`}><Icon size={16} /></span><span className="min-w-0 flex-1"><span className={`block text-[9px] font-black uppercase tracking-[.16em] ${selected ? "text-[#a07b3f]" : "text-white/35"}`}>{step.number}</span><span className="block text-xs font-black">{step.label}</span><span className={`block truncate text-[9px] ${selected ? "text-slate-400" : "text-white/35"}`}>{step.description}</span></span><ChevronRight size={14} /></button>; })}
          </nav>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.06] p-3"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.16em] text-white/40">Live result</p><p className="mt-1 font-serif text-2xl font-bold">{totals.percent.toFixed(1)}%</p></div><span className={`rounded-lg px-2.5 py-1.5 text-[10px] font-black ${totals.result === "PASS" ? "bg-emerald-400/15 text-emerald-200" : "bg-rose-400/15 text-rose-200"}`}>{totals.result}</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#d1b06f]" style={{ width: `${Math.min(100, Math.max(0, totals.percent))}%` }} /></div><div className="mt-3 flex items-center justify-between text-[10px] text-white/45"><span>Grade {totals.grade}</span><span>{subjects.length} subjects</span></div></div>
          {draftSavedAt && !editReportId && <p className="mt-3 px-2 text-[10px] text-white/35">Draft saved locally · {draftSavedAt}</p>}
        </aside>

        <section className="no-print rounded-[24px] border border-[#d9d5cc] bg-[#fffdfa] shadow-lg xl:h-full xl:overflow-y-auto">
          <div className="sticky top-0 z-20 border-b border-[#e5e0d7] bg-[#fffdfa]/95 px-5 py-4 backdrop-blur"><p className="text-[9px] font-black uppercase tracking-[.2em] text-[#a07b3f]">Step {currentStepIndex + 1} of 3</p><h1 className="mt-1 font-serif text-2xl font-bold">{workflowSteps[currentStepIndex].label}</h1><p className="mt-1 text-xs text-slate-400">{workflowSteps[currentStepIndex].description}</p></div>
          <div className="p-5">
            {activeStep === "student" && <div className="space-y-5"><SectionIntro eyebrow="Student record" title="Student & examination" description="Keep the essentials together so entering a new result is quick and predictable." /><div className="space-y-4"><Field label="Student name" value={student} onChange={setStudent} placeholder="Full student name" /><Field label="Father / Guardian" value={father} onChange={setFather} placeholder="Father or guardian name" /><div className="grid grid-cols-2 gap-3"><Field label="Roll number" value={roll} onChange={setRoll} placeholder="Roll no." /><Field label="Class & section" value={klass} onChange={setKlass} placeholder="Grade · section" /></div><div className="grid grid-cols-2 gap-3"><Field label="Session" value={session} onChange={setSession} placeholder="2025–26" /><Field label="Exam" value={exam} onChange={setExam} placeholder="Annual examination" /></div><Field label="Date of birth" value={dob} onChange={setDob} type="date" /><div className="grid grid-cols-2 gap-3"><Field label="Attendance %" value={String(attendance)} onChange={(v) => setAttendance(Number(v))} type="number" /><Field label="Class position" value={String(position)} onChange={(v) => setPosition(Number(v))} type="number" /></div></div><input ref={studentPhotoRef} type="file" accept="image/*" className="hidden" onChange={(e) => readImage(e.target.files?.[0], setPhoto)} /><button onClick={() => studentPhotoRef.current?.click()} className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-[#cfc8bc] bg-[#faf7f1] p-4 text-left"><span className="grid h-12 w-10 place-items-center overflow-hidden rounded-lg border bg-white">{photo ? <img src={photo} alt="Student preview" className="h-full w-full object-cover" /> : <UserRound size={18} />}</span><span><span className="block text-xs font-black">{photo ? "Student photo added" : "Add student photo"}</span><span className="text-[10px] text-slate-400">Optional · portrait crop recommended</span></span></button></div>}

            {activeStep === "marks" && <div className="space-y-5"><SectionIntro eyebrow="Academic performance" title="Subjects & marks" description="Enter marks quickly. Percentage, grade and result calculate automatically." /><div className="overflow-hidden rounded-2xl border border-[#ded9d0] bg-white"><div className="grid grid-cols-[1fr_62px_62px_32px] gap-2 border-b bg-[#f8f5ef] px-3 py-2.5 text-[9px] font-black uppercase text-slate-400"><span>Subject</span><span>Max</span><span>Obt.</span><span /></div><div className="divide-y">{subjects.map((subject) => <div key={subject.id} className="grid grid-cols-[1fr_62px_62px_32px] gap-2 px-3 py-2.5"><input value={subject.name} onChange={(e) => updateSubject(subject.id, "name", e.target.value)} className="min-w-0 rounded-lg px-2 py-2 text-sm font-semibold outline-none focus:bg-[#faf8f3]" /><input type="number" value={subject.total} onChange={(e) => updateSubject(subject.id, "total", e.target.value)} className="rounded-lg border bg-[#faf9f6] px-2 py-2 text-center text-xs font-bold" /><input type="number" value={subject.obtained} onChange={(e) => updateSubject(subject.id, "obtained", e.target.value)} className="rounded-lg border bg-[#faf9f6] px-2 py-2 text-center text-xs font-bold" /><button onClick={() => setSubjects((current) => current.filter((item) => item.id !== subject.id))} className="grid place-items-center text-slate-300 hover:text-rose-500"><Trash2 size={14} /></button></div>)}</div></div><button onClick={() => setSubjects((current) => [...current, { id: Date.now(), name: "New Subject", total: 100, obtained: 0 }])} className="flex w-full items-center justify-center gap-2 rounded-xl border bg-white py-2.5 text-xs font-black"><Plus size={15} /> Add subject</button><div className="grid grid-cols-3 gap-2"><Metric label="Obtained" value={`${totals.obtained}/${totals.total}`} /><Metric label="Percentage" value={`${totals.percent.toFixed(1)}%`} /><Metric label="Grade" value={totals.grade} /></div><button onClick={() => { setGradingDraft(bands.map((band) => ({ ...band }))); setShowGrading(true); }} className="flex w-full items-center justify-between rounded-2xl border bg-[#faf7f1] p-4 text-left"><span className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-[#17365D]"><Settings2 size={15} /></span><span><span className="block text-xs font-black">Grading system</span><span className="text-[10px] text-slate-400">Customize grade thresholds</span></span></span><ChevronRight size={15} /></button></div>}

            {activeStep === "finalize" && <div className="space-y-5"><SectionIntro eyebrow="Final review" title="Save & export" description="Review the calculated result, save the record, then print or continue with the next student." /><div className="grid grid-cols-2 gap-3"><Metric label="Result" value={totals.result} /><Metric label="Grade" value={totals.grade} /><Metric label="Percentage" value={`${totals.percent.toFixed(1)}%`} /><Metric label="Position" value={position ? String(position) : "—"} /></div><div className="rounded-2xl border bg-[#faf7f1] p-4"><p className="text-[9px] font-black uppercase tracking-[.15em] text-[#a07b3f]">Automatic remark</p><p className="mt-2 text-sm leading-6 text-slate-600">{autoRemark(totals.percent, totals.result)}</p></div>{saveError && <p className="rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-600">{saveError}</p>}<button onClick={saveResult} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#17365D] px-4 py-3 text-sm font-black text-white disabled:opacity-60"><Save size={16} /> {saving ? "Saving…" : editReportId ? "Update result" : "Save result"}</button>{savedId && <div className="rounded-2xl border bg-white p-4"><div className="flex items-center gap-4"><QRCodeSVG value={verificationUrl} size={82} /><div><p className="text-xs font-black text-slate-700">Result saved</p><p className="mt-1 break-all text-[10px] text-slate-400">{savedId}</p></div></div><button onClick={nextStudent} className="mt-4 w-full rounded-xl border border-[#17365D] bg-[#f4f7fa] px-4 py-3 text-sm font-black text-[#17365D]">Save & next student</button></div>}</div>}
          </div>
          <div className="sticky bottom-0 flex items-center justify-between border-t bg-[#fffdfa]/95 px-5 py-4 backdrop-blur"><button disabled={currentStepIndex === 0} onClick={() => setActiveStep(workflowSteps[Math.max(0, currentStepIndex - 1)].id)} className="rounded-xl border px-4 py-2.5 text-xs font-black disabled:opacity-30">Previous</button><button disabled={currentStepIndex === workflowSteps.length - 1} onClick={() => setActiveStep(workflowSteps[Math.min(workflowSteps.length - 1, currentStepIndex + 1)].id)} className="rounded-xl bg-[#17365D] px-4 py-2.5 text-xs font-black text-white disabled:opacity-30">Next</button></div>
        </section>

        <section className="min-w-0 xl:h-full xl:overflow-y-auto">
          <div className="no-print mb-3 flex items-center justify-between gap-3 rounded-2xl border border-[#d9d5cc] bg-[#fffdfa] px-4 py-3"><div><p className="text-[9px] font-black uppercase tracking-[.16em] text-[#a07b3f]">Live preview</p><p className="mt-1 text-xs text-slate-400">Actual print output updates instantly</p></div><div className="relative"><button onClick={() => setDesignOpen((value) => !value)} className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs font-black"><LayoutTemplate size={15} className="text-[#17365D]" />{activeTemplate.name} · {activeTheme.name}<ChevronDown size={13} /></button>{designOpen && <DesignDropdown design={design} activeTemplate={activeTemplate} updateDesign={updateDesign} selectTemplate={selectTemplate} onClose={() => setDesignOpen(false)} />}</div></div>
          <div className="print-shell flex justify-center overflow-auto rounded-[24px] bg-[#dfe3e6] p-4 sm:p-6 xl:min-h-[calc(100%-76px)]"><ResultCard school={school} student={student} father={father} roll={roll} klass={klass} session={session} exam={exam} dob={dob} attendance={attendance} position={position} photo={photo} subjects={subjects} totals={totals} theme={activeTheme} template={design.template} savedId={savedId} cardPulse={cardPulse} /></div>
        </section>
      </div>

      {schoolOpen && <SchoolModal school={school} setSchool={setSchool} onSave={saveSchool} onClose={() => setSchoolOpen(false)} logoRef={schoolLogoRef} />}
      {showGrading && <GradingModal draft={gradingDraft} setDraft={setGradingDraft} onSave={() => { setBands(gradingDraft.map((band) => ({ ...band }))); setShowGrading(false); }} onClose={() => setShowGrading(false)} />}
    </main>
  );
}

function ResultCard({ school, student, father, roll, klass, session, exam, dob, attendance, position, photo, subjects, totals, theme, template, savedId, cardPulse }: any) {
  const rounded = template === "modern" ? "rounded-[28px]" : template === "minimal" ? "rounded-none" : "rounded-md";
  const border = template === "certificate" ? "border-[10px]" : template === "executive" ? "border-[6px]" : "border-[4px]";
  return <article className={`gradly-paper ${cardPulse ? "gradly-card-pulse" : ""} ${rounded} ${border} relative overflow-hidden bg-white p-[8%] shadow-[0_22px_70px_rgba(20,36,58,.18)]`} style={{ borderColor: theme.ink }}>
    {template === "certificate" && <div className="pointer-events-none absolute inset-[14px] border" style={{ borderColor: theme.accent }} />}
    <header className={`flex items-center gap-4 pb-5 ${template === "minimal" ? "border-b" : "border-b-2"}`} style={{ borderColor: theme.ink }}>
      <div className={`grid h-20 w-20 shrink-0 place-items-center overflow-hidden ${template === "modern" ? "rounded-2xl" : "rounded-full"}`} style={{ backgroundColor: theme.wash, border: `1px solid ${theme.accent}` }}>{school.logo ? <img src={school.logo} alt="School logo" className="h-full w-full object-contain p-2" /> : <School size={32} style={{ color: theme.ink }} />}</div>
      <div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Official academic report</p><h1 className={`${template === "executive" ? "font-sans" : "font-serif"} mt-1 text-3xl font-bold`} style={{ color: theme.ink }}>{school.name}</h1><p className="mt-1 text-xs italic text-slate-500">{school.motto}</p><p className="mt-1 text-[10px] text-slate-400">{school.address} · {school.contact}</p></div>
    </header>
    <div className="mt-6 grid grid-cols-[1fr_auto] gap-5"><div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs"><Info label="Student" value={student || "—"} /><Info label="Father / Guardian" value={father || "—"} /><Info label="Roll number" value={roll || "—"} /><Info label="Class" value={klass || "—"} /><Info label="Session" value={session || "—"} /><Info label="Exam" value={exam || "—"} /><Info label="Date of birth" value={dob || "—"} /><Info label="Attendance" value={`${attendance || 0}%`} /></div>{photo && <img src={photo} alt="Student" className="h-28 w-24 rounded-lg border object-cover" />}</div>
    <div className="mt-6 overflow-hidden rounded-xl border" style={{ borderColor: theme.ink }}><table className="w-full border-collapse text-xs"><thead style={{ backgroundColor: theme.wash, color: theme.ink }}><tr><th className="px-3 py-2 text-left">Subject</th><th className="px-3 py-2 text-right">Max</th><th className="px-3 py-2 text-right">Obtained</th><th className="px-3 py-2 text-right">%</th></tr></thead><tbody>{subjects.map((subject: Subject) => <tr key={subject.id} className="border-t"><td className="px-3 py-2 font-semibold">{subject.name}</td><td className="px-3 py-2 text-right">{subject.total}</td><td className="px-3 py-2 text-right font-bold">{subject.obtained}</td><td className="px-3 py-2 text-right">{subject.total ? ((subject.obtained / subject.total) * 100).toFixed(0) : 0}%</td></tr>)}</tbody></table></div>
    <div className="mt-6 grid grid-cols-4 gap-2"><Summary label="Obtained" value={`${totals.obtained}/${totals.total}`} theme={theme} /><Summary label="Percentage" value={`${totals.percent.toFixed(1)}%`} theme={theme} /><Summary label="Grade" value={totals.grade} theme={theme} /><Summary label="Result" value={totals.result} theme={theme} /></div>
    <div className="mt-6 rounded-xl p-4" style={{ backgroundColor: theme.wash }}><p className="text-[9px] font-black uppercase tracking-[.15em]" style={{ color: theme.ink }}>Teacher remark</p><p className="mt-2 text-xs leading-5 text-slate-600">{autoRemark(totals.percent, totals.result)}</p></div>
    <footer className="mt-8 flex items-end justify-between border-t pt-5 text-[10px] text-slate-400" style={{ borderColor: theme.ink }}><div><p>Class position: <strong className="text-slate-700">{position || "—"}</strong></p><p className="mt-1">Generated with Gradly</p></div>{savedId && <div className="flex items-center gap-2"><QRCodeSVG value={`${typeof window !== "undefined" ? window.location.origin : ""}/verify/${savedId}`} size={54} /><span className="max-w-[120px] break-all">{savedId}</span></div>}</footer>
  </article>;
}

function DesignDropdown({ design, activeTemplate, updateDesign, selectTemplate, onClose }: any) {
  return <div className="absolute right-0 top-[calc(100%+10px)] z-[120] w-[min(92vw,430px)] rounded-2xl border bg-[#fffdfa] p-4 shadow-2xl"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.16em] text-[#a07b3f]">Live design</p><p className="text-sm font-black">Update the card instantly</p></div><button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg border"><X size={14} /></button></div><p className="mb-2 mt-4 text-[9px] font-black uppercase text-slate-400">Layout</p><div className="grid grid-cols-5 gap-2">{templates.map((item) => <button key={item.id} onClick={() => selectTemplate(item.id)} className={`rounded-xl border p-2 text-[9px] font-black ${design.template === item.id ? "border-[#17365D] bg-[#f4f7fa] text-[#17365D]" : "bg-white text-slate-500"}`}><span className="mx-auto mb-1 block h-6 w-6 rounded border" style={{ borderColor: item.themes[0].ink, backgroundColor: item.themes[0].wash }} />{item.name}</button>)}</div><p className="mb-2 mt-4 text-[9px] font-black uppercase text-slate-400">Palette</p><div className="flex flex-wrap gap-2">{activeTemplate.themes.map((theme: Theme) => <button key={theme.id} onClick={() => updateDesign({ theme: theme.id })} className={`flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[9px] font-black ${design.theme === theme.id ? "border-[#17365D] bg-[#f4f7fa]" : "bg-white"}`}><span className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.ink }} />{theme.name}{design.theme === theme.id && <Check size={10} />}</button>)}</div><p className="mb-2 mt-4 text-[9px] font-black uppercase text-slate-400">Paper</p><div className="grid grid-cols-5 gap-1.5">{(["a4","a5","letter","legal","custom"] as PaperSize[]).map((paper) => <button key={paper} onClick={() => updateDesign({ paperSize: paper })} className={`rounded-lg border px-2 py-2 text-[9px] font-black uppercase ${design.paperSize === paper ? "bg-[#17365D] text-white" : "bg-white text-slate-500"}`}>{paper}</button>)}</div>{design.paperSize === "custom" && <div className="mt-2 grid grid-cols-2 gap-2"><input type="number" value={design.customWidth} onChange={(e) => updateDesign({ customWidth: e.target.value })} className="rounded-lg border px-2.5 py-2 text-xs" placeholder="Width mm" /><input type="number" value={design.customHeight} onChange={(e) => updateDesign({ customHeight: e.target.value })} className="rounded-lg border px-2.5 py-2 text-xs" placeholder="Height mm" /></div>}</div>;
}

function SchoolModal({ school, setSchool, onSave, onClose, logoRef }: any) {
  return <div className="no-print fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"><div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b px-5 py-4"><div><p className="text-[9px] font-black uppercase tracking-[.16em] text-[#a07b3f]">School profile</p><h2 className="font-serif text-xl font-bold">Branding & printed identity</h2></div><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border"><X size={16} /></button></div><div className="grid gap-5 p-5 md:grid-cols-2"><div className="space-y-4"><Field label="School name" value={school.name} onChange={(v) => setSchool((c: SchoolState) => ({ ...c, name: v }))} /><Field label="Motto" value={school.motto} onChange={(v) => setSchool((c: SchoolState) => ({ ...c, motto: v }))} /><Field label="Address" value={school.address} onChange={(v) => setSchool((c: SchoolState) => ({ ...c, address: v }))} /><Field label="Contact" value={school.contact} onChange={(v) => setSchool((c: SchoolState) => ({ ...c, contact: v }))} /><input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => readImage(e.target.files?.[0], (logo) => setSchool((c: SchoolState) => ({ ...c, logo })))} /><button onClick={() => logoRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-3 text-xs font-black"><Upload size={14} /> Upload school logo</button></div><div className="rounded-2xl bg-[#f4f2ed] p-4"><div className="rounded-xl border-4 bg-white p-5" style={{ borderColor: "#17365D" }}><div className="flex items-center gap-3 border-b-2 pb-4" style={{ borderColor: "#17365D" }}><div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full border">{school.logo ? <img src={school.logo} alt="School logo" className="h-full w-full object-contain p-1" /> : <School size={26} />}</div><div><h3 className="font-serif text-xl font-bold text-[#17365D]">{school.name || "School name"}</h3><p className="text-xs text-slate-500">{school.motto}</p></div></div><p className="mt-4 text-[10px] text-slate-500">{school.address}</p><p className="mt-1 text-[10px] text-slate-500">{school.contact}</p></div></div></div><div className="flex justify-end gap-2 border-t bg-slate-50 px-5 py-4"><button onClick={onClose} className="rounded-xl border bg-white px-4 py-2.5 text-sm font-bold">Cancel</button><button onClick={onSave} className="rounded-xl bg-[#17365D] px-5 py-2.5 text-sm font-black text-white">Save school profile</button></div></div></div>;
}

function GradingModal({ draft, setDraft, onSave, onClose }: any) {
  return <div className="no-print fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/50 p-4"><div className="w-full max-w-xl rounded-3xl bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase text-[#a07b3f]">Grading system</p><h2 className="font-serif text-xl font-bold">Grade thresholds</h2></div><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border"><X size={16} /></button></div><div className="mt-5 space-y-2">{draft.map((band: Band, index: number) => <div key={index} className="grid grid-cols-[70px_80px_1fr] gap-2"><input value={band.grade} onChange={(e) => setDraft((current: Band[]) => current.map((item, i) => i === index ? { ...item, grade: e.target.value } : item))} className="rounded-lg border px-2 py-2 text-sm font-bold" /><input type="number" value={band.min} onChange={(e) => setDraft((current: Band[]) => current.map((item, i) => i === index ? { ...item, min: Number(e.target.value) } : item))} className="rounded-lg border px-2 py-2 text-sm" /><input value={band.label} onChange={(e) => setDraft((current: Band[]) => current.map((item, i) => i === index ? { ...item, label: e.target.value } : item))} className="rounded-lg border px-2 py-2 text-sm" /></div>)}</div><div className="mt-5 flex justify-end gap-2"><button onClick={onClose} className="rounded-xl border px-4 py-2.5 text-sm font-bold">Cancel</button><button onClick={onSave} className="rounded-xl bg-[#17365D] px-5 py-2.5 text-sm font-black text-white">Save grading</button></div></div></div>;
}

function SectionIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) { return <div><p className="text-[9px] font-black uppercase tracking-[.16em] text-[#a07b3f]">{eyebrow}</p><h2 className="mt-1 font-serif text-xl font-bold">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-400">{description}</p></div>; }
function Field({ label, value, onChange, placeholder = "", type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) { return <label className="block"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-[.12em] text-slate-500">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-[#ded9d0] bg-white px-3.5 py-3 text-sm font-semibold outline-none focus:border-[#17365D] focus:ring-4 focus:ring-[#17365D]/10" /></label>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border bg-white p-3 text-center"><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-400">{label}</p><p className="mt-1 font-serif text-lg font-bold text-[#17365D]">{value}</p></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-400">{label}</p><p className="mt-1 font-semibold text-slate-700">{value}</p></div>; }
function Summary({ label, value, theme }: any) { return <div className="rounded-xl p-3 text-center" style={{ backgroundColor: theme.wash }}><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-400">{label}</p><p className="mt-1 font-serif text-lg font-bold" style={{ color: theme.ink }}>{value}</p></div>; }
