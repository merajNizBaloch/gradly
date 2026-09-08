"use client";

import { QRCodeSVG } from "qrcode.react";
import { allThemes, autoRemark, getGrade, paperPresets, type Band, type DesignSettings, type SchoolSettings, type Subject } from "./workspace-model";

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

  const modern = design.template === "modern";
  const certificate = design.template === "certificate";
  const executive = design.template === "executive";
  const minimal = design.template === "minimal";
  const resolvedTeacherRemarks = teacherRemarks.trim() || autoRemark(percent, status);
  const resolvedPrincipalRemarks = principalRemarks.trim();

  return (
    <div className="gradly-card-scroll print-shell min-h-0 overflow-auto rounded-b-[22px] bg-[#dfe4e9] p-3 sm:p-5 xl:h-[calc(100vh-155px)]">
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
          className={`gradly-paper flex flex-col animate-[gradlyCardIn_.24s_ease-out] overflow-hidden bg-white shadow-[0_18px_55px_rgba(20,36,58,.18)] ${certificate ? "border-[10px]" : executive ? "border-t-[12px]" : minimal ? "border border-slate-200" : modern ? "rounded-[18px] border-0" : "border-[5px]"}`}
          style={{ borderColor: activeTheme.ink }}
        >
          <style>{`@keyframes gradlyCardIn{from{opacity:.72;transform:scale(.992)}to{opacity:1;transform:scale(1)}}`}</style>
          <div className={`${minimal ? "p-7" : "p-9"} flex min-h-0 flex-1 flex-col`}>
            <div className={`flex items-center gap-5 ${modern ? "rounded-2xl p-5" : "border-b-2 pb-5"}`} style={modern ? { backgroundColor: activeTheme.wash } : { borderColor: activeTheme.ink }}>
              <div className={`grid shrink-0 place-items-center overflow-hidden bg-white ${modern ? "h-20 w-20 rounded-2xl shadow-sm" : "h-20 w-20 rounded-md border"}`} style={!modern ? { borderColor: activeTheme.ink } : undefined}>
                {school.logo ? <img src={school.logo} alt="School logo" className="h-full w-full object-contain p-1" /> : <span className="font-serif text-2xl font-black" style={{ color: activeTheme.ink }}>G</span>}
              </div>
              <div className="min-w-0 flex-1 text-center">
                <h1 className={`${executive ? "font-sans tracking-[.12em] uppercase" : "font-serif"} text-2xl font-bold`} style={{ color: activeTheme.ink }}>{school.name}</h1>
                <p className="mt-1 text-sm italic text-slate-600">{school.motto}</p>
                <p className="mt-1 text-[11px] font-medium text-slate-500">{school.address} · {school.contact}</p>
                <div className="mt-3 inline-flex rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[.12em]" style={{ backgroundColor: activeTheme.wash, color: activeTheme.ink }}>{exam}</div>
              </div>
              {photo ? <img src={photo} alt="Student" className="h-24 w-20 rounded-lg border object-cover" style={{ borderColor: activeTheme.ink }} /> : <div className="h-24 w-20 rounded-lg border bg-slate-50" style={{ borderColor: activeTheme.ink }} />}
            </div>

            <div className={`mt-6 grid grid-cols-2 gap-x-8 gap-y-3 text-[12px] ${modern ? "rounded-2xl p-4" : ""}`} style={modern ? { backgroundColor: activeTheme.wash } : undefined}>
              {[
                ["Student", student], ["Father / Guardian", father], ["Roll No.", roll], ["Class", klass], ["Session", session], ["Date of Birth", dob || "—"],
              ].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2"><span className="font-bold text-slate-500">{label}</span><span className="text-right font-black text-slate-800">{value || "—"}</span></div>)}
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border" style={{ borderColor: activeTheme.ink }}>
              <table className="w-full border-collapse text-[11px]">
                <thead><tr style={{ backgroundColor: activeTheme.ink, color: "white" }}><th className="px-3 py-3 text-left">Subject</th><th className="px-3 py-3 text-center">Max</th><th className="px-3 py-3 text-center">Obt.</th><th className="px-3 py-3 text-center">%</th><th className="px-3 py-3 text-center">Grade</th></tr></thead>
                <tbody>{subjects.map((subject) => { const p = subject.total ? (subject.obtained / subject.total) * 100 : 0; return <tr key={subject.id} className="border-t border-slate-200"><td className="px-3 py-3 font-semibold text-slate-800">{subject.name}</td><td className="px-3 py-3 text-center text-slate-600">{subject.total}</td><td className="px-3 py-3 text-center font-black text-slate-800">{subject.obtained}</td><td className="px-3 py-3 text-center text-slate-600">{p.toFixed(1)}</td><td className="px-3 py-3 text-center font-black" style={{ color: activeTheme.ink }}>{getGrade(p, bands)}</td></tr>; })}</tbody>
              </table>
            </div>

            <div className="mt-6 grid grid-cols-4 gap-2">
              {[["Obtained", `${obtained}/${total}`], ["Percentage", `${percent.toFixed(1)}%`], ["Grade", grade], ["Result", status]].map(([label, value]) => <div key={label} className="rounded-xl border p-3 text-center" style={{ borderColor: activeTheme.ink, backgroundColor: activeTheme.wash }}><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-500">{label}</p><p className="mt-1 text-base font-black" style={{ color: activeTheme.ink }}>{value}</p></div>)}
            </div>

            <div className="mt-6 grid grid-cols-[1fr_auto] gap-5 rounded-xl border p-4" style={{ borderColor: activeTheme.ink, backgroundColor: activeTheme.wash }}>
              <div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-500">Teacher remarks</p>
                    <p className="mt-2 text-[11px] font-medium leading-5 text-slate-700">{resolvedTeacherRemarks}</p>
                  </div>
                  <div className="border-l pl-4" style={{ borderColor: activeTheme.accent }}>
                    <p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-500">Principal remarks</p>
                    <p className="mt-2 text-[11px] font-medium leading-5 text-slate-700">{resolvedPrincipalRemarks || "—"}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-6 border-t pt-3 text-[11px] text-slate-600" style={{ borderColor: activeTheme.accent }}><span>Attendance: <strong>{attendance}%</strong></span><span>Position: <strong>{position || "—"}</strong></span></div>
              </div>
              {verificationUrl ? <div className="text-center"><QRCodeSVG value={verificationUrl} size={68} /><p className="mt-1 text-[9px] font-black text-slate-500">VERIFY</p></div> : null}
            </div>

            <div className="mt-auto pt-12">
              <div className="flex items-end justify-between gap-8 text-[11px] font-semibold text-slate-600">
                <div className="w-40 border-t border-slate-500 pt-2 text-center">Class Teacher Signature</div>
                <div className="w-40 border-t border-slate-500 pt-2 text-center">Principal Signature</div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
