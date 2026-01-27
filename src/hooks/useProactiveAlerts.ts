import { useMemo } from 'react';
import { useProfile, useUserSchedule } from '@/hooks/useProfile';
import { useWorkoutSessions } from '@/hooks/useWorkouts';
import { useExerciseMaxWeights } from '@/hooks/useExerciseMaxWeights';
import { useHydrationLog } from '@/hooks/useNutrition';
import { useMealLogs, useDailyMacros } from '@/hooks/useMealLog';
import { getAllProactiveAlerts, type ProactiveAlert } from '@/services/decision-engine/proactive-alerts';
import { getMacroRecommendation } from '@/services/decision-engine/habit-recommendations';

export function useProactiveAlerts(): {
  alerts: ProactiveAlert[];
  isLoading: boolean;
} {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: schedule, isLoading: scheduleLoading } = useUserSchedule();
  const { data: sessions, isLoading: sessionsLoading } = useWorkoutSessions();
  const { data: exerciseMaxWeights, isLoading: maxWeightsLoading } = useExerciseMaxWeights();
  const { data: hydrationLog, isLoading: hydrationLoading } = useHydrationLog(today);
  const dailyMacros = useDailyMacros(today);

  const isLoading = profileLoading || scheduleLoading || sessionsLoading || maxWeightsLoading || hydrationLoading;

  const alerts = useMemo(() => {
    if (isLoading || !profile) return [];

    // Get today's day name to check if training day
    const dayOfWeek = new Date().getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayDayName = dayNames[dayOfWeek];
    
    const preferredDays = schedule?.preferred_workout_days || ['monday', 'tuesday', 'thursday', 'friday'];
    const isTrainingDay = preferredDays.includes(todayDayName);

    // Calculate macro targets
    const macros = getMacroRecommendation(
      profile.weight_kg || 75,
      profile.height_cm || 175,
      profile.date_of_birth 
        ? Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : 25,
      (profile.gender as 'male' | 'female' | 'other') || 'male',
      (profile.fitness_goal as 'muscle_gain' | 'fat_loss' | 'recomposition' | 'maintenance') || 'muscle_gain',
      profile.body_fat_percentage || undefined,
      isTrainingDay
    );

    // Build exercise name lookup
    const exerciseNames: Record<string, string> = {};
    // We don't have exercise data here, so we'll use IDs as placeholders
    // In real usage, this would be populated from the exercises query

    return getAllProactiveAlerts({
      scheduledDaysPerWeek: schedule?.workout_days_per_week || 4,
      recentSessions: (sessions || []).slice(0, 10).map(s => ({
        id: s.id,
        date: s.date,
        completed_at: s.completed_at,
        workout_plan_day_id: s.workout_plan_day_id,
        feeling: s.feeling,
      })),
      exerciseMaxWeights: (exerciseMaxWeights || []).map(e => ({
        exercise_id: e.exercise_id,
        functional_max_kg: e.functional_max_kg,
        consecutive_successful_sessions: e.consecutive_successful_sessions || 0,
        last_feeling: e.last_feeling,
        should_progress: e.should_progress || false,
      })),
      exerciseNames,
      todayProteinGrams: dailyMacros.consumedProtein,
      targetProteinGrams: macros.proteinGrams,
      consumedMl: hydrationLog?.consumed_ml || 0,
      targetMl: 3000, // Default target
      currentWeightKg: profile.weight_kg || null,
      previousWeightKg: null, // Would need historical data
      fitnessGoal: profile.fitness_goal || 'muscle_gain',
    });
  }, [
    isLoading,
    profile,
    schedule,
    sessions,
    exerciseMaxWeights,
    hydrationLog,
    dailyMacros,
  ]);

  return { alerts, isLoading };
}
