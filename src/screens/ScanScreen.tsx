import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScanStackParamList } from '../navigation';
import { COLORS } from '../theme';

type Props = NativeStackScreenProps<ScanStackParamList, 'ScanHome'>;

export const ScanScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>🪪</Text>
        </View>
        <Text style={styles.heading}>{t('scan.title')}</Text>
        <Text style={styles.subheading}>Charity Aid · المساعدات الخيرية</Text>

        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Camera')}
        >
          <Text style={styles.primaryBtnIcon}>📷</Text>
          <Text style={styles.primaryBtnText}>{t('scan.scanButton')}</Text>
          <Text style={styles.primaryBtnAr}>مسح الهوية</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Review', {})}
        >
          <Text style={styles.secondaryBtnIcon}>✏️</Text>
          <Text style={styles.secondaryBtnText}>{t('scan.manualButton')}</Text>
          <Text style={styles.secondaryBtnAr}>إدخال يدوي</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  icon: { fontSize: 48 },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 4,
    minHeight: 88,
    justifyContent: 'center',
  },
  primaryBtnIcon: { fontSize: 28, marginBottom: 4 },
  primaryBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  primaryBtnAr: { color: 'rgba(255,255,255,0.75)', fontSize: 14 },
  secondaryBtn: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 4,
    minHeight: 88,
    justifyContent: 'center',
  },
  secondaryBtnIcon: { fontSize: 24, marginBottom: 4 },
  secondaryBtnText: { color: COLORS.primary, fontSize: 17, fontWeight: '700' },
  secondaryBtnAr: { color: COLORS.textSecondary, fontSize: 14 },
});
