import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  estimated1RM: number;
  date: string;
}

// Brzycki formula for 1RM estimation
export const calculate1RM = (weight: number, reps: number): number => {
  if (reps === 1) return weight;
  if (reps > 12) return weight * (1 + reps / 30); // Less accurate for high reps
  return Math.round(weight * (36 / (37 - reps)));
};

// Check if a new set is a PR
export const isPR = (
  newWeight: number, 
  newReps: number, 
  currentBest: { weight: number; reps: number; estimated1RM: number } | null
): boolean => {
  if (!currentBest) return true;
  
  const new1RM = calculate1RM(newWeight, newReps);
  return new1RM > currentBest.estimated1RM;
};

export const usePersonalRecords = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['personal_records', user?.id],
    queryFn: async (): Promise<Record<string, PersonalRecord>> => {
      if (!user?.id) return {};

      // Get all exercise logs with exercise info
      const { data, error } = await supabase
        .from('exercise_logs')
        .select(`
          weight_kg,
          reps_completed,
          created_at,
          exercise_id,
          exercises!inner (
            name,
            name_es
          ),
          workout_sessions!inner (
            user_id,
            date
          )
        `)
        .eq('workout_sessions.user_id', user.id)
        .not('weight_kg', 'is', null)
        .not('reps_completed', 'is', null);

      if (error) throw error;

      // Calculate best 1RM for each exercise
      const records: Record<string, PersonalRecord> = {};

      for (const log of data || []) {
        const exerciseId = log.exercise_id;
        const weight = log.weight_kg || 0;
        const reps = log.reps_completed || 0;
        const estimated1RM = calculate1RM(weight, reps);
        const exercise = (log as any).exercises;
        const session = (log as any).workout_sessions;

        if (!records[exerciseId] || estimated1RM > records[exerciseId].estimated1RM) {
          records[exerciseId] = {
            exerciseId,
            exerciseName: exercise?.name_es || exercise?.name || 'Unknown',
            weight,
            reps,
            estimated1RM,
            date: session?.date || log.created_at,
          };
        }
      }

      return records;
    },
    enabled: !!user?.id,
  });
};

// Get top PRs sorted by estimated 1RM
export const useTopPRs = (limit: number = 10) => {
  const { data: records, isLoading } = usePersonalRecords();

  const topPRs = records 
    ? Object.values(records)
        .sort((a, b) => b.estimated1RM - a.estimated1RM)
        .slice(0, limit)
    : [];

  return { data: topPRs, isLoading };
};

// Check if a set is a new PR for a specific exercise
export const useCheckPR = (exerciseId: string) => {
  const { data: records } = usePersonalRecords();
  
  const currentBest = records?.[exerciseId] || null;

  const checkNewPR = (weight: number, reps: number): boolean => {
    return isPR(weight, reps, currentBest);
  };

  return { currentBest, checkNewPR };
};
