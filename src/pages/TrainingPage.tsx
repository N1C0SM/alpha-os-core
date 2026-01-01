import React, { useState } from 'react';
import { Dumbbell, Play, History, Plus, Loader2, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWorkoutPlans, useCreateWorkoutPlan, useExercises, useCreateWorkoutDay, useAddExerciseToPlan } from '@/hooks/useWorkouts';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const TrainingPage: React.FC = () => {
  const [isNewPlanOpen, setIsNewPlanOpen] = useState(false);
  const [isAddDayOpen, setIsAddDayOpen] = useState(false);
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  
  const [newPlan, setNewPlan] = useState({ name: '', split_type: 'push_pull_legs' as const });
  const [newDay, setNewDay] = useState({ name: '', day_number: 1 });
  const [selectedExerciseId, setSelectedExerciseId] = useState('');

  const { data: workoutPlans, isLoading } = useWorkoutPlans();
  const { data: exercises } = useExercises();
  const createPlan = useCreateWorkoutPlan();
  const createDay = useCreateWorkoutDay();
  const addExercise = useAddExerciseToPlan();
  const { toast } = useToast();

  const handleCreatePlan = async () => {
    if (!newPlan.name.trim()) return;
    try {
      const plan = await createPlan.mutateAsync(newPlan);
      setSelectedPlanId(plan.id);
      setNewPlan({ name: '', split_type: 'push_pull_legs' });
      setIsNewPlanOpen(false);
      toast({ title: 'Rutina creada', description: newPlan.name });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo crear la rutina', variant: 'destructive' });
    }
  };

  const handleCreateDay = async () => {
    if (!newDay.name.trim() || !selectedPlanId) return;
    try {
      const day = await createDay.mutateAsync({
        workout_plan_id: selectedPlanId,
        name: newDay.name,
        day_number: newDay.day_number,
      });
      setSelectedDayId(day.id);
      setNewDay({ name: '', day_number: newDay.day_number + 1 });
      setIsAddDayOpen(false);
      toast({ title: 'Día añadido', description: newDay.name });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo añadir el día', variant: 'destructive' });
    }
  };

  const handleAddExercise = async () => {
    if (!selectedExerciseId || !selectedDayId) return;
    try {
      await addExercise.mutateAsync({
        workout_plan_day_id: selectedDayId,
        exercise_id: selectedExerciseId,
      });
      setSelectedExerciseId('');
      setIsAddExerciseOpen(false);
      toast({ title: 'Ejercicio añadido' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo añadir el ejercicio', variant: 'destructive' });
    }
  };

  const activePlan = workoutPlans?.find(p => p.id === selectedPlanId) || workoutPlans?.[0];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 safe-top">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Entrenamiento</h1>
        <Dialog open={isNewPlanOpen} onOpenChange={setIsNewPlanOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="bg-primary text-primary-foreground rounded-full">
              <Plus className="w-5 h-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Nueva rutina</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Nombre de la rutina"
                value={newPlan.name}
                onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                className="bg-secondary border-border"
              />
              <Select 
                value={newPlan.split_type} 
                onValueChange={(v: typeof newPlan.split_type) => setNewPlan({ ...newPlan, split_type: v })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="push_pull_legs">Push/Pull/Legs</SelectItem>
                  <SelectItem value="upper_lower">Upper/Lower</SelectItem>
                  <SelectItem value="full_body">Full Body</SelectItem>
                  <SelectItem value="bro_split">Bro Split</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleCreatePlan} 
                className="w-full bg-primary text-primary-foreground"
                disabled={!newPlan.name.trim() || createPlan.isPending}
              >
                {createPlan.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear rutina'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plan Selector */}
      {workoutPlans && workoutPlans.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
          {workoutPlans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                activePlan?.id === plan.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              {plan.name}
            </button>
          ))}
        </div>
      )}

      {activePlan ? (
        <>
          {/* Active Plan */}
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-5 mb-6 border border-primary/30">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xl font-bold text-foreground">{activePlan.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {activePlan.days_per_week} días/semana • {activePlan.split_type?.replace('_', ' ')}
                </p>
              </div>
              <Button className="bg-primary text-primary-foreground rounded-full w-12 h-12">
                <Play className="w-5 h-5 ml-0.5" />
              </Button>
            </div>
          </div>

          {/* Days */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Días de entreno</h3>
            <Dialog open={isAddDayOpen} onOpenChange={setIsAddDayOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-primary">
                  <Plus className="w-4 h-4 mr-1" /> Día
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Añadir día</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    placeholder="Nombre del día (ej: Push Day)"
                    value={newDay.name}
                    onChange={(e) => setNewDay({ ...newDay, name: e.target.value })}
                    className="bg-secondary border-border"
                  />
                  <Input
                    type="number"
                    placeholder="Número de día"
                    value={newDay.day_number}
                    onChange={(e) => setNewDay({ ...newDay, day_number: Number(e.target.value) })}
                    className="bg-secondary border-border"
                    min={1}
                    max={7}
                  />
                  <Button 
                    onClick={handleCreateDay} 
                    className="w-full bg-primary text-primary-foreground"
                    disabled={!newDay.name.trim() || createDay.isPending}
                  >
                    {createDay.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Añadir día'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {activePlan.workout_plan_days && activePlan.workout_plan_days.length > 0 ? (
            <div className="space-y-3 mb-6">
              {activePlan.workout_plan_days
                .sort((a, b) => a.day_number - b.day_number)
                .map((day) => (
                <div key={day.id} className="bg-card rounded-xl p-4 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                        {day.day_number}
                      </div>
                      <span className="font-medium text-foreground">{day.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedDayId(day.id);
                        setIsAddExerciseOpen(true);
                      }}
                      className="text-primary"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {day.workout_plan_exercises && day.workout_plan_exercises.length > 0 ? (
                    <div className="space-y-2 pl-11">
                      {day.workout_plan_exercises.map((ex, i) => (
                        <div key={ex.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {ex.exercises?.name_es || ex.exercises?.name}
                          </span>
                          <span className="text-primary font-medium">
                            {ex.sets}×{ex.reps_min}-{ex.reps_max}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground pl-11">Sin ejercicios</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 mb-6">
              <p className="text-muted-foreground">Añade días a tu rutina</p>
            </div>
          )}

          {/* Add Exercise Dialog */}
          <Dialog open={isAddExerciseOpen} onOpenChange={setIsAddExerciseOpen}>
            <DialogContent className="bg-card border-border max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Añadir ejercicio</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Selecciona ejercicio" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {exercises?.map((ex) => (
                      <SelectItem key={ex.id} value={ex.id}>
                        {ex.name_es || ex.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleAddExercise} 
                  className="w-full bg-primary text-primary-foreground"
                  disabled={!selectedExerciseId || addExercise.isPending}
                >
                  {addExercise.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Añadir ejercicio'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <div className="text-center py-12">
          <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No tienes rutinas de entrenamiento</p>
          <Button onClick={() => setIsNewPlanOpen(true)} className="bg-primary text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Crear primera rutina
          </Button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="h-14 border-border">
          <History className="w-5 h-5 mr-2" />
          Historial
        </Button>
        <Button variant="outline" className="h-14 border-border">
          <Dumbbell className="w-5 h-5 mr-2" />
          Ejercicios
        </Button>
      </div>
    </div>
  );
};

export default TrainingPage;
