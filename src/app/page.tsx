"use client";

import { useMemo, useRef, useState } from "react";
import {
  Award,
  BarChart3,
  Check,
  FileDown,
  ImagePlus,
  Plus,
  Printer,
  School,
  Settings2,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";

type Subject = { id: number; name: string; total: number; obtained: number };
type Template = "royal" | "classic" | "modern" | "heritage";

type GradingBand = { grade: string; min: number; label: string };

const initial: Subject[] = [
  { id: 1, name: "English", total: 100, obtained: 86 },
  { id: 2, name: "Mathematics", total: 100, obtained: 91 },
  { id: 3, name: "Science", total: 100, obtained: 84 },
  { id: 4, name: "Computer Science", total: 100, obtained: 94 },
  { id: 5, name: "Social Studies", total: 100, obtained: 79 },
];

const defaultBands: GradingBand[] = [
  { grade: "A+", min: 90, label: "Outstanding" },
  { grade: "A", min: 80, label: "Excellent" },
  { grade: "B+", min: 70, label: "Very Good" },
  { grade: "B", min: 60, label: "Good" },
  { grade: "C", min: 50, label: "Satisfactory" },
  { grade: "D", min: 40, label: "Needs Improvement" },
  { grade: "F", min: 0, label: "Fail" },
];

function grade(percent: number, bands: GradingBand[]) {
  return [...bands].sort((a, b) => b.min - a.min).find((b) => percent >= b.min)?.grade ?? "F";
}

function remark(percent: number, result: string) {
  if (result === "FAIL") return "Keep working consistently and focus on the subjects that need improvement.";
  if (percent >= 90) return "Outstanding performance. Keep aiming higher and continue your excellent work.";
  if (percent >= 80) return "Excellent performance. Continue developing consistency and curiosity.";
  if (percent >= 70) return "Very good progress. With continued effort, even stronger results are achievable.";
  if (percent >= 60) return "Good progress. Regular revision and practice will help improve further.";
  return "Satisfactory progress. More focused practice and consistent study are recommended.";
}

export default function Home() {
  const logoRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const teacherSigRef = useRef<HTMLInputElement>(null);
  const principalSigRef = useRef<HTMLInputElement>(null);

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
  const [template, setTemplate] = useState<Template>("royal");
  const [showSettings, setShowSettings] = useState(false);
  const [bands, setBands] = useState(defaultBands);
  const [logo, setLogo] = useState("");
  const [photo, setPhoto] = useState("");
  const [teacherSignature, setTeacherSignature] = useState("");
  const [principalSignature, setPrincipalSignature] = useState("");

  const totals = useMemo(() => {
    const total = subjects.reduce((a, s) => a + Math.max(0, s.total), 0);
    const obtained = subjects.reduce((a, s) => a + Math.min(Math.max(0, s.obtained), Math.max(0, s.total)), 0);
    const percent = total ? (obtained / total) * 100 : 0;
    const result = subjects.length && subjects.every((s) => (s.total ? (s.obtained / s.total) * 100 : 0) >= 40) ? "PASS" : "FAIL";
    return { total, obtained, percent, grade: grade(percent, bands), result };
  }, [subjects, bands]);

  const update = (id: number, key: "name" | "total" | "obtained", value: string) =>
    setSubjects((a) => a.map((s) => (s.id === id ? { ...s, [key]: key === "name" ? value : Number(value) } : s)));

  const readImage = (file: File | undefined, setter: (value: string) => void) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setter(String(reader.result));
    reader.readAsDataURL(file);
  };

  const exportPdf = () => window.print();

  const theme = {
    royal: { border: "border-[#101828]", accent: "#101828", header: "bg-[#101828]", soft: "bg-slate-50", badge: "bg-indigo-50 text-indigo-700" },
    classic: { border: "border-[#3f3f46]", accent: "#3f3f46", header: "bg-[#3f3f46]", soft: "bg-zinc-50", badge: "bg-zinc-100 text-zinc-700" },
    modern: { border: "border-[#5b5bd6]", accent: "#5b5bd6", header: "bg-[#5b5bd6]", soft: "bg-indigo-50/50", badge: "bg-indigo-50 text-indigo-700" },
    heritage: { border: "border-[#68421d]", accent: "#68421d", header: "bg-[#68421d]", soft: "bg-amber-50/40", badge: "bg-amber-50 text-amber-800" },
  }[template];

  return (
    <main className="min-h-screen workspace-grid">
      <header className="no-print sticky top-0 z-30 border-b border-gray-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-3.5 lg:px-7">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#101828] text-white"><Sparkles size={19} /></div>
            <div><div className="text-lg font-bold tracking-tight">Gradly</div><div className="text-[10px] font-bold uppercase tracking-[.18em] text-gray-400">Result Studio</div></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSettings((v) => !v)} className="hidden items-center gap-2 rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-semibold sm:flex"><Settings2 size={16} />Grading</button>
            <button onClick={exportPdf} className="hidden items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold md:flex"><Printer size={16} />Print / PDF</button>
            <button onClick={exportPdf} className="flex items-center gap-2 rounded-lg bg-[#101828] px-4 py-2 text-sm font-semibold text-white"><FileDown size={16} />Export PDF</button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-7 px-5 py-7 lg:grid-cols-[450px_minmax(0,1fr)] lg:px-7">
        <section className="no-print space-y-4">
          <div className="px-1">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[.18em] text-[#5b5bd6]">Create result</p>
            <h1 className="text-3xl font-bold tracking-tight">Build a professional report card.</h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">Everything is calculated live. Upload your school assets, configure the grading scale, choose a template and export the final A4 document.</p>
          </div>

          {showSettings && <Panel title="Grading configuration" icon={<Settings2 size={17} />}>
            <div className="space-y-2">
              {bands.slice(0, -1).map((b, i) => <div key={b.grade} className="grid grid-cols-[55px_80px_1fr] items-center gap-2"><span className="rounded-md bg-gray-50 px-2 py-2 text-center text-sm font-bold">{b.grade}</span><input type="number" min={0} max={100} value={b.min} onChange={(e) => setBands((all) => all.map((x, j) => j === i ? { ...x, min: Number(e.target.value) } : x))} className="rounded-lg border border-gray-200 px-2 py-2 text-sm"/><input value={b.label} onChange={(e) => setBands((all) => all.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} className="rounded-lg border border-gray-200 px-2 py-2 text-sm"/></div>)}
              <p className="pt-1 text-[11px] text-gray-400">The remaining band automatically represents F / fail.</p>
            </div>
          </Panel>}

          <Panel title="School information" icon={<School size={17} />}>
            <Field label="School name" value={school} onChange={setSchool} />
            <div className="grid grid-cols-2 gap-3"><Field label="Exam" value={exam} onChange={setExam} /><Field label="Academic session" value={session} onChange={setSession} /></div>
            <Field label="Motto" value={motto} onChange={setMotto} /><Field label="Address / campus" value={address} onChange={setAddress} /><Field label="Contact" value={contact} onChange={setContact} />
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => readImage(e.target.files?.[0], setLogo)} />
            <button onClick={() => logoRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 py-3 text-sm font-semibold hover:border-[#5b5bd6]">{logo ? <Check size={17} /> : <ImagePlus size={17} />}{logo ? "School logo added" : "Add school logo"}</button>
          </Panel>

          <Panel title="Student information" icon={<UserRound size={17} />}>
            <div className="grid grid-cols-2 gap-3"><Field label="Student name" value={student} onChange={setStudent} /><Field label="Roll number" value={roll} onChange={setRoll} /></div>
            <Field label="Father / guardian" value={father} onChange={setFather} />
            <div className="grid grid-cols-2 gap-3"><Field label="Class & section" value={klass} onChange={setKlass} /><Field label="Date of birth" value={dob} onChange={setDob} type="date" /></div>
            <div className="grid grid-cols-2 gap-3"><Field label="Attendance %" value={String(attendance)} onChange={(v) => setAttendance(Number(v))} type="number" /><Field label="Class position" value={String(position)} onChange={(v) => setPosition(Number(v))} type="number" /></div>
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={(e) => readImage(e.target.files?.[0], setPhoto)} />
            <button onClick={() => photoRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 py-3 text-sm font-semibold hover:border-[#5b5bd6]">{photo ? <Check size={17} /> : <Upload size={17} />}{photo ? "Student photo added" : "Add student photo"}</button>
          </Panel>

          <Panel title="Subjects & marks" icon={<BarChart3 size={17} />}>
            <div className="mb-2 grid grid-cols-[1fr_65px_65px_28px] gap-2 px-1 text-[9px] font-bold uppercase tracking-wider text-gray-400"><span>Subject</span><span>Max</span><span>Obt.</span><span /></div>
            <div className="space-y-2">{subjects.map((s) => <div key={s.id} className="grid grid-cols-[1fr_65px_65px_28px] gap-2"><input aria-label="Subject name" value={s.name} onChange={(e) => update(s.id, "name", e.target.value)} className="min-w-0 rounded-lg border border-gray-200 px-2.5 py-2 text-sm" /><input aria-label="Total marks" type="number" value={s.total} onChange={(e) => update(s.id, "total", e.target.value)} className="rounded-lg border border-gray-200 px-2 py-2 text-sm" /><input aria-label="Obtained marks" type="number" value={s.obtained} onChange={(e) => update(s.id, "obtained", e.target.value)} className="rounded-lg border border-gray-200 px-2 py-2 text-sm" /><button aria-label="Delete subject" onClick={() => setSubjects(subjects.filter((x) => x.id !== s.id))} className="grid h-8 w-7 place-items-center text-gray-400 hover:text-red-500"><Trash2 size={14} /></button></div>)}</div>
            <button onClick={() => setSubjects((a) => [...a, { id: Date.now(), name: "New Subject", total: 100, obtained: 80 }])} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold hover:bg-gray-50"><Plus size={16} />Add subject</button>
          </Panel>

          <Panel title="Report template" icon={<Award size={17} />}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{(["royal", "classic", "modern", "heritage"] as Template[]).map((t) => <button key={t} onClick={() => setTemplate(t)} className={`rounded-xl border p-3 text-left transition ${template === t ? "border-[#5b5bd6] bg-indigo-50 ring-1 ring-[#5b5bd6]" : "border-gray-200 hover:border-gray-300"}`}><div className="mb-2 h-7 rounded-md" style={{ background: { royal: "#101828", classic: "#3f3f46", modern: "#5b5bd6", heritage: "#68421d" }[t] }} /><span className="text-xs font-bold capitalize">{t}</span></button>)}</div>
          </Panel>

          <Panel title="Signatures" icon={<Upload size={17} />}>
            <input ref={teacherSigRef} type="file" accept="image/*" className="hidden" onChange={(e) => readImage(e.target.files?.[0], setTeacherSignature)} />
            <input ref={principalSigRef} type="file" accept="image/*" className="hidden" onChange={(e) => readImage(e.target.files?.[0], setPrincipalSignature)} />
            <div className="grid grid-cols-2 gap-2"><button onClick={() => teacherSigRef.current?.click()} className="rounded-xl border border-dashed border-gray-300 px-3 py-3 text-xs font-semibold">{teacherSignature ? "✓ Teacher signature" : "Teacher signature"}</button><button onClick={() => principalSigRef.current?.click()} className="rounded-xl border border-dashed border-gray-300 px-3 py-3 text-xs font-semibold">{principalSignature ? "✓ Principal signature" : "Principal signature"}</button></div>
          </Panel>
        </section>

        <section className="min-w-0 lg:sticky lg:top-20 lg:h-[calc(100vh-105px)] lg:overflow-auto">
          <div className="no-print mb-4 flex items-center justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-gray-400">Live preview</p><p className="text-sm text-gray-500">A4 portrait · {template} template</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${theme.badge}`}>Auto-calculated</span></div>
          <article className={`print-area paper-shadow mx-auto w-full max-w-[794px] bg-white p-5 sm:p-9 ${theme.soft}`}>
            <div className={`result-paper border-[3px] ${theme.border} p-5 sm:p-7`} style={{ "--accent": theme.accent } as React.CSSProperties}>
              <div className="flex items-start justify-between gap-4 border-b border-gray-300 pb-5">
                <div className="flex min-w-0 items-center gap-4">{logo ? <img src={logo} alt="School logo" className="h-16 w-16 rounded-full object-contain" /> : <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-2 border-gray-300 text-gray-400"><School size={26} /></div>}<div className="min-w-0"><h2 className="text-xl font-black uppercase sm:text-2xl">{school}</h2><p className="mt-1 text-[10px] uppercase tracking-[.16em] text-gray-500">{motto}</p><p className="mt-1 text-[10px] text-gray-400">{address} · {contact}</p></div></div>
                <div className="shrink-0 text-right text-[10px] text-gray-500"><p className="font-bold text-gray-800">{exam}</p><p>Session {session}</p></div>
              </div>
              <div className="py-6 text-center"><p className="text-[10px] font-bold uppercase tracking-[.3em] text-gray-500">Student Progress Report</p><h3 className="mt-1 text-3xl font-black">Academic Result</h3></div>
              <div className="mb-6 grid grid-cols-[1fr_88px] gap-5 border-y border-gray-300 py-4"><div className="grid grid-cols-2 gap-3"><Info label="Student" value={student} /><Info label="Roll No." value={roll} /><Info label="Father / Guardian" value={father} /><Info label="Class" value={klass} /><Info label="Date of Birth" value={dob} /><Info label="Position" value={`#${position}`} /></div>{photo ? <img src={photo} alt="Student" className="h-24 w-[88px] rounded-lg object-cover" /> : <div className="grid h-24 place-items-center border border-dashed border-gray-300 text-[9px] uppercase tracking-widest text-gray-400">Photo</div>}</div>
              <table className="w-full border-collapse text-sm"><thead><tr className={`${theme.header} text-left text-[10px] uppercase tracking-wider text-white`}><th className="px-3 py-2.5">Subject</th><th className="px-2 text-center">Max</th><th className="px-2 text-center">Obtained</th><th className="px-2 text-center">%</th><th className="px-2 text-center">Grade</th></tr></thead><tbody>{subjects.map((s, i) => { const p = s.total ? (s.obtained / s.total) * 100 : 0; return <tr key={s.id} className={i % 2 ? "bg-gray-50" : ""}><td className="border-b border-gray-200 px-3 py-2.5 font-semibold">{s.name}</td><td className="border-b border-gray-200 text-center">{s.total}</td><td className="border-b border-gray-200 text-center font-bold">{s.obtained}</td><td className="border-b border-gray-200 text-center">{p.toFixed(1)}</td><td className="border-b border-gray-200 text-center font-bold">{grade(p, bands)}</td></tr>); })}</tbody></table>
              <div className="mt-6 grid grid-cols-4 gap-2"><Metric label="Total Marks" value={`${totals.obtained}/${totals.total}`} /><Metric label="Percentage" value={`${totals.percent.toFixed(1)}%`} /><Metric label="Overall Grade" value={totals.grade} /><Metric label="Result" value={totals.result} /></div>
              <div className="mt-6 grid grid-cols-3 gap-2"><Metric label="Position" value={`#${position}`} /><Metric label="Attendance" value={`${attendance}%`} /><Metric label="Report ID" value="GRD-2026-001" /></div>
              <div className="mt-7 grid grid-cols-2 gap-6 border-t border-gray-300 pt-6"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-gray-400">Teacher's remarks</p><p className="mt-2 text-sm leading-6">{remark(totals.percent, totals.result)}</p></div><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-gray-400">Performance</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full" style={{ width: `${Math.min(100, Math.max(0, totals.percent))}%`, background: theme.accent }} /></div><p className="mt-1 text-right text-xs font-bold">{totals.percent.toFixed(1)}%</p></div></div>
              <div className="mt-12 grid grid-cols-2 gap-12 text-center"><div>{teacherSignature ? <img src={teacherSignature} alt="Teacher signature" className="mx-auto mb-2 h-9 max-w-32 object-contain" /> : <div className="mx-auto mb-2 h-px w-32 bg-gray-400" />}<p className="text-[10px] uppercase tracking-wider text-gray-500">Class Teacher</p></div><div>{principalSignature ? <img src={principalSignature} alt="Principal signature" className="mx-auto mb-2 h-9 max-w-32 object-contain" /> : <div className="mx-auto mb-2 h-px w-32 bg-gray-400" />}<p className="text-[10px] uppercase tracking-wider text-gray-500">Principal / Head</p></div></div>
              <div className="mt-8 flex justify-between border-t border-gray-200 pt-3 text-[9px] uppercase tracking-wider text-gray-400"><span>Generated with Gradly</span><span>Report ID · GRD-2026-001</span></div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) { return <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"><div className="mb-4 flex items-center gap-2 text-sm font-bold"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#eeedff] text-[#5b5bd6]">{icon}</span>{title}</div>{children}</div>; }
function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) { return <label className="mb-3 block"><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#5b5bd6]" /></label>; }
function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{label}</p><p className="mt-0.5 truncate text-sm font-semibold">{value || "—"}</p></div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="border border-gray-200 bg-white/70 p-3 text-center"><p className="text-[8px] font-bold uppercase tracking-wider text-gray-400">{label}</p><p className="mt-1 text-base font-black sm:text-lg">{value}</p></div>; }
