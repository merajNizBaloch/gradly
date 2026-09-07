import { CheckCircle2, School, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

async function getResult(reportId: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`);
  if (!base) return null;
  const response = await fetch(`${base}/api/verify/${encodeURIComponent(reportId)}`, { cache: "no-store" });
  if (!response.ok) return null;
  return response.json();
}

export default async function VerifyPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const payload = await getResult(reportId);
  if (!payload?.verified) notFound();
  const result = payload.result;

  return (
    <main className="min-h-screen bg-[#f4f2ed] px-5 py-8 text-[#14243a] sm:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#17365D] text-white shadow-[0_8px_24px_rgba(23,54,93,.18)]">
              <School size={18} />
            </span>
            <span>
              <span className="block font-serif text-lg font-bold">Gradly</span>
              <span className="block text-[8px] font-black uppercase tracking-[.18em] text-[#a07b3f]">Record Verification</span>
            </span>
          </Link>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.12em] text-emerald-700">
            Verified record
          </span>
        </div>

        <section className="overflow-hidden rounded-[30px] border border-[#d8d3c9] bg-[#fffdfa] shadow-[0_26px_80px_rgba(20,36,58,.12)]">
          <div className="relative overflow-hidden bg-[#122b49] px-7 py-8 text-white sm:px-9 sm:py-10">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full border border-white/10" />
            <div className="absolute -right-6 top-2 h-36 w-36 rounded-full border border-[#d3b57c]/20" />
            <div className="relative flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-300/20">
                <ShieldCheck size={23} />
              </span>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.22em] text-[#d3b57c]">Official academic record</p>
                <h1 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">Authentic result confirmed</h1>
                <p className="mt-2 text-sm text-white/55">The report ID matches a record stored by Gradly.</p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-9">
            <div className="mb-7 flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                  <CheckCircle2 size={17} />
                </span>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[.14em] text-emerald-700">Verification successful</p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-600">This record has not failed verification.</p>
                </div>
              </div>
              <code className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600">{result.report_id}</code>
            </div>

            <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              <Detail label="School" value={result.school_name} />
              <Detail label="Examination" value={result.exam_name} />
              <Detail label="Student" value={result.student_name} />
              <Detail label="Class & section" value={result.class_section || "—"} />
              <div className="rounded-2xl border border-[#e1dcd2] bg-[#faf7f1] p-4">
                <p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">Percentage</p>
                <p className="mt-1 font-serif text-3xl font-bold text-[#17365D]">{Number(result.percentage).toFixed(2)}%</p>
              </div>
              <div className="rounded-2xl border border-[#e1dcd2] bg-[#faf7f1] p-4">
                <p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">Grade / status</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="font-serif text-2xl font-bold text-[#17365D]">{result.overall_grade || "—"}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${result.result_status === "PASS" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                    {result.result_status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#e7e2d9] bg-[#faf7f1] px-7 py-5 text-[10px] leading-5 text-slate-400 sm:px-9">
            This verification page confirms that the report ID exists in Gradly&apos;s stored academic records. For official institutional use, compare the student and examination details with the issued result card.
          </div>
        </section>
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-[#ebe6de] pb-4">
      <p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">{label}</p>
      <p className="mt-1.5 font-serif text-lg font-bold text-slate-700">{value}</p>
    </div>
  );
}
