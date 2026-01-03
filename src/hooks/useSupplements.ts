import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUserSchedule } from './useProfile';
import { usePreferences } from './usePreferences';
import { supplementDecision, type SupplementRecommendation } from '@/services/decision-engine/supplement-decision';

export const useSupplements = () => {
  return useQuery({
    queryKey: ['supplements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplements')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
};

export const useSupplementRecommendations = () => {
  const { data: profile } = useProfile();
  const { data: preferences } = usePreferences();
  const { data: schedule } = useUserSchedule();

  // Get today's day of week to determine if workout day
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayName = dayNames[new Date().getDay()];

  return useQuery({
    queryKey: ['supplement_recommendations', profile?.fitness_goal, preferences?.sleep_quality, schedule?.preferred_workout_days, todayName],
    queryFn: () => {
      const fitnessGoal = profile?.fitness_goal || 'muscle_gain';
      const sleepQuality = preferences?.sleep_quality || 7;
      
      // Use user's actual workout days from schedule
      const preferredDays = schedule?.preferred_workout_days || ['monday', 'tuesday', 'thursday', 'friday'];
      const isWorkoutDay = preferredDays.includes(todayName);

      return supplementDecision({
        fitnessGoal: fitnessGoal as 'muscle_gain' | 'fat_loss' | 'recomposition' | 'maintenance',
        isWorkoutDay,
        sleepQuality,
      });
    },
    enabled: !!profile,
  });
};

export const useSupplementLogs = (date: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['supplement_logs', date, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('supplement_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useToggleSupplement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      supplementName, 
      timing, 
      date, 
      taken 
    }: { 
      supplementName: string;
      timing: 'morning' | 'pre_workout' | 'intra_workout' | 'post_workout' | 'with_meal' | 'before_bed';
      date: string;
      taken: boolean;
    }) => {
      if (!user?.id) throw new Error('No user');

      // Check if log exists for this supplement+timing+date combo
      const { data: existing } = await supabase
        .from('supplement_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', date)
        .eq('timing', timing)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('supplement_logs')
          .update({
            taken,
            taken_at: taken ? new Date().toISOString() : null,
          })
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('supplement_logs')
          .insert({
            user_id: user.id,
            date,
            timing,
            taken,
            taken_at: taken ? new Date().toISOString() : null,
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplement_logs'] });
    },
  });
};
