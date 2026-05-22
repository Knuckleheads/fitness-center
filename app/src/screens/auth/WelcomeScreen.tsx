import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, NativeSyntheticEvent, NativeScrollEvent, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { colors, spacing, radius } from '../../theme';

type Props = { navigation: StackNavigationProp<RootStackParamList, 'Welcome'> };

const SLIDES = [
  {
    title: 'Запись, QR,\nпрогресс —\nв одном месте',
    sub: 'Управляйте абонементом прямо из телефона',
    bg: colors.accent,
    iconBg: 'rgba(0,0,0,0.08)',
    icon: 'barbell-outline' as const,
    iconColor: colors.ink,
  },
  {
    title: 'Расписание\nгрупповых\nтренировок',
    sub: 'Записывайтесь на занятия за секунды',
    bg: colors.surface3,
    iconBg: colors.accent,
    icon: 'calendar-outline' as const,
    iconColor: colors.ink,
  },
  {
    title: 'Следите\nза прогрессом\nонлайн',
    sub: 'Вес, замеры, история посещений и графики',
    bg: colors.ink,
    iconBg: colors.accent,
    icon: 'trending-up-outline' as const,
    iconColor: colors.ink,
  },
];

export default function WelcomeScreen({ navigation }: Props) {
  const [active, setActive] = useState(0);
  const { width, height } = useWindowDimensions();
  const ref = useRef<FlatList<(typeof SLIDES)[number]>>(null);
  const slideBoxSize = Math.min(196, Math.max(128, Math.floor(width * 0.46)));
  const compact = height < 680;
  const currentSlide = SLIDES[active];
  const isDark = active === 2;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActive(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: currentSlide.bg }]}>
      <View style={[styles.container, { backgroundColor: currentSlide.bg }]}>
        {/* Logo */}
        <View style={styles.logoRow}>
          <Text style={[styles.logo, isDark && styles.logoDark]}>ВОЛНА</Text>
          <Text style={[styles.logoSub, isDark && styles.logoSubDark]}>FITNESS</Text>
        </View>

        {/* Slides */}
        <FlatList
          ref={ref}
          data={SLIDES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => {
            const dark = item.bg === colors.ink;
            return (
              <View style={[styles.slide, compact && styles.slideCompact, { width }]}>
                <View
                  style={[
                    styles.slideBox,
                    {
                      width: slideBoxSize,
                      height: slideBoxSize,
                      backgroundColor: item.iconBg,
                    },
                  ]}
                >
                  <Ionicons name={item.icon} size={slideBoxSize * 0.38} color={item.iconColor} />
                </View>
                <Text style={[styles.slideTitle, compact && styles.slideTitleCompact, dark && styles.slideTitleDark]}>
                  {item.title}
                </Text>
                <Text style={[styles.slideSub, dark && styles.slideSubDark]}>{item.sub}</Text>
              </View>
            );
          }}
        />

        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                isDark ? styles.dotDarkBg : styles.dotLightBg,
                i === active && (isDark ? styles.dotActiveDark : styles.dotActiveLight),
              ]}
            />
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btnPrimary, isDark && styles.btnPrimaryDark]}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={[styles.btnPrimaryText, isDark && styles.btnPrimaryTextDark]}>
              Войти в клуб
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnGhost, isDark && styles.btnGhostDark]}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={[styles.btnGhostText, isDark && styles.btnGhostTextDark]}>
              Войти по email или Apple
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: spacing.lg },

  logoRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, paddingTop: spacing.xl },
  logo: { fontSize: 20, fontWeight: '700', color: colors.ink, letterSpacing: 2 },
  logoDark: { color: '#ffffff' },
  logoSub: { fontSize: 11, color: colors.ink3, letterSpacing: 3 },
  logoSubDark: { color: 'rgba(255,255,255,0.5)' },

  slide: { alignItems: 'center', paddingTop: spacing.xxl },
  slideCompact: { paddingTop: spacing.lg },
  slideBox: {
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  slideTitle: {
    fontSize: 30,
    fontWeight: '500',
    color: colors.ink,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: spacing.md,
    letterSpacing: 0,
  },
  slideTitleCompact: { fontSize: 26, lineHeight: 31 },
  slideTitleDark: { color: '#ffffff' },
  slideSub: { fontSize: 15, color: colors.ink3, textAlign: 'center', lineHeight: 22 },
  slideSubDark: { color: 'rgba(255,255,255,0.55)' },

  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginVertical: spacing.lg },
  dot: { height: 6, borderRadius: 3 },
  dotLightBg: { width: 6, backgroundColor: 'rgba(14,14,12,0.2)' },
  dotDarkBg: { width: 6, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActiveLight: { width: 22, backgroundColor: colors.ink },
  dotActiveDark: { width: 22, backgroundColor: colors.accent },

  actions: { paddingBottom: spacing.xxl, gap: spacing.sm },
  btnPrimary: {
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnPrimaryDark: { backgroundColor: colors.accent },
  btnPrimaryText: { fontSize: 15, fontWeight: '600', color: '#ffffff', letterSpacing: 0 },
  btnPrimaryTextDark: { color: colors.ink },
  btnGhost: {
    backgroundColor: 'transparent',
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(14,14,12,0.2)',
  },
  btnGhostDark: { borderColor: 'rgba(255,255,255,0.25)' },
  btnGhostText: { fontSize: 15, fontWeight: '500', color: colors.ink2 },
  btnGhostTextDark: { color: 'rgba(255,255,255,0.75)' },
});
