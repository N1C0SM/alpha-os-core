import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfWeek, endOfWeek, format } from 'date-fns';

export interface MuscleVolume {
  muscle: string;
  sets: number;
  volume: number; // weight * reps
}

export interface WeeklyVolumeData {
  muscleVolumes: MuscleVolume[];
  totalSets: number;
  totalVolume: number;
  weekStart: string;
  weekEnd: string;
}

const MUSCLE_TRANSLATIONS: Record<string, string> = {
  chest: 'Pecho',
  back: 'Espalda',
  shoulders: 'Hombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  forearms: 'Antebrazos',
  core: 'Core',
  quadriceps: 'Cuádriceps',
  hamstrings: 'Isquios',
  glutes: 'Glúteos',
  calves: 'Gemelos',
  full_body: 'Full Body',
};

// Recommended weekly sets per muscle group for hypertrophy
const RECOMMENDED_SETS: Record<string, { min: number; max: number }> = {
  chest: { min: 10, max: 20 },
  back: { min: 10, max: 20 },
  shoulders: { min: 8, max: 16 },
  biceps: { min: 8, max: 14 },
  triceps: { min: 8, max: 14 },
  quadriceps: { min: 10, max: 20 },
  hamstrings: { min: 8, max: 16 },
  glutes: { min: 8, max: 16 },
  calves: { min: 8, max: 16 },
  core: { min: 6, max: 12 },
};

export const useWeeklyVolume = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['weekly_volume', user?.id],
    queryFn: async (): Promise<WeeklyVolumeData> => {
      if (!user?.id) {
        return {
          muscleVolumes: [],
          totalSets: 0,
          totalVolume: 0,
          weekStart: '',
          weekEnd: '',
        };
      }

      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

      // Fetch all exercise logs for this week with exercise info
      const { data: logs, error } = await supabase
        .from('exercise_logs')
        .select(`
          weight_kg,
          reps_completed,
          is_warmup,
          exercises!inner (
            primary_muscle,
            secondary_muscles
          ),
          workout_sessions!inner (
            date,
            user_id
          )
        `)
        .eq('workout_sessions.user_id', user.id)
        .gte('workout_sessions.date', weekStartStr)
        .lte('workout_sessions.date', weekEndStr);

      if (error) throw error;

      // Aggregate by muscle group
      const muscleMap: Record<string, { sets: number; volume: number }> = {};

      for (const log of logs || []) {
        // Skip warmup sets
        if (log.is_warmup) continue;

        const exercise = (log as any).exercises;
        const primaryMuscle = exercise?.primary_muscle as string;
        const weight = log.weight_kg || 0;
        const reps = log.reps_completed || 0;
        const volume = weight * reps;

        // Count for primary muscle
        if (primaryMuscle) {
          if (!muscleMap[primaryMuscle]) {
            muscleMap[primaryMuscle] = { sets: 0, volume: 0 };
          }
          muscleMap[primaryMuscle].sets += 1;
          muscleMap[primaryMuscle].volume += volume;
        }

        // Count half for secondary muscles
        const secondaryMuscles = exercise?.secondary_muscles as string[] | null;
        if (secondaryMuscles) {
          for (const muscle of secondaryMuscles) {
            if (!muscleMap[muscle]) {
              muscleMap[muscle] = { sets: 0, volume: 0 };
            }
            muscleMap[muscle].sets += 0.5; // Half set credit for secondary
            muscleMap[muscle].volume += volume * 0.5;
          }
        }
      }

      const muscleVolumes: MuscleVolume[] = Object.entries(muscleMap)
        .map(([muscle, data]) => ({
          muscle,
          sets: Math.round(data.sets),
          volume: Math.round(data.volume),
        }))
        .sort((a, b) => b.sets - a.sets);

      const totalSets = muscleVolumes.reduce((sum, m) => sum + m.sets, 0);
      const totalVolume = muscleVolumes.reduce((sum, m) => sum + m.volume, 0);

      return {
        muscleVolumes,
        totalSets,
        totalVolume,
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
      };
    },
    enabled: !!user?.id,
  });
};

export const getMuscleTranslation = (muscle: string) => 
  MUSCLE_TRANSLATIONS[muscle] || muscle;

export const getRecommendedSets = (muscle: string) => 
  RECOMMENDED_SETS[muscle] || { min: 8, max: 16 };

export const getVolumeStatus = (muscle: string, sets: number): 'low' | 'optimal' | 'high' => {
  const rec = getRecommendedSets(muscle);
  if (sets < rec.min) return 'low';
  if (sets > rec.max) return 'high';
  return 'optimal';
};
