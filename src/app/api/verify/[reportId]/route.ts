import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(_: Request, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const { reportId } = await params;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error("Supabase environment variables are not configured.");
    const { data, error } = await createClient(url, key).from("gradly_results").select("report_id, school_name, exam_name, academic_session, student_name, father_guardian, roll_number, class_section, obtained_marks, total_marks, percentage, overall_grade, result_status, created_at").eq("report_id", reportId).single();
    if (error) return NextResponse.json({ verified: false, error: "Result not found" }, { status: 404 });
    return NextResponse.json({ verified: true, result: data });
  } catch (error) {
    return NextResponse.json({ verified: false, error: error instanceof Error ? error.message : "Unable to verify result" }, { status: 500 });
  }
}
