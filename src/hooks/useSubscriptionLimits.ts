import { useSubscription } from '@/contexts/SubscriptionContext';
import { useWorkoutPlans } from './useWorkouts';

const FREE_ROUTINE_LIMIT = 1;

export const useSubscriptionLimits = () => {
  const { isPremium, tier } = useSubscription();
  const { data: workoutPlans } = useWorkoutPlans();

  const routineCount = workoutPlans?.length || 0;
  const canCreateRoutine = isPremium || routineCount < FREE_ROUTINE_LIMIT;
  const routinesRemaining = isPremium ? Infinity : Math.max(0, FREE_ROUTINE_LIMIT - routineCount);

  // Premium features
  const features = {
    // Routines & Training
    aiRoutineGeneration: isPremium,
    automaticProgression: isPremium,
    exerciseSwapping: isPremium, // "Máquina ocupada"
    weightAdjustment: isPremium, // "Peso fácil/duro"
    unlimitedRoutines: isPremium,
    
    // Nutrition
    personalizedMeals: isPremium,
    smartHydrationReminders: isPremium,
    macroTracking: isPremium,
    
    // Schedule
    externalActivitiesIntegration: isPremium,
    timeBlockScheduling: isPremium,
    
    // Habits
    smartHabitReminders: isPremium,
    habitAutoComplete: isPremium,
    
    // Progress
    muscleProgressTracking: isPremium,
    advancedAnalytics: isPremium,
  };

  return {
    isPremium,
    tier,
    // Routines
    routineCount,
    routineLimit: isPremium ? Infinity : FREE_ROUTINE_LIMIT,
    canCreateRoutine,
    routinesRemaining,
    // Feature flags
    features,
    // Quick checks
    canUseFeature: (feature: keyof typeof features) => features[feature],
  };
};
