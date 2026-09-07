"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Edit3, FileText, RefreshCw, Search, School, ShieldCheck, Trash2 } from "lucide-react";
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
  const [busy, setBusy] = useState("");

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/results", { cache: "no-store" });
      const data = await response.json();
      setResults(data.results ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(reportId: string) {
    if (!confirm(`Delete ${reportId}? This cannot be undone.`)) return;
    setBusy(reportId);
    try {
      const response = await fetch(`/api/results/${encodeURIComponent(reportId)}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      setResults((current) => current.filter((item) => item.report_id !== reportId));
    } finally {
      setBusy("");
    }
  }

  const filtered = results.filter((result) =>
    `${result.student_name} ${result.report_id} ${result.class_section ?? ""} ${result.school_name}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  const stats = useMemo(() => {
    const passed = results.filter((result) => result.result_status === "PASS").length;
    const average = results.length
      ? results.reduce((sum, result) => sum + Number(result.percentage || 0), 0) / results.length
      : 0;
    return { passed, average };
  }, [results]);

  return (
    <main className="min-h-screen bg-[#f4f2ed] text-[#14243a]">
      <header className="sticky top-0 z-30 border-b border-[#d7d2c7] bg-[#fffdfa]/95 backdrop-blur-xl">
        <div className="h-1 bg-[#b58b48]" />
        <div className="mx-auto flex min-h-[70px] max-w-[1500px] items-center justify-between gap-4 px-5 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#17365D] text-white shadow-[0_8px_24px_rgba(23,54,93,.18)]">
              <School size={20} />
            </div>
            <div>
              <div className="font-serif text-xl font-bold">Gradly</div>
              <div className="text-[9px] font-black uppercase tracking-[.2em] text-[#a07b3f]">Academic Archive</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={load}
              className="grid h-10 w-10 place-items-center rounded-xl border border-[#d9d5cc] bg-white text-slate-500 transition hover:border-[#17365D]/30 hover:text-[#17365D]"
              title="Refresh results"
            >
              <RefreshCw size={15} />
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 rounded-xl bg-[#17365D] px-4 py-2.5 text-xs font-black text-white shadow-[0_8px_20px_rgba(23,54,93,.16)]"
            >
              <ArrowLeft size={15} />
              New result
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-7 sm:py-9">
        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="rounded-[24px] bg-[#122b49] p-5 text-white shadow-[0_18px_50px_rgba(20,36,58,.13)]">
              <p className="text-[9px] font-black uppercase tracking-[.2em] text-[#d3b57c]">Record archive</p>
              <h1 className="mt-2 font-serif text-2xl font-bold">Saved results</h1>
              <p className="mt-2 text-[11px] leading-5 text-white/50">Search, edit, verify and manage official academic records.</p>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <ArchiveMetric label="Records" value={String(results.length)} />
                <ArchiveMetric label="Passed" value={String(stats.passed)} />
                <ArchiveMetric label="Average" value={`${stats.average.toFixed(1)}%`} wide />
              </div>
            </div>

            <div className="rounded-[22px] border border-[#ddd8ce] bg-[#fffdfa] p-4">
              <p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">Archive note</p>
              <p className="mt-2 text-[11px] leading-5 text-slate-500">Verification links use the permanent report ID. Deleting a record also removes its verification record.</p>
            </div>
          </aside>

          <section className="min-w-0">
            <div className="mb-5 flex flex-col gap-4 rounded-[24px] border border-[#ddd8ce] bg-[#fffdfa] p-5 shadow-[0_14px_40px_rgba(20,36,58,.06)] sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.2em] text-[#a07b3f]">Result register</p>
                <h2 className="mt-1 font-serif text-2xl font-bold">Academic records</h2>
                <p className="mt-1 text-xs text-slate-400">{filtered.length} of {results.length} records shown</p>
              </div>
              <div className="relative w-full sm:w-[340px]">
                <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search student, school or report ID"
                  className="w-full rounded-xl border border-[#ddd8ce] bg-white py-2.5 pl-10 pr-3 text-sm font-medium outline-none transition focus:border-[#17365D]/50 focus:ring-4 focus:ring-[#17365D]/10"
                />
              </div>
            </div>

            {loading ? (
              <div className="rounded-[24px] border border-[#ddd8ce] bg-[#fffdfa] p-12 text-center text-sm text-slate-500">Loading saved results…</div>
            ) : filtered.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[#cec7ba] bg-[#fffdfa] p-14 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#f5f1e8] text-[#a07b3f]"><FileText size={22} /></span>
                <p className="mt-4 font-serif text-lg font-bold">No matching results</p>
                <p className="mt-1 text-sm text-slate-500">Create a new result or change your search.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-[24px] border border-[#ddd8ce] bg-[#fffdfa] shadow-[0_14px_40px_rgba(20,36,58,.06)]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[940px] text-left text-sm">
                    <thead className="bg-[#f8f5ef] text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
                      <tr>
                        <th className="px-5 py-3.5">Student</th>
                        <th className="px-5 py-3.5">Report ID</th>
                        <th className="px-5 py-3.5">Class</th>
                        <th className="px-5 py-3.5">Result</th>
                        <th className="px-5 py-3.5">Score</th>
                        <th className="px-5 py-3.5">Created</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eee9e1]">
                      {filtered.map((result) => (
                        <tr key={result.id} className="transition hover:bg-[#fcfaf6]">
                          <td className="px-5 py-4">
                            <div className="font-black text-slate-700">{result.student_name}</div>
                            <div className="mt-0.5 text-[10px] text-slate-400">{result.school_name}</div>
                          </td>
                          <td className="px-5 py-4 font-mono text-[11px] font-bold text-slate-500">{result.report_id}</td>
                          <td className="px-5 py-4 text-xs font-semibold text-slate-600">{result.class_section || "—"}</td>
                          <td className="px-5 py-4">
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${result.result_status === "PASS" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                              {result.result_status}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-serif text-base font-bold text-[#17365D]">{Number(result.percentage).toFixed(1)}%</span>
                            <span className="ml-2 text-[10px] font-black text-slate-400">{result.overall_grade}</span>
                          </td>
                          <td className="px-5 py-4 text-[11px] font-medium text-slate-400">{new Date(result.created_at).toLocaleDateString()}</td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <Link href={`/edit/${result.report_id}`} className="flex items-center gap-1.5 rounded-lg bg-[#17365D] px-3 py-2 text-[10px] font-black text-white">
                                <Edit3 size={13} /> Edit
                              </Link>
                              <Link href={`/verify/${result.report_id}`} className="flex items-center gap-1.5 rounded-lg border border-[#ddd8ce] bg-white px-3 py-2 text-[10px] font-black text-slate-600">
                                <ShieldCheck size={13} /> Verify
                              </Link>
                              <button
                                type="button"
                                onClick={() => remove(result.report_id)}
                                disabled={busy === result.report_id}
                                className="grid h-8 w-8 place-items-center rounded-lg border border-rose-100 bg-white text-rose-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                                title="Delete record"
                              >
                                <Trash2 size={13} />
                              </button>
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
    </main>
  );
}

function ArchiveMetric({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-xl border border-white/10 bg-white/[.06] p-3 ${wide ? "col-span-2" : ""}`}>
      <p className="text-[8px] font-black uppercase tracking-[.14em] text-white/35">{label}</p>
      <p className="mt-1 font-serif text-xl font-bold">{value}</p>
    </div>
  );
}
