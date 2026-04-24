import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getAvatarColor, getInitials } from '../utils/avatarColor';

interface Props {
  nameEn: string;
  cid: string;
  size?: number;
}

export const AvatarCircle: React.FC<Props> = ({ nameEn, cid, size = 56 }) => {
  const bgColor = getAvatarColor(cid);
  const initials = getInitials(nameEn);
  const fontSize = size * 0.38;

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor }]}>
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 1,
  },
});
