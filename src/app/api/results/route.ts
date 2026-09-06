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

function toDraft(body: any): ResultDraft {
  return {
    report_id: body.report_id,
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

export async function GET() {
  try {
    const { data, error } = await client().from("gradly_results").select("id, report_id, school_name, exam_name, academic_session, student_name, class_section, obtained_marks, total_marks, percentage, overall_grade, result_status, template, grading_scale, created_at").order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ results: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load results" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const draft = toDraft(body);
    const calculated = calculateResult(draft);
    const reportId = draft.report_id || `GRD-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const supabase = client();

    const { data: result, error } = await supabase.from("gradly_results").insert({
      report_id: reportId,
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
      total_marks: calculated.total,
      obtained_marks: calculated.obtained,
      percentage: calculated.percentage,
      overall_grade: calculated.overall_grade,
      result_status: calculated.result_status,
      template: draft.template,
      grading_scale: calculated.grading_scale,
    }).select("id, report_id").single();
    if (error) throw error;

    const rows = draft.subjects.map((subject: any, index: number) => {
      const calculatedSubject = calculateSubjectGrade(subject, calculated.grading_scale);
      return { result_id: result.id, sort_order: index, subject_name: subject.name || "Subject", total_marks: calculatedSubject.total, obtained_marks: calculatedSubject.obtained, percentage: calculatedSubject.percentage, grade: calculatedSubject.grade };
    });
    const { error: subjectError } = await supabase.from("gradly_result_subjects").insert(rows);
    if (subjectError) { await supabase.from("gradly_results").delete().eq("id", result.id); throw subjectError; }
    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save result" }, { status: 500 });
  }
}
