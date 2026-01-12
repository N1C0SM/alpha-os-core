import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  progressionDecision, 
  type ProgressionSuggestion,
  type ExerciseLogData 
} from '@/services/decision-engine/progression-decision';

interface UseProgressionSuggestionParams {
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
}

export function useProgressionSuggestion({
  exerciseId,
  exerciseName,
  targetSets,
  targetRepsMin,
  targetRepsMax,
}: UseProgressionSuggestionParams) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['progression-suggestion', exerciseId, user?.id],
    queryFn: async (): Promise<ProgressionSuggestion | null> => {
      if (!user?.id || !exerciseId) return null;

      // Get the last 2 sessions for this exercise
      const { data: sessions, error: sessionsError } = await supabase
        .from('workout_sessions')
        .select('id, date')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .order('date', { ascending: false })
        .limit(10);

      if (sessionsError || !sessions?.length) return null;

      // Get logs for this exercise from recent sessions
      const sessionIds = sessions.map(s => s.id);
      
      const { data: logs, error: logsError } = await supabase
        .from('exercise_logs')
        .select('workout_session_id, weight_kg, reps_completed, is_warmup, set_number')
        .eq('exercise_id', exerciseId)
        .in('workout_session_id', sessionIds)
        .order('set_number', { ascending: true });

      if (logsError || !logs?.length) return null;

      // Group logs by session
      const logsBySession: { [sessionId: string]: ExerciseLogData[] } = {};
      logs.forEach(log => {
        if (!logsBySession[log.workout_session_id]) {
          logsBySession[log.workout_session_id] = [];
        }
        logsBySession[log.workout_session_id].push({
          weight_kg: log.weight_kg,
          reps_completed: log.reps_completed,
          is_warmup: log.is_warmup,
          set_number: log.set_number,
        });
      });

      // Find last two sessions with logs for this exercise
      let lastSessionLogs: ExerciseLogData[] = [];
      let previousSessionLogs: ExerciseLogData[] | undefined;

      for (const session of sessions) {
        if (logsBySession[session.id]) {
          if (!lastSessionLogs.length) {
            lastSessionLogs = logsBySession[session.id];
          } else if (!previousSessionLogs) {
            previousSessionLogs = logsBySession[session.id];
            break;
          }
        }
      }

      if (!lastSessionLogs.length) return null;

      return progressionDecision({
        exerciseId,
        exerciseName,
        targetSets,
        targetRepsMin,
        targetRepsMax,
        lastSessionLogs,
        previousSessionLogs,
      });
    },
    enabled: !!user?.id && !!exerciseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get all progression suggestions for a routine day
export function useRoutineDayProgressions(routineDayId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['routine-day-progressions', routineDayId, user?.id],
    queryFn: async () => {
      if (!user?.id || !routineDayId) return {};

      // Get all exercises for this routine day
      const { data: planExercises, error: planError } = await supabase
        .from('workout_plan_exercises')
        .select(`
          id,
          exercise_id,
          sets,
          reps_min,
          reps_max,
          exercises (
            id,
            name,
            name_es
          )
        `)
        .eq('workout_plan_day_id', routineDayId);

      if (planError || !planExercises?.length) return {};

      // Get recent sessions
      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .order('date', { ascending: false })
        .limit(10);

      if (!sessions?.length) return {};

      const sessionIds = sessions.map(s => s.id);
      const exerciseIds = planExercises.map(e => e.exercise_id);

      // Get all logs for these exercises
      const { data: logs } = await supabase
        .from('exercise_logs')
        .select('exercise_id, workout_session_id, weight_kg, reps_completed, is_warmup, set_number')
        .in('exercise_id', exerciseIds)
        .in('workout_session_id', sessionIds);

      if (!logs?.length) return {};

      // Group logs by exercise and session
      const logsByExercise: { [exerciseId: string]: { [sessionId: string]: ExerciseLogData[] } } = {};
      
      logs.forEach(log => {
        if (!logsByExercise[log.exercise_id]) {
          logsByExercise[log.exercise_id] = {};
        }
        if (!logsByExercise[log.exercise_id][log.workout_session_id]) {
          logsByExercise[log.exercise_id][log.workout_session_id] = [];
        }
        logsByExercise[log.exercise_id][log.workout_session_id].push({
          weight_kg: log.weight_kg,
          reps_completed: log.reps_completed,
          is_warmup: log.is_warmup,
          set_number: log.set_number,
        });
      });

      // Calculate progressions for each exercise
      const progressions: { [exerciseId: string]: ProgressionSuggestion } = {};

      for (const planEx of planExercises) {
        const exerciseLogs = logsByExercise[planEx.exercise_id];
        if (!exerciseLogs) continue;

        // Find last two sessions with logs
        let lastSessionLogs: ExerciseLogData[] = [];
        let previousSessionLogs: ExerciseLogData[] | undefined;

        for (const session of sessions) {
          if (exerciseLogs[session.id]) {
            if (!lastSessionLogs.length) {
              lastSessionLogs = exerciseLogs[session.id];
            } else if (!previousSessionLogs) {
              previousSessionLogs = exerciseLogs[session.id];
              break;
            }
          }
        }

        if (lastSessionLogs.length) {
          const exercise = planEx.exercises as { id: string; name: string; name_es: string | null };
          progressions[planEx.exercise_id] = progressionDecision({
            exerciseId: planEx.exercise_id,
            exerciseName: exercise?.name_es || exercise?.name || '',
            targetSets: planEx.sets || 3,
            targetRepsMin: planEx.reps_min || 8,
            targetRepsMax: planEx.reps_max || 12,
            lastSessionLogs,
            previousSessionLogs,
          });
        }
      }

      return progressions;
    },
    enabled: !!user?.id && !!routineDayId,
    staleTime: 5 * 60 * 1000,
  });
}
