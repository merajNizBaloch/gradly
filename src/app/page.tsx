"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileDown,
  FileText,
  ImagePlus,
  LayoutTemplate,
  Plus,
  Printer,
  Save,
  School,
  Settings2,
  Trash2,
  Upload,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Subject = { id: number; name: string; total: number; obtained: number };
type TemplateId = "academic" | "modern" | "certificate" | "executive" | "minimal";
type ThemeId =
  | "academic-navy"
  | "academic-emerald"
  | "academic-burgundy"
  | "academic-plum"
  | "modern-ocean"
  | "modern-forest"
  | "modern-coral"
  | "modern-indigo"
  | "certificate-gold"
  | "certificate-emerald"
  | "certificate-burgundy"
  | "certificate-royal"
  | "executive-charcoal"
  | "executive-navy"
  | "executive-wine"
  | "executive-plum"
  | "minimal-slate"
  | "minimal-teal"
  | "minimal-olive"
  | "minimal-rose";
type PaperSize = "a4" | "a5" | "letter" | "legal" | "custom";
type Band = { grade: string; min: number; label: string };
type StepId = "school" | "student" | "marks" | "design" | "finalize";

const initial: Subject[] = [
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

const paperPresets = {
  a4: { label: "A4", width: "210mm", height: "297mm", ratio: 297 / 210 },
  a5: { label: "A5", width: "148mm", height: "210mm", ratio: 210 / 148 },
  letter: { label: "Letter", width: "8.5in", height: "11in", ratio: 11 / 8.5 },
  legal: { label: "Legal", width: "8.5in", height: "14in", ratio: 14 / 8.5 },
} as const;

type Theme = { id: ThemeId; name: string; ink: string; wash: string; accent: string };
type Template = { id: TemplateId; name: string; description: string; themes: Theme[] };

const templates: Template[] = [
  {
    id: "academic",
    name: "Academic",
    description: "Formal institutional report",
    themes: [
      { id: "academic-navy", name: "Navy", ink: "#17365D", wash: "#F3F6F9", accent: "#17365D" },
      { id: "academic-emerald", name: "Emerald", ink: "#155E4A", wash: "#F1F8F5", accent: "#167A5B" },
      { id: "academic-burgundy", name: "Burgundy", ink: "#6B2435", wash: "#FBF3F5", accent: "#9B3A50" },
      { id: "academic-plum", name: "Plum", ink: "#4B315F", wash: "#F7F3F9", accent: "#74518B" },
    ],
  },
  {
    id: "modern",
    name: "Modern",
    description: "Contemporary rounded layout",
    themes: [
      { id: "modern-ocean", name: "Ocean", ink: "#155E75", wash: "#F0F9FA", accent: "#0E7490" },
      { id: "modern-forest", name: "Forest", ink: "#1F5A43", wash: "#F1F8F4", accent: "#2D7A5B" },
      { id: "modern-coral", name: "Coral", ink: "#9A3F3F", wash: "#FFF5F3", accent: "#C15B52" },
      { id: "modern-indigo", name: "Indigo", ink: "#4338A8", wash: "#F3F4FF", accent: "#5B5BD6" },
    ],
  },
  {
    id: "certificate",
    name: "Certificate",
    description: "Ornate ceremonial layout",
    themes: [
      { id: "certificate-gold", name: "Antique Gold", ink: "#5B3A20", wash: "#FBF6EE", accent: "#A9793D" },
      { id: "certificate-emerald", name: "Jade", ink: "#14532D", wash: "#F2F8F3", accent: "#4D8B63" },
      { id: "certificate-burgundy", name: "Crimson", ink: "#641E2B", wash: "#FBF2F4", accent: "#A54A5A" },
      { id: "certificate-royal", name: "Royal Blue", ink: "#253B73", wash: "#F2F5FB", accent: "#5D74B4" },
    ],
  },
  {
    id: "executive",
    name: "Executive",
    description: "Luxury leadership report",
    themes: [
      { id: "executive-charcoal", name: "Charcoal", ink: "#252525", wash: "#F5F5F3", accent: "#6B6B66" },
      { id: "executive-navy", name: "Midnight", ink: "#172554", wash: "#F1F4FA", accent: "#3D5A9B" },
      { id: "executive-wine", name: "Wine", ink: "#5C1F35", wash: "#FBF2F6", accent: "#9A4968" },
      { id: "executive-plum", name: "Plum", ink: "#31233D", wash: "#F6F1F8", accent: "#74558A" },
    ],
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean compact academic",
    themes: [
      { id: "minimal-slate", name: "Slate", ink: "#334155", wash: "#F8FAFC", accent: "#64748B" },
      { id: "minimal-teal", name: "Teal", ink: "#115E59", wash: "#F0FDFA", accent: "#0F766E" },
      { id: "minimal-olive", name: "Olive", ink: "#465A32", wash: "#F5F8F0", accent: "#6C824D" },
      { id: "minimal-rose", name: "Rose", ink: "#7A3E4B", wash: "#FFF6F7", accent: "#A95D6C" },
    ],
  },
];

const allThemes = templates.flatMap((template) =>
  template.themes.map((theme) => ({
    ...theme,
    templateId: template.id,
    templateName: template.name,
  })),
);

const workflowSteps: Array<{
  id: StepId;
  number: string;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  { id: "school", number: "01", label: "Institution", description: "School identity", icon: School },
  { id: "student", number: "02", label: "Student", description: "Student profile", icon: UserRound },
  { id: "marks", number: "03", label: "Marks", description: "Subjects & scores", icon: BarChart3 },
  { id: "design", number: "04", label: "Design", description: "Layout & styling", icon: LayoutTemplate },
  { id: "finalize", number: "05", label: "Finalize", description: "Review & export", icon: CheckCircle2 },
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

export default function Home() {
  const searchParams = useSearchParams();
  const editReportId = searchParams.get("edit");
  const logoRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const teacherRef = useRef<HTMLInputElement>(null);
  const principalRef = useRef<HTMLInputElement>(null);

  const [activeStep, setActiveStep] = useState<StepId>("school");
  const [school, setSchool] = useState("Horizon Grammar School");
  const [motto, setMotto] = useState("Excellence · Character · Future");
  const [address, setAddress] = useState("Main Campus · Quetta, Balochistan");
  const [contact, setContact] = useState("+92 300 0000000 · info@school.edu");
  const [student, setStudent] = useState("Ayesha Khan");
  const [father, setFather] = useState("Muhammad Imran Khan");
  const [roll, setRoll] = useState("HGS-2026-0148");
  const [klass, setKlass] = useState("Grade 8 — Section A");
  const [session, setSession] = useState("2025–26");
  const [exam, setExam] = useState("Annual Examination");
  const [dob, setDob] = useState("2012-08-17");
  const [attendance, setAttendance] = useState(94);
  const [position, setPosition] = useState(3);
  const [subjects, setSubjects] = useState(initial);
  const [template, setTemplate] = useState<TemplateId>("academic");
  const [theme, setTheme] = useState<ThemeId>("academic-navy");
  const [paperSize, setPaperSize] = useState<PaperSize>("a4");
  const [customWidth, setCustomWidth] = useState("210");
  const [customHeight, setCustomHeight] = useState("297");
  const [bands, setBands] = useState(defaultBands);
  const [gradingDraft, setGradingDraft] = useState(defaultBands);
  const [showSettings, setShowSettings] = useState(false);
  const [logo, setLogo] = useState("");
  const [photo, setPhoto] = useState("");
  const [teacherSignature, setTeacherSignature] = useState("");
  const [principalSignature, setPrincipalSignature] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState("");
  const [saveError, setSaveError] = useState("");
  const [loadingEdit, setLoadingEdit] = useState(Boolean(editReportId));

  const totals = useMemo(() => {
    const total = subjects.reduce((sum, subject) => sum + Math.max(0, subject.total), 0);
    const obtained = subjects.reduce(
      (sum, subject) => sum + Math.min(Math.max(0, subject.obtained), Math.max(0, subject.total)),
      0,
    );
    const percent = total ? (obtained / total) * 100 : 0;
    const result =
      subjects.length > 0 &&
      subjects.every((subject) => subject.total > 0 && (subject.obtained / subject.total) * 100 >= 40)
        ? "PASS"
        : "FAIL";

    return { total, obtained, percent, grade: getGrade(percent, bands), result };
  }, [subjects, bands]);

  useEffect(() => {
    if (!editReportId) return;
    let active = true;

    (async () => {
      try {
        const response = await fetch(`/api/results/${encodeURIComponent(editReportId)}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Result not found");
        const result = data.result;
        const rows = Array.isArray(result.gradly_result_subjects) ? result.gradly_result_subjects : [];
        if (!active) return;

        setSchool(result.school_name || "");
        setExam(result.exam_name || "");
        setSession(result.academic_session || "");
        setStudent(result.student_name || "");
        setFather(result.father_guardian || "");
        setRoll(result.roll_number || "");
        setKlass(result.class_section || "");
        setDob(result.date_of_birth || "");
        setAttendance(Number(result.attendance_present ?? 0));
        setPosition(Number(result.position ?? 0));
        setPhoto(result.student_photo_url || "");

        const storedBands =
          Array.isArray(result.grading_scale) && result.grading_scale.length ? result.grading_scale : defaultBands;
        setBands(storedBands);
        setGradingDraft(storedBands);

        const stored = String(result.template || "");
        const storedTheme = allThemes.find((item) => item.id === stored);
        if (storedTheme) {
          setTheme(storedTheme.id);
          setTemplate(storedTheme.templateId as TemplateId);
        } else if (templates.some((item) => item.id === stored)) {
          const storedTemplate = templates.find((item) => item.id === stored)!;
          setTemplate(storedTemplate.id);
          setTheme(storedTemplate.themes[0].id);
        }

        setSubjects(
          rows.map((subject: any, index: number) => ({
            id: index + 1,
            name: subject.subject_name || "Subject",
            total: Number(subject.total_marks) || 0,
            obtained: Number(subject.obtained_marks) || 0,
          })),
        );
        setSavedId(result.report_id || editReportId);
        setLoadingEdit(false);
      } catch (error) {
        if (active) {
          setSaveError(error instanceof Error ? error.message : "Unable to load result");
          setLoadingEdit(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [editReportId]);

  const readImage = (file: File | undefined, setter: (value: string) => void) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setter(String(reader.result));
    reader.readAsDataURL(file);
  };

  const updateSubject = (id: number, key: "name" | "total" | "obtained", value: string) =>
    setSubjects((current) =>
      current.map((subject) =>
        subject.id === id ? { ...subject, [key]: key === "name" ? value : Number(value) } : subject,
      ),
    );

  const openGrading = () => {
    setGradingDraft(bands.map((band) => ({ ...band })));
    setShowSettings(true);
  };

  const saveGrading = () => {
    setBands(gradingDraft.map((band) => ({ ...band })));
    setShowSettings(false);
  };

  const saveResult = async () => {
    setSaving(true);
    setSaveError("");

    try {
      const payload = {
        report_id: editReportId || undefined,
        school_name: school,
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
        template,
        theme,
        grading_scale: bands,
        subjects: subjects.map((subject) => ({
          name: subject.name,
          total: subject.total,
          obtained: subject.obtained,
        })),
      };

      const response = await fetch(
        editReportId ? `/api/results/${encodeURIComponent(editReportId)}` : "/api/results",
        {
          method: editReportId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save result");
      setSavedId(data.result?.report_id || data.report?.report_id || editReportId || "");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save result");
    } finally {
      setSaving(false);
    }
  };

  const verificationUrl = savedId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/verify/${savedId}`
    : "";

  const paper =
    paperSize === "custom"
      ? {
          label: "Custom",
          width: `${Math.max(80, Number(customWidth) || 210)}mm`,
          height: `${Math.max(100, Number(customHeight) || 297)}mm`,
          ratio:
            Math.max(100, Number(customHeight) || 297) /
            Math.max(80, Number(customWidth) || 210),
        }
      : paperPresets[paperSize];

  const activeTheme = allThemes.find((item) => item.id === theme) ?? allThemes[0];
  const activeTemplate = templates.find((item) => item.id === template) ?? templates[0];
  const legacyStyle = template === "certificate";
  const modernStyle = template === "modern";
  const premiumStyle = template === "executive";
  const minimalStyle = template === "minimal";

  const selectTemplate = (id: TemplateId) => {
    const nextTemplate = templates.find((item) => item.id === id)!;
    setTemplate(id);
    setTheme(nextTemplate.themes[0].id);
  };

  const currentStepIndex = workflowSteps.findIndex((step) => step.id === activeStep);
  const goNext = () => {
    const next = workflowSteps[Math.min(workflowSteps.length - 1, currentStepIndex + 1)];
    setActiveStep(next.id);
  };
  const goPrevious = () => {
    const previous = workflowSteps[Math.max(0, currentStepIndex - 1)];
    setActiveStep(previous.id);
  };

  if (loadingEdit) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f2ed] p-6 text-[#14243a]">
        <div className="w-full max-w-md rounded-[28px] border border-[#d9d5cc] bg-[#fffdfa] p-8 text-center shadow-[0_24px_80px_rgba(20,36,58,.12)]">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-[#17365D] text-white shadow-lg">
            <School size={24} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#a07b3f]">Gradly Studio</p>
          <h1 className="mt-2 font-serif text-2xl font-bold">Opening academic record</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Loading the saved result into your workspace…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f2ed] text-[#14243a]">
      <style jsx global>{`
        @page{size:${paper.width} ${paper.height};margin:0}
        .gradly-paper{width:${paper.width};min-height:${paper.height};aspect-ratio:${paper.ratio};box-sizing:border-box}
        .gradly-paper tbody tr{background-color:transparent!important}
        .gradly-workspace-scroll{scrollbar-width:thin;scrollbar-color:#c8c4bc transparent}
        .gradly-workspace-scroll::-webkit-scrollbar{width:8px;height:8px}
        .gradly-workspace-scroll::-webkit-scrollbar-thumb{background:#c8c4bc;border-radius:999px}
        @media print{
          html,body{width:${paper.width};min-height:${paper.height};margin:0!important;padding:0!important;background:#fff!important}
          .gradly-paper{width:${paper.width}!important;height:${paper.height}!important;min-height:${paper.height}!important;aspect-ratio:auto!important;box-shadow:none!important}
          .print-shell{display:block!important;padding:0!important;margin:0!important}
          .no-print{display:none!important}
        }
      `}</style>

      <header className="no-print sticky top-0 z-50 border-b border-[#d7d2c7] bg-[#fffdfa]/95 backdrop-blur-xl">
        <div className="h-1 bg-[#b58b48]" />
        <div className="mx-auto flex min-h-[70px] max-w-[1800px] items-center justify-between gap-4 px-4 sm:px-6 xl:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#17365D] text-white shadow-[0_8px_24px_rgba(23,54,93,.18)]">
              <School size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl font-bold tracking-tight text-[#14243a]">Gradly</span>
                <span className="hidden rounded-full border border-[#ded8cc] bg-[#f8f4ec] px-2 py-0.5 text-[9px] font-black uppercase tracking-[.14em] text-[#8c6a35] sm:inline">
                  Academic Studio
                </span>
              </div>
              <p className="truncate text-[11px] font-medium text-slate-400">
                {editReportId ? "Editing saved result" : "New student result"} · {student || "Untitled student"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/results"
              className="hidden items-center gap-2 rounded-xl border border-[#d9d5cc] bg-white px-3.5 py-2.5 text-xs font-bold text-slate-600 transition hover:border-[#17365D]/30 hover:text-[#17365D] sm:flex"
            >
              <FileText size={15} />
              Saved results
            </Link>
            <label className="hidden items-center gap-2 rounded-xl border border-[#d9d5cc] bg-white px-3 py-2.5 text-xs font-bold text-slate-600 md:flex">
              <Printer size={15} />
              <select
                aria-label="Paper size"
                value={paperSize}
                onChange={(event) => setPaperSize(event.target.value as PaperSize)}
                className="bg-transparent font-bold outline-none"
              >
                <option value="a4">A4</option>
                <option value="a5">A5</option>
                <option value="letter">Letter</option>
                <option value="legal">Legal</option>
                <option value="custom">Custom</option>
              </select>
            </label>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-xl bg-[#17365D] px-4 py-2.5 text-xs font-black text-white shadow-[0_8px_20px_rgba(23,54,93,.16)] transition hover:bg-[#102d50]"
            >
              <Printer size={15} />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1800px] gap-4 px-4 py-4 sm:px-6 xl:h-[calc(100vh-75px)] xl:grid-cols-[210px_430px_minmax(0,1fr)] xl:px-8">
        <aside className="no-print gradly-workspace-scroll rounded-[24px] bg-[#122b49] p-3 text-white shadow-[0_18px_50px_rgba(20,36,58,.14)] xl:h-full xl:overflow-y-auto">
          <div className="border-b border-white/10 px-3 pb-4 pt-2">
            <p className="text-[9px] font-black uppercase tracking-[.22em] text-[#d3b57c]">Create result</p>
            <h2 className="mt-2 font-serif text-xl font-bold">Academic workflow</h2>
            <p className="mt-1 text-[11px] leading-5 text-white/50">Complete each section, then review and export.</p>
          </div>

          <nav className="mt-3 space-y-1.5">
            {workflowSteps.map((step) => {
              const Icon = step.icon;
              const selected = activeStep === step.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                    selected ? "bg-white text-[#17365D] shadow-lg" : "text-white/70 hover:bg-white/[.08] hover:text-white"
                  }`}
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                      selected ? "bg-[#f3eee4] text-[#9a743b]" : "bg-white/[.08] text-white/70"
                    }`}
                  >
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[9px] font-black uppercase tracking-[.16em] ${selected ? "text-[#a07b3f]" : "text-white/35"}`}>
                      {step.number}
                    </span>
                    <span className="block truncate text-xs font-black">{step.label}</span>
                    <span className={`block truncate text-[9px] font-medium ${selected ? "text-slate-400" : "text-white/35"}`}>
                      {step.description}
                    </span>
                  </span>
                  <ChevronRight size={14} className={selected ? "text-[#17365D]" : "text-white/20"} />
                </button>
              );
            })}
          </nav>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.06] p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.16em] text-white/40">Live result</p>
                <p className="mt-1 font-serif text-2xl font-bold">{totals.percent.toFixed(1)}%</p>
              </div>
              <span className={`rounded-lg px-2.5 py-1.5 text-[10px] font-black ${totals.result === "PASS" ? "bg-emerald-400/15 text-emerald-200" : "bg-rose-400/15 text-rose-200"}`}>
                {totals.result}
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#d1b06f]" style={{ width: `${Math.min(100, Math.max(0, totals.percent))}%` }} />
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-white/45">
              <span>Grade {totals.grade}</span>
              <span>{subjects.length} subjects</span>
            </div>
          </div>

          <div className="mt-3 px-2 text-[10px] leading-5 text-white/35">
            Changes update the preview instantly. Save when the academic record is ready.
          </div>
        </aside>

        <section className="no-print gradly-workspace-scroll rounded-[24px] border border-[#d9d5cc] bg-[#fffdfa] shadow-[0_18px_55px_rgba(20,36,58,.08)] xl:h-full xl:overflow-y-auto">
          <div className="sticky top-0 z-20 border-b border-[#e5e0d7] bg-[#fffdfa]/95 px-5 py-4 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.2em] text-[#a07b3f]">
                  Step {currentStepIndex + 1} of {workflowSteps.length}
                </p>
                <h1 className="mt-1 font-serif text-2xl font-bold text-[#14243a]">
                  {workflowSteps[currentStepIndex].label}
                </h1>
                <p className="mt-1 text-xs leading-5 text-slate-400">{workflowSteps[currentStepIndex].description}</p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#e2ddd4] bg-[#f8f4ec] text-[#9a743b]">
                {(() => {
                  const Icon = workflowSteps[currentStepIndex].icon;
                  return <Icon size={17} />;
                })()}
              </span>
            </div>
          </div>

          <div className="p-5">
            <div className={activeStep === "school" ? "space-y-5" : "hidden"}>
              <SectionIntro
                eyebrow="Institution profile"
                title="School identity"
                description="Set the information that appears in the report masthead and official verification."
              />
              <div className="space-y-4">
                <Field label="School name" value={school} onChange={setSchool} placeholder="Enter school name" />
                <Field label="Motto" value={motto} onChange={setMotto} placeholder="School motto" />
                <Field label="Address" value={address} onChange={setAddress} placeholder="Campus address" />
                <Field label="Contact" value={contact} onChange={setContact} placeholder="Phone · email" />
              </div>

              <input
                ref={logoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => readImage(event.target.files?.[0], setLogo)}
              />
              <button
                type="button"
                onClick={() => logoRef.current?.click()}
                className="group flex w-full items-center gap-3 rounded-2xl border border-dashed border-[#cfc8bc] bg-[#faf7f1] p-4 text-left transition hover:border-[#17365D]/40 hover:bg-white"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#ded8cd] bg-white text-[#17365D]">
                  {logo ? <img src={logo} alt="Uploaded school logo" className="h-full w-full object-contain p-1" /> : <ImagePlus size={19} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-black text-slate-700">{logo ? "School logo ready" : "Add school logo"}</span>
                  <span className="mt-0.5 block text-[10px] leading-4 text-slate-400">PNG, JPG or transparent artwork works best.</span>
                </span>
                {logo && <Check size={16} className="text-emerald-600" />}
              </button>
            </div>

            <div className={activeStep === "student" ? "space-y-5" : "hidden"}>
              <SectionIntro
                eyebrow="Student record"
                title="Student & examination"
                description="Keep the essentials together so entering a new result is quick and predictable."
              />
              <div className="space-y-4">
                <Field label="Student name" value={student} onChange={setStudent} placeholder="Full student name" />
                <Field label="Father / Guardian" value={father} onChange={setFather} placeholder="Father or guardian name" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Roll number" value={roll} onChange={setRoll} placeholder="Roll no." />
                  <Field label="Class & section" value={klass} onChange={setKlass} placeholder="Grade · section" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Session" value={session} onChange={setSession} placeholder="2025–26" />
                  <Field label="Exam" value={exam} onChange={setExam} placeholder="Annual examination" />
                </div>
                <Field label="Date of birth" value={dob} onChange={setDob} type="date" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Attendance %" value={String(attendance)} onChange={(value) => setAttendance(Number(value))} type="number" />
                  <Field label="Class position" value={String(position)} onChange={(value) => setPosition(Number(value))} type="number" />
                </div>
              </div>

              <input
                ref={photoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => readImage(event.target.files?.[0], setPhoto)}
              />
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-[#cfc8bc] bg-[#faf7f1] p-4 text-left transition hover:border-[#17365D]/40 hover:bg-white"
              >
                <span className="grid h-12 w-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-[#ded8cd] bg-white text-slate-400">
                  {photo ? <img src={photo} alt="Student preview" className="h-full w-full object-cover" /> : <UserRound size={18} />}
                </span>
                <span>
                  <span className="block text-xs font-black text-slate-700">{photo ? "Student photo added" : "Add student photo"}</span>
                  <span className="mt-0.5 block text-[10px] text-slate-400">Optional · portrait crop recommended</span>
                </span>
              </button>
            </div>

            <div className={activeStep === "marks" ? "space-y-5" : "hidden"}>
              <SectionIntro
                eyebrow="Academic performance"
                title="Subjects & marks"
                description="Enter marks in a compact grid. Overall percentage, grade and result calculate automatically."
              />

              <div className="overflow-hidden rounded-2xl border border-[#ded9d0] bg-white">
                <div className="grid grid-cols-[1fr_62px_62px_32px] gap-2 border-b border-[#ece8e1] bg-[#f8f5ef] px-3 py-2.5 text-[9px] font-black uppercase tracking-[.12em] text-slate-400">
                  <span>Subject</span>
                  <span>Max</span>
                  <span>Obt.</span>
                  <span />
                </div>
                <div className="divide-y divide-[#efebe4]">
                  {subjects.map((subject) => (
                    <div key={subject.id} className="grid grid-cols-[1fr_62px_62px_32px] gap-2 px-3 py-2.5">
                      <input
                        value={subject.name}
                        onChange={(event) => updateSubject(subject.id, "name", event.target.value)}
                        className="min-w-0 rounded-lg border border-transparent bg-transparent px-2 py-2 text-sm font-semibold outline-none transition hover:bg-[#faf8f3] focus:border-[#17365D]/25 focus:bg-white"
                      />
                      <input
                        type="number"
                        value={subject.total}
                        onChange={(event) => updateSubject(subject.id, "total", event.target.value)}
                        className="rounded-lg border border-[#e6e1d8] bg-[#faf9f6] px-2 py-2 text-center text-xs font-bold outline-none focus:border-[#17365D]/40"
                      />
                      <input
                        type="number"
                        value={subject.obtained}
                        onChange={(event) => updateSubject(subject.id, "obtained", event.target.value)}
                        className="rounded-lg border border-[#e6e1d8] bg-[#faf9f6] px-2 py-2 text-center text-xs font-bold outline-none focus:border-[#17365D]/40"
                      />
                      <button
                        type="button"
                        aria-label={`Remove ${subject.name}`}
                        onClick={() => setSubjects((current) => current.filter((item) => item.id !== subject.id))}
                        className="grid place-items-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSubjects((current) => [
                    ...current,
                    { id: Date.now(), name: "New Subject", total: 100, obtained: 80 },
                  ])
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#d9d4cb] bg-white py-2.5 text-xs font-black text-slate-600 transition hover:border-[#17365D]/30 hover:text-[#17365D]"
              >
                <Plus size={15} />
                Add subject
              </button>

              <div className="grid grid-cols-3 gap-2">
                <Metric label="Obtained" value={`${totals.obtained}/${totals.total}`} />
                <Metric label="Percentage" value={`${totals.percent.toFixed(1)}%`} />
                <Metric label="Grade" value={totals.grade} />
              </div>

              <button
                type="button"
                onClick={openGrading}
                className="flex w-full items-center justify-between rounded-2xl border border-[#ded9d0] bg-[#faf7f1] p-4 text-left transition hover:bg-white"
              >
                <span className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-[#17365D] shadow-sm">
                    <Settings2 size={15} />
                  </span>
                  <span>
                    <span className="block text-xs font-black">Grading system</span>
                    <span className="mt-0.5 block text-[10px] text-slate-400">Customize grade thresholds and labels</span>
                  </span>
                </span>
                <ChevronRight size={15} className="text-slate-300" />
              </button>
            </div>

            <div className={activeStep === "design" ? "space-y-5" : "hidden"}>
              <SectionIntro
                eyebrow="Visual system"
                title="Result card design"
                description="Choose a formal layout, palette and paper format while watching the live preview."
              />

              <div className="no-print rounded-2xl border border-[#ded9d0] bg-white p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[.16em] text-[#a07b3f]">Design library</p>
                    <p className="mt-1 text-sm font-black text-slate-700">Choose a result card style</p>
                  </div>
                  <span className="rounded-full bg-[#f5f1e8] px-2.5 py-1 text-[9px] font-black text-[#8d6a35]">
                    5 layouts · 20 palettes
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {templates.map((item) => (
                    <TemplateCard
                      key={item.id}
                      template={item}
                      selected={template === item.id}
                      theme={item.themes[0]}
                      onClick={() => selectTemplate(item.id)}
                    />
                  ))}
                </div>

                <div className="mt-4 border-t border-[#ece8e0] pt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">Palette</span>
                    <span className="text-[10px] font-semibold text-slate-400">{activeTheme.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeTemplate.themes.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTheme(item.id)}
                        className={`flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-black transition ${
                          theme === item.id
                            ? "border-[#17365D] bg-[#f4f7fa] text-[#17365D]"
                            : "border-[#e1ddd5] bg-white text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        <span className="h-3.5 w-3.5 rounded-full shadow-sm" style={{ backgroundColor: item.ink }} />
                        {item.name}
                        {theme === item.id && <Check size={12} />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#ded9d0] bg-white p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Printer size={14} className="text-[#a07b3f]" />
                  <p className="text-xs font-black text-slate-700">Paper format</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(["a4", "a5", "letter", "legal", "custom"] as PaperSize[]).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setPaperSize(size)}
                      className={`rounded-xl border px-3 py-2.5 text-xs font-black transition ${
                        paperSize === size
                          ? "border-[#17365D] bg-[#17365D] text-white"
                          : "border-[#e1ddd5] bg-[#faf9f6] text-slate-500 hover:bg-white"
                      }`}
                    >
                      {size === "letter" ? "Letter" : size === "legal" ? "Legal" : size === "custom" ? "Custom" : size.toUpperCase()}
                    </button>
                  ))}
                </div>

                {paperSize === "custom" && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <Field label="Width (mm)" value={customWidth} onChange={setCustomWidth} type="number" />
                    <Field label="Height (mm)" value={customHeight} onChange={setCustomHeight} type="number" />
                  </div>
                )}
              </div>
            </div>

            <div className={activeStep === "finalize" ? "space-y-5" : "hidden"}>
              <SectionIntro
                eyebrow="Final review"
                title="Approve & export"
                description="Add signatures, save the official record, then download or print the finished result."
              />

              <div className="grid grid-cols-2 gap-3">
                <StatusCard label="Result" value={totals.result} positive={totals.result === "PASS"} />
                <StatusCard label="Overall grade" value={totals.grade} positive />
              </div>

              <div className="rounded-2xl border border-[#ded9d0] bg-white p-4">
                <div className="mb-3">
                  <p className="text-xs font-black text-slate-700">Signatures</p>
                  <p className="mt-1 text-[10px] leading-4 text-slate-400">Optional signature images appear above the signing lines.</p>
                </div>

                <input
                  ref={teacherRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => readImage(event.target.files?.[0], setTeacherSignature)}
                />
                <input
                  ref={principalRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => readImage(event.target.files?.[0], setPrincipalSignature)}
                />

                <div className="grid grid-cols-2 gap-3">
                  <UploadTile
                    label="Class teacher"
                    ready={Boolean(teacherSignature)}
                    onClick={() => teacherRef.current?.click()}
                  />
                  <UploadTile
                    label="Principal / Head"
                    ready={Boolean(principalSignature)}
                    onClick={() => principalRef.current?.click()}
                  />
                </div>
              </div>

              <div className={`rounded-2xl border p-4 ${savedId ? "border-emerald-200 bg-emerald-50/60" : "border-[#ded9d0] bg-[#faf7f1]"}`}>
                <div className="flex items-start gap-3">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${savedId ? "bg-emerald-100 text-emerald-700" : "bg-white text-[#17365D]"}`}>
                    {savedId ? <CheckCircle2 size={16} /> : <FileText size={16} />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-black">{savedId ? "Official record saved" : "Save before verification"}</p>
                    <p className="mt-1 text-[10px] leading-5 text-slate-500">
                      {savedId
                        ? `Report ID ${savedId}. The verification QR is now included on the result card.`
                        : "Saving creates the report ID and verification QR for this academic record."}
                    </p>
                  </div>
                </div>
              </div>

              {saveError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[11px] font-semibold leading-5 text-rose-700">
                  {saveError}
                </div>
              )}

              <button
                type="button"
                onClick={saveResult}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#17365D] px-4 py-3 text-xs font-black text-white shadow-[0_10px_26px_rgba(23,54,93,.18)] transition hover:bg-[#102d50] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={16} />
                {saving ? "Saving result…" : editReportId ? "Update official result" : savedId ? "Save changes" : "Save official result"}
              </button>

              <div data-gradly-workflow-navigation className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#d8d3ca] bg-white px-4 py-3 text-xs font-black text-slate-600 transition hover:border-[#17365D]/30 hover:text-[#17365D]"
                >
                  <FileDown size={16} />
                  Download / Print
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#d8d3ca] bg-[#faf7f1] px-4 py-3 text-xs font-black text-slate-600 transition hover:bg-white"
                >
                  <Printer size={16} />
                  Quick print
                </button>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 z-20 flex items-center justify-between border-t border-[#e5e0d7] bg-[#fffdfa]/95 px-5 py-3 backdrop-blur">
            <button
              type="button"
              onClick={goPrevious}
              disabled={currentStepIndex === 0}
              className="rounded-xl border border-[#ded9d0] bg-white px-3.5 py-2.5 text-[11px] font-black text-slate-500 transition hover:text-[#17365D] disabled:cursor-not-allowed disabled:opacity-30"
            >
              Previous
            </button>
            <div className="flex items-center gap-1.5">
              {workflowSteps.map((step, index) => (
                <button
                  key={step.id}
                  type="button"
                  aria-label={`Go to ${step.label}`}
                  onClick={() => setActiveStep(step.id)}
                  className={`h-1.5 rounded-full transition-all ${activeStep === step.id ? "w-6 bg-[#b58b48]" : index < currentStepIndex ? "w-2 bg-[#17365D]/30" : "w-2 bg-[#d8d3ca]"}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={goNext}
              disabled={currentStepIndex === workflowSteps.length - 1}
              className="flex items-center gap-1.5 rounded-xl bg-[#17365D] px-3.5 py-2.5 text-[11px] font-black text-white transition hover:bg-[#102d50] disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next
              <ChevronRight size={13} />
            </button>
          </div>
        </section>

        <section className="min-w-0 xl:h-full">
          <div className="gradly-workspace-scroll flex h-full min-h-[680px] flex-col overflow-hidden rounded-[24px] border border-[#d8dce2] bg-[#e9edf2] shadow-[0_18px_55px_rgba(20,36,58,.08)]">
            <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-[#d4d9df] bg-[#f8fafc] px-4 py-3.5">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#dde2e8] bg-white text-[#17365D]">
                  <Eye size={16} />
                </span>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[.18em] text-slate-400">Live preview</p>
                  <p className="mt-0.5 text-xs font-black text-slate-700">
                    {paper.label} · {activeTemplate.name} · {activeTheme.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-lg border border-[#dce1e6] bg-white px-2.5 py-1.5 text-[10px] font-black text-[#17365D]">
                  {totals.percent.toFixed(1)}%
                </span>
                <span className={`rounded-lg px-2.5 py-1.5 text-[10px] font-black ${totals.result === "PASS" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                  {totals.result}
                </span>
              </div>
            </div>

            <div className="gradly-workspace-scroll flex-1 overflow-auto p-4 sm:p-6">
              <div className="print-shell flex min-w-max justify-center">
                <article
                  className={`gradly-paper relative mx-auto overflow-hidden bg-white p-7 shadow-[0_28px_70px_rgba(20,36,58,.20)] print:shadow-none ${
                    legacyStyle ? "border-[8px]" : premiumStyle ? "border-[6px]" : "border-[5px]"
                  } ${minimalStyle ? "p-8" : ""}`}
                  style={{
                    borderColor: activeTheme.ink,
                    backgroundImage: logo
                      ? `linear-gradient(rgba(255,255,255,.93),rgba(255,255,255,.93)),url("${logo}")`
                      : undefined,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center center",
                    backgroundSize: "48% auto",
                  }}
                >
                  {premiumStyle && (
                    <>
                      <div className="pointer-events-none absolute inset-2 border" style={{ borderColor: activeTheme.accent }} />
                      <div className="pointer-events-none absolute inset-4 border opacity-60" style={{ borderColor: activeTheme.accent }} />
                    </>
                  )}
                  {legacyStyle && (
                    <>
                      <div className="pointer-events-none absolute inset-2 border" style={{ borderColor: activeTheme.accent }} />
                      <div className="pointer-events-none absolute inset-5 border" style={{ borderColor: activeTheme.accent }} />
                    </>
                  )}

                  <div
                    className={`relative ${
                      modernStyle ? "rounded-2xl border p-4" : minimalStyle ? "border-b pb-4" : "border-b-[3px] pb-4"
                    }`}
                    style={{
                      borderColor: activeTheme.ink,
                      backgroundColor: modernStyle || minimalStyle ? activeTheme.wash : "transparent",
                      marginTop: "12px",
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`grid h-16 w-16 shrink-0 place-items-center overflow-hidden border ${
                          premiumStyle || legacyStyle ? "rounded-full" : modernStyle ? "rounded-xl" : ""
                        }`}
                        style={{ borderColor: activeTheme.accent, backgroundColor: "white" }}
                      >
                        {logo ? (
                          <img src={logo} alt="School logo" className="h-full w-full object-contain" />
                        ) : (
                          <School size={30} style={{ color: activeTheme.ink }} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h2
                          className={`${premiumStyle ? "uppercase tracking-[.08em]" : legacyStyle ? "tracking-wide" : ""} font-serif text-2xl font-bold`}
                          style={{ color: activeTheme.ink }}
                        >
                          {school}
                        </h2>
                        <p className="mt-1 text-xs italic" style={{ color: activeTheme.accent }}>
                          {motto}
                        </p>
                        <p className="mt-1 text-[10px]" style={{ color: activeTheme.ink }}>
                          {address} · {contact}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-serif text-[11px] font-bold uppercase tracking-widest" style={{ color: activeTheme.ink }}>
                          Student Progress Report
                        </p>
                        <p className="mt-2 text-sm font-bold">{exam}</p>
                        <p className="text-xs">Academic Session {session}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-[1fr_90px] gap-4">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                      <Meta label="Student" value={student} />
                      <Meta label="Father / Guardian" value={father} />
                      <Meta label="Roll Number" value={roll} />
                      <Meta label="Class & Section" value={klass} />
                      <Meta label="Date of Birth" value={dob} />
                      <Meta label="Attendance" value={`${attendance}%`} />
                    </div>
                    <div className="flex justify-end">
                      {photo ? (
                        <img
                          src={photo}
                          alt="Student"
                          className={`${premiumStyle ? "rounded-full" : ""} h-24 w-20 border-2 object-cover`}
                          style={{ borderColor: activeTheme.accent }}
                        />
                      ) : (
                        <div
                          className={`${premiumStyle ? "rounded-full" : ""} grid h-24 w-20 place-items-center border-2 border-dashed text-gray-300`}
                          style={{ borderColor: activeTheme.accent }}
                        >
                          <UserRound size={28} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 overflow-hidden border" style={{ borderColor: activeTheme.ink }}>
                    <table className="w-full text-sm">
                      <thead style={{ backgroundColor: `${activeTheme.ink}80`, color: activeTheme.ink }}>
                        <tr>
                          <th className="px-4 py-3 text-left">Subject</th>
                          <th className="px-3 py-3 text-center">Max Marks</th>
                          <th className="px-3 py-3 text-center">Obtained</th>
                          <th className="px-3 py-3 text-center">%</th>
                          <th className="px-3 py-3 text-center">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjects.map((subject) => {
                          const percent = subject.total ? (subject.obtained / subject.total) * 100 : 0;
                          return (
                            <tr key={subject.id}>
                              <td className="border-b border-gray-200 px-4 py-3 font-semibold">{subject.name}</td>
                              <td className="border-b border-gray-200 px-3 py-3 text-center">{subject.total}</td>
                              <td className="border-b border-gray-200 px-3 py-3 text-center font-bold">{subject.obtained}</td>
                              <td className="border-b border-gray-200 px-3 py-3 text-center">{percent.toFixed(1)}</td>
                              <td className="border-b border-gray-200 px-3 py-3 text-center font-black">{getGrade(percent, bands)}</td>
                            </tr>
                          );
                        })}
                        <tr
                          className="font-black"
                          style={{ borderTop: `2px solid ${activeTheme.ink}`, backgroundColor: activeTheme.wash }}
                        >
                          <td className="px-4 py-3">TOTAL</td>
                          <td className="px-3 py-3 text-center">{totals.total}</td>
                          <td className="px-3 py-3 text-center">{totals.obtained}</td>
                          <td className="px-3 py-3 text-center">{totals.percent.toFixed(1)}</td>
                          <td className="px-3 py-3 text-center">{totals.grade}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-5 grid grid-cols-3 border-y" style={{ borderColor: activeTheme.ink }}>
                    <Stat label="Overall Grade" value={totals.grade} />
                    <Stat label="Class Position" value={position ? `#${position}` : "—"} />
                    <Stat label="Result" value={totals.result} />
                  </div>

                  <div className="mt-5 border p-4" style={{ backgroundColor: activeTheme.wash, borderColor: activeTheme.accent }}>
                    <p className="font-serif text-[10px] font-bold uppercase tracking-widest" style={{ color: activeTheme.ink }}>
                      Principal&apos;s Remarks
                    </p>
                    <p className="mt-1 text-sm font-medium leading-6">{autoRemark(totals.percent, totals.result)}</p>
                  </div>

                  {savedId && (
                    <div className="mt-5 flex items-center justify-between border-t pt-3" style={{ borderColor: activeTheme.accent }}>
                      <div>
                        <p className="font-serif text-[9px] font-bold uppercase tracking-widest" style={{ color: activeTheme.ink }}>
                          Official Verification
                        </p>
                        <p className="mt-1 font-mono text-xs font-bold">{savedId}</p>
                        <p className="mt-1 text-[9px] text-gray-500">Scan QR to verify this academic record.</p>
                      </div>
                      <QRCodeSVG value={verificationUrl} size={68} level="M" includeMargin />
                    </div>
                  )}

                  <div className="mt-7 grid grid-cols-2 gap-10 pt-5 text-center text-xs">
                    <div className="relative border-t pt-2" style={{ borderColor: activeTheme.ink }}>
                      {teacherSignature && (
                        <img
                          src={teacherSignature}
                          alt="Teacher signature"
                          className="absolute bottom-6 left-1/2 h-10 max-w-[130px] -translate-x-1/2 object-contain"
                        />
                      )}
                      Class Teacher
                    </div>
                    <div className="relative border-t pt-2" style={{ borderColor: activeTheme.ink }}>
                      {principalSignature && (
                        <img
                          src={principalSignature}
                          alt="Principal signature"
                          className="absolute bottom-6 left-1/2 h-10 max-w-[130px] -translate-x-1/2 object-contain"
                        />
                      )}
                      Principal / Head
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>
      </div>

      {showSettings && (
        <div
          className="no-print fixed inset-0 z-[100] flex items-center justify-center bg-[#0f2239]/55 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowSettings(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="grading-title"
            className="w-full max-w-2xl overflow-hidden rounded-[26px] border border-[#d9d5cc] bg-[#fffdfa] shadow-[0_30px_100px_rgba(15,34,57,.28)]"
          >
            <div className="border-b border-[#e3ded5] px-6 py-5">
              <p className="text-[9px] font-black uppercase tracking-[.2em] text-[#a07b3f]">Academic configuration</p>
              <h2 id="grading-title" className="mt-1 font-serif text-2xl font-bold">Grading system</h2>
              <p className="mt-1 text-sm text-slate-500">Set the minimum percentage and description for each grade.</p>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-6">
              <div className="mb-3 grid grid-cols-[72px_110px_1fr] gap-3 px-1 text-[9px] font-black uppercase tracking-[.12em] text-slate-400">
                <span>Grade</span>
                <span>Minimum %</span>
                <span>Performance label</span>
              </div>
              <div className="space-y-2">
                {gradingDraft.map((band, index) => (
                  <div key={band.grade} className="grid grid-cols-[72px_110px_1fr] gap-3">
                    <div className="grid place-items-center rounded-xl border border-[#ded9d0] bg-[#f8f5ef] px-2 py-2.5 text-sm font-black">
                      {band.grade}
                    </div>
                    <input
                      aria-label={`${band.grade} minimum percentage`}
                      type="number"
                      min="0"
                      max="100"
                      value={band.min}
                      onChange={(event) =>
                        setGradingDraft((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, min: Math.max(0, Math.min(100, Number(event.target.value))) }
                              : item,
                          ),
                        )
                      }
                      className="rounded-xl border border-[#ded9d0] bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#17365D]"
                    />
                    <input
                      aria-label={`${band.grade} label`}
                      value={band.label}
                      onChange={(event) =>
                        setGradingDraft((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, label: event.target.value } : item,
                          ),
                        )
                      }
                      className="rounded-xl border border-[#ded9d0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#17365D]"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#e3ded5] bg-[#faf7f1] px-6 py-4">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="rounded-xl border border-[#d9d4cb] bg-white px-4 py-2.5 text-sm font-bold text-slate-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveGrading}
                className="rounded-xl bg-[#17365D] px-5 py-2.5 text-sm font-black text-white"
              >
                Save grading
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e1dcd2] bg-[#f9f6f0] p-4">
      <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#a07b3f]">{eyebrow}</p>
      <h3 className="mt-1 font-serif text-lg font-bold text-[#14243a]">{title}</h3>
      <p className="mt-1 text-[11px] leading-5 text-slate-500">{description}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[.14em] text-slate-400">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-[#ded9d0] bg-white px-3.5 py-3 text-sm font-semibold text-[#24364d] outline-none transition placeholder:font-normal placeholder:text-slate-300 focus:border-[#17365D]/60 focus:ring-4 focus:ring-[#17365D]/10"
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#e0dbd2] bg-[#faf7f1] px-3 py-3">
      <p className="text-[8px] font-black uppercase tracking-[.14em] text-slate-400">{label}</p>
      <p className="mt-1 font-serif text-base font-bold text-[#17365D]">{value}</p>
    </div>
  );
}

function StatusCard({ label, value, positive }: { label: string; value: string; positive: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${positive ? "border-emerald-200 bg-emerald-50/60" : "border-rose-200 bg-rose-50/60"}`}>
      <p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">{label}</p>
      <p className={`mt-1 font-serif text-xl font-bold ${positive ? "text-emerald-700" : "text-rose-700"}`}>{value}</p>
    </div>
  );
}

function UploadTile({ label, ready, onClick }: { label: string; ready: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-dashed border-[#d3cdc2] bg-[#faf8f3] p-3 text-left transition hover:border-[#17365D]/35 hover:bg-white"
    >
      <span className={`grid h-8 w-8 place-items-center rounded-lg ${ready ? "bg-emerald-100 text-emerald-700" : "bg-white text-slate-400"}`}>
        {ready ? <Check size={14} /> : <Upload size={14} />}
      </span>
      <span className="mt-2 block text-[11px] font-black text-slate-600">{label}</span>
      <span className="mt-0.5 block text-[9px] text-slate-400">{ready ? "Signature added" : "Upload signature"}</span>
    </button>
  );
}

function TemplateCard({
  template,
  selected,
  theme,
  onClick,
}: {
  template: Template;
  selected: boolean;
  theme: Theme;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} title={template.description} className="group text-left">
      <div
        className={`overflow-hidden rounded-xl border transition ${
          selected
            ? "border-[#17365D] bg-white shadow-[0_8px_20px_rgba(23,54,93,.10)] ring-1 ring-[#17365D]/10"
            : "border-[#e2ddd5] bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
        }`}
      >
        <div className="h-24 p-2" style={{ backgroundColor: theme.wash }}>
          <div className="h-full overflow-hidden rounded-md border bg-white shadow-sm" style={{ borderColor: theme.ink }}>
            <div className="flex items-center gap-1.5 border-b-2 p-1.5" style={{ borderColor: theme.ink }}>
              <span className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: theme.accent }} />
              <div className="min-w-0 flex-1">
                <div className="h-1.5 w-14 rounded-full" style={{ backgroundColor: theme.ink }} />
                <div className="mt-1 h-1 w-9 rounded-full bg-slate-200" />
              </div>
            </div>
            <div className="p-1.5">
              {[1, 2, 3].map((index) => (
                <div key={index} className="mt-1.5 flex gap-1">
                  <span className="h-1 flex-1 rounded bg-slate-200" />
                  <span className="h-1 w-5 rounded bg-slate-200" />
                  <span className="h-1 w-4 rounded bg-slate-200" />
                </div>
              ))}
              <div className="mt-2 h-4 rounded" style={{ backgroundColor: theme.wash }} />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-black text-slate-700">{template.name}</p>
            <p className="mt-0.5 truncate text-[8px] text-slate-400">{template.description}</p>
          </div>
          {selected && (
            <span className="rounded-full bg-[#17365D] px-2 py-1 text-[8px] font-black uppercase tracking-wider text-white">
              Selected
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-0.5 font-semibold">{value || "—"}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-3 text-center">
      <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-1 font-serif text-lg font-bold" style={{ color: "inherit" }}>
        {value}
      </p>
    </div>
  );
}
