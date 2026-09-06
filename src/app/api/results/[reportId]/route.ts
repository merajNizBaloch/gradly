import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are not configured.");
  return createClient(url, key);
}

function grade(p: number) {
  if (p >= 90) return "A+";
  if (p >= 80) return "A";
  if (p >= 70) return "B+";
  if (p >= 60) return "B";
  if (p >= 50) return "C";
  if (p >= 40) return "D";
  return "F";
}

export async function GET(_: Request, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const { reportId } = await params;
    const supabase = client();
    const { data, error } = await supabase.from("gradly_results").select("*, gradly_result_subjects(*)").eq("report_id", reportId).single();
    if (error) return NextResponse.json({ error: "Result not found" }, { status: 404 });
    return NextResponse.json({ result: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load result" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const { reportId } = await params;
    const body = await request.json();
    const subjects = Array.isArray(body.subjects) ? body.subjects : [];
    const total = subjects.reduce((sum: number, s: any) => sum + Math.max(0, Number(s.total) || 0), 0);
    const obtained = subjects.reduce((sum: number, s: any) => { const max = Math.max(0, Number(s.total) || 0); return sum + Math.min(max, Math.max(0, Number(s.obtained) || 0)); }, 0);
    const percentage = total ? (obtained / total) * 100 : 0;
    const resultStatus = subjects.length > 0 && subjects.every((s: any) => { const max = Number(s.total) || 0; return max > 0 && ((Number(s.obtained) || 0) / max) * 100 >= 40; }) ? "PASS" : "FAIL";
    const supabase = client();
    const { data: result, error } = await supabase.from("gradly_results").update({ school_name: body.school_name || "", exam_name: body.exam_name || "", academic_session: body.academic_session || "", student_name: body.student_name || "", father_guardian: body.father_guardian || null, roll_number: body.roll_number || null, class_section: body.class_section || null, date_of_birth: body.date_of_birth || null, attendance_present: body.attendance_present ?? null, attendance_total: body.attendance_total ?? null, position: body.position ?? null, student_photo_url: body.student_photo_url || null, remarks: body.remarks || null, template: body.template || "royal", grading_scale: body.grading_scale || [], total_marks: total, obtained_marks: obtained, percentage, overall_grade: grade(percentage), result_status: resultStatus }).eq("report_id", reportId).select("id, report_id").single();
    if (error) throw error;
    const { error: deleteError } = await supabase.from("gradly_result_subjects").delete().eq("result_id", result.id);
    if (deleteError) throw deleteError;
    const rows = subjects.map((s: any, index: number) => { const max = Math.max(0, Number(s.total) || 0); const got = Math.min(max, Math.max(0, Number(s.obtained) || 0)); const pct = max ? (got / max) * 100 : 0; return { result_id: result.id, sort_order: index, subject_name: s.name || "Subject", total_marks: max, obtained_marks: got, percentage: pct, grade: grade(pct) }; });
    if (rows.length) { const { error: subjectError } = await supabase.from("gradly_result_subjects").insert(rows); if (subjectError) throw subjectError; }
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update result" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const { reportId } = await params;
    const { error } = await client().from("gradly_results").delete().eq("report_id", reportId);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete result" }, { status: 500 });
  }
}
