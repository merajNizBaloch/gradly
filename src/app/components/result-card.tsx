"use client";

import { QRCodeSVG } from "qrcode.react";
import { allThemes, autoRemark, getGrade, paperPresets, templates, type Band, type DesignSettings, type SchoolSettings, type Subject } from "./workspace-model";

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
  verificationUrl: string;
}) {
  const total = subjects.reduce((sum, subject) => sum + Math.max(0, subject.total), 0);
  const obtained = subjects.reduce((sum, subject) => sum + Math.min(Math.max(0, subject.obtained), Math.max(0, subject.total)), 0);
  const percent = total ? (obtained / total) * 100 : 0;
  const status = subjects.length > 0 && subjects.every((subject) => subject.total > 0 && (subject.obtained / subject.total) * 100 >= 40) ? "PASS" : "FAIL";
  const grade = getGrade(percent, bands);
  const activeTheme = allThemes.find((item) => item.id === design.theme) || allThemes[0];
  const activeTemplate = templates.find((item) => item.id === design.template) || templates[0];
  const paper = design.paperSize === "custom"
    ? { label: "Custom", width: `${Math.max(80, Number(design.customWidth) || 210)}mm`, height: `${Math.max(100, Number(design.customHeight) || 297)}mm`, ratio: Math.max(100, Number(design.customHeight) || 297) / Math.max(80, Number(design.customWidth) || 210) }
    : paperPresets[design.paperSize];

  const modern = design.template === "modern";
  const certificate = design.template === "certificate";
  const executive = design.template === "executive";
  const minimal = design.template === "minimal";

  return (
    <div className="print-shell flex min-h-0 flex-1 items-start justify-center overflow-auto rounded-[22px] bg-[#dfe4e9] p-3 sm:p-5">
      <style jsx global>{`
        @page{size:${paper.width} ${paper.height};margin:0}
        .gradly-paper{width:${paper.width};min-height:${paper.height};aspect-ratio:${paper.ratio};box-sizing:border-box;transition:opacity .22s ease,transform .22s ease,box-shadow .22s ease}
        @media print{html,body{width:${paper.width};min-height:${paper.height};margin:0!important;padding:0!important;background:#fff!important}.gradly-paper{width:${paper.width}!important;height:${paper.height}!important;min-height:${paper.height}!important;aspect-ratio:auto!important;box-shadow:none!important}.print-shell{display:block!important;padding:0!important;margin:0!important}.no-print{display:none!important}}
      `}</style>
      <article
        key={`${design.template}-${design.theme}-${design.paperSize}-${design.customWidth}-${design.customHeight}`}
        className={`gradly-paper animate-[gradlyCardIn_.24s_ease-out] overflow-hidden bg-white shadow-[0_18px_55px_rgba(20,36,58,.18)] ${certificate ? "border-[10px]" : executive ? "border-t-[12px]" : minimal ? "border border-slate-200" : modern ? "rounded-[18px] border-0" : "border-[5px]"}`}
        style={{ borderColor: activeTheme.ink }}
      >
        <style>{`@keyframes gradlyCardIn{from{opacity:.72;transform:scale(.992)}to{opacity:1;transform:scale(1)}}`}</style>
        <div className={`${minimal ? "p-7" : "p-9"}`}>
          <div className={`flex items-center gap-5 ${modern ? "rounded-2xl p-5" : "border-b-2 pb-5"}`} style={modern ? { backgroundColor: activeTheme.wash } : { borderColor: activeTheme.ink }}>
            <div className={`grid shrink-0 place-items-center overflow-hidden bg-white ${modern ? "h-20 w-20 rounded-2xl shadow-sm" : "h-20 w-20 rounded-md border"}`} style={!modern ? { borderColor: activeTheme.ink } : undefined}>
              {school.logo ? <img src={school.logo} alt="School logo" className="h-full w-full object-contain p-1" /> : <span className="font-serif text-2xl font-black" style={{ color: activeTheme.ink }}>G</span>}
            </div>
            <div className="min-w-0 flex-1 text-center">
              <h1 className={`${executive ? "font-sans tracking-[.12em] uppercase" : "font-serif"} text-2xl font-bold`} style={{ color: activeTheme.ink }}>{school.name}</h1>
              <p className="mt-1 text-xs italic text-slate-500">{school.motto}</p>
              <p className="mt-1 text-[10px] text-slate-400">{school.address} · {school.contact}</p>
              <div className="mt-3 inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[.16em]" style={{ backgroundColor: activeTheme.wash, color: activeTheme.ink }}>{exam}</div>
            </div>
            {photo ? <img src={photo} alt="Student" className="h-24 w-20 rounded-lg border object-cover" style={{ borderColor: activeTheme.ink }} /> : <div className="h-24 w-20 rounded-lg border bg-slate-50" style={{ borderColor: activeTheme.ink }} />}
          </div>

          <div className={`mt-6 grid grid-cols-2 gap-x-8 gap-y-3 text-[11px] ${modern ? "rounded-2xl p-4" : ""}`} style={modern ? { backgroundColor: activeTheme.wash } : undefined}>
            {[
              ["Student", student], ["Father / Guardian", father], ["Roll No.", roll], ["Class", klass], ["Session", session], ["Date of Birth", dob || "—"],
            ].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2"><span className="font-bold text-slate-400">{label}</span><span className="text-right font-black text-slate-700">{value || "—"}</span></div>)}
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border" style={{ borderColor: activeTheme.ink }}>
            <table className="w-full border-collapse text-[10px]">
              <thead><tr style={{ backgroundColor: activeTheme.ink, color: "white" }}><th className="px-3 py-2.5 text-left">Subject</th><th className="px-3 py-2.5 text-center">Max</th><th className="px-3 py-2.5 text-center">Obt.</th><th className="px-3 py-2.5 text-center">%</th><th className="px-3 py-2.5 text-center">Grade</th></tr></thead>
              <tbody>{subjects.map((subject) => { const p = subject.total ? (subject.obtained / subject.total) * 100 : 0; return <tr key={subject.id} className="border-t border-slate-100"><td className="px-3 py-2.5 font-semibold text-slate-700">{subject.name}</td><td className="px-3 py-2.5 text-center text-slate-500">{subject.total}</td><td className="px-3 py-2.5 text-center font-black text-slate-700">{subject.obtained}</td><td className="px-3 py-2.5 text-center text-slate-500">{p.toFixed(1)}</td><td className="px-3 py-2.5 text-center font-black" style={{ color: activeTheme.ink }}>{getGrade(p, bands)}</td></tr>; })}</tbody>
            </table>
          </div>

          <div className={`mt-6 grid grid-cols-4 gap-2 ${minimal ? "text-[10px]" : ""}`}>
            {[["Obtained", `${obtained}/${total}`], ["Percentage", `${percent.toFixed(1)}%`], ["Grade", grade], ["Result", status]].map(([label, value]) => <div key={label} className="rounded-xl border p-3 text-center" style={{ borderColor: activeTheme.ink, backgroundColor: activeTheme.wash }}><p className="text-[8px] font-black uppercase tracking-[.14em] text-slate-400">{label}</p><p className="mt-1 text-sm font-black" style={{ color: activeTheme.ink }}>{value}</p></div>)}
          </div>

          <div className="mt-6 grid grid-cols-[1fr_auto] gap-5 rounded-xl border p-4" style={{ borderColor: activeTheme.ink, backgroundColor: activeTheme.wash }}>
            <div><p className="text-[8px] font-black uppercase tracking-[.14em] text-slate-400">Teacher remarks</p><p className="mt-2 text-[10px] leading-5 text-slate-600">{autoRemark(percent, status)}</p><div className="mt-4 flex gap-6 text-[10px] text-slate-500"><span>Attendance: <strong>{attendance}%</strong></span><span>Position: <strong>{position || "—"}</strong></span></div></div>
            {verificationUrl ? <div className="text-center"><QRCodeSVG value={verificationUrl} size={64} /><p className="mt-1 text-[7px] font-bold text-slate-400">VERIFY</p></div> : null}
          </div>

          <div className="mt-8 flex items-end justify-between gap-8 text-[9px] text-slate-400">
            <div className="w-36 border-t border-slate-400 pt-2 text-center">Class Teacher</div>
            <div className="text-center"><p className="font-black uppercase tracking-[.18em]" style={{ color: activeTheme.ink }}>{activeTemplate.name} Result Card</p><p className="mt-1">Generated with Gradly</p></div>
            <div className="w-36 border-t border-slate-400 pt-2 text-center">Principal</div>
          </div>
        </div>
      </article>
    </div>
  );
}
