import { notFound } from "next/navigation";

async function getResult(reportId: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`;
  if (!base) return null;
  const response = await fetch(`${base}/api/verify/${encodeURIComponent(reportId)}`, { cache: "no-store" });
  if (!response.ok) return null;
  return response.json();
}

export default async function VerifyPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const payload = await getResult(reportId);
  if (!payload?.verified) notFound();
  const r = payload.result;
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-12 text-slate-900">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="bg-slate-950 px-7 py-8 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Gradly verification</p>
          <h1 className="mt-2 text-3xl font-bold">Authentic result record</h1>
          <p className="mt-2 text-sm text-slate-300">Report ID: {r.report_id}</p>
        </div>
        <div className="grid gap-6 p-7 sm:grid-cols-2">
          <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">School</p><p className="mt-1 font-semibold">{r.school_name}</p></div>
          <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Exam</p><p className="mt-1 font-semibold">{r.exam_name}</p></div>
          <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Student</p><p className="mt-1 font-semibold">{r.student_name}</p></div>
          <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Class</p><p className="mt-1 font-semibold">{r.class_section || "—"}</p></div>
          <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Percentage</p><p className="mt-1 text-2xl font-bold">{Number(r.percentage).toFixed(2)}%</p></div>
          <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Grade / Status</p><p className="mt-1 font-semibold">{r.overall_grade} · {r.result_status}</p></div>
        </div>
        <div className="border-t border-slate-100 px-7 py-5 text-xs text-slate-400">This record was generated and stored by Gradly.</div>
      </div>
    </main>
  );
}
