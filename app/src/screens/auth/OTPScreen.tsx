import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, useWindowDimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { colors, spacing, radius } from '../../theme';
import { Button } from '../../components/common/Button';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'OTP'>;
  route: RouteProp<RootStackParamList, 'OTP'>;
};

const DEMO_CODES = new Set(['111111', '123456']);
const CODE_LENGTH = 6;

const formatPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  const national = digits.length === 11 && digits.startsWith('7') ? digits.slice(1) : digits;
  if (national.length !== 10) return phone;
  return `+7 (${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6, 8)}-${national.slice(8)}`;
};

// Single animated OTP cell
function OTPCell({
  value,
  isActive,
  isError,
  size,
  inputRef,
  onChangeText,
  onFocus,
  onKeyPress,
}: {
  value: string;
  isActive: boolean;
  isError: boolean;
  size: number;
  inputRef: (r: TextInput | null) => void;
  onChangeText: (v: string) => void;
  onFocus: () => void;
  onKeyPress: (e: any) => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bgAnim = useRef(new Animated.Value(0)).current; // 0 = empty, 1 = filled
  const prevFilled = useRef(false);

  useEffect(() => {
    const isFilled = value !== '';
    if (isFilled !== prevFilled.current) {
      prevFilled.current = isFilled;

      // Scale pop on fill
      if (isFilled) {
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.15, duration: 100, useNativeDriver: false }),
          Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 200, useNativeDriver: false }),
        ]).start();
      }

      // Background color transition
      Animated.timing(bgAnim, {
        toValue: isFilled ? 1 : 0,
        duration: 180,
        useNativeDriver: false,
      }).start();
    }
  }, [value]);

  const animatedBg = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.surface, colors.ink],
  });

  const animatedBorder = isError
    ? colors.danger
    : isActive && !value
    ? colors.accentDark
    : value
    ? colors.ink
    : colors.line2;

  return (
    <Animated.View
      style={[
        styles.cellWrap,
        {
          width: size,
          height: size + 14,
          transform: [{ scale: scaleAnim }],
          backgroundColor: animatedBg,
          borderColor: animatedBorder,
          borderWidth: isActive || value ? 2 : 1.5,
          borderRadius: radius.lg,
          overflow: 'hidden',
        },
        isError && styles.cellWrapError,
      ]}
    >
      <TextInput
        ref={inputRef}
        style={[
          styles.cellInput,
          { fontSize: size * 0.48, color: value ? '#ffffff' : colors.ink },
        ]}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onKeyPress={onKeyPress}
        keyboardType="number-pad"
        maxLength={CODE_LENGTH}
        textAlign="center"
        selectionColor={colors.accent}
        textContentType="oneTimeCode"
        caretHidden
      />
    </Animated.View>
  );
}

export default function OTPScreen({ navigation, route }: Props) {
  const { phone } = route.params;
  const { width } = useWindowDimensions();
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(''));
  const [timer, setTimer] = useState(42);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(0);
  const inputs = useRef<(TextInput | null)[]>([]);
  const submitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resendTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus first cell on mount with slight delay for smooth entry
  useEffect(() => {
    const t = setTimeout(() => {
      inputs.current[0]?.focus();
    }, 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  useEffect(() => () => {
    if (submitTimer.current) clearTimeout(submitTimer.current);
    if (resendTimer.current) clearTimeout(resendTimer.current);
  }, []);

  const handleChange = (val: string, idx: number) => {
    const digits = val.replace(/\D/g, '');
    const next = [...code];

    if (digits.length > 1) {
      digits.slice(0, CODE_LENGTH - idx).split('').forEach((digit, offset) => {
        next[idx + offset] = digit;
      });
      setCode(next);
      setError('');
      setNotice(next.every(Boolean) ? 'Код вставлен. Можно подтверждать.' : 'Часть кода вставлена.');
      const nextEmpty = next.findIndex(d => !d);
      inputs.current[nextEmpty === -1 ? CODE_LENGTH - 1 : nextEmpty]?.focus();
      return;
    }

    next[idx] = digits;
    setCode(next);
    setError('');
    setNotice('');

    if (digits && idx < CODE_LENGTH - 1) {
      // Small delay for smooth focus transition
      setTimeout(() => inputs.current[idx + 1]?.focus(), 30);
    }
    if (!digits && idx > 0) inputs.current[idx - 1]?.focus();
  };

  const handleBackspace = (idx: number) => {
    if (code[idx] || idx === 0) return;
    inputs.current[idx - 1]?.focus();
  };

  const handleSubmit = () => {
    const joined = code.join('');
    if (loading || joined.length < CODE_LENGTH) return;

    setLoading(true);
    setError('');
    setNotice('');
    submitTimer.current = setTimeout(() => {
      setLoading(false);
      if (DEMO_CODES.has(joined)) {
        navigation.navigate('RoleSelect');
        return;
      }
      setError('Неверный код. Для демо используйте 111111 или 123456.');
      setNotice('');
    }, 350);
  };

  const handleResend = () => {
    if (timer > 0 || resendLoading) return;

    setResendLoading(true);
    setError('');
    setNotice('');
    resendTimer.current = setTimeout(() => {
      setCode(Array(CODE_LENGTH).fill(''));
      setTimer(60);
      setResendLoading(false);
      setNotice('Отправили новый код.');
      inputs.current[0]?.focus();
    }, 400);
  };

  const filled = code.filter(d => d !== '').length;
  const canSubmit = filled === CODE_LENGTH && !loading;
  const cellGap = 8;
  const cellSize = Math.min(50, Math.floor((width - spacing.lg * 2 - cellGap * (CODE_LENGTH - 1)) / CODE_LENGTH));

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backText}>← Назад · шаг 2 из 2</Text>
          </TouchableOpacity>

          <View style={styles.titleBlock}>
            <Text style={styles.title}>Код из SMS</Text>
            <Text style={styles.sub}>
              Отправили на{' '}
              <Text style={styles.phone}>{formatPhone(phone)}</Text>
            </Text>
          </View>

          {/* OTP cells */}
          <View style={[styles.otpRow, { gap: cellGap }]}>
            {code.map((d, i) => (
              <OTPCell
                key={i}
                value={d}
                isActive={focusedIndex === i}
                isError={!!error}
                size={cellSize}
                inputRef={r => { inputs.current[i] = r; }}
                onChangeText={v => handleChange(v, i)}
                onFocus={() => {
                  setFocusedIndex(i);
                  setError('');
                }}
                onKeyPress={({ nativeEvent }: any) => {
                  if (nativeEvent.key === 'Backspace') handleBackspace(i);
                }}
              />
            ))}
          </View>

          {/* Hint */}
          <Text style={styles.hint}>Для демо: 111111</Text>

          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : notice ? (
            <Text style={styles.notice}>{notice}</Text>
          ) : null}

          {timer > 0 ? (
            <Text style={styles.timer}>
              Повторная отправка через{' '}
              <Text style={styles.timerBold}>0:{timer < 10 ? `0${timer}` : timer}</Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={resendLoading} activeOpacity={0.75}>
              <Text style={[styles.timer, styles.resend, resendLoading && styles.resendDisabled]}>
                {resendLoading ? 'Отправляем...' : 'Отправить код повторно'}
              </Text>
            </TouchableOpacity>
          )}

          <Button
            title={loading ? 'Проверяем...' : 'Подтвердить'}
            onPress={handleSubmit}
            style={styles.submit}
            disabled={!canSubmit}
            loading={loading}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  keyboard: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  back: { paddingTop: spacing.lg, paddingBottom: spacing.sm },
  backText: { color: colors.ink3, fontSize: 14 },
  titleBlock: { marginTop: spacing.xl, marginBottom: 36 },
  title: { fontSize: 32, fontWeight: '800', color: colors.dark, letterSpacing: 0 },
  sub: { fontSize: 15, color: colors.ink3, marginTop: 8 },
  phone: { color: colors.dark, fontWeight: '700' },
  otpRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
  cellWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cellWrapError: {
    borderColor: colors.danger,
  },
  cellInput: {
    width: '100%',
    height: '100%',
    fontWeight: '800',
    padding: 0,
    color: colors.ink,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  hint: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.ink4,
    marginBottom: spacing.sm,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  error: { textAlign: 'center', fontSize: 13, color: colors.danger, marginBottom: spacing.md },
  notice: { textAlign: 'center', fontSize: 13, color: colors.ok, marginBottom: spacing.md },
  timer: { textAlign: 'center', fontSize: 14, color: colors.ink3, marginBottom: spacing.lg },
  timerBold: { fontWeight: '700', color: colors.ink2 },
  resend: { color: colors.dark, fontWeight: '600' },
  resendDisabled: { color: colors.ink4 },
  submit: { marginTop: 24 },
});
