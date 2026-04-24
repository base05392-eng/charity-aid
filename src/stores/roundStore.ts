import { create } from 'zustand';
import { Round, getActiveRound, getAllRounds, startNewRound } from '../database';

interface RoundState {
  activeRound: Round | null;
  allRounds: Round[];
  loading: boolean;

  initRounds: () => Promise<void>;
  startRound: (name: string) => Promise<void>;
}

export const useRoundStore = create<RoundState>((set) => ({
  activeRound: null,
  allRounds: [],
  loading: false,

  initRounds: async () => {
    set({ loading: true });
    const [activeRound, allRounds] = await Promise.all([getActiveRound(), getAllRounds()]);
    set({ activeRound, allRounds, loading: false });
  },

  startRound: async (name: string) => {
    set({ loading: true });
    const newRound = await startNewRound(name);
    const allRounds = await getAllRounds();
    set({ activeRound: newRound, allRounds, loading: false });
  },
}));
