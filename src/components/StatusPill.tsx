import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Beneficiary } from '../database';

export type BeneficiaryStatus = 'new' | 'eligible' | 'blocked' | 'blacklisted';

export function getStatus(b: Pick<Beneficiary, 'eligible' | 'blacklisted'>, isNew = false): BeneficiaryStatus {
  if (b.blacklisted) return 'blacklisted';
  if (isNew) return 'new';
  if (b.eligible) return 'eligible';
  return 'blocked';
}

interface Props {
  status: BeneficiaryStatus;
  size?: 'sm' | 'md';
}

export const StatusPill: React.FC<Props> = ({ status, size = 'md' }) => {
  const { t } = useTranslation();

  const styles = getStyles(status, size);

  return (
    <View style={styles.pill}>
      <Text style={styles.text}>{t(`status.${status}`)}</Text>
    </View>
  );
};

function getStyles(status: BeneficiaryStatus, size: 'sm' | 'md') {
  const colorMap = {
    new: { bg: '#FAEEDA', border: '#FAC775', text: '#7A5A00' },
    eligible: { bg: '#E1F5EE', border: '#9FE1CB', text: '#0A5E3F' },
    blocked: { bg: '#FCEBEB', border: '#F7C1C1', text: '#8B1A1A' },
    blacklisted: { bg: '#5C1A1A', border: '#3D0000', text: '#FFFFFF' },
  };
  const c = colorMap[status];
  const isSmall = size === 'sm';

  return StyleSheet.create({
    pill: {
      backgroundColor: c.bg,
      borderColor: c.border,
      borderWidth: 1,
      borderRadius: 20,
      paddingHorizontal: isSmall ? 8 : 12,
      paddingVertical: isSmall ? 2 : 4,
      alignSelf: 'flex-start',
    },
    text: {
      color: c.text,
      fontSize: isSmall ? 11 : 13,
      fontWeight: '600',
    },
  });
}
