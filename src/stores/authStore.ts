import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { hashPin } from '../utils/pinHash';

const PIN_KEY = 'charity_aid_pin_hash';
const PIN_REQUIRED_KEY = 'charity_aid_pin_required';
const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30 * 1000; // 30 seconds

interface AuthState {
  isUnlocked: boolean;
  pinRequired: boolean;
  pinSet: boolean;
  failedAttempts: number;
  lockedUntil: number | null;
  lastActivity: number;

  // Actions
  initAuth: () => Promise<void>;
  setupPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  changePin: (oldPin: string, newPin: string) => Promise<boolean>;
  unlock: () => void;
  lock: () => void;
  checkSessionTimeout: () => void;
  setPinRequired: (required: boolean) => void;
  tryBiometric: () => Promise<boolean>;
  resetActivity: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isUnlocked: false,
  pinRequired: true,
  pinSet: false,
  failedAttempts: 0,
  lockedUntil: null,
  lastActivity: Date.now(),

  initAuth: async () => {
    const storedHash = await SecureStore.getItemAsync(PIN_KEY);
    const pinRequiredStr = await SecureStore.getItemAsync(PIN_REQUIRED_KEY);
    const pinRequired = pinRequiredStr !== 'false';
    set({
      pinSet: !!storedHash,
      pinRequired,
    });
  },

  setupPin: async (pin: string) => {
    const hash = await hashPin(pin);
    await SecureStore.setItemAsync(PIN_KEY, hash);
    set({ pinSet: true, isUnlocked: true, lastActivity: Date.now() });
  },

  verifyPin: async (pin: string) => {
    const { lockedUntil, failedAttempts } = get();

    if (lockedUntil && Date.now() < lockedUntil) {
      return false;
    }

    const storedHash = await SecureStore.getItemAsync(PIN_KEY);
    if (!storedHash) return false;

    const hash = await hashPin(pin);
    const correct = hash === storedHash;

    if (correct) {
      set({
        isUnlocked: true,
        failedAttempts: 0,
        lockedUntil: null,
        lastActivity: Date.now(),
      });
    } else {
      const newAttempts = failedAttempts + 1;
      if (newAttempts >= MAX_ATTEMPTS) {
        set({
          failedAttempts: newAttempts,
          lockedUntil: Date.now() + LOCKOUT_MS,
        });
      } else {
        set({ failedAttempts: newAttempts });
      }
    }

    return correct;
  },

  changePin: async (oldPin: string, newPin: string) => {
    const storedHash = await SecureStore.getItemAsync(PIN_KEY);
    if (!storedHash) return false;
    const oldHash = await hashPin(oldPin);
    if (oldHash !== storedHash) return false;
    const newHash = await hashPin(newPin);
    await SecureStore.setItemAsync(PIN_KEY, newHash);
    return true;
  },

  unlock: () => set({ isUnlocked: true, lastActivity: Date.now() }),
  lock: () => set({ isUnlocked: false }),

  checkSessionTimeout: () => {
    const { isUnlocked, lastActivity } = get();
    if (isUnlocked && Date.now() - lastActivity > SESSION_TIMEOUT_MS) {
      set({ isUnlocked: false });
    }
  },

  setPinRequired: async (required: boolean) => {
    await SecureStore.setItemAsync(PIN_REQUIRED_KEY, required ? 'true' : 'false');
    set({ pinRequired: required });
  },

  tryBiometric: async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!compatible || !enrolled) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access Admin · المصادقة للوصول',
      fallbackLabel: 'Use PIN',
      disableDeviceFallback: false,
    });

    if (result.success) {
      set({ isUnlocked: true, failedAttempts: 0, lastActivity: Date.now() });
      return true;
    }
    return false;
  },

  resetActivity: () => set({ lastActivity: Date.now() }),
}));
