"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type LoadedResult = {
  report: { report_id: string; school_name: string; exam_name: string; academic_session: string; student_name: string; father_guardian: string | null; roll_number: string | null; class_section: string | null; date_of_birth: string | null; attendance_present: number | null; attendance_total: number | null; position: number | null; student_photo_url: string | null; template: string; grading_scale: unknown; };
  subjects: { id: string; subject_name: string; total_marks: number; obtained_marks: number }[];
};

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
        localStorage.setItem("gradly-edit-result", JSON.stringify(data.result));
        router.replace(`/?edit=${encodeURIComponent(reportId)}`);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Unable to load result");
      }
    })();
    return () => { active = false; };
  }, [params, router]);

  return <main className="grid min-h-screen place-items-center bg-[#f6f7fb] p-6 text-[#101828]"><div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm"><div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[#101828] text-white font-black">G</div><h1 className="text-xl font-bold">Loading result</h1><p className="mt-2 text-sm text-gray-500">Opening the saved report in Gradly Studio…</p>{error&&<p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}</div></main>;
}
