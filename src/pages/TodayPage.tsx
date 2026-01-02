import React from 'react';
import { useProfile, useUserPreferences } from '@/hooks/useProfile';
import { generateDailyPlan } from '@/services/decision-engine';
import { Battery, Dumbbell, Utensils, Droplets, Pill, Moon, Star, Loader2, Check } from 'lucide-react';
import { useSupplementRecommendations, useSupplementLogs } from '@/hooks/useSupplements';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const TodayPage: React.FC = () => {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: preferences } = useUserPreferences();
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: recommendations } = useSupplementRecommendations();
  const { data: logs } = useSupplementLogs(today);

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const takenCount = logs?.filter(l => l.taken)?.length || 0;
  const totalSupplements = recommendations?.recommendations?.length || 0;
  const progressPercent = totalSupplements > 0 ? (takenCount / totalSupplements) * 100 : 0;

  // Generate daily plan based on user data
  const plan = generateDailyPlan({
    sleepHours: 7,
    sleepQuality: preferences?.sleep_quality || 7,
    stressLevel: preferences?.stress_level || 5,
    energyLevel: 7,
    sorenessLevel: 3,
    weightKg: Number(profile?.weight_kg) || 75,
    fitnessGoal: (profile?.fitness_goal as any) || 'muscle_gain',
    experienceLevel: (profile?.experience_level as any) || 'beginner',
    isWorkoutDay: true,
    dayOfWeek: new Date().getDay(),
    workoutDaysPerWeek: 4,
    hydrationProgress: 40,
    mealsCompleted: 1,
    totalMeals: 5,
    supplementsTaken: 1,
    totalSupplements: 4,
  });

  const energyColor = plan.computedEnergy >= 7 ? 'text-success' : plan.computedEnergy >= 4 ? 'text-warning' : 'text-destructive';

  return (
    <div className="px-4 py-6 safe-top">
      {/* Header */}
      <div className="mb-6">
        <p className="text-muted-foreground">Hola, {profile?.full_name?.split(' ')[0] || 'Atleta'}</p>
        <h1 className="text-2xl font-bold text-foreground">Tu día de hoy</h1>
      </div>

      {/* Energy Card */}
      <div className="bg-card rounded-2xl p-5 mb-4 border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-3 rounded-xl bg-secondary", energyColor)}>
              <Battery className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Energía</p>
              <p className={cn("text-2xl font-bold", energyColor)}>{plan.computedEnergy}/10</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Estado</p>
            <p className="font-semibold text-primary">{plan.shouldRest ? 'Descanso' : 'Entreno'}</p>
          </div>
        </div>
      </div>

      {/* Training Card */}
      <div className="bg-card rounded-2xl p-5 mb-4 border border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Dumbbell className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Entrenamiento</h3>
        </div>
        <p className="text-foreground font-medium">{plan.training.recommendation === 'full_workout' ? 'Push Day - Pecho y Tríceps' : plan.training.recommendation}</p>
        <p className="text-sm text-muted-foreground mt-1">{plan.training.reason}</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-card rounded-xl p-4 border border-border">
          <Utensils className="w-5 h-5 text-success mb-2" />
          <p className="text-xs text-muted-foreground">Calorías</p>
          <p className="text-lg font-bold text-foreground">{plan.nutrition.dailyCalories}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <Droplets className="w-5 h-5 text-blue-400 mb-2" />
          <p className="text-xs text-muted-foreground">Hidratación</p>
          <p className="text-lg font-bold text-foreground">{plan.nutrition.hydrationTarget}ml</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <Pill className="w-5 h-5 text-purple-400 mb-2" />
          <p className="text-xs text-muted-foreground">Suplementos</p>
          <p className="text-lg font-bold text-foreground">{plan.supplements.totalSupplements}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <Moon className="w-5 h-5 text-indigo-400 mb-2" />
          <p className="text-xs text-muted-foreground">Dormir</p>
          <p className="text-lg font-bold text-foreground">23:00</p>
        </div>
      </div>

      {/* Supplements Summary */}
      <div className="bg-card rounded-2xl p-5 mb-4 border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Pill className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="font-semibold text-foreground">Suplementos</h3>
          </div>
          <span className="text-sm text-muted-foreground">{takenCount}/{totalSupplements}</span>
        </div>
        <Progress value={progressPercent} className="h-2 mb-3" />
        <div className="flex flex-wrap gap-2">
          {recommendations?.recommendations?.slice(0, 4).map((supp, i) => {
            const isTaken = logs?.some(l => l.timing === supp.timing && l.taken);
            return (
              <div 
                key={i} 
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs",
                  isTaken ? "bg-success/20 text-success" : "bg-secondary text-muted-foreground"
                )}
              >
                {isTaken && <Check className="w-3 h-3" />}
                {supp.name}
              </div>
            );
          })}
        </div>
      </div>

      {/* Priorities */}
      <div className="bg-card rounded-2xl p-5 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Prioridades del día</h3>
        </div>
        <div className="space-y-3">
          {plan.priorities.map((priority, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-secondary rounded-xl">
              <span className="text-xl">{priority.icon}</span>
              <div className="flex-1">
                <p className="font-medium text-foreground">{priority.title}</p>
                <p className="text-sm text-muted-foreground">{priority.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TodayPage;
