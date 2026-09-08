"use client";

import { Download, X } from "lucide-react";
import ExportActions from "./export-actions";
import type { LocalResult } from "./local-results";
import ResultCardWithSignatures from "./result-card-with-signatures";

export default function SavedResultDownloadModal({
  result,
  onClose,
}: {
  result: LocalResult | null;
  onClose: () => void;
}) {
  if (!result) return null;
  const exportId = `saved-result-${result.report_id}`;

  return (
    <>
      <div
        className="fixed inset-0 z-[220] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm"
        onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      >
        <div className="w-full max-w-md border border-[#D8E3F0] bg-white shadow-[0_28px_90px_rgba(15,34,57,.28)]">
          <div className="flex items-start justify-between gap-4 border-b border-[#E4ECF5] px-5 py-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center bg-[#0F4AA8] text-white"><Download size={17} /></span>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.17em] text-[#11B8B2]">Saved result</p>
                <h2 className="mt-1 font-serif text-xl font-bold text-[#0B3477]">Download {result.student || "result"}</h2>
                <p className="mt-1 text-[10px] text-slate-400">{result.report_id} · {result.klass || "No class"}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center border border-[#D8E3F0] text-slate-400 hover:text-slate-700" title="Close download panel"><X size={16} /></button>
          </div>

          <div className="p-5">
            <p className="mb-3 text-[11px] leading-5 text-slate-500">Choose a format. The file is created entirely in this browser from the saved result.</p>
            <ExportActions student={result.student} design={result.design} targetId={exportId} />
            <button type="button" onClick={onClose} className="mt-4 w-full border border-[#D8E3F0] bg-white px-4 py-2.5 text-xs font-black text-slate-600">Close</button>
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed left-[-12000px] top-0 z-[-1]">
        <ResultCardWithSignatures
          exportId={exportId}
          teacherSignature={result.teacherSignature || ""}
          principalSignature={result.principalSignature || ""}
          school={result.school}
          design={result.design}
          student={result.student}
          father={result.father}
          roll={result.roll}
          klass={result.klass}
          session={result.session}
          exam={result.exam}
          dob={result.dob}
          attendance={result.attendance}
          position={result.position}
          photo={result.photo}
          subjects={result.subjects}
          bands={result.bands}
          teacherRemarks={result.teacherRemarks}
          principalRemarks={result.principalRemarks}
          verificationUrl=""
        />
      </div>
    </>
  );
}
