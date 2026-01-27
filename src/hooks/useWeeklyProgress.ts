import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface WeeklyProgressData {
  currentWeekVolume: number;
  previousWeekVolume: number;
  volumeChange: number;
  volumeChangePercent: number;
  trend: 'up' | 'down' | 'stable';
  sessionsThisWeek: number;
  sessionsPreviousWeek: number;
  weeklyPRs: Array<{
    exerciseName: string;
    weight: number;
    reps: number;
    date: string;
  }>;
  consistencyRate: number;
  chartData: Array<{
    date: string;
    volume: number;
  }>;
}

export function useWeeklyProgress(scheduledDaysPerWeek: number = 4) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['weekly-progress', user?.id],
    queryFn: async (): Promise<WeeklyProgressData> => {
      if (!user?.id) {
        return getEmptyProgressData();
      }

      const now = new Date();
      const startOfThisWeek = new Date(now);
      startOfThisWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
      startOfThisWeek.setHours(0, 0, 0, 0);

      const startOfLastWeek = new Date(startOfThisWeek);
      startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

      const twoWeeksAgo = new Date(startOfLastWeek);
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 7);

      // Get all sessions from last 14 days
      const { data: sessions, error: sessionsError } = await supabase
        .from('workout_sessions')
        .select('id, date, completed_at')
        .eq('user_id', user.id)
        .gte('date', twoWeeksAgo.toISOString().split('T')[0])
        .not('completed_at', 'is', null)
        .order('date', { ascending: true });

      if (sessionsError) throw sessionsError;

      const sessionIds = sessions?.map(s => s.id) || [];

      // Get all exercise logs for these sessions
      const { data: logs, error: logsError } = await supabase
        .from('exercise_logs')
        .select(`
          id,
          workout_session_id,
          exercise_id,
          weight_kg,
          reps_completed,
          is_warmup,
          is_pr,
          created_at,
          exercises (
            name,
            name_es
          )
        `)
        .in('workout_session_id', sessionIds)
        .eq('is_warmup', false);

      if (logsError) throw logsError;

      // Get session dates for grouping
      const sessionDates = new Map(sessions?.map(s => [s.id, s.date]) || []);

      // Calculate volumes
      let currentWeekVolume = 0;
      let previousWeekVolume = 0;
      const dailyVolumes: Record<string, number> = {};
      const weeklyPRs: WeeklyProgressData['weeklyPRs'] = [];

      logs?.forEach(log => {
        const sessionDate = sessionDates.get(log.workout_session_id);
        if (!sessionDate) return;

        const date = new Date(sessionDate);
        const weight = log.weight_kg || 0;
        const reps = log.reps_completed || 0;
        const volume = weight * reps;

        // Add to daily volumes
        const dateKey = sessionDate;
        dailyVolumes[dateKey] = (dailyVolumes[dateKey] || 0) + volume;

        // Check if this week or last week
        if (date >= startOfThisWeek) {
          currentWeekVolume += volume;
        } else if (date >= startOfLastWeek) {
          previousWeekVolume += volume;
        }

        // Track PRs
        if (log.is_pr) {
          const exercise = log.exercises as { name: string; name_es: string | null } | null;
          weeklyPRs.push({
            exerciseName: exercise?.name_es || exercise?.name || 'Ejercicio',
            weight,
            reps,
            date: sessionDate,
          });
        }
      });

      // Count sessions per week
      const sessionsThisWeek = sessions?.filter(s => 
        new Date(s.date) >= startOfThisWeek
      ).length || 0;

      const sessionsPreviousWeek = sessions?.filter(s => {
        const date = new Date(s.date);
        return date >= startOfLastWeek && date < startOfThisWeek;
      }).length || 0;

      // Calculate volume change
      const volumeChange = currentWeekVolume - previousWeekVolume;
      const volumeChangePercent = previousWeekVolume > 0 
        ? Math.round((volumeChange / previousWeekVolume) * 100) 
        : 0;

      // Determine trend
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (volumeChangePercent >= 5) trend = 'up';
      else if (volumeChangePercent <= -5) trend = 'down';

      // Calculate consistency rate
      const consistencyRate = scheduledDaysPerWeek > 0 
        ? Math.min(Math.round((sessionsThisWeek / scheduledDaysPerWeek) * 100), 100)
        : 0;

      // Build chart data (last 14 days)
      const chartData: WeeklyProgressData['chartData'] = [];
      for (let i = 13; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        chartData.push({
          date: dateKey,
          volume: Math.round(dailyVolumes[dateKey] || 0),
        });
      }

      return {
        currentWeekVolume: Math.round(currentWeekVolume),
        previousWeekVolume: Math.round(previousWeekVolume),
        volumeChange: Math.round(volumeChange),
        volumeChangePercent,
        trend,
        sessionsThisWeek,
        sessionsPreviousWeek,
        weeklyPRs: weeklyPRs.slice(0, 5),
        consistencyRate,
        chartData,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

function getEmptyProgressData(): WeeklyProgressData {
  return {
    currentWeekVolume: 0,
    previousWeekVolume: 0,
    volumeChange: 0,
    volumeChangePercent: 0,
    trend: 'stable',
    sessionsThisWeek: 0,
    sessionsPreviousWeek: 0,
    weeklyPRs: [],
    consistencyRate: 0,
    chartData: [],
  };
}
