import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { ResultDraft } from "@/lib/gradly/types";
import { calculateResult, calculateSubjectGrade } from "@/lib/gradly/validation";

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are not configured.");
  return createClient(url, key);
}

function toDraft(body: any, reportId?: string): ResultDraft {
  return {
    report_id: reportId || body.report_id,
    school_profile_id: body.school_profile_id ?? null,
    school_name: body.school_name || "",
    exam_name: body.exam_name || "",
    academic_session: body.academic_session || "",
    student_name: body.student_name || "",
    father_guardian: body.father_guardian || "",
    roll_number: body.roll_number || "",
    admission_number: body.admission_number || "",
    class_section: body.class_section || "",
    date_of_birth: body.date_of_birth || "",
    gender: body.gender || "",
    student_photo_url: body.student_photo_url || "",
    attendance_present: body.attendance_present ?? null,
    attendance_total: body.attendance_total ?? null,
    position: body.position ?? null,
    remarks: body.remarks || "",
    template: body.template || "royal",
    theme: body.theme || undefined,
    grading_scale: Array.isArray(body.grading_scale) ? body.grading_scale : undefined,
    subjects: Array.isArray(body.subjects) ? body.subjects : [],
  };
}

export async function GET(_: Request, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const { reportId } = await params;
    const { data, error } = await client().from("gradly_results").select("*, gradly_result_subjects(*)").eq("report_id", reportId).single();
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
    const draft = toDraft(body, reportId);
    const calculated = calculateResult(draft);
    const supabase = client();

    const { data: result, error } = await supabase.from("gradly_results").update({
      school_profile_id: draft.school_profile_id,
      school_name: draft.school_name,
      exam_name: draft.exam_name,
      academic_session: draft.academic_session,
      student_name: draft.student_name,
      father_guardian: draft.father_guardian || null,
      roll_number: draft.roll_number || null,
      admission_number: draft.admission_number || null,
      class_section: draft.class_section || null,
      date_of_birth: draft.date_of_birth || null,
      gender: draft.gender || null,
      attendance_present: draft.attendance_present,
      attendance_total: draft.attendance_total,
      position: draft.position,
      student_photo_url: draft.student_photo_url || null,
      remarks: draft.remarks || null,
      template: draft.template,
      grading_scale: calculated.grading_scale,
      total_marks: calculated.total,
      obtained_marks: calculated.obtained,
      percentage: calculated.percentage,
      overall_grade: calculated.overall_grade,
      result_status: calculated.result_status,
    }).eq("report_id", reportId).select("id, report_id").single();
    if (error) throw error;

    const { error: deleteError } = await supabase.from("gradly_result_subjects").delete().eq("result_id", result.id);
    if (deleteError) throw deleteError;

    const rows = draft.subjects.map((subject: any, index: number) => {
      const calculatedSubject = calculateSubjectGrade(subject, calculated.grading_scale);
      return { result_id: result.id, sort_order: index, subject_name: subject.name || "Subject", total_marks: calculatedSubject.total, obtained_marks: calculatedSubject.obtained, percentage: calculatedSubject.percentage, grade: calculatedSubject.grade };
    });
    if (rows.length) {
      const { error: subjectError } = await supabase.from("gradly_result_subjects").insert(rows);
      if (subjectError) throw subjectError;
    }
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
