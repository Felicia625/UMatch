export const EMAIL_DOMAIN = '@student.umn.ac.id';
export const MIN_AGE = 17;
export const SCHOOL_YEARS = ['2021', '2022', '2023', '2024', '2025'] as const;

export const GENDERS = [
  { code: 'M', label: 'Male' },
  { code: 'F', label: 'Female' },
] as const;

// Ported from models/Jurusan.kt
export const MAJORS = [
  { code: 'TI', label: 'Informatika' },
  { code: 'TE', label: 'Teknik Elektro' },
  { code: 'TF', label: 'Teknik Fisika' },
  { code: 'TK', label: 'Teknik Komputer' },
  { code: 'SI', label: 'Sistem Informasi' },
  { code: 'STRACOM', label: 'Strategic Communication' },
  { code: 'JURNAL', label: 'Jurnalistik' },
  { code: 'MANAGEMENT', label: 'Management' },
  { code: 'AK', label: 'Akuntansi' },
  { code: 'HOTEL', label: 'Perhotelan' },
  { code: 'DKV', label: 'Desain Komunikasi Visual' },
  { code: 'FILM', label: 'Film & Animasi' },
  { code: 'ARSI', label: 'Arsitektur' },
] as const;

// "Senior / Junior / Seangkatan" come from the old Range enum and the profile-edit dropdown.
// They are relative to the user's own batch (school year). A plain year like '2023' is also still understood.
export const YEAR_PREFERENCES = [
  { value: 'All', label: 'No preference' },
  { value: 'Senior', label: 'Seniors (earlier batch)' },
  { value: 'Junior', label: 'Juniors (later batch)' },
  { value: 'Seangkatan', label: 'Same batch' },
] as const;
