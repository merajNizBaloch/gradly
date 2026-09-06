import { createClient } from "@supabase/supabase-js";
import type { ResultDraft } from "./types";
import { calculateResult, calculateSubjectGrade } from "./validation";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are not configured.");
  return createClient(url, key);
}

export async function createGradlyResult(draft: ResultDraft) {
  const supabase = getClient();
  const calculated = calculateResult(draft);
  const reportId = draft.report_id ?? `GRD-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

  const { data: result, error } = await supabase
    .from("gradly_results")
    .insert({
      report_id: reportId,
      school_profile_id: draft.school_profile_id ?? null,
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
      student_photo_url: draft.student_photo_url || null,
      attendance_present: draft.attendance_present,
      attendance_total: draft.attendance_total,
      position: draft.position,
      remarks: draft.remarks || null,
      total_marks: calculated.total,
      obtained_marks: calculated.obtained,
      percentage: calculated.percentage,
      overall_grade: calculated.overall_grade,
      result_status: calculated.result_status,
      template: draft.template,
      grading_scale: calculated.grading_scale,
    })
    .select("id, report_id")
    .single();

  if (error) throw error;

  const rows = draft.subjects.map((subject, index) => {
    const calculatedSubject = calculateSubjectGrade(subject, calculated.grading_scale);
    return {
      result_id: result.id,
      sort_order: index,
      subject_name: subject.name,
      total_marks: calculatedSubject.total,
      obtained_marks: calculatedSubject.obtained,
      percentage: calculatedSubject.percentage,
      grade: calculatedSubject.grade,
    };
  });

  const { error: subjectError } = await supabase.from("gradly_result_subjects").insert(rows);
  if (subjectError) {
    await supabase.from("gradly_results").delete().eq("id", result.id);
    throw subjectError;
  }

  return result;
}
