"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EditResultPage({ params }: { params: Promise<{ reportId: string }> }) {
  const router = useRouter();

  useEffect(() => {
    let active = true;
    (async () => {
      const { reportId } = await params;
      if (active) router.replace(`/?edit=${encodeURIComponent(reportId)}`);
    })();
    return () => { active = false; };
  }, [params, router]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#F4F8FC] p-6">
      <div className="border border-[#D8E3F0] bg-white p-8 text-center shadow-xl">
        <img src="/gradly-logo.svg" alt="Gradly" className="mx-auto h-12 w-12" />
        <h1 className="mt-4 font-serif text-2xl font-bold text-[#0B3477]">Opening browser result</h1>
        <p className="mt-2 text-sm text-slate-500">Loading the saved local record into Gradly…</p>
      </div>
    </main>
  );
}
