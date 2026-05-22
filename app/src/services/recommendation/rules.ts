import type { RecommendationContext, WorkoutRecommendation } from './types';

type Rule = {
  id: string;
  evaluate(ctx: RecommendationContext): WorkoutRecommendation | null;
};

function makeId(ruleId: string, exerciseName: string) {
  return `rec-${ruleId}-${exerciseName.replace(/\s+/g, '-').toLowerCase()}`;
}

const stalledLiftRule: Rule = {
  id: 'stalled-lift',
  evaluate({ recentLifts }) {
    for (const lift of recentLifts) {
      const delta = parseFloat(lift.delta);
      if (!isNaN(delta) && delta === 0 && lift.sessions >= 3) {
        return {
          id: makeId('stalled', lift.name),
          exerciseName: lift.name,
          rationale: `${lift.sessions} тренировок без прогресса в "${lift.name}" — рекомендуется разгрузочная неделя (−10% веса)`,
          patch: { weight: `${Math.round(parseFloat(lift.val) * 0.9)} кг` },
          score: 0.9,
          acceptedAt: null,
          rejectedAt: null,
        };
      }
    }
    return null;
  },
};

const progressingLiftRule: Rule = {
  id: 'progressing-lift',
  evaluate({ recentLifts }) {
    for (const lift of recentLifts) {
      const delta = parseFloat(lift.delta);
      if (!isNaN(delta) && delta > 0 && lift.sessions >= 2) {
        const current = parseFloat(lift.val);
        if (!isNaN(current)) {
          return {
            id: makeId('progress', lift.name),
            exerciseName: lift.name,
            rationale: `Стабильный прогресс в "${lift.name}" (+${lift.delta}) — попробуйте добавить 2.5 кг`,
            patch: { weight: `${current + 2.5} кг` },
            score: 0.75,
            acceptedAt: null,
            rejectedAt: null,
          };
        }
      }
    }
    return null;
  },
};

const lowVisitsRule: Rule = {
  id: 'low-visits',
  evaluate({ visitCount, client }) {
    if (visitCount < 2) {
      return {
        id: makeId('low-visits', client.goal),
        exerciseName: 'Общая активность',
        rationale: `Менее 2 визитов за последний период — рекомендуется добавить кардио-сессию для набора регулярности`,
        patch: { sets: '3×20 мин' },
        score: 0.6,
        acceptedAt: null,
        rejectedAt: null,
      };
    }
    return null;
  },
};

const weightLossRule: Rule = {
  id: 'weight-loss-goal',
  evaluate({ client, recentMeasures }) {
    if (!client.goal.toLowerCase().includes('похуд')) return null;
    const weightMeasure = recentMeasures.find(m => m.label.toLowerCase().includes('вес'));
    if (!weightMeasure) return null;
    const delta = parseFloat(weightMeasure.delta);
    if (!isNaN(delta) && delta >= 0) {
      return {
        id: makeId('weight-loss', 'cardio'),
        exerciseName: 'Кардио',
        rationale: 'Цель — снижение веса, но прогресса нет. Рекомендуется добавить 2 кардио-сессии в неделю',
        patch: { sets: '2×40 мин' },
        score: 0.8,
        acceptedAt: null,
        rejectedAt: null,
      };
    }
    return null;
  },
};

export const ALL_RULES: Rule[] = [
  stalledLiftRule,
  progressingLiftRule,
  lowVisitsRule,
  weightLossRule,
];
