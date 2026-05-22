import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { colors, spacing, radius } from '../../theme';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'Login'> };

const normalizeRussianPhone = (value: string) => {
  const digits = value.replace(/\D/g, '');
  const withoutCountry = digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))
    ? digits.slice(1)
    : digits;
  return withoutCountry.slice(0, 10);
};

const formatPhoneInput = (digits: string) => {
  const parts = [
    digits.slice(0, 3),
    digits.slice(3, 6),
    digits.slice(6, 8),
    digits.slice(8, 10),
  ].filter(Boolean);

  if (digits.length <= 3) return parts[0] ? `(${parts[0]}` : '';
  if (digits.length <= 6) return `(${parts[0]}) ${parts[1]}`;
  if (digits.length <= 8) return `(${parts[0]}) ${parts[1]}-${parts[2]}`;
  return `(${parts[0]}) ${parts[1]}-${parts[2]}-${parts[3]}`;
};

export default function LoginScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [agreed, setAgreed] = useState(true);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const phoneDigits = normalizeRussianPhone(phone);
  const isPhoneValid = phoneDigits.length === 10;
  const canRequestCode = agreed && isPhoneValid;

  const handlePhoneChange = (value: string) => {
    setPhone(formatPhoneInput(normalizeRussianPhone(value)));
  };

  const handleSubmit = () => {
    if (!canRequestCode) return;
    navigation.navigate('OTP', { phone: `+7${phoneDigits}` });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          {/* Heading */}
          <Text style={styles.title}>Вход{'\n'}в клуб</Text>
          <Text style={styles.sub}>
            Войдите по номеру телефона.{'\n'}Мы отправим код в SMS.
          </Text>

          {/* Phone field */}
          <View style={styles.fieldWrap}>
            <Text style={styles.eyebrow}>Номер телефона</Text>
            <TouchableOpacity
              activeOpacity={1}
              style={[
                styles.input,
                focused && styles.inputFocus,
                phone && isPhoneValid && styles.inputValid,
              ]}
              onPress={() => inputRef.current?.focus()}
            >
              <View style={styles.prefixBadge}>
                <Text style={styles.prefixText}>+7</Text>
              </View>
              <TextInput
                ref={inputRef}
                style={styles.inputField}
                value={phone}
                onChangeText={handlePhoneChange}
                placeholder="(900) 123-45-67"
                placeholderTextColor={colors.ink4}
                keyboardType="phone-pad"
                maxLength={15}
                returnKeyType="done"
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onSubmitEditing={handleSubmit}
              />
              {isPhoneValid && (
                <Text style={styles.validMark}>✓</Text>
              )}
            </TouchableOpacity>
            {phone.length > 0 && !isPhoneValid && (
              <Text style={styles.error}>Введите 10 цифр номера.</Text>
            )}
          </View>

          {/* Agreement */}
          <TouchableOpacity style={styles.agreeRow} onPress={() => setAgreed(a => !a)} activeOpacity={0.7}>
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.agreeText}>
              Согласен с{' '}
              <Text style={styles.agreeLink}>офертой</Text>
              {' '}и{' '}
              <Text style={styles.agreeLink}>политикой</Text>
            </Text>
          </TouchableOpacity>

          {/* Primary CTA */}
          <TouchableOpacity
            style={[styles.btnPrimary, !canRequestCode && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={!canRequestCode}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>Получить код →</Text>
          </TouchableOpacity>

          <Text style={styles.securityNote}>
            Вход сейчас работает по SMS-коду. Дополнительные способы можно включить после подключения серверной авторизации.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  keyboard: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },

  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line2,
    alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.lg,
  },
  backIcon: { fontSize: 18, color: colors.ink },

  title: {
    fontSize: 34,
    fontWeight: '500',
    color: colors.ink,
    lineHeight: 38,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    letterSpacing: 0,
  },
  sub: {
    fontSize: 14,
    color: colors.ink3,
    lineHeight: 22,
    marginBottom: spacing.xxl,
  },

  fieldWrap: { marginBottom: spacing.lg },
  eyebrow: {
    fontSize: 10,
    color: colors.ink3,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.lg,
    paddingRight: spacing.lg,
    paddingVertical: 14,
    paddingLeft: 4,
  },
  inputFocus: { borderColor: colors.ink },
  inputValid: { borderColor: colors.ink },
  prefixBadge: {
    backgroundColor: colors.surface3,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  prefixText: { fontSize: 15, color: colors.ink2, fontWeight: '600' },
  inputField: { flex: 1, fontSize: 15, color: colors.ink, padding: 0 },
  validMark: { fontSize: 16, color: colors.ok, fontWeight: '700' },
  error: { color: colors.danger, fontSize: 12, marginTop: spacing.sm },

  agreeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  checkbox: {
    width: 18, height: 18, borderRadius: 5,
    borderWidth: 1.5, borderColor: colors.line2,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: colors.ink, borderColor: colors.ink },
  checkmark: { fontSize: 11, color: colors.surface, fontWeight: '700' },
  agreeText: { flex: 1, fontSize: 12, color: colors.ink2, lineHeight: 18 },
  agreeLink: { textDecorationLine: 'underline', color: colors.ink },

  btnPrimary: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnPrimaryText: { fontSize: 15, fontWeight: '600', color: colors.accentInk, letterSpacing: 0 },

  securityNote: {
    fontSize: 12,
    color: colors.ink3,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
