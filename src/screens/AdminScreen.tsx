import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, Switch, SafeAreaView, Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { PinModal } from '../components/PinModal';
import { COLORS } from '../theme';
import { resetAllEligibility, clearAllData } from '../database';
import { exportToCsv } from '../utils/csvExport';
import { useBeneficiaryStore } from '../stores/beneficiaryStore';
import { useRoundStore } from '../stores/roundStore';

export const AdminScreen: React.FC = () => {
  const { t } = useTranslation();
  const {
    isUnlocked, pinRequired, lock, unlock,
    changePin, setPinRequired,
  } = useAuthStore();

  const { loadAll } = useBeneficiaryStore();
  const { initRounds } = useRoundStore();

  const [pinVisible, setPinVisible] = useState(false);
  const [changePinVisible, setChangePinVisible] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  if (!isUnlocked) {
    return (
      <SafeAreaView style={styles.lockedContainer}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={styles.lockedTitle}>{t('admin.title')}</Text>
        <Text style={styles.lockedSubtitle}>{t('admin.enterPin')}</Text>
        <TouchableOpacity
          style={styles.unlockBtn}
          onPress={() => setPinVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.unlockBtnText}>{t('admin.enterPin')}</Text>
        </TouchableOpacity>
        <PinModal
          visible={pinVisible}
          onSuccess={() => { setPinVisible(false); unlock(); }}
          onCancel={() => setPinVisible(false)}
        />
      </SafeAreaView>
    );
  }

  const handleChangePinSubmit = async () => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinError(t('admin.pinWrong'));
      return;
    }
    if (newPin !== confirmPin) {
      setPinError(t('admin.pinMismatch'));
      return;
    }
    const ok = await changePin(oldPin, newPin);
    if (!ok) {
      setPinError(t('admin.pinWrong'));
      return;
    }
    setChangePinVisible(false);
    setOldPin(''); setNewPin(''); setConfirmPin(''); setPinError('');
    Alert.alert(t('admin.done'), t('admin.success'));
  };

  const handleExport = async () => {
    try {
      const path = await exportToCsv();
      Alert.alert(t('admin.done'), `${t('admin.exportSuccess')}\n${path}`);
    } catch (e) {
      Alert.alert(t('common.error'), t('admin.exportFailed'));
    }
  };

  const handleResetEligibility = () => {
    Alert.alert(t('admin.resetEligibility'), t('admin.resetEligibilityConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('admin.confirm'),
        style: 'destructive',
        onPress: async () => {
          await resetAllEligibility();
          await loadAll();
          Alert.alert(t('admin.done'), t('admin.success'));
        },
      },
    ]);
  };

  const handleClearData = () => {
    Alert.alert(t('admin.clearData'), t('admin.clearDataConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        style: 'destructive',
        onPress: () => {
          Alert.alert(t('admin.clearData'), t('admin.clearDataConfirm2'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('common.delete'),
              style: 'destructive',
              onPress: async () => {
                await clearAllData();
                await loadAll();
                await initRounds();
                Alert.alert(t('admin.done'), t('admin.success'));
              },
            },
          ]);
        },
      },
    ]);
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const AdminRow = ({
    label, onPress, danger = false, rightElement,
  }: {
    label: string; onPress?: () => void; danger?: boolean; rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      disabled={!onPress}
    >
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      {rightElement ?? <Text style={styles.rowArrow}>›</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.unlockedBanner}>
          <Text style={styles.unlockedBannerText}>🔓 Admin session active</Text>
          <TouchableOpacity onPress={lock}>
            <Text style={styles.lockLink}>Lock</Text>
          </TouchableOpacity>
        </View>

        {/* PIN Settings */}
        <Section title="PIN Settings · إعدادات PIN">
          <AdminRow
            label={t('admin.changePin')}
            onPress={() => { setOldPin(''); setNewPin(''); setConfirmPin(''); setPinError(''); setChangePinVisible(true); }}
          />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('admin.togglePin')}</Text>
            <Switch
              value={pinRequired}
              onValueChange={setPinRequired}
              trackColor={{ false: '#DDD', true: COLORS.accent }}
              thumbColor={pinRequired ? COLORS.primary : '#AAA'}
            />
          </View>
        </Section>

        {/* Data */}
        <Section title="Data · البيانات">
          <AdminRow label={t('admin.exportCsv')} onPress={handleExport} />
          <AdminRow label={t('admin.resetEligibility')} onPress={handleResetEligibility} danger />
          <AdminRow label={t('admin.clearData')} onPress={handleClearData} danger />
        </Section>

      </ScrollView>

      {/* Change PIN Modal */}
      <Modal visible={changePinVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('admin.changePin')}</Text>

            <Text style={styles.fieldLabel}>{t('admin.oldPin')}</Text>
            <TextInput
              style={styles.pinInput}
              value={oldPin}
              onChangeText={setOldPin}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              placeholder="••••"
            />

            <Text style={styles.fieldLabel}>{t('admin.newPin')}</Text>
            <TextInput
              style={styles.pinInput}
              value={newPin}
              onChangeText={setNewPin}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              placeholder="••••"
            />

            <Text style={styles.fieldLabel}>{t('admin.confirmPin')}</Text>
            <TextInput
              style={styles.pinInput}
              value={confirmPin}
              onChangeText={setConfirmPin}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              placeholder="••••"
            />

            {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setChangePinVisible(false)}>
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleChangePinSubmit}>
                <Text style={styles.modalConfirmText}>{t('admin.done')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  lockedContainer: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: 32 },
  lockIcon: { fontSize: 56, marginBottom: 16 },
  lockedTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  lockedSubtitle: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 32 },
  unlockBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14,
    paddingHorizontal: 40, minHeight: 52, justifyContent: 'center',
  },
  unlockBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  unlockedBanner: {
    backgroundColor: COLORS.primary + '20', borderRadius: 10, padding: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  unlockedBannerText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  lockLink: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  section: { backgroundColor: COLORS.surface, borderRadius: 14, overflow: 'hidden' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, padding: 14, paddingBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: COLORS.border, minHeight: 52,
  },
  rowLabel: { fontSize: 15, color: COLORS.textPrimary },
  rowLabelDanger: { color: '#C0392B' },
  rowArrow: { color: '#BBB', fontSize: 20 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  modalCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, width: '100%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 },
  fieldLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 6, marginTop: 8 },
  pinInput: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    padding: 12, fontSize: 18, letterSpacing: 6, textAlign: 'center', marginBottom: 4,
  },
  pinError: { color: '#C0392B', fontSize: 13, textAlign: 'center', marginTop: 8 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalCancelBtn: {
    flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  modalCancelText: { color: COLORS.textSecondary, fontWeight: '600' },
  modalConfirmBtn: {
    flex: 1, backgroundColor: COLORS.primary, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  modalConfirmText: { color: '#FFF', fontWeight: '700' },
});
