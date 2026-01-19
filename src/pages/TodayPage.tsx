import React from 'react';
import { useProfile, useUserPreferences, useUserSchedule } from '@/hooks/useProfile';
import { generateDailyPlan } from '@/services/decision-engine';
import { getHydrationRecommendation } from '@/services/decision-engine/habit-recommendations';
import { Dumbbell, Droplets, Loader2, ChevronRight, Play, Moon, Info, Sparkles, CheckCircle2 } from 'lucide-react';
import { useWorkoutPlans, useStartWorkoutSession } from '@/hooks/useWorkouts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const TodayPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: preferences } = useUserPreferences();
  const { data: schedule } = useUserSchedule();
  const { data: workoutPlans } = useWorkoutPlans();
  const startSession = useStartWorkoutSession();

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Cargando tu día...</span>
        </div>
      </div>
    );
  }

  // AUTOPILOT: Get today's workout dynamically based on assigned_weekdays
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayDayName = dayNames[new Date().getDay()];
  
  const activePlan = workoutPlans?.[0];
  const todayWorkoutDay = activePlan?.workout_plan_days?.find(
    (day: any) => day.assigned_weekdays?.includes(todayDayName)
  );
  
  // If there's a workout day assigned for today, it's a workout day
  const isWorkoutDay = !!todayWorkoutDay;
  const hasRoutine = activePlan && activePlan.workout_plan_days?.length > 0;
  
  const workoutName = todayWorkoutDay?.name || 'Día de descanso';
  const exerciseCount = todayWorkoutDay?.workout_plan_exercises?.length || 0;

  // Get personalized hydration
  const hydration = getHydrationRecommendation(
    profile?.weight_kg || 75,
    profile?.height_cm || 175,
    profile?.fitness_goal || 'muscle_gain'
  );

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
    isWorkoutDay,
    dayOfWeek: new Date().getDay(),
    workoutDaysPerWeek: schedule?.workout_days_per_week || 4,
    hydrationProgress: 40,
    mealsCompleted: 1,
    totalMeals: 5,
    supplementsTaken: 1,
    totalSupplements: 4,
  });

  const firstName = profile?.full_name?.split(' ')[0] || 'Atleta';
  const greeting = getGreeting();

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  // AUTOPILOT: Single action - Start today's workout
  const handleStartTodayWorkout = async () => {
    if (!todayWorkoutDay) {
      toast({ title: 'Hoy es día de descanso 😴' });
      return;
    }
    try {
      const session = await startSession.mutateAsync(todayWorkoutDay.id);
      navigate(`/entreno/activo?session=${session.id}&dayId=${todayWorkoutDay.id}`);
    } catch (error) {
      toast({ title: 'Error al iniciar', variant: 'destructive' });
    }
  };

  // Estimate workout duration
  const estimatedDuration = exerciseCount > 0 
    ? Math.round(exerciseCount * 8)
    : schedule?.workout_duration_minutes || 45;

  // Get muscle focus from workout day
  const muscleFocus = todayWorkoutDay?.focus?.join(', ') || '';

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Compact Header */}
      <div className="px-5 pt-10 pb-4">
        <p className="text-muted-foreground text-xs uppercase tracking-wide">
          {format(new Date(), "EEEE, d MMM", { locale: es })}
        </p>
        <h1 className="text-2xl font-bold text-foreground mt-0.5">
          {greeting}, <span className="text-primary">{firstName}</span>
        </h1>
      </div>

      <div className="px-5 space-y-4">
        {/* ============= NO ROUTINE: Create with AI ============= */}
        {!hasRoutine && (
          <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-3xl p-6 border border-primary/30">
            <div className="text-center">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">
                Configura tu rutina automática
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                AUTOPILOT creará tu plan personalizado basado en tu perfil, objetivo y horario
              </p>
              <Button
                onClick={() => navigate('/entreno')}
                size="lg"
                className="bg-primary text-primary-foreground font-bold h-14 px-8"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Crear Rutina con IA
              </Button>
            </div>
          </div>
        )}

        {/* ============= HERO: TRAINING CARD (when routine exists) ============= */}
        {hasRoutine && isWorkoutDay && !plan.shouldRest && (
          <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 rounded-3xl p-6 shadow-xl">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Dumbbell className="w-5 h-5 text-primary-foreground/80" />
                <span className="text-primary-foreground/80 text-sm font-medium uppercase tracking-wide">
                  Tu entrenamiento de hoy
                </span>
              </div>
              
              <h2 className="text-3xl font-bold text-primary-foreground mb-2">
                {workoutName}
              </h2>
              
              {/* Duration and Focus */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-white/20 text-primary-foreground text-sm px-3 py-1 rounded-full">
                  ⏱️ ~{estimatedDuration} min
                </span>
                {muscleFocus && (
                  <span className="bg-white/20 text-primary-foreground text-sm px-3 py-1 rounded-full">
                    🎯 {muscleFocus}
                  </span>
                )}
              </div>
              
              <p className="text-primary-foreground/70 text-sm mb-6">
                {exerciseCount} ejercicios • Pesos ajustados automáticamente
              </p>
              
              {/* AUTOPILOT: Single button, no choices */}
              <Button
                onClick={handleStartTodayWorkout}
                size="lg"
                className="w-full bg-white text-primary hover:bg-white/90 font-bold text-lg h-14 rounded-xl shadow-lg"
                disabled={startSession.isPending}
              >
                {startSession.isPending ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Play className="w-5 h-5 mr-2 fill-current" />
                )}
                Entrenar Ahora
              </Button>
            </div>
          </div>
        )}

        {/* Rest Day Hero (when routine exists but it's rest day) */}
        {hasRoutine && (!isWorkoutDay || plan.shouldRest) && (
          <div className="relative overflow-hidden bg-gradient-to-br from-secondary via-secondary to-muted rounded-3xl p-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-primary/10">
                <Moon className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground">Día de descanso</h2>
                <p className="text-muted-foreground">
                  {plan.shouldRest ? 'Tu cuerpo necesita recuperarse' : 'Recupera para volver más fuerte'}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </div>
        )}

        {/* ============= HYDRATION CARD (Simple) ============= */}
        <div 
          onClick={() => navigate('/nutricion')}
          className="group bg-card hover:bg-card/80 rounded-2xl p-4 border border-border/50 cursor-pointer active:scale-[0.98] transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10">
                <Droplets className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Hidratación</h3>
                <p className="text-sm text-muted-foreground">
                  Objetivo: {hydration.dailyLiters.toFixed(1)}L de agua
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </div>

        {/* Hydration tip */}
        <div className="flex items-start gap-3 px-4 py-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-300/80">
            {hydration.tips[0]}
          </p>
        </div>

        {/* ============= PRIORITIES (Compact) ============= */}
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground text-sm px-1">Prioridades del día</h3>
          {plan.priorities.slice(0, 3).map((priority, i) => (
            <div 
              key={i} 
              className="flex items-center gap-3 p-3 bg-secondary/40 rounded-xl"
            >
              <span className="text-xl">{priority.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm">{priority.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {priority.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TodayPage;
