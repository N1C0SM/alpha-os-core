import React from 'react';
import { useProfile, useUserSchedule } from '@/hooks/useProfile';
import { Dumbbell, Loader2, Play, Moon, Sparkles, Droplets, Apple, Target } from 'lucide-react';
import { useWorkoutPlans, useStartWorkoutSession } from '@/hooks/useWorkouts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const TodayPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: schedule } = useUserSchedule();
  const { data: workoutPlans } = useWorkoutPlans();
  const startSession = useStartWorkoutSession();

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Get today's workout
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayDayName = dayNames[new Date().getDay()];
  
  const activePlan = workoutPlans?.[0];
  const todayWorkoutDay = activePlan?.workout_plan_days?.find(
    (day: any) => day.assigned_weekdays?.includes(todayDayName)
  );
  
  const isWorkoutDay = !!todayWorkoutDay;
  const hasRoutine = activePlan && activePlan.workout_plan_days?.length > 0;
  
  const workoutName = todayWorkoutDay?.name || 'Día de descanso';
  const exerciseCount = todayWorkoutDay?.workout_plan_exercises?.length || 0;

  const firstName = profile?.full_name?.split(' ')[0] || 'Atleta';
  const greeting = getGreeting();

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  const handleStartTodayWorkout = async () => {
    if (!todayWorkoutDay) {
      toast({ title: 'Hoy es día de descanso' });
      return;
    }
    try {
      const session = await startSession.mutateAsync(todayWorkoutDay.id);
      navigate(`/entreno/activo?session=${session.id}&dayId=${todayWorkoutDay.id}`);
    } catch (error) {
      toast({ title: 'Error al iniciar', variant: 'destructive' });
    }
  };

  const estimatedDuration = exerciseCount > 0 
    ? Math.round(exerciseCount * 8)
    : schedule?.workout_duration_minutes || 45;

  // Goal labels
  const goalLabels: Record<string, string> = {
    muscle_gain: 'Ganar músculo',
    fat_loss: 'Perder grasa',
    recomposition: 'Recomposición',
    maintenance: 'Mantener',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-muted-foreground text-sm">
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
        </p>
        <h1 className="text-3xl font-bold text-foreground mt-1">
          {greeting}, <span className="text-primary">{firstName}</span>
        </h1>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        
        {/* ===== TRAINING CARD ===== */}
        {!hasRoutine ? (
          <Card className="md:col-span-2 lg:col-span-2 border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
            <CardContent className="p-6 text-center">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">
                Crea tu rutina automática
              </h2>
              <p className="text-muted-foreground mb-4">
                AUTOPILOT generará un plan personalizado según tu perfil y objetivo
              </p>
              <Button onClick={() => navigate('/entreno')} size="lg">
                <Sparkles className="w-4 h-4 mr-2" />
                Crear Rutina con IA
              </Button>
            </CardContent>
          </Card>
        ) : isWorkoutDay ? (
          <Card className="md:col-span-2 lg:col-span-2 bg-primary text-primary-foreground">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Dumbbell className="w-5 h-5" />
                <span className="text-sm font-medium opacity-80">Entrenamiento de hoy</span>
              </div>
              <h2 className="text-2xl font-bold mb-1">{workoutName}</h2>
              <p className="opacity-80 text-sm mb-4">
                {exerciseCount} ejercicios • ~{estimatedDuration} min
              </p>
              <Button
                onClick={handleStartTodayWorkout}
                size="lg"
                variant="secondary"
                className="bg-background text-foreground hover:bg-background/90"
                disabled={startSession.isPending}
              >
                {startSession.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Empezar Entrenamiento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="md:col-span-2 lg:col-span-2">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-secondary">
                <Moon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Día de descanso</h2>
                <p className="text-muted-foreground">Recupera para volver más fuerte</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ===== GOAL CARD ===== */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4" />
              Objetivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-primary">
              {goalLabels[profile?.fitness_goal || 'muscle_gain']}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {profile?.weight_kg}kg • {profile?.height_cm}cm
            </p>
          </CardContent>
        </Card>

        {/* ===== NUTRITION CARD (MVP: Simple) ===== */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Apple className="w-4 h-4" />
              Nutrición hoy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Proteína</span>
                <span className="font-medium">0 / {Math.round((profile?.weight_kg || 75) * 2)}g</span>
              </div>
              <Progress value={0} className="h-2" />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => navigate('/nutricion')}
            >
              Registrar comida
            </Button>
          </CardContent>
        </Card>

        {/* ===== HYDRATION CARD ===== */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Droplets className="w-4 h-4" />
              Hidratación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground">0</span>
              <span className="text-muted-foreground">/ 3L</span>
            </div>
            <Progress value={0} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => navigate('/entreno')}>
          <Dumbbell className="w-4 h-4 mr-2" />
          Ver rutinas
        </Button>
        <Button variant="outline" onClick={() => navigate('/nutricion')}>
          <Apple className="w-4 h-4 mr-2" />
          Nutrición
        </Button>
        <Button variant="outline" onClick={() => navigate('/perfil')}>
          <Target className="w-4 h-4 mr-2" />
          Mi perfil
        </Button>
      </div>
    </div>
  );
};

export default TodayPage;
