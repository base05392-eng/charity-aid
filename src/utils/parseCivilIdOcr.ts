export interface ParsedCivilId {
  cid: string | null;
  nameEn: string | null;
  nameAr: string | null;
}

const LABEL_WORDS = new Set([
  'NAME', 'NATIONALITY', 'EXPIRY', 'DATE', 'BIRTH', 'SEX',
  'CIVIL', 'ID', 'CARD', 'VALID', 'NO', 'NUMBER', 'SERIAL',
  'KUWAIT', 'KUWAITI', 'MALE', 'FEMALE', 'M', 'F',
]);

export function parseCivilIdOcr(rawText: string): ParsedCivilId {
  // ── Civil ID: first sequence of exactly 12 consecutive digits ──
  const cidMatch = rawText.match(/\b(\d{12})\b/);
  const cid = cidMatch ? cidMatch[1] : null;

  // ── Name EN: longest run of ALL-CAPS Latin words, excluding labels ──
  const capsWordPattern = /\b([A-Z]{2,}(?:\s+[A-Z]{2,})+)\b/g;
  let bestEn: string | null = null;
  let bestEnLen = 0;

  let match: RegExpExecArray | null;
  while ((match = capsWordPattern.exec(rawText)) !== null) {
    const candidate = match[1];
    const words = candidate.split(/\s+/).filter((w) => !LABEL_WORDS.has(w));
    if (words.length >= 2) {
      const joined = words.join(' ');
      if (joined.length > bestEnLen) {
        bestEnLen = joined.length;
        bestEn = joined;
      }
    }
  }

  // ── Name AR: longest contiguous Arabic unicode sequence ──
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]+(?:\s+[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]+)*/g;
  let bestAr: string | null = null;
  let bestArLen = 0;

  while ((match = arabicPattern.exec(rawText)) !== null) {
    const candidate = match[0].trim();
    if (candidate.length > bestArLen) {
      bestArLen = candidate.length;
      bestAr = candidate;
    }
  }

  return { cid, nameEn: bestEn, nameAr: bestAr };
}
