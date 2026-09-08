export type Subject = { id: number; name: string; total: number; obtained: number };
export type TemplateId = "academic" | "modern" | "certificate" | "executive" | "minimal";
export type ThemeId =
  | "academic-navy"
  | "academic-emerald"
  | "academic-burgundy"
  | "academic-plum"
  | "modern-ocean"
  | "modern-forest"
  | "modern-coral"
  | "modern-indigo"
  | "certificate-gold"
  | "certificate-emerald"
  | "certificate-burgundy"
  | "certificate-royal"
  | "executive-charcoal"
  | "executive-navy"
  | "executive-wine"
  | "executive-plum"
  | "minimal-slate"
  | "minimal-teal"
  | "minimal-olive"
  | "minimal-rose";
export type PaperSize = "a4" | "a5" | "letter" | "legal" | "custom";
export type Band = { grade: string; min: number; label: string };
export type StepId = "student" | "marks" | "finalize";
export type SchoolSettings = { name: string; motto: string; address: string; contact: string; logo: string };
export type DesignSettings = { template: TemplateId; theme: ThemeId; paperSize: PaperSize; customWidth: string; customHeight: string };
export type Theme = { id: ThemeId; name: string; ink: string; wash: string; accent: string };
export type Template = { id: TemplateId; name: string; description: string; themes: Theme[] };

export const initialSubjects: Subject[] = [
  { id: 1, name: "English", total: 100, obtained: 86 },
  { id: 2, name: "Mathematics", total: 100, obtained: 91 },
  { id: 3, name: "Science", total: 100, obtained: 84 },
  { id: 4, name: "Computer Science", total: 100, obtained: 94 },
  { id: 5, name: "Social Studies", total: 100, obtained: 79 },
];

export const defaultBands: Band[] = [
  { grade: "A+", min: 90, label: "Outstanding" },
  { grade: "A", min: 80, label: "Excellent" },
  { grade: "B+", min: 70, label: "Very Good" },
  { grade: "B", min: 60, label: "Good" },
  { grade: "C", min: 50, label: "Satisfactory" },
  { grade: "D", min: 40, label: "Needs Improvement" },
  { grade: "F", min: 0, label: "Fail" },
];

export const defaultSchool: SchoolSettings = {
  name: "Horizon Grammar School",
  motto: "Excellence · Character · Future",
  address: "Main Campus · Quetta, Balochistan",
  contact: "+92 300 0000000 · info@school.edu",
  logo: "",
};

export const templates: Template[] = [
  { id: "academic", name: "Academic", description: "Formal institutional report", themes: [
    { id: "academic-navy", name: "Navy", ink: "#17365D", wash: "#F3F6F9", accent: "#17365D" },
    { id: "academic-emerald", name: "Emerald", ink: "#155E4A", wash: "#F1F8F5", accent: "#167A5B" },
    { id: "academic-burgundy", name: "Burgundy", ink: "#6B2435", wash: "#FBF3F5", accent: "#9B3A50" },
    { id: "academic-plum", name: "Plum", ink: "#4B315F", wash: "#F7F3F9", accent: "#74518B" },
  ]},
  { id: "modern", name: "Modern", description: "Contemporary rounded layout", themes: [
    { id: "modern-ocean", name: "Ocean", ink: "#155E75", wash: "#F0F9FA", accent: "#0E7490" },
    { id: "modern-forest", name: "Forest", ink: "#1F5A43", wash: "#F1F8F4", accent: "#2D7A5B" },
    { id: "modern-coral", name: "Coral", ink: "#9A3F3F", wash: "#FFF5F3", accent: "#C15B52" },
    { id: "modern-indigo", name: "Indigo", ink: "#4338A8", wash: "#F3F4FF", accent: "#5B5BD6" },
  ]},
  { id: "certificate", name: "Certificate", description: "Ornate ceremonial layout", themes: [
    { id: "certificate-gold", name: "Antique Gold", ink: "#5B3A20", wash: "#FBF6EE", accent: "#A9793D" },
    { id: "certificate-emerald", name: "Jade", ink: "#14532D", wash: "#F2F8F3", accent: "#4D8B63" },
    { id: "certificate-burgundy", name: "Crimson", ink: "#641E2B", wash: "#FBF2F4", accent: "#A54A5A" },
    { id: "certificate-royal", name: "Royal Blue", ink: "#253B73", wash: "#F2F5FB", accent: "#5D74B4" },
  ]},
  { id: "executive", name: "Executive", description: "Luxury leadership report", themes: [
    { id: "executive-charcoal", name: "Charcoal", ink: "#252525", wash: "#F5F5F3", accent: "#6B6B66" },
    { id: "executive-navy", name: "Midnight", ink: "#172554", wash: "#F1F4FA", accent: "#3D5A9B" },
    { id: "executive-wine", name: "Wine", ink: "#5C1F35", wash: "#FBF2F6", accent: "#9A4968" },
    { id: "executive-plum", name: "Plum", ink: "#31233D", wash: "#F6F1F8", accent: "#74558A" },
  ]},
  { id: "minimal", name: "Minimal", description: "Clean compact academic", themes: [
    { id: "minimal-slate", name: "Slate", ink: "#334155", wash: "#F8FAFC", accent: "#64748B" },
    { id: "minimal-teal", name: "Teal", ink: "#115E59", wash: "#F0FDFA", accent: "#0F766E" },
    { id: "minimal-olive", name: "Olive", wash: "#F5F8F0", ink: "#465A32", accent: "#6C824D" },
    { id: "minimal-rose", name: "Rose", ink: "#7A3E4B", wash: "#FFF6F7", accent: "#A95D6C" },
  ]},
];

export const allThemes = templates.flatMap((template) => template.themes.map((theme) => ({ ...theme, templateId: template.id })));

export const paperPresets = {
  a4: { label: "A4", width: "210mm", height: "297mm", ratio: 297 / 210 },
  a5: { label: "A5", width: "148mm", height: "210mm", ratio: 210 / 148 },
  letter: { label: "Letter", width: "8.5in", height: "11in", ratio: 11 / 8.5 },
  legal: { label: "Legal", width: "8.5in", height: "14in", ratio: 14 / 8.5 },
} as const;

export function getGrade(percent: number, bands: Band[]) {
  return [...bands].sort((a, b) => b.min - a.min).find((band) => percent >= band.min)?.grade ?? "F";
}

export function autoRemark(percent: number, status: string) {
  if (status === "FAIL") return "Keep working consistently and focus on the subjects that need improvement.";
  if (percent >= 90) return "Outstanding performance. Keep aiming higher and continue your excellent work.";
  if (percent >= 80) return "Excellent performance. Continue developing consistency and curiosity.";
  if (percent >= 70) return "Very good progress. With continued effort, even stronger results are achievable.";
  if (percent >= 60) return "Good progress. Regular revision and practice will help improve further.";
  return "Satisfactory progress. More focused practice and consistent study are recommended.";
}
