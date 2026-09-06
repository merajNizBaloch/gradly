export type Subject = {
  id: string;
  name: string;
  total: number;
  obtained: number;
};

export type SchoolProfile = {
  id?: string;
  school_name: string;
  motto: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo_url: string;
  principal_name: string;
  principal_signature_url: string;
  teacher_signature_url: string;
};

export type ResultDraft = {
  report_id?: string;
  school_profile_id?: string | null;
  school_name: string;
  exam_name: string;
  academic_session: string;
  student_name: string;
  father_guardian: string;
  roll_number: string;
  admission_number: string;
  class_section: string;
  date_of_birth: string;
  gender: string;
  student_photo_url: string;
  attendance_present: number | null;
  attendance_total: number | null;
  position: number | null;
  remarks: string;
  template: string;
  subjects: Subject[];
};
