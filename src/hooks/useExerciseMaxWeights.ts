import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ExerciseMaxWeight {
  id: string;
  user_id: string;
  exercise_id: string;
  functional_max_kg: number;
  best_weight_kg: number;
  best_reps: number;
  consecutive_successful_sessions: number;
  last_feeling: 'easy' | 'correct' | 'hard' | null;
  last_session_date: string | null;
  should_progress: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useExerciseMaxWeights = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['exercise_max_weights', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('exercise_max_weights')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as ExerciseMaxWeight[];
    },
    enabled: !!user?.id,
  });
};

export const useExerciseMaxWeight = (exerciseId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['exercise_max_weight', user?.id, exerciseId],
    queryFn: async () => {
      if (!user?.id || !exerciseId) return null;
      
      const { data, error } = await supabase
        .from('exercise_max_weights')
        .select('*')
        .eq('user_id', user.id)
        .eq('exercise_id', exerciseId)
        .maybeSingle();
      
      if (error) throw error;
      return data as ExerciseMaxWeight | null;
    },
    enabled: !!user?.id && !!exerciseId,
  });
};

export const useUpdateExerciseMaxWeight = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      exerciseId,
      weightKg,
      reps,
      feeling,
    }: {
      exerciseId: string;
      weightKg: number;
      reps: number;
      feeling: 'easy' | 'correct' | 'hard';
    }) => {
      if (!user?.id) throw new Error('No user');

      // Get current record
      const { data: existing } = await supabase
        .from('exercise_max_weights')
        .select('*')
        .eq('user_id', user.id)
        .eq('exercise_id', exerciseId)
        .maybeSingle();

      const today = new Date().toISOString().split('T')[0];
      
      // Calculate progression logic
      let shouldProgress = false;
      let consecutiveSessions = existing?.consecutive_successful_sessions || 0;
      let functionalMax = existing?.functional_max_kg || weightKg;
      let bestWeight = existing?.best_weight_kg || weightKg;
      let bestReps = existing?.best_reps || reps;

      // Update best weight if this is better
      if (weightKg > bestWeight || (weightKg === bestWeight && reps > bestReps)) {
        bestWeight = weightKg;
        bestReps = reps;
      }

      // Progression logic based on feeling
      if (feeling === 'correct' || feeling === 'easy') {
        consecutiveSessions++;
        // Only suggest progression after 2 consecutive successful sessions
        if (consecutiveSessions >= 2 && feeling === 'easy') {
          shouldProgress = true;
        }
        // Update functional max if completed successfully
        if (weightKg >= functionalMax) {
          functionalMax = weightKg;
        }
      } else if (feeling === 'hard') {
        // Reset progression counter, set functional max as this weight
        consecutiveSessions = 0;
        shouldProgress = false;
        // Don't update functional max - keep last successful weight
      }

      if (existing) {
        const { data, error } = await supabase
          .from('exercise_max_weights')
          .update({
            functional_max_kg: functionalMax,
            best_weight_kg: bestWeight,
            best_reps: bestReps,
            consecutive_successful_sessions: consecutiveSessions,
            last_feeling: feeling,
            last_session_date: today,
            should_progress: shouldProgress,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('exercise_max_weights')
          .insert({
            user_id: user.id,
            exercise_id: exerciseId,
            functional_max_kg: functionalMax,
            best_weight_kg: bestWeight,
            best_reps: bestReps,
            consecutive_successful_sessions: consecutiveSessions,
            last_feeling: feeling,
            last_session_date: today,
            should_progress: shouldProgress,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise_max_weights'] });
      queryClient.invalidateQueries({ queryKey: ['exercise_max_weight'] });
    },
  });
};

// Calculate suggested weight for next session
export function calculateSuggestedWeight(
  maxWeight: ExerciseMaxWeight | null,
  exerciseName: string
): { weight: number; reason: string } {
  if (!maxWeight) {
    return { weight: 0, reason: 'Sin historial previo' };
  }

  const { functional_max_kg, should_progress, last_feeling, consecutive_successful_sessions } = maxWeight;

  // Determine increment based on exercise type
  const nameLower = exerciseName.toLowerCase();
  const isLowerBody = ['sentadilla', 'peso muerto', 'prensa', 'hip thrust', 'squat', 'deadlift', 'leg press'].some(e => nameLower.includes(e));
  const isIsolation = ['curl', 'extension', 'elevacion', 'face pull', 'apertura', 'lateral raise', 'fly'].some(e => nameLower.includes(e));
  
  const increment = isLowerBody ? 5 : isIsolation ? 1.25 : 2.5;

  if (should_progress && last_feeling === 'easy') {
    return {
      weight: functional_max_kg + increment,
      reason: `¡Sube ${increment}kg! ${consecutive_successful_sessions} sesiones perfectas 💪`,
    };
  }

  if (last_feeling === 'hard') {
    return {
      weight: functional_max_kg,
      reason: `Mantén ${functional_max_kg}kg hasta dominar el peso`,
    };
  }

  return {
    weight: functional_max_kg,
    reason: last_feeling === 'correct' 
      ? `${consecutive_successful_sessions}/2 sesiones para subir` 
      : 'Peso sugerido basado en historial',
  };
}
