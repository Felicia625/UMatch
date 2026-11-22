import { MajorCode, UserProfile } from '../types';

// Built-in conversation starters (Bahasa Indonesia). They need no internet and send no data anywhere, so they are
// both the first thing shown and the fallback when the AI is off, out of quota or unreachable.

const KEYWORDS: [RegExp, string][] = [
  [/hik|gunung|mendaki|camping|alam/i, 'Kayaknya kamu suka kegiatan outdoor. Tempat favoritmu buat jalan-jalan atau naik gunung di mana?'],
  [/musik|music|band|gitar|guitar|piano|konser|nyanyi/i, 'Kamu suka musik, ya? Lagi sering dengerin lagu apa belakangan ini?'],
  [/film|movie|nonton|drakor|anime|series/i, 'Kamu suka nonton? Film atau series apa yang terakhir bikin kamu ketagihan?'],
  [/kopi|coffee|kuliner|makan|masak|cafe|kafe/i, 'Kayaknya kamu suka kuliner. Tempat makan atau kafe favorit di sekitar kampus di mana?'],
  [/game|gaming|esport|valorant|mobile legends/i, 'Kamu suka main game? Lagi sering mainin game apa sekarang?'],
  [/baca|buku|novel|book/i, 'Kamu suka baca? Buku apa yang paling berkesan buatmu?'],
  [/futsal|badminton|basket|gym|lari|olahraga|renang|sepak/i, 'Kamu suka olahraga, ya? Biasanya olahraga apa dan sama siapa?'],
  [/travel|traveling|jalan-jalan|liburan|trip/i, 'Kamu suka jalan-jalan? Tempat mana yang paling ingin kamu kunjungi?'],
  [/foto|photo|kamera|fotografi/i, 'Kamu suka fotografi? Biasanya motret apa?'],
  [/kucing|anjing|hewan|\bcat\b|\bdog\b/i, 'Kamu suka hewan? Kamu punya peliharaan, atau pengin punya yang mana?'],
];

const MAJOR_IDEAS: Partial<Record<MajorCode, string>> = {
  TI: 'Kamu anak Informatika, ya? Lagi ngerjain proyek atau tugas coding apa nih?',
  SI: 'Kamu anak Sistem Informasi, ya? Materi kuliah apa yang paling kamu suka sejauh ini?',
  TK: 'Kamu anak Teknik Komputer, ya? Pernah bikin proyek hardware yang seru?',
  TE: 'Kamu anak Teknik Elektro, ya? Proyek apa yang paling menantang buatmu?',
  TF: 'Kamu anak Teknik Fisika, ya? Mata kuliah apa yang paling bikin penasaran?',
  DKV: 'Kamu anak DKV, ya? Lagi bikin karya apa belakangan ini?',
  FILM: 'Kamu anak Film dan Animasi, ya? Film apa yang terakhir bikin kamu kagum?',
  ARSI: 'Kamu anak Arsitektur, ya? Bangunan paling keren yang pernah kamu lihat apa?',
  AK: 'Kamu anak Akuntansi, ya? Kuliah semester ini lagi seru-serunya di bagian mana?',
  MANAGEMENT: 'Kamu anak Management, ya? Kamu lebih tertarik ke bisnis apa nanti?',
  HOTEL: 'Kamu anak Perhotelan, ya? Pengalaman paling seru dari praktikmu apa?',
  JURNAL: 'Kamu anak Jurnalistik, ya? Topik berita apa yang paling kamu suka tulis?',
  STRACOM: 'Kamu anak Strategic Communication, ya? Kampanye yang menurutmu paling keren apa?',
};

const FRIEND_IDEAS = [
  'Hai! Senang bisa kenalan. Biasanya kamu lebih suka nongkrong atau belajar bareng teman?',
  'Halo! Lagi cari teman buat ngapain nih: ngobrol santai, olahraga, atau belajar bareng?',
  'Hai! Ada rekomendasi tempat makan atau nongkrong enak di sekitar kampus?',
  'Halo! Kegiatan apa yang lagi kamu seneng-senengin sekarang?',
];

const GENERAL_IDEAS = [
  'Hai! Senang bisa terhubung sama kamu. Weekend biasanya kamu ngapain?',
  'Halo! Kalau lagi senggang, kamu lebih suka di rumah atau jalan-jalan?',
  'Hai! Ada rekomendasi tempat makan enak di sekitar kampus?',
  'Halo! Cerita dong, hal apa yang lagi bikin kamu semangat belakangan ini?',
];

/** Three ideas about the other person. `round` rotates the choice, so "Ide lain" shows a different set. */
export function ruleBasedStarters(partner: UserProfile, me: UserProfile | null, round = 0): string[] {
  const specific: string[] = [];
  for (const [pattern, idea] of KEYWORDS) if (pattern.test(partner.bio)) specific.push(idea);
  const major = partner.major ? MAJOR_IDEAS[partner.major] : undefined;
  if (major) specific.push(major);
  if (me && partner.schoolyear && partner.schoolyear === me.schoolyear) {
    specific.push('Kita seangkatan, ya! Semester ini kuliahmu lagi padat nggak?');
  }
  const pool = [...specific, ...(partner.friendFirst ? FRIEND_IDEAS : GENERAL_IDEAS)];
  const start = (round * 3) % pool.length;
  return Array.from({ length: 3 }, (_, i) => pool[(start + i) % pool.length]);
}
