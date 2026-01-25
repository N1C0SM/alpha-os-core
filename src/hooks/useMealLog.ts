import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type MealTime = 'desayuno' | 'media_manana' | 'comida' | 'cena';

export interface MealLogEntry {
  id: string;
  user_id: string;
  date: string;
  meal_name: string;
  meal_time: MealTime;
  protein_grams: number;
  carbs_grams: number;
  fat_grams: number;
  calories: number;
  blocks_data: any;
  created_at: string;
}

export interface LogMealInput {
  date: string;
  mealName: string;
  mealTime: MealTime;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  blocks?: any[];
}

// Predefined meals with estimated macros
export const PREDEFINED_MEALS = [
  { name: 'Garbanzos', protein: 15, carbs: 45, fat: 6, calories: 294 },
  { name: 'Alubias', protein: 14, carbs: 40, fat: 1, calories: 225 },
  { name: 'Pasta', protein: 12, carbs: 75, fat: 2, calories: 366 },
  { name: 'Pasta con salmón', protein: 35, carbs: 70, fat: 15, calories: 555 },
  { name: 'Arroz a la cubana', protein: 12, carbs: 65, fat: 10, calories: 398 },
  { name: 'Frixuelos', protein: 8, carbs: 35, fat: 12, calories: 280 },
  { name: 'Rosquillas', protein: 5, carbs: 40, fat: 15, calories: 315 },
  { name: 'Tortilla francesa de queso', protein: 18, carbs: 2, fat: 20, calories: 260 },
  { name: 'Plátano', protein: 1, carbs: 27, fat: 0, calories: 105 },
  { name: 'Manzana', protein: 0, carbs: 25, fat: 0, calories: 95 },
  { name: 'Tostadas con aguacate', protein: 5, carbs: 25, fat: 15, calories: 255 },
  { name: 'Yogur con granola', protein: 10, carbs: 35, fat: 8, calories: 252 },
  { name: 'Ensalada de pollo', protein: 30, carbs: 10, fat: 12, calories: 268 },
  { name: 'Batido de proteínas', protein: 25, carbs: 5, fat: 2, calories: 138 },
] as const;

export const MEAL_TIME_LABELS: Record<MealTime, string> = {
  desayuno: 'Desayuno',
  media_manana: 'Media mañana',
  comida: 'Comida',
  cena: 'Cena',
};

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
      return (data || []).map((log: any) => {
        let parsedNotes = { protein_grams: 0, carbs_grams: 0, fat_grams: 0, calories: 0, blocks_data: [], meal_name: 'Comida', meal_time: 'comida' as MealTime };
        try {
          if (log.notes) {
            parsedNotes = { ...parsedNotes, ...JSON.parse(log.notes) };
          }
        } catch (e) {
          console.error('Error parsing meal notes:', e);
        }
        return {
          id: log.id,
          user_id: log.user_id,
          date: log.date,
          meal_name: parsedNotes.meal_name || 'Comida',
          meal_time: parsedNotes.meal_time || 'comida',
          protein_grams: parsedNotes.protein_grams || 0,
          carbs_grams: parsedNotes.carbs_grams || 0,
          fat_grams: parsedNotes.fat_grams || 0,
          calories: parsedNotes.calories || 0,
          blocks_data: parsedNotes.blocks_data || [],
          created_at: log.created_at,
        };
      });
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
        meal_name: input.mealName,
        meal_time: input.mealTime,
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
