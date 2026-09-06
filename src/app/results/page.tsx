"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, FileText, RefreshCw, Search, Sparkles } from "lucide-react";
import Link from "next/link";

type Result = {
  id: string;
  report_id: string;
  school_name: string;
  exam_name: string;
  academic_session: string;
  student_name: string;
  class_section: string | null;
  obtained_marks: number;
  total_marks: number;
  percentage: number;
  overall_grade: string | null;
  result_status: string;
  template: string;
  created_at: string;
};

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/results", { cache: "no-store" });
    const data = await response.json();
    setResults(data.results ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = results.filter((r) => `${r.student_name} ${r.report_id} ${r.roll_number ?? ""} ${r.class_section ?? ""}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <main className="min-h-screen bg-[#f6f7fb]">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#101828] text-white"><Sparkles size={18}/></div><div><div className="font-bold">Gradly</div><div className="text-[10px] font-bold uppercase tracking-[.18em] text-gray-400">Saved Results</div></div></div>
          <div className="flex gap-2"><button onClick={load} className="rounded-lg border border-gray-200 p-2.5" title="Refresh"><RefreshCw size={16}/></button><Link href="/" className="flex items-center gap-2 rounded-lg bg-[#101828] px-4 py-2.5 text-sm font-semibold text-white"><ArrowLeft size={16}/>New result</Link></div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#5b5bd6]">Result archive</p><h1 className="mt-1 text-3xl font-black tracking-tight">Saved report cards</h1><p className="mt-2 text-sm text-gray-500">Search and manage generated student results.</p></div><div className="relative w-full sm:w-80"><Search className="absolute left-3 top-3 text-gray-400" size={17}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search student or report ID" className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#5b5bd6]"/></div></div>
        {loading ? <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">Loading saved results…</div> : filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-14 text-center"><FileText className="mx-auto mb-3 text-gray-300" size={32}/><p className="font-bold">No saved results yet</p><p className="mt-1 text-sm text-gray-500">Create a result from the studio and it will appear here.</p></div> : <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-500"><tr><th className="px-5 py-3">Student</th><th className="px-5 py-3">Report</th><th className="px-5 py-3">Class</th><th className="px-5 py-3">Result</th><th className="px-5 py-3">Score</th><th className="px-5 py-3">Created</th></tr></thead><tbody>{filtered.map((r)=><tr key={r.id} className="border-t border-gray-100"><td className="px-5 py-4 font-bold">{r.student_name}<div className="text-xs font-normal text-gray-400">{r.school_name}</div></td><td className="px-5 py-4 font-mono text-xs">{r.report_id}</td><td className="px-5 py-4">{r.class_section || "—"}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${r.result_status === "PASS" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{r.result_status}</span></td><td className="px-5 py-4 font-bold">{Number(r.percentage).toFixed(1)}% <span className="ml-1 text-gray-400">{r.overall_grade}</span></td><td className="px-5 py-4 text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div></div>}
      </div>
    </main>
  );
}
