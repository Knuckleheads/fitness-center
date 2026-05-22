import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../../theme';

interface ChipProps {
  label: string;
  active?: boolean;
  accent?: boolean;
  outline?: boolean;
  onPress?: () => void;
}

export function Chip({ label, active, accent, outline, onPress }: ChipProps) {
  return (
    <TouchableOpacity
      style={[styles.base,
        active && styles.active,
        accent && styles.accentChip,
        outline && styles.outlineChip,
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.text,
        active && styles.activeText,
        accent && styles.accentText,
        outline && styles.outlineText,
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surface3,
    marginRight: 6,
  },
  active: { backgroundColor: colors.ink },
  accentChip: { backgroundColor: colors.accent },
  outlineChip: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.line2 },
  text: { fontSize: 12, fontWeight: '500', color: colors.ink2 },
  activeText: { color: colors.surface },
  accentText: { color: colors.accentInk },
  outlineText: { color: colors.ink2 },
});
