import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUserSchedule, useUpdateUserSchedule } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'L' },
  { id: 'tuesday', label: 'M' },
  { id: 'wednesday', label: 'X' },
  { id: 'thursday', label: 'J' },
  { id: 'friday', label: 'V' },
  { id: 'saturday', label: 'S' },
  { id: 'sunday', label: 'D' },
];

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
    }
  }, [schedule]);

  const toggleWorkoutDay = (dayId: string) => {
    setFormData((prev) => {
      const days = prev.preferred_workout_days.includes(dayId)
        ? prev.preferred_workout_days.filter((d) => d !== dayId)
        : [...prev.preferred_workout_days, dayId];
      return { ...prev, preferred_workout_days: days };
    });
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
      });
      toast({ title: 'Horarios guardados' });
      navigate('/perfil');
    } catch {
      toast({ title: 'Error', description: 'No se pudieron guardar los horarios', variant: 'destructive' });
    }
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
        <h1 className="text-xl font-bold text-foreground">Configuración Horarios</h1>
      </div>

      <div className="space-y-6">
        {/* Sleep Schedule */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h2 className="font-semibold text-foreground mb-4">Sueño</h2>
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
          <h2 className="font-semibold text-foreground mb-4">Comidas</h2>
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

        {/* Workout Schedule */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h2 className="font-semibold text-foreground mb-4">Entrenamiento</h2>
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

            <div className="space-y-2">
              <Label>Días de entreno</Label>
              <div className="flex gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleWorkoutDay(day.id)}
                    className={cn(
                      "w-10 h-10 rounded-full text-sm font-medium transition-all",
                      formData.preferred_workout_days.includes(day.id)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {day.label}
                  </button>
                ))}
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
