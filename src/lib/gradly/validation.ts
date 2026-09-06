import type { ResultDraft } from "./types";

export function calculateSubject(subject: { total: number; obtained: number }) {
  const total = Math.max(0, Number(subject.total) || 0);
  const obtained = Math.max(0, Math.min(total, Number(subject.obtained) || 0));
  const percentage = total ? (obtained / total) * 100 : 0;
  return { total, obtained, percentage };
}

export function gradeFromPercentage(percentage: number) {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 40) return "D";
  return "F";
}

export function calculateResult(draft: ResultDraft) {
  const total = draft.subjects.reduce((sum, subject) => sum + Math.max(0, Number(subject.total) || 0), 0);
  const obtained = draft.subjects.reduce((sum, subject) => sum + Math.max(0, Math.min(Number(subject.total) || 0, Number(subject.obtained) || 0)), 0);
  const percentage = total ? (obtained / total) * 100 : 0;
  const status = draft.subjects.length > 0 && draft.subjects.every((subject) => {
    const { percentage: subjectPercentage } = calculateSubject(subject);
    return subjectPercentage >= 40;
  }) ? "PASS" : "FAIL";

  return {
    total,
    obtained,
    percentage,
    overall_grade: gradeFromPercentage(percentage),
    result_status: status
  };
}
