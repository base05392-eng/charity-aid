import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Vibration,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { COLORS } from '../theme';

interface Props {
  visible: boolean;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const PinModal: React.FC<Props> = ({ visible, onSuccess, onCancel }) => {
  const { t } = useTranslation();
  const { verifyPin, tryBiometric, lockedUntil, failedAttempts } = useAuthStore();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setPin('');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [visible]);

  useEffect(() => {
    if (!lockedUntil) { setCountdown(0); return; }
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) { setCountdown(0); clearInterval(interval); }
      else setCountdown(remaining);
    }, 500);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const handlePinChange = async (text: string) => {
    if (text.length > 4) return;
    setPin(text);
    setError('');

    if (text.length === 4) {
      setLoading(true);
      const ok = await verifyPin(text);
      setLoading(false);
      if (ok) {
        onSuccess();
        setPin('');
      } else {
        Vibration.vibrate(200);
        setPin('');
        setError(
          countdown > 0
            ? t('admin.pinLocked', { seconds: countdown })
            : t('admin.pinWrong')
        );
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  };

  const handleBiometric = async () => {
    const ok = await tryBiometric();
    if (ok) onSuccess();
    else setError(t('admin.pinWrong'));
  };

  const isLocked = lockedUntil ? Date.now() < lockedUntil : false;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('admin.enterPin')}</Text>

          {/* PIN dots */}
          <View style={styles.dots}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.dot, pin.length > i && styles.dotFilled]} />
            ))}
          </View>

          {/* Hidden input */}
          <TextInput
            ref={inputRef}
            value={pin}
            onChangeText={handlePinChange}
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
            style={styles.hiddenInput}
            editable={!isLocked && !loading}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {loading && <ActivityIndicator color={COLORS.primary} style={{ marginTop: 8 }} />}

          <TouchableOpacity style={styles.biometricBtn} onPress={handleBiometric}>
            <Text style={styles.biometricText}>👆 {t('admin.useBiometric')}</Text>
          </TouchableOpacity>

          {onCancel && (
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    width: 280,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 24,
  },
  dots: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: COLORS.primary,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  error: {
    color: '#C0392B',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  biometricBtn: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  biometricText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  cancelBtn: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelText: {
    color: '#888',
    fontSize: 14,
  },
});
