import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../../theme';
import { useApp } from '../../state/AppContext';

export default function AdminDashboardScreen() {
  const { data } = useApp();
  const visits = data?.visits ?? [];
  const classes = data?.classes ?? [];
  const clients = data?.trainerClients ?? [];
  const halls = data?.halls ?? [];
  const trainers = data?.trainers ?? [];
  const bookedCount = classes.reduce((sum, item) => sum + (item.total - item.spots), 0);
  const revenue = trainers.reduce((sum, item) => sum + Number(item.rate.replace(/\D/g, '') || 0) * item.clients, 0);
  const renewals = clients.filter(item => item.status === 'warn' || item.status === 'done').length;
  const newClients = clients.filter(item => item.status === 'new').length;
  const hourData = classes.map(item => item.total - item.spots);
  const maxH = Math.max(...hourData, 1);
  const expiring = clients.filter(item => item.status === 'warn').length;

  const kpi = [
    { label: 'ВЫРУЧКА', val: `${revenue.toLocaleString('ru-RU')} ₽`, delta: null, ok: null },
    { label: 'ВИЗИТЫ', val: String(visits.length), delta: null, ok: null },
    { label: 'ПРОДЛЕНИЯ', val: String(renewals), delta: null, ok: null },
    { label: 'НОВЫХ', val: String(newClients), delta: null, ok: null },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.clubLabel}>ФИТНЕС «ВОЛНА» · ЦЕНТР</Text>
            <Text style={styles.title}>Сегодня</Text>
          </View>
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeText}>{new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}</Text>
          </View>
        </View>

        <View style={styles.kpiGrid}>
          {kpi.map(k => (
            <View key={k.label} style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{k.label}</Text>
              <Text style={styles.kpiVal}>{k.val}</Text>
            </View>
          ))}
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>Записи по занятиям</Text>
          <View style={styles.barChart}>
            {classes.map((item, i) => {
              const h = item.total - item.spots;
              return (
                <View key={item.id} style={styles.barCol}>
                  <View style={[styles.bar, {
                    height: `${(h / maxH) * 100}%`,
                    backgroundColor: item.booked ? colors.accent : colors.dark,
                    opacity: item.booked ? 1 : 0.2 + (h / maxH) * 0.6,
                  }]} />
                </View>
              );
            })}
          </View>
          <View style={styles.barLabels}>
            {classes.map((item, i) => (
              <Text key={item.id} style={styles.barLabel}>{i % 2 === 0 ? item.time.slice(0, 2) : ''}</Text>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.ink3 }]}>Загрузка залов</Text>
          {halls.map(h => (
            <View key={h.id} style={styles.hallRow}>
              <View style={styles.hallInfo}>
                <Text style={styles.hallName}>{h.name}</Text>
                <Text style={[styles.hallPct, h.loadPct > 85 && { color: colors.danger }]}>{h.loadPct}%</Text>
              </View>
              <View style={styles.hallBar}>
                <View style={[styles.hallBarFill, {
                  width: `${h.loadPct}%`,
                  backgroundColor: h.loadPct > 85 ? colors.danger : h.loadPct > 60 ? colors.accent : colors.ok,
                }]} />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.dark }]}>
            <Text style={styles.statLabelDark}>АБОН. ИСТЕКАЮТ</Text>
            <Text style={styles.statValDark}>{expiring}</Text>
            <Text style={styles.statSubDark}>по базе клиентов</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>ЗАПИСЕЙ В РАСПИСАНИИ</Text>
            <Text style={styles.statVal}>{bookedCount}</Text>
            <Text style={styles.statSub}>занятые места</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: spacing.lg, marginBottom: spacing.md },
  clubLabel: { fontSize: 10, color: colors.ink3, letterSpacing: 0.8, marginBottom: 3 },
  title: { fontSize: 28, fontWeight: '800', color: colors.dark, letterSpacing: 0 },
  dateBadge: { backgroundColor: colors.paperCard, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: colors.line, marginTop: 4 },
  dateBadgeText: { fontSize: 12, color: colors.dark, fontWeight: '700' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: spacing.md },
  kpiCard: { width: '47.5%', backgroundColor: colors.paperCard, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.line },
  kpiLabel: { fontSize: 9, color: colors.ink3, letterSpacing: 0.8, fontWeight: '700', marginBottom: 4 },
  kpiVal: { fontSize: 22, fontWeight: '800', color: colors.dark, letterSpacing: 0 },
  chartCard: { backgroundColor: colors.dark, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md },
  cardTitle: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.5)', marginBottom: spacing.md, letterSpacing: 0.3 },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 3 },
  barCol: { flex: 1, justifyContent: 'flex-end', height: '100%' },
  bar: { width: '100%', borderRadius: 3 },
  barLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  barLabel: { fontSize: 8, color: 'rgba(255,255,255,0.3)', width: 14, textAlign: 'center' },
  card: { backgroundColor: colors.paperCard, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.line, marginBottom: spacing.md },
  hallRow: { marginBottom: 12 },
  hallInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  hallName: { fontSize: 13, color: colors.dark, fontWeight: '500' },
  hallPct: { fontSize: 13, color: colors.ink3, fontWeight: '700' },
  hallBar: { height: 5, backgroundColor: colors.surface3, borderRadius: 3 },
  hallBarFill: { height: '100%', borderRadius: 3 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: colors.paperCard, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.line },
  statLabel: { fontSize: 9, color: colors.ink3, letterSpacing: 0.8, fontWeight: '700' },
  statVal: { fontSize: 30, fontWeight: '800', color: colors.dark, marginVertical: 4, letterSpacing: 0 },
  statSub: { fontSize: 11, color: colors.ok, fontWeight: '600' },
  statLabelDark: { fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.8, fontWeight: '700' },
  statValDark: { fontSize: 30, fontWeight: '800', color: colors.accent, marginVertical: 4, letterSpacing: 0 },
  statSubDark: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
});
