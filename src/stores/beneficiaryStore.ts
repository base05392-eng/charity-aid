import { create } from 'zustand';
import {
  Beneficiary,
  Collection,
  getAllBeneficiaries,
  getBeneficiaryByCid,
  getCollectionsByCid,
  upsertBeneficiary,
  setEligibility,
  setBlacklisted,
  updateNotes,
  recordCollection,
  getCollectedTodayCount,
  getBlockedTodayCount,
} from '../database';
import { useRoundStore } from './roundStore';

interface BeneficiaryState {
  beneficiaries: Beneficiary[];
  currentBeneficiary: Beneficiary | null;
  currentCollections: Collection[];
  collectedToday: number;
  blockedToday: number;
  loading: boolean;

  // Actions
  loadAll: () => Promise<void>;
  lookupOrCreate: (data: {
    cid: string;
    name_en: string;
    name_ar: string;
    family_group?: string;
    notes?: string;
  }) => Promise<Beneficiary>;
  loadBeneficiary: (cid: string) => Promise<void>;
  collect: (cid: string) => Promise<'collected' | 'blocked' | 'blacklisted'>;
  toggleEligibility: (cid: string, eligible: boolean) => Promise<void>;
  blacklist: (cid: string, reason: string) => Promise<void>;
  removeBlacklist: (cid: string) => Promise<void>;
  saveNotes: (cid: string, notes: string) => Promise<void>;
  refreshStats: () => Promise<void>;
}

export const useBeneficiaryStore = create<BeneficiaryState>((set, get) => ({
  beneficiaries: [],
  currentBeneficiary: null,
  currentCollections: [],
  collectedToday: 0,
  blockedToday: 0,
  loading: false,

  loadAll: async () => {
    set({ loading: true });
    const beneficiaries = await getAllBeneficiaries();
    const collectedToday = await getCollectedTodayCount();
    const blockedToday = await getBlockedTodayCount();
    set({ beneficiaries, collectedToday, blockedToday, loading: false });
  },

  lookupOrCreate: async (data) => {
    const beneficiary = await upsertBeneficiary(data);
    return beneficiary;
  },

  loadBeneficiary: async (cid: string) => {
    set({ loading: true });
    const beneficiary = await getBeneficiaryByCid(cid);
    const collections = beneficiary ? await getCollectionsByCid(cid) : [];
    set({ currentBeneficiary: beneficiary, currentCollections: collections, loading: false });
  },

  collect: async (cid: string) => {
    const beneficiary = await getBeneficiaryByCid(cid);
    if (!beneficiary) return 'blocked';

    if (beneficiary.blacklisted) return 'blacklisted';
    if (!beneficiary.eligible) return 'blocked';

    const activeRound = useRoundStore.getState().activeRound;

    await recordCollection({
      beneficiary_id: beneficiary.id,
      cid,
      round_id: activeRound?.id ?? null,
      round_name: activeRound?.name ?? null,
    });

    await get().loadBeneficiary(cid);
    await get().refreshStats();

    return 'collected';
  },

  toggleEligibility: async (cid: string, eligible: boolean) => {
    await setEligibility(cid, eligible);
    await get().loadBeneficiary(cid);
    await get().loadAll();
  },

  blacklist: async (cid: string, reason: string) => {
    await setBlacklisted(cid, true, reason);
    await get().loadBeneficiary(cid);
    await get().loadAll();
  },

  removeBlacklist: async (cid: string) => {
    await setBlacklisted(cid, false);
    await get().loadBeneficiary(cid);
    await get().loadAll();
  },

  saveNotes: async (cid: string, notes: string) => {
    await updateNotes(cid, notes);
    await get().loadBeneficiary(cid);
  },

  refreshStats: async () => {
    const collectedToday = await getCollectedTodayCount();
    const blockedToday = await getBlockedTodayCount();
    set({ collectedToday, blockedToday });
  },
}));
