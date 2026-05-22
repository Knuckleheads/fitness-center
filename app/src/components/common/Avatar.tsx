import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme';

interface AvatarProps {
  initials: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'accent' | 'dark';
}

const dims = { sm: 32, md: 40, lg: 64 };
const fonts = { sm: 12, md: 14, lg: 22 };

export function Avatar({ initials, size = 'md', variant = 'default' }: AvatarProps) {
  const dim = dims[size];
  const bg = variant === 'accent' ? colors.accent : variant === 'dark' ? colors.ink : colors.surface3;
  const color = variant === 'accent' ? colors.accentInk : variant === 'dark' ? colors.surface : colors.ink;
  return (
    <View style={[styles.base, { width: dim, height: dim, borderRadius: dim / 2, backgroundColor: bg,
      borderColor: variant === 'default' ? colors.line : 'transparent' }]}>
      <Text style={[styles.text, { fontSize: fonts[size], color }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 0,
  },
  text: { fontWeight: '500' },
});
