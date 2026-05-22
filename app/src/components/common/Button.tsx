import React from 'react';
import { ActivityIndicator, TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius } from '../../theme';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'ghost' | 'dark' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  disabled?: boolean;
  loading?: boolean;
}

export function Button({ title, onPress, variant = 'primary', size = 'md', style, disabled, loading }: ButtonProps) {
  const isDisabled = disabled || loading || !onPress;
  const textStyle = styles[`${variant}Text` as keyof typeof styles];
  const spinnerColor = variant === 'primary' ? colors.accentInk : variant === 'dark' ? colors.surface : colors.ink;

  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], styles[`size_${size}`], isDisabled && styles.disabled, style]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isDisabled}
    >
      {loading && <ActivityIndicator size="small" color={spinnerColor} />}
      <Text style={[styles.text, textStyle]} numberOfLines={2}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  size_sm: { paddingVertical: 8, paddingHorizontal: 14 },
  size_md: { paddingVertical: 13, paddingHorizontal: 18 },
  size_lg: { paddingVertical: 16, paddingHorizontal: 20 },
  primary: { backgroundColor: colors.accent },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.line2,
  },
  dark: { backgroundColor: colors.ink },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.ink,
  },
  disabled: { opacity: 0.4 },
  text: { flexShrink: 1, textAlign: 'center', fontSize: 14, fontWeight: '600', letterSpacing: 0 },
  primaryText: { color: colors.accentInk },
  ghostText: { color: colors.ink },
  darkText: { color: colors.surface },
  outlineText: { color: colors.ink },
});
