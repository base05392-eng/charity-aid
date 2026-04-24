import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScanStackParamList } from '../navigation';
import { useBeneficiaryStore } from '../stores/beneficiaryStore';
import { COLORS } from '../theme';

type Props = NativeStackScreenProps<ScanStackParamList, 'Review'>;

export const ReviewScreen: React.FC<Props> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const ocr = route.params?.ocrResult;
  const { lookupOrCreate } = useBeneficiaryStore();

  const [cid, setCid] = useState(ocr?.cid ?? '');
  const [nameEn, setNameEn] = useState(ocr?.nameEn ?? '');
  const [nameAr, setNameAr] = useState(ocr?.nameAr ?? '');
  const [familyGroup, setFamilyGroup] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const cidMissing = !ocr?.cid;
  const nameEnMissing = !ocr?.nameEn;
  const nameArMissing = !ocr?.nameAr;
  const isManual = !ocr;

  const validate = () => {
    if (!/^\d{12}$/.test(cid)) {
      Alert.alert(t('common.error'), t('review.cidInvalid'));
      return false;
    }
    if (!nameEn.trim()) {
      Alert.alert(t('common.error'), t('review.nameEnRequired'));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await lookupOrCreate({
        cid: cid.trim(),
        name_en: nameEn.trim().toUpperCase(),
        name_ar: nameAr.trim(),
        family_group: familyGroup.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      navigation.replace('ResultCard', { cid: cid.trim(), fromScan: true });
    } catch (e) {
      Alert.alert(t('common.error'), t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const fieldStyle = (missing: boolean) => [
    styles.input,
    missing && styles.inputAmber,
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'android' ? undefined : 'padding'}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {!isManual && (
          <View style={styles.ocrNote}>
            <Text style={styles.ocrNoteText}>📋 {t('review.subtitle')}</Text>
          </View>
        )}

        {/* Civil ID */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>{t('review.cidLabel')}</Text>
            {cidMissing && !isManual && (
              <Text style={styles.missingTag}>⚠ {t('review.fieldMissing')}</Text>
            )}
          </View>
          <TextInput
            style={fieldStyle(cidMissing && !isManual)}
            value={cid}
            onChangeText={(v) => setCid(v.replace(/\D/g, ''))}
            placeholder={t('review.cidPlaceholder')}
            keyboardType="numeric"
            maxLength={12}
          />
        </View>

        {/* Name EN */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>{t('review.nameEnLabel')}</Text>
            {nameEnMissing && !isManual && (
              <Text style={styles.missingTag}>⚠ {t('review.fieldMissing')}</Text>
            )}
          </View>
          <TextInput
            style={fieldStyle(nameEnMissing && !isManual)}
            value={nameEn}
            onChangeText={(v) => setNameEn(v.toUpperCase())}
            placeholder={t('review.nameEnPlaceholder')}
            autoCapitalize="characters"
          />
        </View>

        {/* Name AR */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>{t('review.nameArLabel')}</Text>
            {nameArMissing && !isManual && (
              <Text style={styles.missingTag}>⚠ {t('review.fieldMissing')}</Text>
            )}
          </View>
          <TextInput
            style={[fieldStyle(nameArMissing && !isManual), styles.rtlInput]}
            value={nameAr}
            onChangeText={setNameAr}
            placeholder={t('review.nameArPlaceholder')}
            textAlign="right"
            writingDirection="rtl"
          />
        </View>

        {/* Family Group */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{t('review.familyGroupLabel')}</Text>
          <TextInput
            style={styles.input}
            value={familyGroup}
            onChangeText={setFamilyGroup}
            placeholder={t('review.familyGroupPlaceholder')}
          />
        </View>

        {/* Notes */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{t('review.notesLabel')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('review.notesPlaceholder')}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          <Text style={styles.submitBtnText}>
            {submitting ? t('common.loading') : t('review.confirmButton')}
          </Text>
        </TouchableOpacity>

        {!isManual && (
          <TouchableOpacity
            style={styles.retakeBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Text style={styles.retakeBtnText}>{t('review.retakeButton')}</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, gap: 4, paddingBottom: 40 },
  ocrNote: {
    backgroundColor: COLORS.accent + '25',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  ocrNoteText: { color: COLORS.primary, fontSize: 13 },
  fieldGroup: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  missingTag: { fontSize: 11, color: '#B8860B', backgroundColor: '#FAEEDA', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    minHeight: 48,
  },
  inputAmber: {
    borderColor: '#FAC775',
    backgroundColor: '#FAEEDA',
  },
  rtlInput: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 52,
    justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  retakeBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    minHeight: 52,
    justifyContent: 'center',
  },
  retakeBtnText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
});
