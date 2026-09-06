"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function EditResultPage({ params }: { params: Promise<{ reportId: string }> }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 10000);

    (async () => {
      try {
        const { reportId } = await params;
        const response = await fetch(`/api/results/${encodeURIComponent(reportId)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Result not found");
        if (!active) return;
        router.replace(`/?edit=${encodeURIComponent(reportId)}`);
      } catch (e) {
        if (!active) return;
        setError(e instanceof DOMException && e.name === "AbortError" ? "The saved result took too long to load. Please try again." : e instanceof Error ? e.message : "Unable to load result");
        setLoading(false);
      }
    })();

    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [params, router]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f7fb] p-6 text-[#101828]">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[#101828] text-white font-black">G</div>
        <h1 className="text-xl font-bold">{error ? "Unable to open result" : "Opening Gradly Studio"}</h1>
        {loading && <p className="mt-2 text-sm text-gray-500">Loading the saved report directly into the editor…</p>}
        {error && (
          <>
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>
            <button type="button" onClick={() => window.location.assign("/")} className="mt-4 rounded-lg bg-[#101828] px-4 py-2 text-sm font-bold text-white">Return to Gradly</button>
          </>
        )}
      </div>
    </main>
  );
}
