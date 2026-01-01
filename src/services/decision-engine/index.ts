// AlphaSupps OS - Decision Engine
// This service orchestrates all decision-making for the app
// Designed to be extensible - logic can be enhanced without structural changes

import { trainingDecision, type TrainingDecisionInput, type TrainingDecision } from './training-decision';
import { nutritionDecision, type NutritionDecisionInput, type NutritionDecision } from './nutrition-decision';
import { supplementDecision, type SupplementDecisionInput, type SupplementDecision } from './supplement-decision';
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
  nutrition: NutritionDecision;
  supplements: SupplementDecision;
  priorities: DailyPriority[];
  computedEnergy: number;
  shouldRest: boolean;
}

/**
 * Main decision engine - generates the complete daily plan
 * All decisions are made based on user state and preferences
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
    daysSinceLastWorkout: 1, // Would come from DB in real implementation
    consecutiveWorkoutDays: 0,
  };
  const training = trainingDecision(trainingInput);
  
  // Step 3: Nutrition decision
  const nutritionInput: NutritionDecisionInput = {
    weightKg: input.weightKg,
    fitnessGoal: input.fitnessGoal,
    isWorkoutDay: training.shouldTrain,
    activityLevel: training.shouldTrain ? 'high' : 'moderate',
  };
  const nutrition = nutritionDecision(nutritionInput);
  
  // Step 4: Supplement decision
  const supplementInput: SupplementDecisionInput = {
    fitnessGoal: input.fitnessGoal,
    isWorkoutDay: training.shouldTrain,
    sleepQuality: input.sleepQuality,
  };
  const supplements = supplementDecision(supplementInput);
  
  // Step 5: Generate priorities
  const prioritiesInput: PrioritiesDecisionInput = {
    isWorkoutDay: training.shouldTrain,
    hydrationProgress: input.hydrationProgress,
    mealsCompleted: input.mealsCompleted,
    totalMeals: input.totalMeals,
    supplementsTaken: input.supplementsTaken,
    totalSupplements: input.totalSupplements,
    sleepQuality: input.sleepQuality,
    stressLevel: input.stressLevel,
  };
  const priorities = prioritiesDecision(prioritiesInput);
  
  return {
    training,
    nutrition,
    supplements,
    priorities,
    computedEnergy,
    shouldRest: !training.shouldTrain,
  };
}

/**
 * Calculate overall energy/readiness score (1-10)
 * This is a simplified algorithm that can be enhanced later
 */
function calculateEnergy(input: DailyPlanInput): number {
  const sleepScore = Math.min(input.sleepHours / 8, 1) * input.sleepQuality;
  const stressImpact = (10 - input.stressLevel) / 10;
  const sorenessImpact = (10 - input.sorenessLevel) / 10;
  
  // Weighted average
  const rawScore = (sleepScore * 0.4) + (stressImpact * 0.3) + (sorenessImpact * 0.3);
  
  // Scale to 1-10
  return Math.round(rawScore * 10);
}

// Re-export types for external use
export type { TrainingDecision, NutritionDecision, SupplementDecision, DailyPriority };
