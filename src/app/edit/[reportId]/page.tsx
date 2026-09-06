"use client";

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
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Unable to load result");
      }
    })();
    return () => { active = false; };
  }, [params, router]);

  return <main className="grid min-h-screen place-items-center bg-[#f6f7fb] p-6 text-[#101828]"><div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm"><div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[#101828] text-white font-black">G</div><h1 className="text-xl font-bold">Opening Gradly Studio</h1><p className="mt-2 text-sm text-gray-500">Loading the saved report directly into the editor…</p>{error&&<p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}</div></main>;
}
