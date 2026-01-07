import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUserSchedule, useUpdateUserSchedule } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ExternalActivityType,
  ExternalActivity,
  WeeklyExternalActivities,
  ACTIVITY_LABELS,
} from '@/types/schedule';

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Lunes', short: 'L' },
  { id: 'tuesday', label: 'Martes', short: 'M' },
  { id: 'wednesday', label: 'Miércoles', short: 'X' },
  { id: 'thursday', label: 'Jueves', short: 'J' },
  { id: 'friday', label: 'Viernes', short: 'V' },
  { id: 'saturday', label: 'Sábado', short: 'S' },
  { id: 'sunday', label: 'Domingo', short: 'D' },
];

const ACTIVITY_OPTIONS = Object.entries(ACTIVITY_LABELS).map(([value, { label, emoji }]) => ({
  value: value as ExternalActivityType,
  label: `${emoji} ${label}`,
}));

const SchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const { data: schedule, isLoading } = useUserSchedule();
  const updateSchedule = useUpdateUserSchedule();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    wake_time: '07:00',
    sleep_time: '23:00',
    breakfast_time: '08:00',
    lunch_time: '13:00',
    dinner_time: '20:00',
    workout_time: '18:00',
    workout_duration_minutes: 60,
    preferred_workout_days: ['monday', 'tuesday', 'thursday', 'friday'] as string[],
  });

  const [externalActivities, setExternalActivities] = useState<WeeklyExternalActivities>({});
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  useEffect(() => {
    if (schedule) {
      setFormData({
        wake_time: schedule.wake_time?.slice(0, 5) || '07:00',
        sleep_time: schedule.sleep_time?.slice(0, 5) || '23:00',
        breakfast_time: schedule.breakfast_time?.slice(0, 5) || '08:00',
        lunch_time: schedule.lunch_time?.slice(0, 5) || '13:00',
        dinner_time: schedule.dinner_time?.slice(0, 5) || '20:00',
        workout_time: schedule.workout_time?.slice(0, 5) || '18:00',
        workout_duration_minutes: schedule.workout_duration_minutes || 60,
        preferred_workout_days: schedule.preferred_workout_days || ['monday', 'tuesday', 'thursday', 'friday'],
      });
      
      // Parse external activities from JSONB
      if (schedule.external_activities && typeof schedule.external_activities === 'object' && !Array.isArray(schedule.external_activities)) {
        setExternalActivities(schedule.external_activities as unknown as WeeklyExternalActivities);
      }
    }
  }, [schedule]);

  const toggleWorkoutDay = (dayId: string) => {
    // Don't allow gym on days with external activities
    if (externalActivities[dayId]) {
      toast({
        title: 'Día ocupado',
        description: 'Ya tienes una actividad externa este día. Elimínala primero.',
        variant: 'destructive',
      });
      return;
    }
    
    setFormData((prev) => {
      const days = prev.preferred_workout_days.includes(dayId)
        ? prev.preferred_workout_days.filter((d) => d !== dayId)
        : [...prev.preferred_workout_days, dayId];
      return { ...prev, preferred_workout_days: days };
    });
  };

  const addExternalActivity = (dayId: string, activity: ExternalActivityType) => {
    // Remove from workout days if it was selected
    setFormData((prev) => ({
      ...prev,
      preferred_workout_days: prev.preferred_workout_days.filter((d) => d !== dayId),
    }));
    
    setExternalActivities((prev) => ({
      ...prev,
      [dayId]: {
        activity,
        time: '18:00',
        duration: 60,
      },
    }));
    setExpandedDay(dayId);
  };

  const updateExternalActivity = (dayId: string, updates: Partial<ExternalActivity>) => {
    setExternalActivities((prev) => ({
      ...prev,
      [dayId]: prev[dayId] ? { ...prev[dayId]!, ...updates } : null,
    }));
  };

  const removeExternalActivity = (dayId: string) => {
    setExternalActivities((prev) => {
      const newActivities = { ...prev };
      delete newActivities[dayId];
      return newActivities;
    });
    setExpandedDay(null);
  };

  const handleSave = async () => {
    try {
      await updateSchedule.mutateAsync({
        wake_time: formData.wake_time + ':00',
        sleep_time: formData.sleep_time + ':00',
        breakfast_time: formData.breakfast_time + ':00',
        lunch_time: formData.lunch_time + ':00',
        dinner_time: formData.dinner_time + ':00',
        workout_time: formData.workout_time + ':00',
        workout_duration_minutes: formData.workout_duration_minutes,
        workout_days_per_week: formData.preferred_workout_days.length,
        preferred_workout_days: formData.preferred_workout_days,
        external_activities: externalActivities as any,
      });
      toast({ title: 'Horarios guardados' });
      navigate('/perfil');
    } catch {
      toast({ title: 'Error', description: 'No se pudieron guardar los horarios', variant: 'destructive' });
    }
  };

  const getDayStatus = (dayId: string) => {
    if (externalActivities[dayId]) {
      const activity = externalActivities[dayId]!;
      const activityInfo = ACTIVITY_LABELS[activity.activity];
      return { type: 'external' as const, label: activityInfo.emoji, fullLabel: activityInfo.label };
    }
    if (formData.preferred_workout_days.includes(dayId)) {
      return { type: 'gym' as const, label: '🏋️', fullLabel: 'Gym' };
    }
    return { type: 'rest' as const, label: '😴', fullLabel: 'Descanso' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 safe-top pb-28">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/perfil')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Mi Horario Semanal</h1>
      </div>

      <div className="space-y-6">
        {/* Weekly Overview */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h2 className="font-semibold text-foreground mb-4">📅 Semana</h2>
          <div className="flex gap-1 justify-between mb-4">
            {DAYS_OF_WEEK.map((day) => {
              const status = getDayStatus(day.id);
              return (
                <div 
                  key={day.id}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg flex-1 transition-all",
                    status.type === 'gym' && "bg-primary/10 border border-primary/30",
                    status.type === 'external' && "bg-accent/10 border border-accent/30",
                    status.type === 'rest' && "bg-muted"
                  )}
                >
                  <span className="text-xs font-medium text-muted-foreground">{day.short}</span>
                  <span className="text-lg">{status.label}</span>
                </div>
              );
            })}
          </div>
          
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>🏋️ Gym ({formData.preferred_workout_days.length})</span>
            <span>🎯 Actividades ({Object.keys(externalActivities).length})</span>
            <span>😴 Descanso ({7 - formData.preferred_workout_days.length - Object.keys(externalActivities).length})</span>
          </div>
        </div>

        {/* Day-by-Day Configuration */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h2 className="font-semibold text-foreground mb-4">🗓️ Configurar por día</h2>
          <div className="space-y-2">
            {DAYS_OF_WEEK.map((day) => {
              const status = getDayStatus(day.id);
              const activity = externalActivities[day.id];
              
              return (
                <Collapsible 
                  key={day.id}
                  open={expandedDay === day.id}
                  onOpenChange={(open) => setExpandedDay(open ? day.id : null)}
                >
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{status.label}</span>
                        <span className="font-medium text-foreground">{day.label}</span>
                        <span className="text-sm text-muted-foreground">
                          {status.fullLabel}
                          {activity && ` • ${activity.time} • ${activity.duration}min`}
                        </span>
                      </div>
                      <ChevronDown className={cn(
                        "w-4 h-4 text-muted-foreground transition-transform",
                        expandedDay === day.id && "rotate-180"
                      )} />
                    </button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="pt-2">
                    <div className="p-4 rounded-lg bg-muted/50 space-y-4">
                      {/* Activity Type Selection */}
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant={status.type === 'gym' ? 'default' : 'outline'}
                          onClick={() => {
                            removeExternalActivity(day.id);
                            if (!formData.preferred_workout_days.includes(day.id)) {
                              toggleWorkoutDay(day.id);
                            }
                          }}
                        >
                          🏋️ Gym
                        </Button>
                        <Button
                          size="sm"
                          variant={status.type === 'rest' && !activity ? 'default' : 'outline'}
                          onClick={() => {
                            removeExternalActivity(day.id);
                            if (formData.preferred_workout_days.includes(day.id)) {
                              toggleWorkoutDay(day.id);
                            }
                          }}
                        >
                          😴 Descanso
                        </Button>
                      </div>

                      {/* External Activity Selector */}
                      <div className="space-y-2">
                        <Label className="text-sm">O elige una actividad externa:</Label>
                        <Select
                          value={activity?.activity || ''}
                          onValueChange={(value) => addExternalActivity(day.id, value as ExternalActivityType)}
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Seleccionar actividad..." />
                          </SelectTrigger>
                          <SelectContent>
                            {ACTIVITY_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Activity Details */}
                      {activity && (
                        <div className="space-y-3 pt-2 border-t border-border">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Hora</Label>
                              <Input
                                type="time"
                                value={activity.time}
                                onChange={(e) => updateExternalActivity(day.id, { time: e.target.value })}
                                className="bg-background"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Duración (min)</Label>
                              <Input
                                type="number"
                                value={activity.duration}
                                onChange={(e) => updateExternalActivity(day.id, { duration: parseInt(e.target.value) || 60 })}
                                className="bg-background"
                              />
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="w-full"
                            onClick={() => removeExternalActivity(day.id)}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Quitar actividad
                          </Button>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </div>

        {/* Sleep Schedule */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h2 className="font-semibold text-foreground mb-4">😴 Sueño</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wake_time">Despertar</Label>
              <Input
                id="wake_time"
                type="time"
                value={formData.wake_time}
                onChange={(e) => setFormData({ ...formData, wake_time: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sleep_time">Dormir</Label>
              <Input
                id="sleep_time"
                type="time"
                value={formData.sleep_time}
                onChange={(e) => setFormData({ ...formData, sleep_time: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
          </div>
        </div>

        {/* Meals Schedule */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h2 className="font-semibold text-foreground mb-4">🍽️ Comidas</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="breakfast_time">Desayuno</Label>
                <Input
                  id="breakfast_time"
                  type="time"
                  value={formData.breakfast_time}
                  onChange={(e) => setFormData({ ...formData, breakfast_time: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lunch_time">Almuerzo</Label>
                <Input
                  id="lunch_time"
                  type="time"
                  value={formData.lunch_time}
                  onChange={(e) => setFormData({ ...formData, lunch_time: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dinner_time">Cena</Label>
              <Input
                id="dinner_time"
                type="time"
                value={formData.dinner_time}
                onChange={(e) => setFormData({ ...formData, dinner_time: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
          </div>
        </div>

        {/* Gym Schedule */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h2 className="font-semibold text-foreground mb-4">🏋️ Entreno en Gym</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workout_time">Hora de entreno</Label>
                <Input
                  id="workout_time"
                  type="time"
                  value={formData.workout_time}
                  onChange={(e) => setFormData({ ...formData, workout_time: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workout_duration">Duración (min)</Label>
                <Input
                  id="workout_duration"
                  type="number"
                  value={formData.workout_duration_minutes}
                  onChange={(e) => setFormData({ ...formData, workout_duration_minutes: parseInt(e.target.value) || 60 })}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={updateSchedule.isPending}
          className="w-full h-12 bg-primary text-primary-foreground"
        >
          {updateSchedule.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar horarios'}
        </Button>
      </div>
    </div>
  );
};

export default SchedulePage;
