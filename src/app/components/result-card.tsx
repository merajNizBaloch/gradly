"use client";

import { QRCodeSVG } from "qrcode.react";
import { allThemes, autoRemark, getGrade, paperPresets, type Band, type DesignSettings, type SchoolSettings, type Subject, type TemplateId } from "./workspace-model";

type ThemeValue = { ink: string; wash: string; accent: string };
type Row = Subject & { percent: number; grade: string };

type CompositionProps = {
  school: SchoolSettings;
  student: string;
  father: string;
  roll: string;
  klass: string;
  session: string;
  exam: string;
  dob: string;
  attendance: number;
  position: number;
  photo: string;
  rows: Row[];
  bands: Band[];
  total: number;
  obtained: number;
  percent: number;
  status: string;
  grade: string;
  teacherRemarks: string;
  principalRemarks: string;
  verificationUrl: string;
  theme: ThemeValue;
};

function Logo({ school, theme, className = "h-20 w-20" }: { school: SchoolSettings; theme: ThemeValue; className?: string }) {
  return (
    <div className={`grid shrink-0 place-items-center overflow-hidden border bg-white ${className}`} style={{ borderColor: theme.ink }}>
      {school.logo ? <img src={school.logo} alt="School logo" className="h-full w-full object-contain p-1" /> : <span className="font-serif text-2xl font-black" style={{ color: theme.ink }}>G</span>}
    </div>
  );
}

function StudentPhoto({ photo, theme, className = "h-24 w-20" }: { photo: string; theme: ThemeValue; className?: string }) {
  return photo ? <img src={photo} alt="Student" className={`${className} border object-cover`} style={{ borderColor: theme.ink }} /> : <div className={`${className} border bg-slate-50`} style={{ borderColor: theme.ink }} />;
}

function MarksTable({ rows, theme, ledger = false, minimal = false }: { rows: Row[]; theme: ThemeValue; ledger?: boolean; minimal?: boolean }) {
  return (
    <div className={`overflow-hidden ${minimal ? "border-y-2" : "border"}`} style={{ borderColor: theme.ink }}>
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr style={minimal ? { color: theme.ink } : { backgroundColor: theme.ink, color: "white" }}>
            {ledger && <th className="border-r px-2 py-2.5 text-center" style={{ borderColor: theme.ink }}>#</th>}
            <th className="px-3 py-2.5 text-left">Subject</th>
            <th className="px-3 py-2.5 text-center">Max</th>
            <th className="px-3 py-2.5 text-center">Obt.</th>
            <th className="px-3 py-2.5 text-center">%</th>
            <th className="px-3 py-2.5 text-center">Grade</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id} className="border-t border-slate-300">
              {ledger && <td className="border-r px-2 py-2.5 text-center font-bold text-slate-500" style={{ borderColor: theme.ink }}>{index + 1}</td>}
              <td className="px-3 py-2.5 font-semibold text-slate-800">{row.name}</td>
              <td className="px-3 py-2.5 text-center text-slate-600">{row.total}</td>
              <td className="px-3 py-2.5 text-center font-black text-slate-800">{row.obtained}</td>
              <td className="px-3 py-2.5 text-center text-slate-600">{row.percent.toFixed(1)}</td>
              <td className="px-3 py-2.5 text-center font-black" style={{ color: theme.ink }}>{row.grade}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetaGrid({ student, father, roll, klass, session, dob, theme, boxed = false }: Pick<CompositionProps, "student" | "father" | "roll" | "klass" | "session" | "dob" | "theme"> & { boxed?: boolean }) {
  return (
    <div className={`grid grid-cols-2 text-[12px] ${boxed ? "border-l border-t" : "gap-x-8 gap-y-3"}`} style={boxed ? { borderColor: theme.ink } : undefined}>
      {[["Student", student], ["Father / Guardian", father], ["Roll No.", roll], ["Class", klass], ["Session", session], ["Date of Birth", dob || "—"]].map(([label, value]) => (
        <div key={label} className={boxed ? "border-b border-r p-2.5" : "flex items-center justify-between gap-3 border-b border-slate-200 pb-2"} style={boxed ? { borderColor: theme.ink } : undefined}>
          <span className="font-bold text-slate-500">{label}</span>
          <span className={`${boxed ? "mt-1 block" : "text-right"} font-black text-slate-800`}>{value || "—"}</span>
        </div>
      ))}
    </div>
  );
}

function Summary({ total, obtained, percent, grade, status, theme, minimal = false }: Pick<CompositionProps, "total" | "obtained" | "percent" | "grade" | "status" | "theme"> & { minimal?: boolean }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {[["Obtained", `${obtained}/${total}`], ["Percentage", `${percent.toFixed(1)}%`], ["Grade", grade], ["Result", status]].map(([label, value]) => (
        <div key={label} className={`${minimal ? "border-t-2 py-3" : "border p-3"} text-center`} style={minimal ? { borderColor: theme.ink } : { borderColor: theme.ink, backgroundColor: theme.wash }}>
          <p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-500">{label}</p>
          <p className="mt-1 text-base font-black" style={{ color: theme.ink }}>{value}</p>
        </div>
      ))}
    </div>
  );
}

function Remarks({ teacherRemarks, principalRemarks, attendance, position, verificationUrl, theme, minimal = false }: Pick<CompositionProps, "teacherRemarks" | "principalRemarks" | "attendance" | "position" | "verificationUrl" | "theme"> & { minimal?: boolean }) {
  return (
    <div className={`grid grid-cols-[1fr_auto] gap-5 ${minimal ? "border-y py-4" : "border p-4"}`} style={minimal ? { borderColor: theme.ink } : { borderColor: theme.ink, backgroundColor: theme.wash }}>
      <div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-500">Teacher remarks</p>
            <p className="mt-2 text-[11px] font-medium leading-5 text-slate-700">{teacherRemarks}</p>
          </div>
          <div className="border-l pl-4" style={{ borderColor: theme.accent }}>
            <p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-500">Principal remarks</p>
            <p className="mt-2 text-[11px] font-medium leading-5 text-slate-700">{principalRemarks || "—"}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-6 border-t pt-3 text-[11px] text-slate-600" style={{ borderColor: theme.accent }}><span>Attendance: <strong>{attendance}%</strong></span><span>Position: <strong>{position || "—"}</strong></span></div>
      </div>
      {verificationUrl ? <div className="text-center"><QRCodeSVG value={verificationUrl} size={68} /><p className="mt-1 text-[9px] font-black text-slate-500">VERIFY</p></div> : null}
    </div>
  );
}

function Signatures({ theme }: { theme: ThemeValue }) {
  return (
    <div className="mt-auto pt-12">
      <div className="flex items-end justify-between gap-8 text-[11px] font-semibold text-slate-600">
        <div className="w-40 border-t pt-2 text-center" style={{ borderColor: theme.ink }}>Class Teacher Signature</div>
        <div className="w-40 border-t pt-2 text-center" style={{ borderColor: theme.ink }}>Principal Signature</div>
      </div>
    </div>
  );
}

function AcademicDesign(p: CompositionProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col p-9">
      <div className="flex items-center gap-5 border-b-2 pb-5" style={{ borderColor: p.theme.ink }}>
        <Logo school={p.school} theme={p.theme} />
        <div className="min-w-0 flex-1 text-center"><h1 className="font-serif text-2xl font-bold" style={{ color: p.theme.ink }}>{p.school.name}</h1><p className="mt-1 text-sm italic text-slate-600">{p.school.motto}</p><p className="mt-1 text-[11px] font-medium text-slate-500">{p.school.address} · {p.school.contact}</p><div className="mt-3 inline-flex px-3 py-1.5 text-[11px] font-black uppercase tracking-[.12em]" style={{ backgroundColor: p.theme.wash, color: p.theme.ink }}>{p.exam}</div></div>
        <StudentPhoto photo={p.photo} theme={p.theme} />
      </div>
      <div className="mt-6"><MetaGrid {...p} /></div>
      <div className="mt-6"><MarksTable rows={p.rows} theme={p.theme} /></div>
      <div className="mt-6"><Summary {...p} /></div>
      <div className="mt-6"><Remarks {...p} /></div>
      <Signatures theme={p.theme} />
    </div>
  );
}

function ModernDesign(p: CompositionProps) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[31%_1fr]">
      <aside className="flex flex-col p-7 text-white" style={{ backgroundColor: p.theme.ink }}>
        <Logo school={p.school} theme={p.theme} className="h-16 w-16 border-white/60" />
        <h1 className="mt-5 font-serif text-2xl font-bold leading-tight">{p.school.name}</h1>
        <p className="mt-2 text-[11px] leading-5 text-white/65">{p.school.motto}</p>
        <div className="mt-8 border-y border-white/25 py-4"><p className="text-[9px] font-black uppercase tracking-[.16em] text-white/55">{p.exam}</p><p className="mt-2 font-serif text-5xl font-black">{p.percent.toFixed(1)}%</p><div className="mt-3 flex items-center justify-between text-[11px]"><span>Grade <strong>{p.grade}</strong></span><strong>{p.status}</strong></div></div>
        <div className="mt-6 text-[11px] leading-6 text-white/70"><p>{p.session}</p><p>{p.klass}</p><p>Roll · {p.roll || "—"}</p></div>
        <div className="mt-auto text-[10px] leading-5 text-white/50">{p.school.address}<br />{p.school.contact}</div>
      </aside>
      <div className="flex min-h-0 flex-col p-8">
        <div className="flex items-start gap-5"><StudentPhoto photo={p.photo} theme={p.theme} className="h-28 w-24" /><div className="flex-1"><p className="text-[9px] font-black uppercase tracking-[.16em]" style={{ color: p.theme.accent }}>Student profile</p><h2 className="mt-1 font-serif text-3xl font-bold text-slate-900">{p.student}</h2><p className="mt-2 text-[12px] text-slate-600">{p.father}</p><div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[11px]"><span><b className="text-slate-400">DOB</b> · {p.dob || "—"}</span><span><b className="text-slate-400">Position</b> · {p.position || "—"}</span><span><b className="text-slate-400">Attendance</b> · {p.attendance}%</span><span><b className="text-slate-400">Class</b> · {p.klass}</span></div></div></div>
        <div className="mt-7"><MarksTable rows={p.rows} theme={p.theme} /></div>
        <div className="mt-5 grid grid-cols-3 gap-2">{[["Obtained", `${p.obtained}/${p.total}`], ["Grade", p.grade], ["Result", p.status]].map(([label, value]) => <div key={label} className="p-3" style={{ backgroundColor: p.theme.wash }}><p className="text-[9px] font-black uppercase text-slate-500">{label}</p><p className="mt-1 text-lg font-black" style={{ color: p.theme.ink }}>{value}</p></div>)}</div>
        <div className="mt-5"><Remarks {...p} minimal /></div>
        <Signatures theme={p.theme} />
      </div>
    </div>
  );
}

function CertificateDesign(p: CompositionProps) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col p-10">
      <div className="pointer-events-none absolute inset-3 border" style={{ borderColor: p.theme.accent }} />
      <div className="pointer-events-none absolute left-6 top-6 h-8 w-8 border-l-2 border-t-2" style={{ borderColor: p.theme.accent }} /><div className="pointer-events-none absolute right-6 top-6 h-8 w-8 border-r-2 border-t-2" style={{ borderColor: p.theme.accent }} /><div className="pointer-events-none absolute bottom-6 left-6 h-8 w-8 border-b-2 border-l-2" style={{ borderColor: p.theme.accent }} /><div className="pointer-events-none absolute bottom-6 right-6 h-8 w-8 border-b-2 border-r-2" style={{ borderColor: p.theme.accent }} />
      <div className="relative text-center">
        <Logo school={p.school} theme={p.theme} className="mx-auto h-16 w-16" />
        <h1 className="mt-3 font-serif text-2xl font-bold uppercase tracking-[.08em]" style={{ color: p.theme.ink }}>{p.school.name}</h1>
        <p className="mt-1 text-[11px] text-slate-500">{p.school.motto}</p>
        <div className="mx-auto mt-5 h-px w-44" style={{ backgroundColor: p.theme.accent }} />
        <p className="mt-4 text-[10px] font-black uppercase tracking-[.28em]" style={{ color: p.theme.accent }}>Statement of Academic Achievement</p>
        <h2 className="mt-3 font-serif text-4xl font-bold" style={{ color: p.theme.ink }}>{p.student}</h2>
        <p className="mt-2 text-[12px] text-slate-600">has completed <strong>{p.exam}</strong> · {p.session}</p>
        <div className="mx-auto mt-4 inline-flex gap-5 border-y px-6 py-2 text-[11px] font-semibold text-slate-600" style={{ borderColor: p.theme.accent }}><span>{p.klass}</span><span>Roll {p.roll || "—"}</span><span>{p.dob || "DOB —"}</span></div>
      </div>
      <div className="relative mt-7"><MarksTable rows={p.rows} theme={p.theme} /></div>
      <div className="relative mx-auto mt-6 grid w-[80%] grid-cols-4 gap-3">{[["Marks", `${p.obtained}/${p.total}`], ["Score", `${p.percent.toFixed(1)}%`], ["Grade", p.grade], ["Status", p.status]].map(([label, value]) => <div key={label} className="border-y py-3 text-center" style={{ borderColor: p.theme.accent }}><p className="text-[9px] font-black uppercase text-slate-500">{label}</p><p className="mt-1 font-serif text-xl font-bold" style={{ color: p.theme.ink }}>{value}</p></div>)}</div>
      <div className="relative mt-6"><Remarks {...p} minimal /></div>
      <Signatures theme={p.theme} />
    </div>
  );
}

function ExecutiveDesign(p: CompositionProps) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[14px_1fr]">
      <div style={{ backgroundColor: p.theme.ink }} />
      <div className="flex min-h-0 flex-col p-8">
        <div className="flex items-start justify-between gap-6"><div><p className="text-[9px] font-black uppercase tracking-[.18em]" style={{ color: p.theme.accent }}>Academic performance report</p><h1 className="mt-2 text-2xl font-black uppercase tracking-[.08em]" style={{ color: p.theme.ink }}>{p.school.name}</h1><p className="mt-1 text-[11px] text-slate-500">{p.school.address} · {p.school.contact}</p></div><Logo school={p.school} theme={p.theme} className="h-16 w-16" /></div>
        <div className="mt-6 grid grid-cols-[1fr_auto] items-end gap-6 border-y py-5" style={{ borderColor: p.theme.ink }}><div><p className="text-[9px] font-black uppercase text-slate-500">Student</p><h2 className="mt-1 font-serif text-3xl font-bold text-slate-900">{p.student}</h2><p className="mt-2 text-[11px] text-slate-600">{p.father} · {p.klass} · Roll {p.roll || "—"}</p></div><StudentPhoto photo={p.photo} theme={p.theme} className="h-24 w-20" /></div>
        <div className="mt-6 grid grid-cols-[1.4fr_.8fr_.8fr] gap-3"><div className="p-5" style={{ backgroundColor: p.theme.ink, color: "white" }}><p className="text-[9px] font-black uppercase tracking-[.14em] text-white/60">Overall score</p><p className="mt-1 text-4xl font-black">{p.percent.toFixed(1)}%</p><p className="mt-2 text-[11px] text-white/65">{p.exam} · {p.session}</p></div><div className="border p-4" style={{ borderColor: p.theme.ink, backgroundColor: p.theme.wash }}><p className="text-[9px] font-black uppercase text-slate-500">Grade</p><p className="mt-3 text-3xl font-black" style={{ color: p.theme.ink }}>{p.grade}</p></div><div className="border p-4" style={{ borderColor: p.theme.ink }}><p className="text-[9px] font-black uppercase text-slate-500">Result</p><p className="mt-3 text-xl font-black" style={{ color: p.theme.ink }}>{p.status}</p></div></div>
        <div className="mt-6"><MarksTable rows={p.rows} theme={p.theme} /></div>
        <div className="mt-5"><Remarks {...p} /></div>
        <Signatures theme={p.theme} />
      </div>
    </div>
  );
}

function MinimalDesign(p: CompositionProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col p-8">
      <div className="flex items-start justify-between border-b-2 pb-4" style={{ borderColor: p.theme.ink }}><div><p className="text-[10px] font-black uppercase tracking-[.2em]" style={{ color: p.theme.ink }}>{p.school.name}</p><p className="mt-1 text-[11px] text-slate-500">{p.exam} · {p.session}</p></div><Logo school={p.school} theme={p.theme} className="h-12 w-12" /></div>
      <div className="mt-7 flex items-end justify-between gap-8"><div><p className="text-[9px] font-black uppercase text-slate-400">Student result</p><h2 className="mt-1 font-serif text-4xl font-bold text-slate-900">{p.student}</h2><p className="mt-2 text-[12px] text-slate-600">{p.klass} · Roll {p.roll || "—"}</p></div><div className="text-right"><p className="text-5xl font-light" style={{ color: p.theme.ink }}>{p.percent.toFixed(1)}</p><p className="text-[10px] font-black uppercase tracking-[.18em] text-slate-400">percent</p></div></div>
      <div className="mt-7"><MetaGrid {...p} /></div>
      <div className="mt-7"><MarksTable rows={p.rows} theme={p.theme} minimal /></div>
      <div className="mt-6"><Summary {...p} minimal /></div>
      <div className="mt-6"><Remarks {...p} minimal /></div>
      <Signatures theme={p.theme} />
    </div>
  );
}

function HeritageDesign(p: CompositionProps) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col p-9">
      <div className="absolute inset-4 border" style={{ borderColor: p.theme.accent }} />
      <div className="relative text-center"><div className="mx-auto grid h-12 w-12 rotate-45 place-items-center border-2" style={{ borderColor: p.theme.accent }}><div className="-rotate-45"><Logo school={p.school} theme={p.theme} className="h-9 w-9 border-0" /></div></div><h1 className="mt-4 font-serif text-3xl font-bold" style={{ color: p.theme.ink }}>{p.school.name}</h1><p className="mt-1 text-[11px] italic text-slate-500">{p.school.motto}</p><div className="mx-auto mt-3 flex w-[70%] items-center gap-3"><span className="h-px flex-1" style={{ backgroundColor: p.theme.accent }} /><span className="h-2 w-2 rotate-45" style={{ backgroundColor: p.theme.accent }} /><span className="h-px flex-1" style={{ backgroundColor: p.theme.accent }} /></div><div className="mx-auto mt-4 w-fit px-8 py-2 text-[11px] font-black uppercase tracking-[.16em] text-white" style={{ backgroundColor: p.theme.ink }}>{p.exam}</div></div>
      <div className="relative mt-6 border-2 p-4" style={{ borderColor: p.theme.accent, backgroundColor: p.theme.wash }}><div className="flex items-center gap-5"><StudentPhoto photo={p.photo} theme={p.theme} className="h-24 w-20" /><div className="flex-1"><p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-500">Presented to</p><h2 className="mt-1 font-serif text-3xl font-bold" style={{ color: p.theme.ink }}>{p.student}</h2><p className="mt-2 text-[11px] text-slate-600">{p.father} · {p.klass} · {p.session}</p></div><div className="border-l pl-5 text-center" style={{ borderColor: p.theme.accent }}><p className="font-serif text-4xl font-bold" style={{ color: p.theme.ink }}>{p.grade}</p><p className="text-[9px] font-black uppercase text-slate-500">Grade</p></div></div></div>
      <div className="relative mt-6"><MarksTable rows={p.rows} theme={p.theme} /></div>
      <div className="relative mt-5"><Summary {...p} /></div>
      <div className="relative mt-5"><Remarks {...p} minimal /></div>
      <Signatures theme={p.theme} />
    </div>
  );
}

function LedgerDesign(p: CompositionProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col p-6 font-mono">
      <div className="grid grid-cols-[80px_1fr_120px] border-2" style={{ borderColor: p.theme.ink }}><div className="grid place-items-center border-r p-2" style={{ borderColor: p.theme.ink }}><Logo school={p.school} theme={p.theme} className="h-14 w-14" /></div><div className="p-3 text-center"><h1 className="text-xl font-black uppercase" style={{ color: p.theme.ink }}>{p.school.name}</h1><p className="mt-1 text-[10px] text-slate-500">{p.school.address} · {p.school.contact}</p><p className="mt-2 text-[11px] font-black uppercase">Student Result Register</p></div><div className="border-l p-3 text-[10px]" style={{ borderColor: p.theme.ink }}><p><b>Exam:</b> {p.exam}</p><p className="mt-2"><b>Session:</b> {p.session}</p></div></div>
      <div className="mt-3"><MetaGrid {...p} boxed /></div>
      <div className="mt-3"><MarksTable rows={p.rows} theme={p.theme} ledger /></div>
      <div className="mt-3 grid grid-cols-5 border-l border-t text-[10px]" style={{ borderColor: p.theme.ink }}>{[["Total", p.total], ["Obtained", p.obtained], ["Percent", `${p.percent.toFixed(1)}%`], ["Grade", p.grade], ["Result", p.status]].map(([label, value]) => <div key={label} className="border-b border-r p-2 text-center" style={{ borderColor: p.theme.ink }}><p className="font-bold text-slate-500">{label}</p><p className="mt-1 text-sm font-black" style={{ color: p.theme.ink }}>{value}</p></div>)}</div>
      <div className="mt-3 grid grid-cols-[1fr_auto] border" style={{ borderColor: p.theme.ink }}><div className="grid grid-cols-2"><div className="border-r p-3" style={{ borderColor: p.theme.ink }}><p className="text-[9px] font-black uppercase">Teacher remarks</p><p className="mt-2 text-[11px] font-sans leading-5 text-slate-700">{p.teacherRemarks}</p></div><div className="p-3"><p className="text-[9px] font-black uppercase">Principal remarks</p><p className="mt-2 text-[11px] font-sans leading-5 text-slate-700">{p.principalRemarks || "—"}</p></div></div>{p.verificationUrl ? <div className="border-l p-3 text-center" style={{ borderColor: p.theme.ink }}><QRCodeSVG value={p.verificationUrl} size={62} /><p className="mt-1 text-[8px] font-black">VERIFY</p></div> : null}</div>
      <div className="mt-3 flex gap-6 text-[10px]"><span>Attendance <b>{p.attendance}%</b></span><span>Position <b>{p.position || "—"}</b></span></div>
      <Signatures theme={p.theme} />
    </div>
  );
}

function ScholarDesign(p: CompositionProps) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden p-8">
      <div className="absolute -right-20 -top-20 h-52 w-52 rotate-45" style={{ backgroundColor: p.theme.ink }} /><div className="absolute right-12 top-0 h-24 w-8 -skew-x-12" style={{ backgroundColor: p.theme.accent }} />
      <div className="relative flex items-start gap-5"><Logo school={p.school} theme={p.theme} className="h-16 w-16" /><div className="flex-1"><p className="text-[9px] font-black uppercase tracking-[.18em]" style={{ color: p.theme.accent }}>Academic distinction report</p><h1 className="mt-1 font-serif text-2xl font-bold" style={{ color: p.theme.ink }}>{p.school.name}</h1><p className="mt-1 text-[11px] text-slate-500">{p.exam} · {p.session}</p></div></div>
      <div className="relative mt-7 grid grid-cols-[1fr_auto_auto] items-center gap-5 border-y py-5" style={{ borderColor: p.theme.ink }}><div><p className="text-[9px] font-black uppercase text-slate-500">Student</p><h2 className="mt-1 font-serif text-4xl font-bold text-slate-900">{p.student}</h2><p className="mt-2 text-[11px] text-slate-600">{p.father} · {p.klass} · Roll {p.roll || "—"}</p></div><div className="grid h-24 w-24 place-items-center border-[5px] text-center" style={{ borderColor: p.theme.accent, backgroundColor: p.theme.wash }}><div><p className="font-serif text-4xl font-black" style={{ color: p.theme.ink }}>{p.grade}</p><p className="text-[8px] font-black uppercase text-slate-500">Grade</p></div></div><StudentPhoto photo={p.photo} theme={p.theme} className="h-28 w-24" /></div>
      <div className="relative mt-6 grid grid-cols-3 gap-2">{[["Score", `${p.percent.toFixed(1)}%`], ["Position", p.position || "—"], ["Attendance", `${p.attendance}%`]].map(([label, value]) => <div key={label} className="border-l-4 p-3" style={{ borderColor: p.theme.accent, backgroundColor: p.theme.wash }}><p className="text-[9px] font-black uppercase text-slate-500">{label}</p><p className="mt-1 text-lg font-black" style={{ color: p.theme.ink }}>{value}</p></div>)}</div>
      <div className="relative mt-6"><MarksTable rows={p.rows} theme={p.theme} /></div>
      <div className="relative mt-5"><Remarks {...p} /></div>
      <Signatures theme={p.theme} />
    </div>
  );
}

function Composition({ id, props }: { id: TemplateId; props: CompositionProps }) {
  if (id === "modern") return <ModernDesign {...props} />;
  if (id === "certificate") return <CertificateDesign {...props} />;
  if (id === "executive") return <ExecutiveDesign {...props} />;
  if (id === "minimal") return <MinimalDesign {...props} />;
  if (id === "heritage") return <HeritageDesign {...props} />;
  if (id === "ledger") return <LedgerDesign {...props} />;
  if (id === "scholar") return <ScholarDesign {...props} />;
  return <AcademicDesign {...props} />;
}

export default function ResultCard({
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
  verificationUrl,
}: {
  school: SchoolSettings;
  design: DesignSettings;
  student: string;
  father: string;
  roll: string;
  klass: string;
  session: string;
  exam: string;
  dob: string;
  attendance: number;
  position: number;
  photo: string;
  subjects: Subject[];
  bands: Band[];
  teacherRemarks: string;
  principalRemarks: string;
  verificationUrl: string;
}) {
  const total = subjects.reduce((sum, subject) => sum + Math.max(0, subject.total), 0);
  const obtained = subjects.reduce((sum, subject) => sum + Math.min(Math.max(0, subject.obtained), Math.max(0, subject.total)), 0);
  const percent = total ? (obtained / total) * 100 : 0;
  const status = subjects.length > 0 && subjects.every((subject) => subject.total > 0 && (subject.obtained / subject.total) * 100 >= 40) ? "PASS" : "FAIL";
  const grade = getGrade(percent, bands);
  const activeTheme = allThemes.find((item) => item.id === design.theme) || allThemes[0];
  const paper = design.paperSize === "custom"
    ? { label: "Custom", width: `${Math.max(80, Number(design.customWidth) || 210)}mm`, height: `${Math.max(100, Number(design.customHeight) || 297)}mm`, ratio: Math.max(100, Number(design.customHeight) || 297) / Math.max(80, Number(design.customWidth) || 210) }
    : paperPresets[design.paperSize];
  const rows = subjects.map((subject) => {
    const subjectPercent = subject.total ? (subject.obtained / subject.total) * 100 : 0;
    return { ...subject, percent: subjectPercent, grade: getGrade(subjectPercent, bands) };
  });
  const props: CompositionProps = {
    school,
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
    rows,
    bands,
    total,
    obtained,
    percent,
    status,
    grade,
    teacherRemarks: teacherRemarks.trim() || autoRemark(percent, status),
    principalRemarks: principalRemarks.trim(),
    verificationUrl,
    theme: activeTheme,
  };

  const borderClass = design.template === "modern" ? "border-0" : design.template === "certificate" ? "border-[8px]" : design.template === "executive" || design.template === "scholar" ? "border-t-[10px]" : design.template === "minimal" ? "border" : design.template === "ledger" ? "border-2" : "border-[5px]";

  return (
    <div className="gradly-card-scroll print-shell min-h-0 overflow-auto bg-[#dfe4e9] p-3 sm:p-5 xl:h-[calc(100vh-155px)]">
      <style jsx global>{`
        @page{size:${paper.width} ${paper.height};margin:0}
        .gradly-card-scroll{scrollbar-width:thin;scrollbar-color:#9fb4c9 #dfe4e9;overscroll-behavior:contain}
        .gradly-card-scroll::-webkit-scrollbar{width:10px;height:10px}
        .gradly-card-scroll::-webkit-scrollbar-track{background:#dfe4e9}
        .gradly-card-scroll::-webkit-scrollbar-thumb{background:#9fb4c9;border:2px solid #dfe4e9;border-radius:999px}
        .gradly-card-scroll::-webkit-scrollbar-thumb:hover{background:#7897b5}
        .gradly-paper{width:${paper.width};min-height:${paper.height};aspect-ratio:${paper.ratio};box-sizing:border-box;transition:opacity .22s ease,transform .22s ease,box-shadow .22s ease;-webkit-print-color-adjust:exact;print-color-adjust:exact}
        .gradly-paper,.gradly-paper *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
        @media print{
          html,body{width:${paper.width};min-height:${paper.height};margin:0!important;padding:0!important;background:#fff!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
          .gradly-card-scroll{height:auto!important;overflow:visible!important;padding:0!important;background:#fff!important}
          .gradly-paper{width:${paper.width}!important;height:${paper.height}!important;min-height:${paper.height}!important;aspect-ratio:auto!important;box-shadow:none!important}
          .print-shell{display:block!important;padding:0!important;margin:0!important}
          .no-print{display:none!important}
        }
      `}</style>

      <div className="flex min-w-max justify-center pb-4">
        <article
          key={`${design.template}-${design.theme}-${design.paperSize}-${design.customWidth}-${design.customHeight}`}
          className={`gradly-paper relative flex flex-col animate-[gradlyCardIn_.24s_ease-out] overflow-hidden bg-white shadow-[0_18px_55px_rgba(20,36,58,.18)] ${borderClass}`}
          style={{ borderColor: activeTheme.ink }}
        >
          <style>{`@keyframes gradlyCardIn{from{opacity:.72;transform:scale(.992)}to{opacity:1;transform:scale(1)}}`}</style>
          <Composition id={design.template} props={props} />
        </article>
      </div>
    </div>
  );
}
