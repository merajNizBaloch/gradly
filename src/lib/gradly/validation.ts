import type { GradingBand, ResultDraft } from "./types";

export const DEFAULT_GRADING_SCALE: GradingBand[] = [
  { grade: "A+", min: 90, label: "Outstanding" },
  { grade: "A", min: 80, label: "Excellent" },
  { grade: "B+", min: 70, label: "Very Good" },
  { grade: "B", min: 60, label: "Good" },
  { grade: "C", min: 50, label: "Satisfactory" },
  { grade: "D", min: 40, label: "Pass" },
  { grade: "F", min: 0, label: "Fail" },
];

export function normalizeGradingScale(scale?: GradingBand[] | null): GradingBand[] {
  if (!Array.isArray(scale) || scale.length === 0) return DEFAULT_GRADING_SCALE;

  const normalized = scale
    .map((band) => ({
      grade: String(band?.grade ?? "").trim() || "F",
      min: Math.max(0, Math.min(100, Number(band?.min) || 0)),
      ...(band?.label ? { label: String(band.label).trim() } : {}),
    }))
    .sort((a, b) => b.min - a.min);

  return normalized.length ? normalized : DEFAULT_GRADING_SCALE;
}

export function calculateSubject(subject: { total: number; obtained: number }) {
  const total = Math.max(0, Number(subject.total) || 0);
  const obtained = Math.max(0, Math.min(total, Number(subject.obtained) || 0));
  const percentage = total ? (obtained / total) * 100 : 0;
  return { total, obtained, percentage };
}

export function gradeFromPercentage(percentage: number, gradingScale?: GradingBand[] | null) {
  const scale = normalizeGradingScale(gradingScale);
  return scale.find((band) => percentage >= band.min)?.grade ?? scale[scale.length - 1]?.grade ?? "F";
}

export function calculateSubjectGrade(subject: { total: number; obtained: number }, gradingScale?: GradingBand[] | null) {
  const calculated = calculateSubject(subject);
  return { ...calculated, grade: gradeFromPercentage(calculated.percentage, gradingScale) };
}

export function calculateResult(draft: ResultDraft) {
  const gradingScale = normalizeGradingScale(draft.grading_scale);
  const calculatedSubjects = draft.subjects.map((subject) => calculateSubject(subject));
  const total = calculatedSubjects.reduce((sum, subject) => sum + subject.total, 0);
  const obtained = calculatedSubjects.reduce((sum, subject) => sum + subject.obtained, 0);
  const percentage = total ? (obtained / total) * 100 : 0;
  const resultStatus = calculatedSubjects.length > 0 && calculatedSubjects.every((subject) => subject.percentage >= 40) ? "PASS" : "FAIL";

  return {
    total,
    obtained,
    percentage,
    overall_grade: gradeFromPercentage(percentage, gradingScale),
    result_status: resultStatus,
    grading_scale: gradingScale,
  };
}
