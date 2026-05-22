import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing } from '../../theme';
import { useApp } from '../../state/AppContext';
import { getRecommendations } from '../../services/recommendation/WorkoutRecommender';
import type { WorkoutRecommendation } from '../../services/recommendation/types';

export default function ClientRecommendationsScreen() {
  const navigation = useNavigation();
  const { data } = useApp();
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [rejected, setRejected] = useState<Set<string>>(new Set());

  const recommendations = useMemo<WorkoutRecommendation[]>(() => {
    if (!data) return [];
    const client = data.trainerClients[0];
    if (!client) return [];
    return getRecommendations({
      client,
      recentLifts: (data.progress.lifts as any[]).map((l, i) => ({
        id: `lift-${i}`,
        ...l,
        sessions: l.sessions ?? 2,
        createdAt: Date.now(),
      })),
      recentMeasures: (data.progress.measures as any[]).map((m, i) => ({
        id: `meas-${i}`,
        ...m,
        createdAt: Date.now(),
      })),
      visitCount: data.visits.length,
    });
  }, [data]);

  const visible = recommendations.filter(r => !rejected.has(r.id));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={22} color={colors.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>Рекомендации</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Ionicons name="bulb" size={22} color={colors.dark} />
          </View>
          <Text style={styles.heroTitle}>ИИ-тренер анализирует ваш прогресс</Text>
          <Text style={styles.heroSub}>На основе ваших результатов и истории тренировок</Text>
        </View>

        {visible.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={48} color={colors.ink4} />
            <Text style={styles.emptyTitle}>Всё отлично!</Text>
            <Text style={styles.emptySub}>Новых рекомендаций пока нет. Продолжайте тренироваться.</Text>
          </View>
        )}

        {visible.map(rec => (
          <View key={rec.id} style={[styles.card, accepted.has(rec.id) && styles.cardAccepted]}>
            <View style={styles.cardHeader}>
              <View style={styles.exerciseBadge}>
                <Ionicons name="barbell-outline" size={16} color={colors.ink2} />
                <Text style={styles.exerciseName}>{rec.exerciseName}</Text>
              </View>
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>{Math.round(rec.score * 100)}%</Text>
              </View>
            </View>

            <Text style={styles.rationale}>{rec.rationale}</Text>

            {(rec.patch.weight || rec.patch.sets) && (
              <View style={styles.patchRow}>
                {rec.patch.weight && (
                  <View style={styles.patchChip}>
                    <Ionicons name="trending-up-outline" size={13} color={colors.ink2} />
                    <Text style={styles.patchText}>{rec.patch.weight}</Text>
                  </View>
                )}
                {rec.patch.sets && (
                  <View style={styles.patchChip}>
                    <Ionicons name="repeat-outline" size={13} color={colors.ink2} />
                    <Text style={styles.patchText}>{rec.patch.sets}</Text>
                  </View>
                )}
              </View>
            )}

            {!accepted.has(rec.id) && (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => setRejected(prev => new Set([...prev, rec.id]))}
                  activeOpacity={0.75}
                >
                  <Ionicons name="close" size={16} color={colors.ink3} />
                  <Text style={styles.rejectText}>Пропустить</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => setAccepted(prev => new Set([...prev, rec.id]))}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark" size={16} color={colors.dark} />
                  <Text style={styles.acceptText}>Применить</Text>
                </TouchableOpacity>
              </View>
            )}

            {accepted.has(rec.id) && (
              <View style={styles.acceptedBanner}>
                <Ionicons name="checkmark-circle" size={16} color="#3a7a4a" />
                <Text style={styles.acceptedText}>Принято — передано тренеру</Text>
              </View>
            )}
          </View>
        ))}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color={colors.ink3} />
          <Text style={styles.infoText}>
            Рекомендации формируются на основе правил анализа прогресса. В следующей версии — нейросетевая модель на основе ваших данных.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  backBtn: { padding: 4, marginRight: 4 },
  title: { fontSize: 20, fontWeight: '700', color: colors.dark, letterSpacing: 0 },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 40, gap: spacing.md },
  hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  heroBadge: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 16, fontWeight: '700', color: colors.dark, textAlign: 'center' },
  heroSub: { fontSize: 13, color: colors.ink3, textAlign: 'center' },
  card: { backgroundColor: colors.paperCard, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, padding: spacing.lg, gap: spacing.sm },
  cardAccepted: { borderColor: '#3a7a4a' + '60', backgroundColor: '#3a7a4a' + '06' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  exerciseBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  exerciseName: { fontSize: 14, fontWeight: '700', color: colors.dark },
  scoreBadge: { backgroundColor: colors.accent + '30', borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  scoreText: { fontSize: 11, fontWeight: '700', color: colors.dark },
  rationale: { fontSize: 13, color: colors.ink2, lineHeight: 19 },
  patchRow: { flexDirection: 'row', gap: spacing.sm },
  patchChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surface3, borderRadius: radius.md, paddingHorizontal: 8, paddingVertical: 4 },
  patchText: { fontSize: 12, fontWeight: '600', color: colors.ink2 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, paddingVertical: 10 },
  rejectText: { fontSize: 13, color: colors.ink3, fontWeight: '500' },
  acceptBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: radius.md, backgroundColor: colors.accent, paddingVertical: 10 },
  acceptText: { fontSize: 13, color: colors.dark, fontWeight: '700' },
  acceptedBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingTop: spacing.xs },
  acceptedText: { fontSize: 13, color: '#3a7a4a', fontWeight: '600' },
  empty: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.ink2 },
  emptySub: { fontSize: 13, color: colors.ink3, textAlign: 'center', maxWidth: 240 },
  infoCard: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.paperCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: spacing.md, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: 12, color: colors.ink3, lineHeight: 17 },
});
