import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useExercises = () => {
  return useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });
};

export const useWorkoutPlans = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['workout_plans', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('workout_plans')
        .select(`
          *,
          workout_plan_days (
            *,
            workout_plan_exercises (
              *,
              exercises (*)
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useCreateWorkoutPlan = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plan: { name: string; description?: string; split_type?: 'push_pull_legs' | 'upper_lower' | 'full_body' | 'bro_split' | 'custom'; days_per_week?: number }) => {
      if (!user?.id) throw new Error('No user');
      
      const { data, error } = await supabase
        .from('workout_plans')
        .insert([{
          user_id: user.id,
          name: plan.name,
          description: plan.description,
          split_type: plan.split_type || 'push_pull_legs',
          days_per_week: plan.days_per_week || 4,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout_plans'] });
    },
  });
};

export const useCreateWorkoutDay = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (day: { workout_plan_id: string; name: string; day_number: number; focus?: ('chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'forearms' | 'core' | 'quadriceps' | 'hamstrings' | 'glutes' | 'calves' | 'full_body')[] }) => {
      const { data, error } = await supabase
        .from('workout_plan_days')
        .insert([{
          workout_plan_id: day.workout_plan_id,
          name: day.name,
          day_number: day.day_number,
          focus: day.focus,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout_plans'] });
    },
  });
};

export const useAddExerciseToPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (exercise: { 
      workout_plan_day_id: string; 
      exercise_id: string; 
      sets?: number; 
      reps_min?: number; 
      reps_max?: number;
      order_index?: number;
    }) => {
      const { data, error } = await supabase
        .from('workout_plan_exercises')
        .insert({
          workout_plan_day_id: exercise.workout_plan_day_id,
          exercise_id: exercise.exercise_id,
          sets: exercise.sets || 3,
          reps_min: exercise.reps_min || 8,
          reps_max: exercise.reps_max || 12,
          order_index: exercise.order_index || 0,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout_plans'] });
    },
  });
};

export const useWorkoutSessions = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['workout_sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          workout_plan_days (
            name,
            focus
          )
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(30);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useStartWorkoutSession = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planDayId?: string) => {
      if (!user?.id) throw new Error('No user');
      
      const { data, error } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          workout_plan_day_id: planDayId,
          date: new Date().toISOString().split('T')[0],
          started_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout_sessions'] });
    },
  });
};

export const useLogExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: {
      workout_session_id: string;
      exercise_id: string;
      set_number: number;
      weight_kg?: number;
      reps_completed?: number;
      rpe?: number;
    }) => {
      const { data, error } = await supabase
        .from('exercise_logs')
        .insert(log)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise_logs'] });
    },
  });
};

export const useCompleteWorkoutSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, rating }: { sessionId: string; rating?: number }) => {
      const startedAt = new Date(); // Would get from session
      const completedAt = new Date();
      const durationMinutes = Math.round((completedAt.getTime() - startedAt.getTime()) / 60000);

      const { error } = await supabase
        .from('workout_sessions')
        .update({
          completed_at: completedAt.toISOString(),
          duration_minutes: durationMinutes,
          rating,
        })
        .eq('id', sessionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout_sessions'] });
    },
  });
};

export const useUpdateWorkoutDay = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dayId, name }: { dayId: string; name: string }) => {
      const { data, error } = await supabase
        .from('workout_plan_days')
        .update({ name })
        .eq('id', dayId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout_plans'] });
    },
  });
};

export const useDeleteWorkoutDay = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dayId }: { dayId: string }) => {
      // Delete exercises for the day first (FK safety)
      const { error: exError } = await supabase
        .from('workout_plan_exercises')
        .delete()
        .eq('workout_plan_day_id', dayId);
      if (exError) throw exError;

      const { error } = await supabase
        .from('workout_plan_days')
        .delete()
        .eq('id', dayId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout_plans'] });
    },
  });
};

export const useDeleteWorkoutPlanExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planExerciseId }: { planExerciseId: string }) => {
      const { error } = await supabase
        .from('workout_plan_exercises')
        .delete()
        .eq('id', planExerciseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout_plans'] });
    },
  });
};
