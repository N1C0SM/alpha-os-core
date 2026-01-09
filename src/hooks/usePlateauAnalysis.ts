import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  analyzeExerciseProgress, 
  analyzeOverallProgress,
  ExerciseProgress,
  PlateauAnalysis,
  OverallProgressAnalysis 
} from '@/services/plateau-detection';

export function usePlateauAnalysis() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['plateau-analysis', user?.id],
    queryFn: async (): Promise<OverallProgressAnalysis | null> => {
      if (!user) return null;

      // Get all exercise logs for the user from the last 12 weeks
      const twelveWeeksAgo = new Date();
      twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

      const { data: logs, error } = await supabase
        .from('exercise_logs')
        .select(`
          id,
          exercise_id,
          weight_kg,
          reps_completed,
          set_number,
          created_at,
          workout_sessions!inner (
            user_id,
            date
          ),
          exercises (
            id,
            name,
            name_es
          )
        `)
        .gte('created_at', twelveWeeksAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching exercise logs:', error);
        return null;
      }

      // Filter logs for current user
      const userLogs = logs?.filter(log => 
        (log.workout_sessions as any)?.user_id === user.id
      ) || [];

      if (userLogs.length === 0) return null;

      // Group logs by exercise
      const exerciseMap = new Map<string, {
        exerciseId: string;
        exerciseName: string;
        sessions: Map<string, { weight: number; reps: number; sets: number }>;
      }>();

      userLogs.forEach(log => {
        const exerciseId = log.exercise_id;
        const exerciseName = (log.exercises as any)?.name_es || (log.exercises as any)?.name || 'Ejercicio';
        const date = (log.workout_sessions as any)?.date || log.created_at?.split('T')[0];
        const weight = log.weight_kg || 0;
        const reps = log.reps_completed || 0;

        if (!exerciseMap.has(exerciseId)) {
          exerciseMap.set(exerciseId, {
            exerciseId,
            exerciseName,
            sessions: new Map(),
          });
        }

        const exercise = exerciseMap.get(exerciseId)!;
        
        if (!exercise.sessions.has(date)) {
          exercise.sessions.set(date, { weight: 0, reps: 0, sets: 0 });
        }

        const session = exercise.sessions.get(date)!;
        // Keep the max weight for the day
        session.weight = Math.max(session.weight, weight);
        session.reps = Math.max(session.reps, reps);
        session.sets++;
      });

      // Convert to ExerciseProgress format
      const exerciseProgresses: ExerciseProgress[] = [];

      exerciseMap.forEach((exercise) => {
        const history = Array.from(exercise.sessions.entries()).map(([date, data]) => ({
          date,
          weight: data.weight,
          reps: data.reps,
          sets: data.sets,
          volume: data.weight * data.reps * data.sets,
        }));

        // Only analyze exercises with at least 3 sessions
        if (history.length >= 3) {
          exerciseProgresses.push({
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exerciseName,
            history,
          });
        }
      });

      if (exerciseProgresses.length === 0) return null;

      // Run the analysis
      return analyzeOverallProgress(exerciseProgresses);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useExercisePlateauAnalysis(exerciseId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['exercise-plateau', exerciseId, user?.id],
    queryFn: async (): Promise<PlateauAnalysis | null> => {
      if (!user || !exerciseId) return null;

      const twelveWeeksAgo = new Date();
      twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

      const { data: logs, error } = await supabase
        .from('exercise_logs')
        .select(`
          id,
          exercise_id,
          weight_kg,
          reps_completed,
          set_number,
          created_at,
          workout_sessions!inner (
            user_id,
            date
          ),
          exercises (
            id,
            name,
            name_es
          )
        `)
        .eq('exercise_id', exerciseId)
        .gte('created_at', twelveWeeksAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching exercise logs:', error);
        return null;
      }

      const userLogs = logs?.filter(log => 
        (log.workout_sessions as any)?.user_id === user.id
      ) || [];

      if (userLogs.length < 3) return null;

      // Group by date
      const sessionMap = new Map<string, { weight: number; reps: number; sets: number }>();
      let exerciseName = '';

      userLogs.forEach(log => {
        const date = (log.workout_sessions as any)?.date || log.created_at?.split('T')[0];
        exerciseName = (log.exercises as any)?.name_es || (log.exercises as any)?.name || 'Ejercicio';
        
        if (!sessionMap.has(date)) {
          sessionMap.set(date, { weight: 0, reps: 0, sets: 0 });
        }

        const session = sessionMap.get(date)!;
        session.weight = Math.max(session.weight, log.weight_kg || 0);
        session.reps = Math.max(session.reps, log.reps_completed || 0);
        session.sets++;
      });

      const history = Array.from(sessionMap.entries()).map(([date, data]) => ({
        date,
        weight: data.weight,
        reps: data.reps,
        sets: data.sets,
        volume: data.weight * data.reps * data.sets,
      }));

      return analyzeExerciseProgress({
        exerciseId,
        exerciseName,
        history,
      });
    },
    enabled: !!user && !!exerciseId,
  });
}
