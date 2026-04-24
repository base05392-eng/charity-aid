import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, Modal, ActivityIndicator, Switch,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScanStackParamList } from '../navigation';
import { useBeneficiaryStore } from '../stores/beneficiaryStore';
import { useAuthStore } from '../stores/authStore';
import { AvatarCircle } from '../components/AvatarCircle';
import { StatusPill, getStatus } from '../components/StatusPill';
import { CollectionHistory } from '../components/CollectionHistory';
import { PinModal } from '../components/PinModal';
import { COLORS } from '../theme';

type Props = NativeStackScreenProps<ScanStackParamList, 'ResultCard'>;

export const ResultCardScreen: React.FC<Props> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { cid, fromScan = false } = route.params as { cid: string; fromScan?: boolean };

  const {
    currentBeneficiary: b,
    currentCollections,
    loadBeneficiary,
    collect,
    toggleEligibility,
    blacklist,
    removeBlacklist,
    saveNotes,
    loading,
  } = useBeneficiaryStore();

  const { isUnlocked, pinRequired } = useAuthStore();

  const [pinVisible, setPinVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<'eligibility' | 'blacklist' | 'removeBlacklist' | null>(null);
  const [blacklistReason, setBlacklistReason] = useState('');
  const [blacklistModalVisible, setBlacklistModalVisible] = useState(false);
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [collectResult, setCollectResult] = useState<'collected' | 'blocked' | 'blacklisted' | null>(null);

  useEffect(() => {
    const load = async () => {
      await loadBeneficiary(cid);
      // Only auto-collect when arriving from the scan/review flow
      if (fromScan) {
        const result = await collect(cid);
        setCollectResult(result);
        await loadBeneficiary(cid);
      }
    };
    load();
  }, [cid]);

  const requirePin = (action: typeof pendingAction) => {
    if (!pinRequired || isUnlocked) {
      executeAction(action!);
    } else {
      setPendingAction(action);
      setPinVisible(true);
    }
  };

  const executeAction = (action: typeof pendingAction) => {
    if (action === 'eligibility') {
      toggleEligibility(cid, !b?.eligible);
    } else if (action === 'blacklist') {
      setBlacklistModalVisible(true);
    } else if (action === 'removeBlacklist') {
      Alert.alert(t('result.removeBlacklist'), t('common.confirm'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.confirm'), onPress: () => removeBlacklist(cid) },
      ]);
    }
  };

  const handlePinSuccess = () => {
    setPinVisible(false);
    executeAction(pendingAction);
    setPendingAction(null);
  };

  const handleBlacklistConfirm = async () => {
    if (!blacklistReason.trim()) {
      Alert.alert(t('common.error'), t('result.blacklistReason'));
      return;
    }
    await blacklist(cid, blacklistReason.trim());
    setBlacklistModalVisible(false);
    setBlacklistReason('');
  };

  const handleSaveNotes = async () => {
    await saveNotes(cid, editedNotes);
    setNotesModalVisible(false);
  };

  if (loading || !b) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const isNew = currentCollections.length === 0;
  const status = getStatus(b, isNew);

  const showBlockedBanner =
    collectResult === 'blocked' || collectResult === 'blacklisted' ||
    (!fromScan && (b.blacklisted || (!b.eligible && !isNew)));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Collection result feedback */}
      {fromScan && collectResult === 'collected' && (
        <View style={styles.successBanner}>
          <Text style={styles.successBannerText}>✅ Collection recorded successfully · تم تسجيل الاستلام</Text>
        </View>
      )}

      {/* Blocked / Blacklisted Banner */}
      {showBlockedBanner && (
        <View style={b.blacklisted ? styles.blacklistBanner : styles.blockedBanner}>
          <Text style={styles.bannerText}>{t('result.blockedBanner')}</Text>
        </View>
      )}

      {/* Header Card */}
      <View style={styles.headerCard}>
        <AvatarCircle nameEn={b.name_en} cid={b.cid} size={64} />
        <View style={styles.headerInfo}>
          <Text style={styles.nameEn}>{b.name_en || '—'}</Text>
          <Text style={styles.nameAr}>{b.name_ar || '—'}</Text>
          <Text style={styles.cidText}>{b.cid}</Text>
          {b.family_group ? (
            <Text style={styles.familyGroup}>{t('result.familyGroup')}: {b.family_group}</Text>
          ) : null}
        </View>
        <StatusPill status={status} />
      </View>

      {/* Blacklist reason if applicable */}
      {b.blacklisted && b.blacklist_reason ? (
        <View style={styles.blacklistReasonCard}>
          <Text style={styles.blacklistReasonLabel}>Reason · السبب:</Text>
          <Text style={styles.blacklistReasonText}>{b.blacklist_reason}</Text>
        </View>
      ) : null}

      {/* Notes */}
      {b.notes ? (
        <View style={styles.notesCard}>
          <Text style={styles.notesLabel}>Notes · ملاحظات</Text>
          <Text style={styles.notesText}>{b.notes}</Text>
        </View>
      ) : null}

      {/* Collection History */}
      <CollectionHistory collections={currentCollections} />

      {/* Actions */}
      <View style={styles.actionsSection}>

        {/* Eligibility Toggle */}
        {!b.blacklisted && (
          <View style={styles.actionRow}>
            <View>
              <Text style={styles.actionLabel}>{t('result.eligibilityToggle')}</Text>
              <Text style={styles.actionSubLabel}>مؤهل للاستلام</Text>
            </View>
            <Switch
              value={!!b.eligible}
              onValueChange={() => requirePin('eligibility')}
              trackColor={{ false: '#DDD', true: COLORS.accent }}
              thumbColor={b.eligible ? COLORS.primary : '#AAA'}
            />
          </View>
        )}

        {/* Edit Notes */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => { setEditedNotes(b.notes ?? ''); setNotesModalVisible(true); }}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>✏️ {t('result.editNotes')} · تعديل الملاحظات</Text>
        </TouchableOpacity>

        {/* Blacklist / Remove */}
        {b.blacklisted ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.removeBlacklistBtn]}
            onPress={() => requirePin('removeBlacklist')}
            activeOpacity={0.8}
          >
            <Text style={styles.removeBlacklistText}>✅ {t('result.removeBlacklist')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.blacklistBtn]}
            onPress={() => requirePin('blacklist')}
            activeOpacity={0.8}
          >
            <Text style={styles.blacklistBtnText}>🚫 {t('result.blacklist')} · قائمة سوداء</Text>
          </TouchableOpacity>
        )}

        {/* Scan Another */}
        <TouchableOpacity
          style={styles.scanAnotherBtn}
          onPress={() => navigation.navigate('ScanHome')}
          activeOpacity={0.85}
        >
          <Text style={styles.scanAnotherText}>📷 {t('result.scanAnother')} · مسح مستفيد آخر</Text>
        </TouchableOpacity>
      </View>

      {/* PIN Modal */}
      <PinModal visible={pinVisible} onSuccess={handlePinSuccess} onCancel={() => setPinVisible(false)} />

      {/* Blacklist Reason Modal */}
      <Modal visible={blacklistModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('result.blacklist')} · قائمة سوداء</Text>
            <Text style={styles.modalSubtitle}>{t('result.blacklistReason')}</Text>
            <TextInput
              style={styles.modalInput}
              value={blacklistReason}
              onChangeText={setBlacklistReason}
              placeholder={t('result.blacklistReasonPlaceholder')}
              multiline
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setBlacklistModalVisible(false)}>
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleBlacklistConfirm}>
                <Text style={styles.modalConfirmText}>{t('result.blacklistConfirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notes Edit Modal */}
      <Modal visible={notesModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('result.editNotes')}</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 100 }]}
              value={editedNotes}
              onChangeText={setEditedNotes}
              placeholder={t('review.notesPlaceholder')}
              multiline
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setNotesModalVisible(false)}>
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleSaveNotes}>
                <Text style={styles.modalConfirmText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  successBanner: {
    backgroundColor: '#E1F5EE',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  successBannerText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  blockedBanner: {
    backgroundColor: '#F7C1C1',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#C0392B',
  },
  blacklistBanner: {
    backgroundColor: '#5C1A1A',
    borderRadius: 10,
    padding: 12,
  },
  bannerText: { color: '#FFF', fontWeight: '700', fontSize: 14, textAlign: 'center' },
  headerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  headerInfo: { flex: 1 },
  nameEn: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  nameAr: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'right', marginTop: 2 },
  cidText: { fontSize: 13, color: '#AAA', marginTop: 4, letterSpacing: 1 },
  familyGroup: { fontSize: 12, color: COLORS.primary, marginTop: 4 },
  blacklistReasonCard: {
    backgroundColor: '#FDF0F0',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#C0392B',
  },
  blacklistReasonLabel: { fontSize: 11, fontWeight: '700', color: '#C0392B', marginBottom: 4 },
  blacklistReasonText: { fontSize: 13, color: COLORS.textSecondary },
  notesCard: {
    backgroundColor: '#FFFBF0',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FAC775',
  },
  notesLabel: { fontSize: 11, fontWeight: '700', color: '#B8860B', marginBottom: 4 },
  notesText: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20 },
  actionsSection: { gap: 10, marginTop: 4 },
  actionRow: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1,
  },
  actionLabel: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  actionSubLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  actionButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    elevation: 1,
    minHeight: 52,
    justifyContent: 'center',
  },
  actionButtonText: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  blacklistBtn: { borderWidth: 1.5, borderColor: '#F7C1C1' },
  blacklistBtnText: { color: '#C0392B', fontSize: 15, fontWeight: '600' },
  removeBlacklistBtn: { borderWidth: 1.5, borderColor: COLORS.accent },
  removeBlacklistText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
  scanAnotherBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  scanAnotherText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, width: '100%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  modalSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 16 },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    textAlignVertical: 'top',
    marginBottom: 16,
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
