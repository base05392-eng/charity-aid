import './src/i18n';
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { getDb } from './src/database';
import { useAuthStore } from './src/stores/authStore';
import { AppNavigator } from './src/navigation';
import { COLORS } from './src/theme';

type AppState = 'loading' | 'pin_setup' | 'ready';

function PinSetupScreen({ onComplete }: { onComplete: () => void }) {
  const { t } = useTranslation();
  const { setupPin } = useAuthStore();
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');

  const handleNext = () => {
    if (!/^\d{4}$/.test(pin)) {
      setError('Please enter exactly 4 digits');
      return;
    }
    setStep('confirm');
    setError('');
  };

  const handleCreate = async () => {
    if (confirm !== pin) {
      setError(t('pin.mismatch'));
      setConfirm('');
      return;
    }
    await setupPin(pin);
    onComplete();
  };

  return (
    <SafeAreaView style={setup.container}>
      <KeyboardAvoidingView style={setup.inner} behavior={Platform.OS === 'android' ? undefined : 'padding'}>
        <Text style={setup.logo}>🤲</Text>
        <Text style={setup.appName}>Charity Aid</Text>
        <Text style={setup.appNameAr}>المساعدات الخيرية</Text>

        <View style={setup.card}>
          <Text style={setup.title}>{t('pin.setup')}</Text>
          <Text style={setup.subtitle}>{t('pin.setupSubtitle')}</Text>

          {step === 'enter' ? (
            <>
              <Text style={setup.fieldLabel}>{t('pin.enter')}</Text>
              <TextInput
                style={setup.pinInput}
                value={pin}
                onChangeText={(v) => { setPin(v.replace(/\D/g, '')); setError(''); }}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                placeholder="••••"
                autoFocus
              />
              {error ? <Text style={setup.error}>{error}</Text> : null}
              <TouchableOpacity
                style={[setup.btn, pin.length !== 4 && setup.btnDisabled]}
                onPress={handleNext}
                disabled={pin.length !== 4}
              >
                <Text style={setup.btnText}>Next →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={setup.fieldLabel}>{t('pin.confirm')}</Text>
              <TextInput
                style={setup.pinInput}
                value={confirm}
                onChangeText={(v) => { setConfirm(v.replace(/\D/g, '')); setError(''); }}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                placeholder="••••"
                autoFocus
              />
              {error ? <Text style={setup.error}>{error}</Text> : null}
              <TouchableOpacity
                style={[setup.btn, confirm.length !== 4 && setup.btnDisabled]}
                onPress={handleCreate}
                disabled={confirm.length !== 4}
              >
                <Text style={setup.btnText}>{t('pin.create')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={setup.backBtn} onPress={() => { setStep('enter'); setConfirm(''); setError(''); }}>
                <Text style={setup.backBtnText}>← Back</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const { initAuth, pinSet } = useAuthStore();

  useEffect(() => {
    async function initialize() {
      try {
        await getDb();         // runs schema migrations
        await initAuth();      // loads PIN state from secure store
        const { pinSet } = useAuthStore.getState();
        setAppState(pinSet ? 'ready' : 'pin_setup');
      } catch (e) {
        console.error('Init error:', e);
        setAppState('pin_setup');
      }
    }
    initialize();
  }, []);

  if (appState === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.header }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🤲</Text>
        <Text style={{ color: '#FFF', fontSize: 20, fontWeight: '700' }}>Charity Aid</Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 32 }}>المساعدات الخيرية</Text>
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    );
  }

  if (appState === 'pin_setup') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <PinSetupScreen onComplete={() => setAppState('ready')} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const setup = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.header },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  logo: { fontSize: 56, marginBottom: 8 },
  appName: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  appNameAr: { fontSize: 16, color: 'rgba(255,255,255,0.75)', marginBottom: 32 },
  card: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 28,
    width: '100%', gap: 8,
  },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  pinInput: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12,
    padding: 14, fontSize: 22, letterSpacing: 10, textAlign: 'center',
    marginVertical: 8,
  },
  error: { color: '#C0392B', fontSize: 13, textAlign: 'center' },
  btn: {
    backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 8, minHeight: 52, justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  backBtn: { alignItems: 'center', paddingVertical: 10 },
  backBtnText: { color: COLORS.primary, fontSize: 14 },
});
