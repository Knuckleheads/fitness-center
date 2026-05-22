import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { colors, radius, shadow, spacing } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'dark' | 'accent' | 'flat' | 'tight';
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  return (
    <View style={[styles.base, styles[variant], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  default: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow.sm,
  },
  dark: {
    backgroundColor: colors.ink,
    borderWidth: 0,
  },
  accent: {
    backgroundColor: colors.accent,
    borderWidth: 0,
  },
  flat: {
    backgroundColor: colors.surface2,
    borderWidth: 0,
  },
  tight: {
    padding: spacing.md,
  },
});
