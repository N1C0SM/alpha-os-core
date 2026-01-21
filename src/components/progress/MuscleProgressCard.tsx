import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { TrendingUp, TrendingDown, Minus, Lock, Dumbbell } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface MuscleGroup {
  id: string;
  name: string;
  emoji: string;
  muscles: string[];
}

const MUSCLE_GROUPS: MuscleGroup[] = [
  { id: 'chest', name: 'Pecho', emoji: '🫁', muscles: ['chest'] },
  { id: 'back', name: 'Espalda', emoji: '🔙', muscles: ['back'] },
  { id: 'shoulders', name: 'Hombros', emoji: '🦾', muscles: ['shoulders'] },
  { id: 'arms', name: 'Brazos', emoji: '💪', muscles: ['biceps', 'triceps', 'forearms'] },
  { id: 'legs', name: 'Piernas', emoji: '🦵', muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'] },
  { id: 'core', name: 'Core', emoji: '🎯', muscles: ['core'] },
];

const MuscleProgressCard: React.FC = () => {
  const { user } = useAuth();
  const { isPremium, features } = useSubscriptionLimits();

  // Get exercise logs from last 30 days with weight progression
  const { data: progressData, isLoading } = useQuery({
    queryKey: ['muscle-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const sixtyDaysAgo = format(subDays(new Date(), 60), 'yyyy-MM-dd');

      // Get exercise max weights with exercise info
      const { data: maxWeights, error } = await supabase
        .from('exercise_max_weights')
        .select(`
          *,
          exercises (
            id,
            name,
            primary_muscle,
            secondary_muscles
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      // Get workout sessions for volume calculation
      const { data: recentLogs } = await supabase
        .from('exercise_logs')
        .select(`
          *,
          workout_sessions!inner (
            date,
            user_id
          ),
          exercises (
            primary_muscle
          )
        `)
        .gte('workout_sessions.date', thirtyDaysAgo)
        .eq('workout_sessions.user_id', user.id);

      const { data: previousLogs } = await supabase
        .from('exercise_logs')
        .select(`
          *,
          workout_sessions!inner (
            date,
            user_id
          ),
          exercises (
            primary_muscle
          )
        `)
        .gte('workout_sessions.date', sixtyDaysAgo)
        .lt('workout_sessions.date', thirtyDaysAgo)
        .eq('workout_sessions.user_id', user.id);

      // Calculate progress per muscle group
      const muscleProgress = MUSCLE_GROUPS.map(group => {
        // Get max weights for this muscle group
        const groupMaxWeights = maxWeights?.filter(mw => 
          group.muscles.includes(mw.exercises?.primary_muscle || '')
        ) || [];

        // Get recent volume (sets x reps x weight)
        const recentVolume = recentLogs?.filter(log => 
          group.muscles.includes(log.exercises?.primary_muscle || '')
        ).reduce((sum, log) => sum + ((log.weight_kg || 0) * (log.reps_completed || 0)), 0) || 0;

        const previousVolume = previousLogs?.filter(log => 
          group.muscles.includes(log.exercises?.primary_muscle || '')
        ).reduce((sum, log) => sum + ((log.weight_kg || 0) * (log.reps_completed || 0)), 0) || 0;

        // Calculate average max weight
        const avgMaxWeight = groupMaxWeights.length > 0
          ? groupMaxWeights.reduce((sum, mw) => sum + Number(mw.best_weight_kg || 0), 0) / groupMaxWeights.length
          : 0;

        // Calculate volume change percentage
        const volumeChange = previousVolume > 0 
          ? ((recentVolume - previousVolume) / previousVolume) * 100 
          : recentVolume > 0 ? 100 : 0;

        // Count exercises with progression ready
        const readyToProgress = groupMaxWeights.filter(mw => mw.should_progress).length;

        return {
          ...group,
          avgMaxWeight,
          recentVolume,
          volumeChange,
          exerciseCount: groupMaxWeights.length,
          readyToProgress,
          trend: volumeChange > 5 ? 'up' : volumeChange < -5 ? 'down' : 'stable',
        };
      });

      return muscleProgress;
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-4 border border-border/50 animate-pulse">
        <div className="h-6 w-40 bg-muted rounded mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-20 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // For free users, show limited preview
  if (!isPremium && !features.muscleProgressTracking) {
    return (
      <div className="bg-card rounded-2xl p-4 border border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <Dumbbell className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Progreso por músculo</h3>
        </div>

        {/* Blurred preview */}
        <div className="relative">
          <div className="grid grid-cols-2 gap-3 blur-sm opacity-50 pointer-events-none">
            {MUSCLE_GROUPS.slice(0, 4).map(group => (
              <div key={group.id} className="bg-secondary/40 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{group.emoji}</span>
                  <span className="font-medium text-sm">{group.name}</span>
                </div>
                <div className="h-2 bg-muted rounded-full" />
              </div>
            ))}
          </div>

          {/* Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-card/50 rounded-xl">
            <div className="text-center p-4">
              <Lock className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Función Premium</p>
              <p className="text-xs text-muted-foreground mt-1">
                Seguimiento detallado por músculo
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-4 border border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <Dumbbell className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Progreso por músculo</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {progressData?.map(group => (
          <div 
            key={group.id}
            className={cn(
              "bg-secondary/40 rounded-xl p-3 border transition-all",
              group.trend === 'up' && "border-green-500/30",
              group.trend === 'down' && "border-red-500/30",
              group.trend === 'stable' && "border-transparent"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{group.emoji}</span>
                <span className="font-medium text-sm text-foreground">{group.name}</span>
              </div>
              {group.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
              {group.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
              {group.trend === 'stable' && <Minus className="w-4 h-4 text-muted-foreground" />}
            </div>

            {/* Stats */}
            <div className="space-y-1">
              {group.avgMaxWeight > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Peso medio</span>
                  <span className="font-medium text-foreground">{group.avgMaxWeight.toFixed(1)} kg</span>
                </div>
              )}
              {group.volumeChange !== 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Volumen</span>
                  <span className={cn(
                    "font-medium",
                    group.volumeChange > 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {group.volumeChange > 0 ? '+' : ''}{group.volumeChange.toFixed(0)}%
                  </span>
                </div>
              )}
              {group.readyToProgress > 0 && (
                <div className="mt-2 py-1 px-2 bg-primary/10 rounded-md">
                  <span className="text-xs text-primary font-medium">
                    ⬆️ {group.readyToProgress} ejercicio{group.readyToProgress > 1 ? 's' : ''} listo{group.readyToProgress > 1 ? 's' : ''} para subir
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      {progressData && (
        <div className="mt-4 p-3 bg-primary/10 rounded-xl border border-primary/20">
          <p className="text-xs text-center text-muted-foreground">
            📊 Últimos 30 días • {progressData.filter(g => g.trend === 'up').length} grupos mejorando
          </p>
        </div>
      )}
    </div>
  );
};

export default MuscleProgressCard;
