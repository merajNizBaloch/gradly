"use client";

import { School } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function EditResultPage({ params }: { params: Promise<{ reportId: string }> }) {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { reportId } = await params;
        const response = await fetch(`/api/results/${encodeURIComponent(reportId)}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Result not found");
        if (!active) return;
        router.replace(`/?edit=${encodeURIComponent(reportId)}`);
      } catch (value) {
        if (active) setError(value instanceof Error ? value.message : "Unable to load result");
      }
    })();
    return () => {
      active = false;
    };
  }, [params, router]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f2ed] p-6 text-[#14243a]">
      <div className="w-full max-w-md rounded-[28px] border border-[#d9d5cc] bg-[#fffdfa] p-8 text-center shadow-[0_24px_80px_rgba(20,36,58,.12)]">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-[#17365D] text-white shadow-lg">
          <School size={24} />
        </div>
        <p className="text-[9px] font-black uppercase tracking-[.2em] text-[#a07b3f]">Gradly Academic Studio</p>
        <h1 className="mt-2 font-serif text-2xl font-bold">Opening saved result</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Loading the academic record directly into the editor…</p>
        {error && <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>}
      </div>
    </main>
  );
}
