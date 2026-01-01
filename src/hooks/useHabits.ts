import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useHabits = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['habits', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('priority', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useCreateHabit = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habit: { name: string; description?: string; icon?: string }) => {
      if (!user?.id) throw new Error('No user');
      
      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          name: habit.name,
          description: habit.description,
          icon: habit.icon || '✓',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
};

export const useDeleteHabit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habitId: string) => {
      const { error } = await supabase
        .from('habits')
        .update({ is_active: false })
        .eq('id', habitId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
};

export const useHabitLogs = (date: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['habit_logs', user?.id, date],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useToggleHabit = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ habitId, date, completed }: { habitId: string; date: string; completed: boolean }) => {
      if (!user?.id) throw new Error('No user');

      // Check if log exists
      const { data: existing } = await supabase
        .from('habit_logs')
        .select('id')
        .eq('habit_id', habitId)
        .eq('date', date)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('habit_logs')
          .update({ 
            completed, 
            completed_at: completed ? new Date().toISOString() : null 
          })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('habit_logs')
          .insert({
            habit_id: habitId,
            user_id: user.id,
            date,
            completed,
            completed_at: completed ? new Date().toISOString() : null,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['habit_logs', user?.id, variables.date] });
    },
  });
};

// Get streak for a habit
export const useHabitStreak = (habitId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['habit_streak', habitId],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { data, error } = await supabase
        .from('habit_logs')
        .select('date, completed')
        .eq('habit_id', habitId)
        .eq('completed', true)
        .order('date', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      // Calculate streak
      let streak = 0;
      const today = new Date();
      
      for (let i = 0; i < 100; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        const found = data?.find(log => log.date === dateStr);
        if (found) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }
      
      return streak;
    },
    enabled: !!user?.id && !!habitId,
  });
};
