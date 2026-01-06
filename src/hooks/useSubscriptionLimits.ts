import { useSubscription } from '@/contexts/SubscriptionContext';
import { useWorkoutPlans } from './useWorkouts';

const FREE_ROUTINE_LIMIT = 3;

export const useSubscriptionLimits = () => {
  const { isPremium, tier } = useSubscription();
  const { data: workoutPlans } = useWorkoutPlans();

  const routineCount = workoutPlans?.length || 0;
  const canCreateRoutine = isPremium || routineCount < FREE_ROUTINE_LIMIT;
  const routinesRemaining = isPremium ? Infinity : Math.max(0, FREE_ROUTINE_LIMIT - routineCount);

  return {
    isPremium,
    tier,
    // Routines
    routineCount,
    routineLimit: isPremium ? Infinity : FREE_ROUTINE_LIMIT,
    canCreateRoutine,
    routinesRemaining,
  };
};
