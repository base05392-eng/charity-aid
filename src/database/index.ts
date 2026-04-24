import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import { Beneficiary, CollectionRecord, Round, FilterType } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

// ── Init ──────────────────────────────────────────────────────────────────────

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('charity_aid.db');
    await initSchema(db);
  }
  return db;
}

async function initSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS rounds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 0,
      started_at TEXT NOT NULL,
      ended_at TEXT
    );

    CREATE TABLE IF NOT EXISTS beneficiaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cid TEXT NOT NULL UNIQUE,
      name_en TEXT NOT NULL DEFAULT '',
      name_ar TEXT NOT NULL DEFAULT '',
      family_group TEXT,
      eligible INTEGER NOT NULL DEFAULT 1,
      blacklisted INTEGER NOT NULL DEFAULT 0,
      blacklist_reason TEXT,
      notes TEXT,
      first_seen TEXT NOT NULL,
      last_seen TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      beneficiary_id INTEGER NOT NULL,
      cid TEXT NOT NULL,
      collected_at TEXT NOT NULL,
      round_id INTEGER,
      round_name TEXT,
      device_id TEXT,
      FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries(id),
      FOREIGN KEY (round_id) REFERENCES rounds(id)
    );

    CREATE INDEX IF NOT EXISTS idx_beneficiaries_cid ON beneficiaries(cid);
    CREATE INDEX IF NOT EXISTS idx_collections_cid ON collections(cid);
    CREATE INDEX IF NOT EXISTS idx_collections_beneficiary_id ON collections(beneficiary_id);
    CREATE INDEX IF NOT EXISTS idx_rounds_active ON rounds(active);
  `);
}

// ── Device ID (stable per-device identifier) ─────────────────────────────────

const DEVICE_ID_KEY = 'charity_aid_device_id';

export async function getOrCreateDeviceId(): Promise<string> {
  let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!id) {
    id = `device_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
  }
  return id;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString();
}

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// ── Beneficiaries ─────────────────────────────────────────────────────────────

export async function getBeneficiaryById(id: number): Promise<Beneficiary | null> {
  const database = await getDb();
  return (await database.getFirstAsync<Beneficiary>('SELECT * FROM beneficiaries WHERE id = ?', [id])) ?? null;
}

export async function getBeneficiaryByCid(cid: string): Promise<Beneficiary | null> {
  const database = await getDb();
  return (await database.getFirstAsync<Beneficiary>('SELECT * FROM beneficiaries WHERE cid = ?', [cid])) ?? null;
}

export async function getAllBeneficiaries(): Promise<Beneficiary[]> {
  const database = await getDb();
  return database.getAllAsync<Beneficiary>('SELECT * FROM beneficiaries ORDER BY last_seen DESC');
}

/**
 * SQL-level search + filter — efficient even with thousands of records.
 */
export async function searchBeneficiaries(
  search: string,
  filter: FilterType
): Promise<Beneficiary[]> {
  const database = await getDb();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (search.trim()) {
    conditions.push('(name_en LIKE ? OR name_ar LIKE ? OR cid LIKE ?)');
    const needle = `%${search.trim()}%`;
    params.push(needle, needle, needle);
  }

  if (filter === 'eligible') conditions.push('eligible = 1 AND blacklisted = 0');
  if (filter === 'blocked') conditions.push('eligible = 0 AND blacklisted = 0');
  if (filter === 'blacklisted') conditions.push('blacklisted = 1');

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return database.getAllAsync<Beneficiary>(
    `SELECT * FROM beneficiaries ${where} ORDER BY last_seen DESC`,
    params
  );
}

export async function upsertBeneficiary(data: {
  cid: string;
  name_en: string;
  name_ar: string;
  family_group?: string;
  notes?: string;
}): Promise<Beneficiary> {
  const database = await getDb();
  const now = nowIso();
  const existing = await getBeneficiaryByCid(data.cid);

  if (existing) {
    await database.runAsync(
      `UPDATE beneficiaries SET name_en = ?, name_ar = ?, family_group = ?, notes = ?, last_seen = ? WHERE cid = ?`,
      [data.name_en, data.name_ar, data.family_group ?? existing.family_group, data.notes ?? existing.notes, now, data.cid]
    );
    return (await getBeneficiaryByCid(data.cid))!;
  }

  const result = await database.runAsync(
    `INSERT INTO beneficiaries (cid, name_en, name_ar, family_group, eligible, blacklisted, notes, first_seen, last_seen)
     VALUES (?, ?, ?, ?, 1, 0, ?, ?, ?)`,
    [data.cid, data.name_en, data.name_ar, data.family_group ?? null, data.notes ?? null, now, now]
  );
  return (await getBeneficiaryById(Number(result.lastInsertRowId)))!;
}

export async function setEligibility(cid: string, eligible: boolean): Promise<void> {
  const database = await getDb();
  await database.runAsync('UPDATE beneficiaries SET eligible = ? WHERE cid = ?', [eligible ? 1 : 0, cid]);
}

export async function setBlacklisted(cid: string, blacklisted: boolean, reason?: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'UPDATE beneficiaries SET blacklisted = ?, blacklist_reason = ?, eligible = CASE WHEN ? = 1 THEN 0 ELSE eligible END WHERE cid = ?',
    [blacklisted ? 1 : 0, blacklisted ? (reason ?? '') : null, blacklisted ? 1 : 0, cid]
  );
}

export async function updateNotes(cid: string, notes: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('UPDATE beneficiaries SET notes = ?, last_seen = ? WHERE cid = ?', [notes, nowIso(), cid]);
}

export async function resetAllEligibility(): Promise<void> {
  const database = await getDb();
  await database.runAsync('UPDATE beneficiaries SET eligible = 1 WHERE blacklisted = 0');
}

export async function clearAllData(): Promise<void> {
  const database = await getDb();
  await database.execAsync(`
    DELETE FROM collections;
    DELETE FROM beneficiaries;
    DELETE FROM rounds;
  `);
}

// ── Collections ───────────────────────────────────────────────────────────────

export async function getCollectionsByCid(cid: string): Promise<CollectionRecord[]> {
  const database = await getDb();
  return database.getAllAsync<CollectionRecord>(
    'SELECT * FROM collections WHERE cid = ? ORDER BY collected_at DESC',
    [cid]
  );
}

/**
 * Records a collection using an exclusive transaction to prevent
 * race conditions on slow devices or concurrent writes.
 */
export async function recordCollection(data: {
  beneficiary_id: number;
  cid: string;
  round_id: number | null;
  round_name: string | null;
}): Promise<void> {
  const database = await getDb();
  const now = nowIso();
  const deviceId = await getOrCreateDeviceId();

  await database.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync(
      `INSERT INTO collections (beneficiary_id, cid, collected_at, round_id, round_name, device_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.beneficiary_id, data.cid, now, data.round_id, data.round_name, deviceId]
    );
    await tx.runAsync(
      'UPDATE beneficiaries SET eligible = 0, last_seen = ? WHERE cid = ?',
      [now, data.cid]
    );
  });
}

export async function getAllCollectionsForExport(): Promise<(CollectionRecord & Beneficiary)[]> {
  const database = await getDb();
  return database.getAllAsync<CollectionRecord & Beneficiary>(
    `SELECT c.*, b.name_en, b.name_ar, b.family_group, b.notes, b.eligible, b.blacklisted
     FROM collections c
     JOIN beneficiaries b ON b.id = c.beneficiary_id
     ORDER BY c.collected_at DESC`
  );
}

// ── Dashboard stats ───────────────────────────────────────────────────────────

export interface DashboardStats {
  collectedToday: number;
  blockedToday: number;
  totalBeneficiaries: number;
  totalBlacklisted: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const database = await getDb();
  const startOfDay = startOfTodayIso();

  const [collectedToday, blockedToday, totalBeneficiaries, totalBlacklisted] = await Promise.all([
    database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM collections WHERE collected_at >= ?',
      [startOfDay]
    ),
    database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM beneficiaries WHERE eligible = 0 AND blacklisted = 0 AND last_seen >= ?',
      [startOfDay]
    ),
    database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM beneficiaries'),
    database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM beneficiaries WHERE blacklisted = 1'),
  ]);

  return {
    collectedToday: collectedToday?.count ?? 0,
    blockedToday: blockedToday?.count ?? 0,
    totalBeneficiaries: totalBeneficiaries?.count ?? 0,
    totalBlacklisted: totalBlacklisted?.count ?? 0,
  };
}

// ── Rounds ────────────────────────────────────────────────────────────────────

export async function getActiveRound(): Promise<Round | null> {
  const database = await getDb();
  return (await database.getFirstAsync<Round>('SELECT * FROM rounds WHERE active = 1 LIMIT 1')) ?? null;
}

export async function getAllRounds(): Promise<Round[]> {
  const database = await getDb();
  return database.getAllAsync<Round>(
    `SELECT r.*, COUNT(c.id) as collection_count
     FROM rounds r
     LEFT JOIN collections c ON c.round_id = r.id
     GROUP BY r.id
     ORDER BY r.started_at DESC`
  );
}

export async function startNewRound(name: string): Promise<Round> {
  const database = await getDb();
  const now = nowIso();

  await database.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync('UPDATE rounds SET active = 0, ended_at = ? WHERE active = 1', [now]);
    await tx.runAsync('UPDATE beneficiaries SET eligible = 1 WHERE blacklisted = 0');
    await tx.runAsync('INSERT INTO rounds (name, active, started_at) VALUES (?, 1, ?)', [name, now]);
  });

  return (await getActiveRound())!;
}
