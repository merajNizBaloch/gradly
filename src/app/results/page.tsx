"use client";

import { ArrowLeft, Download, Edit3, FileText, HardDrive, RefreshCw, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { deleteLocalResult, readLocalResults, type LocalResult } from "../components/local-results";
import SavedResultDownloadModal from "../components/saved-result-download-modal";

export default function ResultsPage() {
  const [results, setResults] = useState<LocalResult[]>([]);
  const [query, setQuery] = useState("");
  const [downloadResult, setDownloadResult] = useState<LocalResult | null>(null);

  const load = () => setResults(readLocalResults());

  useEffect(() => {
    load();
    const refresh = () => load();
    window.addEventListener("storage", refresh);
    window.addEventListener("gradly-local-results-changed", refresh as EventListener);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("gradly-local-results-changed", refresh as EventListener);
    };
  }, []);

  const remove = (reportId: string) => {
    if (!confirm(`Delete ${reportId} from this browser?`)) return;
    deleteLocalResult(reportId);
    load();
  };

  const filtered = results.filter((result) =>
    `${result.student} ${result.report_id} ${result.klass} ${result.school.name}`.toLowerCase().includes(query.toLowerCase()),
  );

  const stats = useMemo(() => {
    const passed = results.filter((result) => result.totals.result === "PASS").length;
    const average = results.length ? results.reduce((sum, result) => sum + Number(result.totals.percent || 0), 0) / results.length : 0;
    return { passed, average };
  }, [results]);

  return (
    <main className="min-h-screen bg-[#F4F8FC] text-[#17324D]">
      <header className="sticky top-0 z-30 border-b border-[#D8E3F0] bg-white/95 backdrop-blur-xl">
        <div className="h-1 bg-gradient-to-r from-[#0F4AA8] via-[#1D9BF0] to-[#11B8B2]" />
        <div className="mx-auto flex min-h-[70px] max-w-[1500px] items-center justify-between gap-4 px-5 sm:px-7">
          <div className="flex items-center gap-3">
            <img src="/gradly-logo.svg" alt="Gradly" className="h-11 w-11" />
            <div><div className="font-serif text-xl font-bold text-[#0B3477]">Gradly</div><div className="text-[9px] font-black uppercase tracking-[.2em] text-[#11B8B2]">Browser Archive</div></div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={load} className="grid h-10 w-10 place-items-center border border-[#D8E3F0] bg-white text-slate-500" title="Refresh"><RefreshCw size={15} /></button>
            <Link href="/" className="flex items-center gap-2 bg-[#0F4AA8] px-4 py-2.5 text-xs font-black text-white"><ArrowLeft size={15} /> New result</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-7 sm:py-9">
        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="bg-gradient-to-b from-[#0B3477] to-[#0F4AA8] p-5 text-white shadow-[0_18px_50px_rgba(15,74,168,.16)]">
              <p className="text-[9px] font-black uppercase tracking-[.2em] text-[#6FE1DB]">Local archive</p>
              <h1 className="mt-2 font-serif text-2xl font-bold">Saved results</h1>
              <p className="mt-2 text-[11px] leading-5 text-white/55">Records, photos, remarks and signatures are stored only in this browser.</p>
              <div className="mt-5 grid grid-cols-2 gap-2"><Metric label="Records" value={String(results.length)} /><Metric label="Passed" value={String(stats.passed)} /><Metric label="Average" value={`${stats.average.toFixed(1)}%`} wide /></div>
            </div>
            <div className="border border-[#D8E3F0] bg-white p-4"><div className="flex items-center gap-2"><HardDrive size={15} className="text-[#0F4AA8]" /><p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-500">Browser storage</p></div><p className="mt-2 text-[11px] leading-5 text-slate-500">Clearing site data or moving to another browser/device will not carry these records over.</p></div>
          </aside>

          <section className="min-w-0">
            <div className="mb-5 flex flex-col gap-4 border border-[#D8E3F0] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-[9px] font-black uppercase tracking-[.2em] text-[#11B8B2]">Result register</p><h2 className="mt-1 font-serif text-2xl font-bold text-[#0B3477]">Local academic records</h2><p className="mt-1 text-xs text-slate-400">{filtered.length} of {results.length} records shown</p></div>
              <div className="relative w-full sm:w-[340px]"><Search className="absolute left-3.5 top-3 text-slate-400" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search student, school or report ID" className="w-full border border-[#D8E3F0] bg-white py-2.5 pl-10 pr-3 text-sm font-medium outline-none focus:border-[#0F4AA8]" /></div>
            </div>

            {filtered.length === 0 ? (
              <div className="border border-dashed border-[#C9D8E7] bg-white p-14 text-center"><span className="mx-auto grid h-12 w-12 place-items-center bg-[#F2FAFF] text-[#0F4AA8]"><FileText size={22} /></span><p className="mt-4 font-serif text-lg font-bold">No saved browser results</p><p className="mt-1 text-sm text-slate-500">Save a result from Finalize or change your search.</p></div>
            ) : (
              <div className="overflow-hidden border border-[#D8E3F0] bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-left text-sm">
                    <thead className="bg-[#F7FAFD] text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
                      <tr><th className="px-5 py-3.5">Student</th><th className="px-5 py-3.5">Report ID</th><th className="px-5 py-3.5">Class</th><th className="px-5 py-3.5">Result</th><th className="px-5 py-3.5">Score</th><th className="px-5 py-3.5">Saved</th><th className="px-5 py-3.5 text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDF2F7]">
                      {filtered.map((result) => (
                        <tr key={result.report_id} className="hover:bg-[#FAFCFE]">
                          <td className="px-5 py-4"><div className="font-black text-slate-700">{result.student || "Untitled student"}</div><div className="mt-0.5 text-[10px] text-slate-400">{result.school.name}</div></td>
                          <td className="px-5 py-4 font-mono text-[11px] font-bold text-slate-500">{result.report_id}</td>
                          <td className="px-5 py-4 text-xs font-semibold text-slate-600">{result.klass || "—"}</td>
                          <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${result.totals.result === "PASS" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{result.totals.result}</span></td>
                          <td className="px-5 py-4"><span className="font-serif text-base font-bold text-[#0F4AA8]">{result.totals.percent.toFixed(1)}%</span><span className="ml-2 text-[10px] font-black text-slate-400">{result.totals.grade}</span></td>
                          <td className="px-5 py-4 text-[11px] font-medium text-slate-400">{new Date(result.updated_at).toLocaleDateString()}</td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <Link href={`/?edit=${encodeURIComponent(result.report_id)}`} className="flex items-center gap-1.5 bg-[#0F4AA8] px-3 py-2 text-[10px] font-black text-white"><Edit3 size={13} /> Edit</Link>
                              <button type="button" onClick={() => setDownloadResult(result)} className="flex items-center gap-1.5 border border-[#D8E3F0] bg-white px-3 py-2 text-[10px] font-black text-[#0F4AA8]"><Download size={13} /> Download</button>
                              <button type="button" onClick={() => remove(result.report_id)} className="grid h-8 w-8 place-items-center border border-rose-100 bg-white text-rose-500" title="Delete local record"><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      <SavedResultDownloadModal result={downloadResult} onClose={() => setDownloadResult(null)} />
    </main>
  );
}

function Metric({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return <div className={`border border-white/10 bg-white/[.06] p-3 ${wide ? "col-span-2" : ""}`}><p className="text-[8px] font-black uppercase tracking-[.14em] text-white/35">{label}</p><p className="mt-1 font-serif text-xl font-bold">{value}</p></div>;
}
