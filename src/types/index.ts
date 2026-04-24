// ── Database entity types ─────────────────────────────────────────────────────

export interface Beneficiary {
  id: number;
  cid: string;
  name_en: string;
  name_ar: string;
  family_group: string | null;
  eligible: number;          // 0 | 1
  blacklisted: number;       // 0 | 1
  blacklist_reason: string | null;
  notes: string | null;
  first_seen: string;        // ISO 8601
  last_seen: string;         // ISO 8601
}

export interface CollectionRecord {
  id: number;
  beneficiary_id: number;
  cid: string;
  collected_at: string;      // ISO 8601
  round_id: number | null;
  round_name: string | null;
  device_id: string | null;
}

export interface Round {
  id: number;
  name: string;
  active: number;            // 0 | 1
  started_at: string;        // ISO 8601
  ended_at: string | null;
  collection_count?: number;
}

// ── Status types ──────────────────────────────────────────────────────────────

export type BeneficiaryStatus = 'new' | 'eligible' | 'blocked' | 'blacklisted';

export function getBeneficiaryStatus(
  b: Pick<Beneficiary, 'eligible' | 'blacklisted'>,
  collectionCount: number
): BeneficiaryStatus {
  if (b.blacklisted) return 'blacklisted';
  if (collectionCount === 0) return 'new';
  if (b.eligible) return 'eligible';
  return 'blocked';
}

// ── Navigation param types ────────────────────────────────────────────────────

export type ScanStackParamList = {
  ScanHome: undefined;
  Camera: undefined;
  Review: {
    ocrResult?: {
      cid: string | null;
      nameEn: string | null;
      nameAr: string | null;
    };
  };
  ResultCard: {
    cid: string;
    fromScan?: boolean;
  };
};

export type RegistryStackParamList = {
  RegistryHome: undefined;
  ResultCard: {
    cid: string;
    fromScan?: boolean;
  };
};

export type FilterType = 'all' | 'eligible' | 'blocked' | 'blacklisted';
