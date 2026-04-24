import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { useRoundStore } from '../stores/roundStore';
import { useAuthStore } from '../stores/authStore';
import { PinModal } from '../components/PinModal';
import { COLORS } from '../theme';
import { Round, getDashboardStats, DashboardStats } from '../database';

export const DashboardScreen: React.FC = () => {
  const { t } = useTranslation();
  const { allRounds, activeRound, initRounds, startRound } = useRoundStore();
  const { isUnlocked, pinRequired } = useAuthStore();

  const [stats, setStats] = useState<DashboardStats>({
    collectedToday: 0, blockedToday: 0, totalBeneficiaries: 0, totalBlacklisted: 0,
  });
  const [pinVisible, setPinVisible] = useState(false);
  const [roundModalVisible, setRoundModalVisible] = useState(false);
  const [roundName, setRoundName] = useState('');

  // Reload every time the tab is focused — picks up new collections instantly
  useFocusEffect(
    useCallback(() => {
      getDashboardStats().then(setStats);
      initRounds();
    }, [])
  );

  const blacklistedCount = stats.totalBlacklisted;

  const handleStartRound = () => {
    if (!pinRequired || isUnlocked) {
      setRoundModalVisible(true);
    } else {
      setPinVisible(true);
    }
  };

  const confirmStartRound = async () => {
    if (!roundName.trim()) {
      Alert.alert(t('common.error'), t('dashboard.roundName'));
      return;
    }
    Alert.alert(t('dashboard.startRound'), t('dashboard.startRoundWarning'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('dashboard.startRoundConfirm'),
        onPress: async () => {
          await startRound(roundName.trim());
          getDashboardStats().then(setStats);
          setRoundModalVisible(false);
          setRoundName('');
        },
      },
    ]);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const MetricCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <View style={[styles.metricCard, { borderTopColor: color }]}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Metric Cards */}
        <View style={styles.metricsGrid}>
          <MetricCard label={t('dashboard.collectedToday')} value={stats.collectedToday} color={COLORS.primary} />
          <MetricCard label={t('dashboard.blockedToday')} value={stats.blockedToday} color='#C0392B' />
          <MetricCard label={t('dashboard.totalBeneficiaries')} value={stats.totalBeneficiaries} color={COLORS.accent} />
          <MetricCard label={t('dashboard.totalBlacklisted')} value={blacklistedCount} color='#5C1A1A' />
        </View>

        {/* Active Round */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.activeRound')}</Text>
          {activeRound ? (
            <View style={styles.activeRoundCard}>
              <Text style={styles.activeRoundName}>{activeRound.name}</Text>
              <Text style={styles.activeRoundDate}>
                {t('dashboard.startedAt')}: {formatDate(activeRound.started_at)}
              </Text>
            </View>
          ) : (
            <Text style={styles.noRoundText}>{t('dashboard.noActiveRound')}</Text>
          )}

          <TouchableOpacity style={styles.startRoundBtn} onPress={handleStartRound} activeOpacity={0.85}>
            <Text style={styles.startRoundBtnText}>+ {t('dashboard.startRound')}</Text>
          </TouchableOpacity>
        </View>

        {/* All Rounds */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.rounds')}</Text>
          {allRounds.length === 0 ? (
            <Text style={styles.noRoundText}>{t('dashboard.noActiveRound')}</Text>
          ) : (
            allRounds.map((round: Round) => (
              <View key={round.id} style={[styles.roundRow, round.active ? styles.roundRowActive : null]}>
                <View style={styles.roundInfo}>
                  <Text style={styles.roundName}>{round.name}</Text>
                  <Text style={styles.roundMeta}>
                    {formatDate(round.started_at)}
                    {round.ended_at ? ` → ${formatDate(round.ended_at)}` : ' (active)'}
                  </Text>
                </View>
                <View style={styles.roundBadge}>
                  <Text style={styles.roundBadgeText}>
                    {round.collection_count ?? 0} {t('dashboard.collections')}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

      </ScrollView>

      <PinModal visible={pinVisible} onSuccess={() => { setPinVisible(false); setRoundModalVisible(true); }} onCancel={() => setPinVisible(false)} />

      <Modal visible={roundModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('dashboard.startRound')}</Text>
            <TextInput
              style={styles.modalInput}
              value={roundName}
              onChangeText={setRoundName}
              placeholder={t('dashboard.roundNamePlaceholder')}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setRoundModalVisible(false)}>
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmStartRound}>
                <Text style={styles.modalConfirmText}>{t('dashboard.startRoundConfirm')}</Text>
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderTopWidth: 3,
    elevation: 1,
    alignItems: 'center',
  },
  metricValue: { fontSize: 32, fontWeight: '800' },
  metricLabel: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', marginTop: 4 },
  section: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  activeRoundCard: {
    backgroundColor: COLORS.primary + '15',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  activeRoundName: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  activeRoundDate: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  noRoundText: { color: COLORS.textSecondary, fontSize: 14 },
  startRoundBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  startRoundBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  roundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 10,
  },
  roundRowActive: { backgroundColor: COLORS.primary + '08', borderRadius: 8, paddingHorizontal: 8 },
  roundInfo: { flex: 1 },
  roundName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  roundMeta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  roundBadge: {
    backgroundColor: COLORS.accent + '30',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  roundBadgeText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  modalCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, width: '100%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 },
  modalInput: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    padding: 12, fontSize: 15, marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', gap: 10 },
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
