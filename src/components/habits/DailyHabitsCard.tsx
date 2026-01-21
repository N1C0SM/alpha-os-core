import React, { useEffect } from 'react';
import { useHabits, useHabitLogs, useToggleHabit, useCreateHabit } from '@/hooks/useHabits';
import { useWorkoutSessions } from '@/hooks/useWorkouts';
import { useDailyMacros } from '@/hooks/useMealLog';
import { useHydrationLog } from '@/hooks/useNutrition';
import { useProfile } from '@/hooks/useProfile';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { Check, Loader2, Lock, Dumbbell, Droplets, Utensils, Moon, Flame } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface SystemHabit {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: 'training' | 'nutrition' | 'hydration' | 'recovery';
  checkFn: () => boolean;
  isSystem: true;
}

const DailyHabitsCard: React.FC = () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { features, isPremium } = useSubscriptionLimits();
  
  // Data for auto-complete
  const { data: profile } = useProfile();
  const { data: workoutSessions } = useWorkoutSessions();
  const dailyMacros = useDailyMacros(today);
  const { data: hydrationLog } = useHydrationLog(today);
  
  // User habits
  const { data: userHabits, isLoading: habitsLoading } = useHabits();
  const { data: habitLogs } = useHabitLogs(today);
  const toggleHabit = useToggleHabit();
  const createHabit = useCreateHabit();

  // Check if user completed workout today
  const completedWorkoutToday = workoutSessions?.some(
    (session) => session.date === today && session.completed_at
  );

  // Check protein goal (80% of target = completed)
  const proteinTarget = (profile?.weight_kg || 75) * 2;
  const proteinConsumed = dailyMacros?.consumedProtein || 0;
  const proteinCompleted = proteinConsumed >= proteinTarget * 0.8;

  // Check hydration goal (80% of target = completed)
  const hydrationTarget = hydrationLog?.target_ml || 3000;
  const hydrationConsumed = hydrationLog?.consumed_ml || 0;
  const hydrationCompleted = hydrationConsumed >= hydrationTarget * 0.8;

  // System habits that auto-complete
  const systemHabits: SystemHabit[] = [
    {
      id: 'system-training',
      name: 'Entrenar',
      icon: <Dumbbell className="w-4 h-4" />,
      category: 'training',
      checkFn: () => completedWorkoutToday,
      isSystem: true,
    },
    {
      id: 'system-protein',
      name: 'Proteína cumplida',
      icon: <Utensils className="w-4 h-4" />,
      category: 'nutrition',
      checkFn: () => proteinCompleted,
      isSystem: true,
    },
    {
      id: 'system-hydration',
      name: 'Hidratación',
      icon: <Droplets className="w-4 h-4" />,
      category: 'hydration',
      checkFn: () => hydrationCompleted,
      isSystem: true,
    },
  ];

  // Combine system + user habits
  const allHabits = [
    ...systemHabits,
    ...(userHabits?.map(h => ({
      ...h,
      icon: <span className="text-base">{h.icon}</span>,
      isSystem: false,
      checkFn: () => false,
    })) || []),
  ];

  // Get completion status
  const getHabitStatus = (habit: typeof allHabits[0]) => {
    if (habit.isSystem) {
      return (habit as SystemHabit).checkFn();
    }
    const log = habitLogs?.find(l => l.habit_id === habit.id);
    return log?.completed || false;
  };

  const handleToggle = async (habit: typeof allHabits[0]) => {
    if (habit.isSystem) return; // Can't manually toggle system habits
    if (!features.habitAutoComplete && !isPremium) return; // Free users can't toggle

    const currentStatus = getHabitStatus(habit);
    await toggleHabit.mutateAsync({
      habitId: habit.id,
      date: today,
      completed: !currentStatus,
    });
  };

  // Count completed
  const completedCount = allHabits.filter(h => getHabitStatus(h)).length;
  const totalCount = allHabits.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Create default habits for new users
  useEffect(() => {
    if (!habitsLoading && userHabits && userHabits.length === 0) {
      // Don't auto-create, system habits are enough
    }
  }, [habitsLoading, userHabits]);

  if (habitsLoading) {
    return (
      <div className="bg-card rounded-2xl p-4 border border-border/50 animate-pulse">
        <div className="h-6 w-32 bg-muted rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-4 border border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-foreground">Hábitos del día</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {completedCount}/{totalCount}
          </span>
          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Habits List */}
      <div className="space-y-2">
        {allHabits.map((habit) => {
          const isCompleted = getHabitStatus(habit);
          const isLocked = !isPremium && !habit.isSystem;

          return (
            <button
              key={habit.id}
              onClick={() => !isLocked && handleToggle(habit)}
              disabled={habit.isSystem || isLocked || toggleHabit.isPending}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                isCompleted 
                  ? "bg-green-500/10 border border-green-500/30" 
                  : "bg-secondary/40 border border-transparent hover:border-border/50",
                habit.isSystem && "cursor-default",
                isLocked && "opacity-50 cursor-not-allowed"
              )}
            >
              {/* Icon */}
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                isCompleted ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"
              )}>
                {habit.icon}
              </div>

              {/* Name */}
              <span className={cn(
                "flex-1 text-left font-medium text-sm",
                isCompleted ? "text-green-500" : "text-foreground"
              )}>
                {habit.name}
                {habit.isSystem && (
                  <span className="ml-2 text-xs text-muted-foreground">(auto)</span>
                )}
              </span>

              {/* Status */}
              {isLocked ? (
                <Lock className="w-4 h-4 text-muted-foreground" />
              ) : isCompleted ? (
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30" />
              )}
            </button>
          );
        })}
      </div>

      {/* Premium upsell for free users */}
      {!isPremium && (
        <div className="mt-4 p-3 bg-primary/10 rounded-xl border border-primary/20">
          <p className="text-xs text-muted-foreground text-center">
            <Lock className="w-3 h-3 inline mr-1" />
            Hábitos personalizados con <span className="text-primary font-medium">Premium</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default DailyHabitsCard;
