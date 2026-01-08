import React from 'react';
import { useProfile, useUserPreferences, useUserSchedule } from '@/hooks/useProfile';
import { generateDailyPlan } from '@/services/decision-engine';
import { Battery, Dumbbell, Utensils, Droplets, Pill, Moon, Star, Loader2, Check, ChevronRight, Zap, Target, TrendingUp } from 'lucide-react';
import { useSupplementRecommendations, useSupplementLogs } from '@/hooks/useSupplements';
import { useWorkoutPlans } from '@/hooks/useWorkouts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const TodayPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: preferences } = useUserPreferences();
  const { data: schedule } = useUserSchedule();
  const { data: workoutPlans } = useWorkoutPlans();
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: recommendations } = useSupplementRecommendations();
  const { data: logs } = useSupplementLogs(today);

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

  const takenCount = logs?.filter(l => l.taken)?.length || 0;
  const totalSupplements = recommendations?.recommendations?.length || 0;
  const progressPercent = totalSupplements > 0 ? (takenCount / totalSupplements) * 100 : 0;

  // Get today's workout from active plan based on assigned_weekdays (array)
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayDayName = dayNames[new Date().getDay()];
  
  const activePlan = workoutPlans?.[0];
  const todayWorkoutDay = activePlan?.workout_plan_days?.find(
    (day: any) => day.assigned_weekdays?.includes(todayDayName)
  );
  
  const preferredDays = schedule?.preferred_workout_days || ['monday', 'tuesday', 'thursday', 'friday'];
  const isWorkoutDay = todayWorkoutDay ? true : preferredDays.includes(todayDayName);
  
  const workoutName = todayWorkoutDay?.name || (isWorkoutDay ? 'Entrenamiento' : 'Día de descanso');

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

  const energyColor = plan.computedEnergy >= 7 ? 'text-success' : plan.computedEnergy >= 4 ? 'text-warning' : 'text-destructive';
  const energyBgColor = plan.computedEnergy >= 7 ? 'bg-success/20' : plan.computedEnergy >= 4 ? 'bg-warning/20' : 'bg-destructive/20';

  const firstName = profile?.full_name?.split(' ')[0] || 'Atleta';
  const greeting = getGreeting();

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header with gradient */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-primary/3 to-transparent pointer-events-none" />
        
        <div className="px-5 pt-12 pb-6 relative">
          <p className="text-muted-foreground text-sm capitalize">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
          </p>
          <h1 className="text-3xl font-bold text-foreground mt-1">
            {greeting}, <span className="text-primary">{firstName}</span>
          </h1>
        </div>
      </div>

      <div className="px-5 space-y-4">
        {/* Energy Card - Hero style */}
        <div className="relative overflow-hidden bg-gradient-to-br from-card via-card to-secondary/30 rounded-3xl p-6 border border-border/50 shadow-lg">
          {/* Decorative glow */}
          <div className={cn("absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-40", energyBgColor)} />
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn("p-4 rounded-2xl", energyBgColor)}>
                <Battery className={cn("w-7 h-7", energyColor)} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Nivel de energía</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className={cn("text-4xl font-bold tracking-tight", energyColor)}>
                    {plan.computedEnergy}
                  </span>
                  <span className="text-lg text-muted-foreground">/10</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold",
                plan.shouldRest 
                  ? "bg-secondary text-muted-foreground" 
                  : "bg-primary/20 text-primary"
              )}>
                {plan.shouldRest ? (
                  <>
                    <Moon className="w-4 h-4" />
                    Descanso
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Entreno
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Training Card */}
        <div 
          onClick={() => navigate('/entreno')}
          className="group bg-card hover:bg-card/80 rounded-2xl p-5 border border-border/50 cursor-pointer active:scale-[0.98] transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10">
                <Dumbbell className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg">{workoutName}</h3>
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                  {isWorkoutDay ? plan.training.reason : 'Recupera para volver más fuerte'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
          { icon: Utensils, label: 'Calorías', value: plan.nutrition.dailyCalories.toLocaleString(), color: 'text-success', bg: 'bg-success/10' },
          { icon: Droplets, label: 'Hidratación', value: `${(plan.nutrition.hydrationTarget / 1000).toFixed(1)}L`, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { icon: Target, label: 'Proteína', value: `${plan.nutrition.protein}g`, color: 'text-purple-400', bg: 'bg-purple-400/10' },
          { icon: Moon, label: 'Dormir', value: '23:00', color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-2xl p-4 border border-border/50">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", stat.bg)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Supplements Summary */}
        <div 
          onClick={() => navigate('/nutricion')}
          className="group bg-card hover:bg-card/80 rounded-2xl p-5 border border-border/50 cursor-pointer active:scale-[0.98] transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10">
                <Pill className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Suplementos</h3>
                <p className="text-xs text-muted-foreground">{takenCount} de {totalSupplements} tomados</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
          
          <Progress value={progressPercent} className="h-2 mb-4" />
          
          <div className="flex flex-wrap gap-2">
            {recommendations?.recommendations?.slice(0, 4).map((supp, i) => {
              const isTaken = logs?.some(l => l.timing === supp.timing && l.taken);
              return (
                <div 
                  key={i} 
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                    isTaken 
                      ? "bg-success/20 text-success" 
                      : "bg-secondary/80 text-muted-foreground"
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
        <div className="bg-card rounded-2xl p-5 border border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Prioridades del día</h3>
          </div>
          
          <div className="space-y-3">
            {plan.priorities.map((priority, i) => (
              <div 
                key={i} 
                className="flex items-start gap-4 p-4 bg-secondary/50 hover:bg-secondary/70 rounded-xl transition-colors"
              >
                <span className="text-2xl">{priority.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{priority.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                    {priority.description}
                  </p>
                </div>
                <TrendingUp className="w-4 h-4 text-muted-foreground/50 flex-shrink-0 mt-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodayPage;