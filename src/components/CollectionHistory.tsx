import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Collection } from '../database';
import { COLORS } from '../theme';

interface Props {
  collections: Collection[];
}

export const CollectionHistory: React.FC<Props> = ({ collections }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={() => setExpanded((e) => !e)} activeOpacity={0.7}>
        <Text style={styles.headerText}>{t('result.collectionHistory')}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{collections.length}</Text>
        </View>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          {collections.length === 0 ? (
            <Text style={styles.empty}>{t('result.noHistory')}</Text>
          ) : (
            collections.map((c, index) => (
              <View key={c.id} style={[styles.row, index === 0 && styles.rowFirst]}>
                <View style={styles.rowLeft}>
                  <Text style={styles.number}>{collections.length - index}</Text>
                </View>
                <View style={styles.rowContent}>
                  <View style={styles.rowTop}>
                    <Text style={styles.date}>{formatDate(c.collected_at)}</Text>
                    {index === 0 && (
                      <View style={styles.latestBadge}>
                        <Text style={styles.latestText}>{t('result.latest')}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.time}>{formatTime(c.collected_at)}</Text>
                  {c.round_name ? (
                    <Text style={styles.round}>
                      {t('result.round')}: {c.round_name}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F8F8F8',
    gap: 8,
  },
  headerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  chevron: { color: '#666', fontSize: 12 },
  body: { backgroundColor: '#FFF' },
  empty: {
    padding: 16,
    color: '#888',
    textAlign: 'center',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  rowFirst: { borderTopColor: '#E0E0E0' },
  rowLeft: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accent + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
  rowContent: { flex: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  date: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  time: { fontSize: 12, color: '#666', marginTop: 2 },
  round: { fontSize: 12, color: '#888', marginTop: 2 },
  latestBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  latestText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
});
