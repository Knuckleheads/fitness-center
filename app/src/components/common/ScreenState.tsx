import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import { Button } from './Button';

type ScreenStateProps = {
  title: string;
  message?: string;
  loading?: boolean;
  onRetry?: () => void;
  retryLabel?: string;
};

export function ScreenState({
  title,
  message,
  loading,
  onRetry,
  retryLabel = 'Повторить',
}: ScreenStateProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : null}
        <Text style={styles.title}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
        {onRetry ? (
          <Button title={retryLabel} onPress={onRetry} variant="dark" />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: 10,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.paperCard,
    borderWidth: 1,
    borderColor: colors.line,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.dark,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    color: colors.ink3,
    textAlign: 'center',
    lineHeight: 19,
  },
});
