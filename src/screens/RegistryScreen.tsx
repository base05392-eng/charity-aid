import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RegistryStackParamList, FilterType, Beneficiary } from '../types';
import { searchBeneficiaries } from '../database';
import { AvatarCircle } from '../components/AvatarCircle';
import { StatusPill } from '../components/StatusPill';
import { getBeneficiaryStatus } from '../types';
import { COLORS } from '../theme';

export const RegistryScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RegistryStackParamList, 'RegistryHome'>>();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [results, setResults] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(async (q: string, f: FilterType) => {
    setLoading(true);
    try {
      const data = await searchBeneficiaries(q, f);
      setResults(data);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload whenever this tab comes into focus (e.g. after a scan adds a beneficiary)
  useFocusEffect(
    useCallback(() => {
      runSearch(search, filter);
    }, [search, filter])
  );

  useEffect(() => {
    const timer = setTimeout(() => runSearch(search, filter), 200); // debounce typing
    return () => clearTimeout(timer);
  }, [search, filter]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const renderItem = ({ item: b }: { item: Beneficiary }) => {
    const status = getBeneficiaryStatus(b, b.eligible === 1 && b.blacklisted === 0 ? 1 : 0);
    // Use a simpler status derivation for list view
    const listStatus = b.blacklisted ? 'blacklisted' : b.eligible ? 'eligible' : 'blocked';

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate('ResultCard', { cid: b.cid, fromScan: false })}
        activeOpacity={0.75}
      >
        <AvatarCircle nameEn={b.name_en} cid={b.cid} size={44} />
        <View style={styles.rowContent}>
          <Text style={styles.nameEn} numberOfLines={1}>{b.name_en || '—'}</Text>
          <Text style={styles.nameAr} numberOfLines={1}>{b.name_ar || '—'}</Text>
          <Text style={styles.cid}>{b.cid}</Text>
          <Text style={styles.lastSeen}>
            {b.last_seen !== b.first_seen
              ? `${t('registry.lastCollection')}: ${formatDate(b.last_seen)}`
              : t('registry.never')}
          </Text>
        </View>
        <StatusPill status={listStatus} size="sm" />
      </TouchableOpacity>
    );
  };

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all', label: t('registry.filterAll') },
    { key: 'eligible', label: t('registry.filterEligible') },
    { key: 'blocked', label: t('registry.filterBlocked') },
    { key: 'blacklisted', label: t('registry.filterBlacklisted') },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('registry.searchPlaceholder')}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTabText, filter === f.key && styles.filterTabTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && results.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(b) => b.cid}
          renderItem={renderItem}
          contentContainerStyle={results.length === 0 ? styles.emptyContainer : undefined}
          ListEmptyComponent={
            <Text style={styles.emptyText}>{t('registry.noResults')}</Text>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchWrap: { padding: 12, backgroundColor: COLORS.surface },
  searchInput: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 44,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 36,
    justifyContent: 'center',
  },
  filterTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterTabText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  filterTabTextActive: { color: '#FFF' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: COLORS.surface,
    gap: 12,
    minHeight: 72,
  },
  rowContent: { flex: 1 },
  nameEn: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  nameAr: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'right', marginTop: 1 },
  cid: { fontSize: 11, color: '#AAA', marginTop: 2, letterSpacing: 0.5 },
  lastSeen: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  separator: { height: 1, backgroundColor: COLORS.border },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { color: COLORS.textSecondary, fontSize: 15, textAlign: 'center' },
});
