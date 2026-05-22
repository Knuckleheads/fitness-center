import type { ProgressLift, ProgressMeasure, TrainerClient, WorkoutExercise } from '../../api/types';

export type RecommendationContext = {
  client: TrainerClient;
  recentLifts: ProgressLift[];
  recentMeasures: ProgressMeasure[];
  visitCount: number;
};

export type ExercisePatch = Partial<Pick<WorkoutExercise, 'sets' | 'weight'>>;

export type WorkoutRecommendation = {
  id: string;
  exerciseName: string;
  rationale: string;
  patch: ExercisePatch;
  score: number;
  acceptedAt: number | null;
  rejectedAt: number | null;
};
