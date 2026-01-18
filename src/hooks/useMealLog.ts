import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface MealLogEntry {
  id: string;
  user_id: string;
  date: string;
  meal_type: string;
  protein_grams: number;
  carbs_grams: number;
  fat_grams: number;
  calories: number;
  blocks_data: any;
  created_at: string;
}

interface LogMealInput {
  date: string;
  mealType?: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  blocks?: any[];
}

export function useMealLogs(date: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['meal-logs', user?.id, date],
    queryFn: async (): Promise<MealLogEntry[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching meal logs:', error);
        return [];
      }

      // Transform the data to match our interface
      return (data || []).map((log: any) => ({
        id: log.id,
        user_id: log.user_id,
        date: log.date,
        meal_type: log.meal_id || 'custom',
        protein_grams: log.notes ? JSON.parse(log.notes)?.protein_grams || 0 : 0,
        carbs_grams: log.notes ? JSON.parse(log.notes)?.carbs_grams || 0 : 0,
        fat_grams: log.notes ? JSON.parse(log.notes)?.fat_grams || 0 : 0,
        calories: log.notes ? JSON.parse(log.notes)?.calories || 0 : 0,
        blocks_data: log.notes ? JSON.parse(log.notes)?.blocks_data || [] : [],
        created_at: log.created_at,
      }));
    },
    enabled: !!user,
  });
}

export function useDailyMacros(date: string) {
  const { data: mealLogs } = useMealLogs(date);

  const totals = (mealLogs || []).reduce(
    (acc, log) => ({
      protein: acc.protein + (log.protein_grams || 0),
      carbs: acc.carbs + (log.carbs_grams || 0),
      fat: acc.fat + (log.fat_grams || 0),
      calories: acc.calories + (log.calories || 0),
    }),
    { protein: 0, carbs: 0, fat: 0, calories: 0 }
  );

  return {
    consumedProtein: totals.protein,
    consumedCarbs: totals.carbs,
    consumedFat: totals.fat,
    consumedCalories: totals.calories,
    mealCount: mealLogs?.length || 0,
  };
}

export function useLogMeal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: LogMealInput) => {
      if (!user) throw new Error('User not authenticated');

      // Store macro data in the notes field as JSON
      const notesData = JSON.stringify({
        protein_grams: input.protein,
        carbs_grams: input.carbs,
        fat_grams: input.fat,
        calories: input.calories,
        blocks_data: input.blocks || [],
      });

      const { data, error } = await supabase
        .from('meal_logs')
        .insert({
          user_id: user.id,
          date: input.date,
          completed: true,
          completed_at: new Date().toISOString(),
          notes: notesData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meal-logs', user?.id, variables.date] });
      toast({
        title: '¡Comida registrada!',
        description: `+${variables.protein}g proteína añadidos`,
      });
    },
    onError: (error) => {
      console.error('Error logging meal:', error);
      toast({
        title: 'Error',
        description: 'No se pudo registrar la comida',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteMealLog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, date }: { id: string; date: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('meal_logs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return { id, date };
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({ queryKey: ['meal-logs', user?.id, variables.date] });
      toast({
        title: 'Comida eliminada',
      });
    },
    onError: (error) => {
      console.error('Error deleting meal log:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la comida',
        variant: 'destructive',
      });
    },
  });
}
