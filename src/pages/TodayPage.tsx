import React, { useState } from 'react';
import { useProfile, useUserSchedule } from '@/hooks/useProfile';
import { Dumbbell, Loader2, Play, Moon, Sparkles, Droplets, Apple, Target, TrendingUp, Calendar } from 'lucide-react';
import { useWorkoutPlans, useWorkoutSessions, useStartWorkoutSession } from '@/hooks/useWorkouts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PageHeader, StatCard, ProgressBar, DataTable, EmptyState } from '@/components/ui/saas-components';
import { cn } from '@/lib/utils';
import { useProactiveAlerts } from '@/hooks/useProactiveAlerts';
import { ProactiveAlertsList } from '@/components/alerts/ProactiveAlertCard';
import WeeklyProgressCard from '@/components/progress/WeeklyProgressCard';

const TodayPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: schedule } = useUserSchedule();
  const { data: workoutPlans } = useWorkoutPlans();
  const { data: sessions } = useWorkoutSessions();
  const startSession = useStartWorkoutSession();
  const { alerts, isLoading: alertsLoading } = useProactiveAlerts();
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId]);
  };

  const visibleAlerts = alerts.filter(a => !dismissedAlerts.includes(a.id));

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

  // Recent sessions for table
  const recentSessions = sessions?.slice(0, 5) || [];

  // Calculate protein target
  const proteinTarget = Math.round((profile?.weight_kg || 75) * 2);

  return (
    <div className="space-y-6">
      {/* Proactive Alerts */}
      {visibleAlerts.length > 0 && (
        <ProactiveAlertsList 
          alerts={visibleAlerts} 
          onDismiss={handleDismissAlert}
        />
      )}

      <PageHeader 
        title={`Hola, ${firstName}`}
        description={format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })}
      >
        {hasRoutine && isWorkoutDay && (
          <Button onClick={handleStartTodayWorkout} disabled={startSession.isPending}>
            {startSession.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Empezar entreno
          </Button>
        )}
      </PageHeader>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          label="Objetivo"
          value={goalLabels[profile?.fitness_goal || 'muscle_gain']}
          icon={<Target className="w-5 h-5" />}
        />
        <StatCard 
          label="Peso actual"
          value={`${profile?.weight_kg || '--'} kg`}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard 
          label="Sesiones esta semana"
          value={sessions?.filter((s: any) => {
            const sessionDate = new Date(s.created_at);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return sessionDate >= weekAgo;
          }).length || 0}
          icon={<Dumbbell className="w-5 h-5" />}
        />
        <StatCard 
          label="Días de entreno/semana"
          value={`${schedule?.workout_days_per_week || 4} días`}
          icon={<Calendar className="w-5 h-5" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Training Card */}
        <div className="lg:col-span-2">
          {!hasRoutine ? (
            <div className="bg-card rounded-xl border border-border p-8">
              <EmptyState
                icon={<Sparkles className="w-8 h-8" />}
                title="Crea tu primera rutina"
                description="AUTOPILOT generará un plan personalizado basado en tu perfil, objetivo y disponibilidad"
                action={
                  <Button onClick={() => navigate('/entreno')}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Crear Rutina con IA
                  </Button>
                }
              />
            </div>
          ) : isWorkoutDay ? (
            <div className="bg-primary rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <Dumbbell className="w-5 h-5 text-primary-foreground" />
                <span className="text-sm font-medium text-primary-foreground/80">Entrenamiento de hoy</span>
              </div>
              <h2 className="text-2xl font-bold text-primary-foreground mb-1">{workoutName}</h2>
              <p className="text-primary-foreground/70 text-sm mb-6">
                {exerciseCount} ejercicios • ~{estimatedDuration} min
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleStartTodayWorkout}
                  variant="secondary"
                  className="bg-background text-foreground hover:bg-background/90"
                  disabled={startSession.isPending}
                >
                  {startSession.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  Empezar
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/entreno')}
                  className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
                >
                  Ver detalles
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border p-6 flex items-center gap-4">
              <div className="p-4 rounded-xl bg-secondary">
                <Moon className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Día de descanso</h2>
                <p className="text-muted-foreground">Recupera para volver más fuerte mañana</p>
              </div>
            </div>
          )}
        </div>

        {/* Nutrition Quick View */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Nutrición hoy</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/nutricion')}>
              Ver todo
            </Button>
          </div>
          
          <ProgressBar 
            value={0} 
            max={proteinTarget} 
            label="Proteína"
            color="primary"
          />
          
          <ProgressBar 
            value={0} 
            max={3} 
            label="Hidratación (L)"
            color="blue"
          />

          <Button variant="outline" className="w-full" onClick={() => navigate('/nutricion')}>
            <Apple className="w-4 h-4 mr-2" />
            Registrar comida
          </Button>
        </div>
        {/* Weekly Progress Card */}
        <WeeklyProgressCard 
          scheduledDaysPerWeek={schedule?.workout_days_per_week || 4}
          className="lg:col-span-1"
        />
      </div>

      {/* Recent Sessions Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Sesiones recientes</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/entreno')}>
            Ver historial completo
          </Button>
        </div>
        
        {recentSessions.length > 0 ? (
          <DataTable headers={['Fecha', 'Rutina', 'Duración', 'Estado']}>
            {recentSessions.map((session: any) => (
              <tr key={session.id} className="hover:bg-secondary/50">
                <td className="px-4 py-3 text-sm text-foreground">
                  {format(new Date(session.created_at), "d MMM, HH:mm", { locale: es })}
                </td>
                <td className="px-4 py-3 text-sm text-foreground">
                  {session.workout_plan_days?.name || 'Sesión'}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {session.duration_minutes ? `${session.duration_minutes} min` : '--'}
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    session.completed_at 
                      ? "bg-green-500/20 text-green-500" 
                      : "bg-yellow-500/20 text-yellow-500"
                  )}>
                    {session.completed_at ? 'Completada' : 'En progreso'}
                  </span>
                </td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <div className="bg-card rounded-xl border border-border p-8">
            <EmptyState
              icon={<Dumbbell className="w-8 h-8" />}
              title="Sin sesiones aún"
              description="Completa tu primer entreno para ver el historial aquí"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TodayPage;
