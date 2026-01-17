// AlphaSupps OS - Decision Engine (MVP Version)
// Simplified to match MVP requirements - no calorie/macro tracking

import { trainingDecision, type TrainingDecisionInput, type TrainingDecision } from './training-decision';
import { prioritiesDecision, type PrioritiesDecisionInput, type DailyPriority } from './priorities-decision';

export interface DailyPlanInput {
  // User state
  sleepHours: number;
  sleepQuality: number;
  stressLevel: number;
  energyLevel: number;
  sorenessLevel: number;
  
  // User profile
  weightKg: number;
  fitnessGoal: 'muscle_gain' | 'fat_loss' | 'recomposition' | 'maintenance';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  
  // Schedule
  isWorkoutDay: boolean;
  dayOfWeek: number;
  workoutDaysPerWeek: number;
  
  // Completion status (for priorities)
  hydrationProgress: number;
  mealsCompleted: number;
  totalMeals: number;
  supplementsTaken: number;
  totalSupplements: number;
}

export interface DailyPlan {
  training: TrainingDecision;
  priorities: DailyPriority[];
  computedEnergy: number;
  shouldRest: boolean;
}

/**
 * Main decision engine - generates the complete daily plan (MVP version)
 * Simplified: no calorie/macro/supplement tracking
 */
export function generateDailyPlan(input: DailyPlanInput): DailyPlan {
  // Step 1: Calculate overall energy/readiness
  const computedEnergy = calculateEnergy(input);
  
  // Step 2: Training decision
  const trainingInput: TrainingDecisionInput = {
    sleepHours: input.sleepHours,
    sleepQuality: input.sleepQuality,
    stressLevel: input.stressLevel,
    sorenessLevel: input.sorenessLevel,
    isScheduledWorkoutDay: input.isWorkoutDay,
    experienceLevel: input.experienceLevel,
    daysSinceLastWorkout: 1,
    consecutiveWorkoutDays: 0,
  };
  const training = trainingDecision(trainingInput);
  
  // Step 3: Generate priorities
  const prioritiesInput: PrioritiesDecisionInput = {
    isWorkoutDay: training.shouldTrain,
    hydrationProgress: input.hydrationProgress,
    mealsCompleted: input.mealsCompleted,
    totalMeals: input.totalMeals,
    supplementsTaken: input.supplementsTaken,
    totalSupplements: input.totalSupplements,
    sleepQuality: input.sleepQuality,
    stressLevel: input.stressLevel,
    weightKg: input.weightKg,
    fitnessGoal: input.fitnessGoal,
    experienceLevel: input.experienceLevel,
  };
  const priorities = prioritiesDecision(prioritiesInput);
  
  return {
    training,
    priorities,
    computedEnergy,
    shouldRest: !training.shouldTrain,
  };
}

/**
 * Calculate overall energy/readiness score (1-10)
 */
function calculateEnergy(input: DailyPlanInput): number {
  const sleepScore = Math.min(input.sleepHours / 8, 1) * input.sleepQuality;
  const stressImpact = (10 - input.stressLevel) / 10;
  const sorenessImpact = (10 - input.sorenessLevel) / 10;
  
  const rawScore = (sleepScore * 0.4) + (stressImpact * 0.3) + (sorenessImpact * 0.3);
  
  return Math.round(rawScore * 10);
}

// Re-export types for external use
export type { TrainingDecision, DailyPriority };
