import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ExerciseHistoryEntry {
  date: string;
  weight_kg: number | null;
  reps_completed: number | null;
  set_number: number;
}

interface LastPerformance {
  weight_kg: number | null;
  reps_completed: number | null;
  date: string;
  sets: { weight_kg: number | null; reps_completed: number | null }[];
}

export const useExerciseHistory = (exerciseId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['exercise_history', exerciseId, user?.id],
    queryFn: async (): Promise<ExerciseHistoryEntry[]> => {
      if (!user?.id || !exerciseId) return [];

      const { data, error } = await supabase
        .from('exercise_logs')
        .select(`
          weight_kg,
          reps_completed,
          set_number,
          workout_sessions!inner (
            date,
            user_id
          )
        `)
        .eq('exercise_id', exerciseId)
        .eq('workout_sessions.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map((entry: any) => ({
        date: entry.workout_sessions?.date,
        weight_kg: entry.weight_kg,
        reps_completed: entry.reps_completed,
        set_number: entry.set_number,
      }));
    },
    enabled: !!user?.id && !!exerciseId,
  });
};

export const useLastExercisePerformance = (exerciseId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['last_exercise_performance', exerciseId, user?.id],
    queryFn: async (): Promise<LastPerformance | null> => {
      if (!user?.id || !exerciseId) return null;

      // Get the most recent session where this exercise was performed
      const { data, error } = await supabase
        .from('exercise_logs')
        .select(`
          weight_kg,
          reps_completed,
          set_number,
          created_at,
          workout_sessions!inner (
            date,
            user_id
          )
        `)
        .eq('exercise_id', exerciseId)
        .eq('workout_sessions.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      if (!data || data.length === 0) return null;

      // Group by session date to get the most recent session's sets
      const mostRecentDate = (data[0] as any).workout_sessions?.date;
      const sessionSets = data
        .filter((d: any) => d.workout_sessions?.date === mostRecentDate)
        .sort((a: any, b: any) => a.set_number - b.set_number)
        .map((d: any) => ({
          weight_kg: d.weight_kg,
          reps_completed: d.reps_completed,
        }));

      // Find the best set (highest weight with reps)
      const bestSet = sessionSets.reduce((best: any, current: any) => {
        if (!best) return current;
        if ((current.weight_kg || 0) > (best.weight_kg || 0)) return current;
        return best;
      }, null);

      return {
        weight_kg: bestSet?.weight_kg || null,
        reps_completed: bestSet?.reps_completed || null,
        date: mostRecentDate,
        sets: sessionSets,
      };
    },
    enabled: !!user?.id && !!exerciseId,
  });
};

// Hook to get last performance for multiple exercises at once
export const useMultipleExercisesLastPerformance = (exerciseIds: string[]) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['multiple_exercises_last_performance', exerciseIds, user?.id],
    queryFn: async (): Promise<Record<string, LastPerformance>> => {
      if (!user?.id || exerciseIds.length === 0) return {};

      const { data, error } = await supabase
        .from('exercise_logs')
        .select(`
          exercise_id,
          weight_kg,
          reps_completed,
          set_number,
          created_at,
          workout_sessions!inner (
            date,
            user_id
          )
        `)
        .in('exercise_id', exerciseIds)
        .eq('workout_sessions.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      if (!data) return {};

      // Group by exercise_id and get the most recent session for each
      const result: Record<string, LastPerformance> = {};

      for (const exerciseId of exerciseIds) {
        const exerciseLogs = data.filter((d: any) => d.exercise_id === exerciseId);
        if (exerciseLogs.length === 0) continue;

        const mostRecentDate = (exerciseLogs[0] as any).workout_sessions?.date;
        const sessionSets = exerciseLogs
          .filter((d: any) => d.workout_sessions?.date === mostRecentDate)
          .sort((a: any, b: any) => a.set_number - b.set_number)
          .map((d: any) => ({
            weight_kg: d.weight_kg,
            reps_completed: d.reps_completed,
          }));

        const bestSet = sessionSets.reduce((best: any, current: any) => {
          if (!best) return current;
          if ((current.weight_kg || 0) > (best.weight_kg || 0)) return current;
          return best;
        }, null);

        result[exerciseId] = {
          weight_kg: bestSet?.weight_kg || null,
          reps_completed: bestSet?.reps_completed || null,
          date: mostRecentDate,
          sets: sessionSets,
        };
      }

      return result;
    },
    enabled: !!user?.id && exerciseIds.length > 0,
  });
};
