import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Play, Plus, Loader2, ChevronRight, Trash2, Calendar, Clock, PencilLine, Check, X, Sparkles, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useWorkoutPlans,
  useCreateWorkoutPlan,
  useExercises,
  useCreateWorkoutDay,
  useAddExerciseToPlan,
  useWorkoutSessions,
  useStartWorkoutSession,
  useDeleteWorkoutDay,
  useUpdateWorkoutDay,
  useDeleteWorkoutPlanExercise,
  useDeleteWorkoutPlan,
} from '@/hooks/useWorkouts';
import { useProfile, useUserSchedule } from '@/hooks/useProfile';
import { routineDecision } from '@/services/decision-engine/routine-decision';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const WEEKDAYS = [
  { id: 'monday', name: 'Lunes', short: 'L' },
  { id: 'tuesday', name: 'Martes', short: 'M' },
  { id: 'wednesday', name: 'Miércoles', short: 'X' },
  { id: 'thursday', name: 'Jueves', short: 'J' },
  { id: 'friday', name: 'Viernes', short: 'V' },
  { id: 'saturday', name: 'Sábado', short: 'S' },
  { id: 'sunday', name: 'Domingo', short: 'D' },
];

const MUSCLE_GROUPS = [
  { id: 'chest', name: 'Pecho' },
  { id: 'back', name: 'Espalda' },
  { id: 'shoulders', name: 'Hombros' },
  { id: 'biceps', name: 'Bíceps' },
  { id: 'triceps', name: 'Tríceps' },
  { id: 'quadriceps', name: 'Cuádriceps' },
  { id: 'hamstrings', name: 'Isquios' },
  { id: 'glutes', name: 'Glúteos' },
  { id: 'calves', name: 'Gemelos' },
  { id: 'core', name: 'Core' },
];

const TrainingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'routines' | 'history'>('routines');
  const [isNewRoutineOpen, setIsNewRoutineOpen] = useState(false);
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [viewingRoutine, setViewingRoutine] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [editingDayName, setEditingDayName] = useState('');

  const [newRoutineName, setNewRoutineName] = useState('');
  const [newDayName, setNewDayName] = useState('');
  const [searchExercise, setSearchExercise] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  const { data: workoutPlans, isLoading } = useWorkoutPlans();
  const { data: exercises } = useExercises();
  const { data: sessions } = useWorkoutSessions();
  const { data: profile } = useProfile();
  const { data: schedule } = useUserSchedule();
  const createPlan = useCreateWorkoutPlan();
  const createDay = useCreateWorkoutDay();
  const addExercise = useAddExerciseToPlan();
  const startSession = useStartWorkoutSession();
  const updateDay = useUpdateWorkoutDay();
  const deleteDay = useDeleteWorkoutDay();
  const deletePlanExercise = useDeleteWorkoutPlanExercise();
  const deletePlan = useDeleteWorkoutPlan();
  const { toast } = useToast();

  const handleStartEmptyWorkout = async () => {
    try {
      const session = await startSession.mutateAsync(undefined);
      navigate(`/entreno/activo?session=${session.id}`);
    } catch (error) {
      toast({ title: 'Error al iniciar', variant: 'destructive' });
    }
  };

  const handleCreateRoutine = async () => {
    if (!newRoutineName.trim()) return;
    try {
      const plan = await createPlan.mutateAsync({ name: newRoutineName, split_type: 'custom' });
      setNewRoutineName('');
      setIsNewRoutineOpen(false);
      setViewingRoutine(plan.id);
      toast({ title: 'Rutina creada' });
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleGenerateRoutine = async () => {
    if (!profile) {
      toast({ title: 'Configura tu perfil primero', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    try {
      const daysPerWeek = schedule?.preferred_workout_days?.length || schedule?.workout_days_per_week || 4;
      const recommendation = routineDecision({
        fitnessGoal: (profile.fitness_goal as 'muscle_gain' | 'fat_loss' | 'recomposition' | 'maintenance') || 'muscle_gain',
        experienceLevel: (profile.experience_level as 'beginner' | 'intermediate' | 'advanced') || 'intermediate',
        daysPerWeek,
      });

      // Create the plan
      const plan = await createPlan.mutateAsync({
        name: recommendation.name,
        description: recommendation.description,
        split_type: recommendation.splitType,
        days_per_week: daysPerWeek,
      });

      // Create days with exercises
      for (let i = 0; i < recommendation.days.length; i++) {
        const dayData = recommendation.days[i];
        const day = await createDay.mutateAsync({
          workout_plan_id: plan.id,
          name: dayData.name,
          day_number: i + 1,
          focus: dayData.focus as any[],
        });

        // Find matching exercises from DB and add them
        for (const ex of dayData.exercises) {
          const matchingExercise = exercises?.find(
            e => e.name_es?.toLowerCase().includes(ex.name.toLowerCase().split(' ')[0]) ||
                 e.name?.toLowerCase().includes(ex.name.toLowerCase().split(' ')[0])
          );
          
          if (matchingExercise) {
            await addExercise.mutateAsync({
              workout_plan_day_id: day.id,
              exercise_id: matchingExercise.id,
              sets: ex.sets,
              reps_min: ex.repsMin,
              reps_max: ex.repsMax,
            });
          }
        }
      }

      setIsNewRoutineOpen(false);
      setViewingRoutine(plan.id);
      toast({ title: '¡Rutina personalizada creada!', description: recommendation.description });
    } catch (error) {
      console.error('Error generating routine:', error);
      toast({ title: 'Error al generar rutina', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddDay = async (routineId: string) => {
    if (!newDayName.trim()) return;
    const routine = workoutPlans?.find(p => p.id === routineId);
    const dayNumber = (routine?.workout_plan_days?.length || 0) + 1;

    try {
      await createDay.mutateAsync({
        workout_plan_id: routineId,
        name: newDayName,
        day_number: dayNumber,
      });
      setNewDayName('');
      toast({ title: 'Día añadido' });
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleAddExercise = async (exerciseId: string) => {
    if (!selectedDayId) return;
    try {
      await addExercise.mutateAsync({
        workout_plan_day_id: selectedDayId,
        exercise_id: exerciseId,
      });
      toast({ title: 'Ejercicio añadido' });
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleStartEditDay = (dayId: string, currentName: string) => {
    setEditingDayId(dayId);
    setEditingDayName(currentName);
  };

  const handleCancelEditDay = () => {
    setEditingDayId(null);
    setEditingDayName('');
  };

  const handleSaveDayName = async () => {
    if (!editingDayId) return;
    if (!editingDayName.trim()) return;

    try {
      await updateDay.mutateAsync({ dayId: editingDayId, name: editingDayName.trim() });
      toast({ title: 'Día actualizado' });
      handleCancelEditDay();
    } catch {
      toast({ title: 'Error', description: 'No se pudo actualizar el día', variant: 'destructive' });
    }
  };

  const handleDeleteDay = async (dayId: string) => {
    try {
      await deleteDay.mutateAsync({ dayId });
      toast({ title: 'Día eliminado' });
      if (selectedDayId === dayId) setSelectedDayId(null);
      if (editingDayId === dayId) handleCancelEditDay();
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar el día', variant: 'destructive' });
    }
  };

  const handleDeleteExerciseFromDay = async (planExerciseId: string) => {
    try {
      await deletePlanExercise.mutateAsync({ planExerciseId });
      toast({ title: 'Ejercicio eliminado' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar el ejercicio', variant: 'destructive' });
    }
  };

  const handleDeleteRoutine = async (planId: string) => {
    try {
      await deletePlan.mutateAsync({ planId });
      toast({ title: 'Rutina eliminada' });
      setViewingRoutine(null);
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar la rutina', variant: 'destructive' });
    }
  };

  const currentRoutine = workoutPlans?.find(p => p.id === viewingRoutine);

  const filteredExercises = useMemo(() => {
    return exercises?.filter(ex => {
      const matchesSearch = !searchExercise ||
        ex.name_es?.toLowerCase().includes(searchExercise.toLowerCase()) ||
        ex.name?.toLowerCase().includes(searchExercise.toLowerCase());
      const matchesMuscle = !selectedMuscle || ex.primary_muscle === selectedMuscle;
      return matchesSearch && matchesMuscle;
    });
  }, [exercises, searchExercise, selectedMuscle]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Viewing a specific routine
  if (currentRoutine) {
    return (
      <div className="px-4 py-6 safe-top">
        <div className="flex items-center gap-3 mb-6">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setViewingRoutine(null)}
            className="text-muted-foreground"
          >
            ← Atrás
          </Button>
        </div>
        
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{currentRoutine.name}</h1>
            <p className="text-sm text-muted-foreground">
              {currentRoutine.workout_plan_days?.length || 0} días de entreno
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={() => handleDeleteRoutine(currentRoutine.id)}
            disabled={deletePlan.isPending}
            aria-label="Eliminar rutina"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>

        {/* Days list */}
        <div className="space-y-3 mb-6">
          {currentRoutine.workout_plan_days?.sort((a, b) => a.day_number - b.day_number).map((day) => {
            const isEditing = editingDayId === day.id;

            return (
              <div key={day.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingDayName}
                          onChange={(e) => setEditingDayName(e.target.value)}
                          className="bg-secondary border-border"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-primary"
                          onClick={handleSaveDayName}
                          disabled={updateDay.isPending || !editingDayName.trim()}
                          aria-label="Guardar nombre del día"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleCancelEditDay}
                          aria-label="Cancelar edición"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate">{day.name}</h3>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleStartEditDay(day.id, day.name)}
                          aria-label="Editar día"
                        >
                          <PencilLine className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleDeleteDay(day.id)}
                          disabled={deleteDay.isPending}
                          aria-label="Eliminar día"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-primary"
                    onClick={() => {
                      setSelectedDayId(day.id);
                      setIsAddExerciseOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ejercicio
                  </Button>
                </div>

                {/* Weekday assignment */}
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  <Select
                    value={(day as any).assigned_weekday || 'none'}
                    onValueChange={(value) => {
                      updateDay.mutate({ 
                        dayId: day.id, 
                        assignedWeekday: value === 'none' ? null : value 
                      });
                    }}
                  >
                    <SelectTrigger className="h-8 w-auto bg-secondary border-border text-sm">
                      <SelectValue placeholder="Asignar día" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      {WEEKDAYS.map((wd) => (
                        <SelectItem key={wd.id} value={wd.id}>
                          {wd.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(day as any).assigned_weekday && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                      {WEEKDAYS.find(w => w.id === (day as any).assigned_weekday)?.name}
                    </span>
                  )}
                </div>

                {day.workout_plan_exercises && day.workout_plan_exercises.length > 0 ? (
                  <div className="space-y-2">
                    {day.workout_plan_exercises.map((ex) => (
                      <div key={ex.id} className="flex items-center justify-between gap-3 py-2 px-3 bg-secondary/50 rounded-lg">
                        <div className="min-w-0">
                          <p className="text-sm text-foreground truncate">
                            {ex.exercises?.name_es || ex.exercises?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {ex.sets} × {ex.reps_min}-{ex.reps_max}
                          </p>
                        </div>

                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleDeleteExerciseFromDay(ex.id)}
                          disabled={deletePlanExercise.isPending}
                          aria-label="Eliminar ejercicio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin ejercicios</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Add new day */}
        <div className="bg-card rounded-xl border border-dashed border-border p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nombre del día (ej: Pecho y Tríceps)"
              value={newDayName}
              onChange={(e) => setNewDayName(e.target.value)}
              className="bg-secondary border-border"
            />
            <Button 
              onClick={() => handleAddDay(currentRoutine.id)}
              disabled={!newDayName.trim() || createDay.isPending}
              className="bg-primary text-primary-foreground shrink-0"
            >
              {createDay.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Add Exercise Dialog */}
        <Dialog open={isAddExerciseOpen} onOpenChange={setIsAddExerciseOpen}>
          <DialogContent className="bg-card border-border max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Añadir ejercicio</DialogTitle>
              <DialogDescription>Busca y selecciona ejercicios</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3 pt-2">
              <Input
                placeholder="Buscar ejercicio..."
                value={searchExercise}
                onChange={(e) => setSearchExercise(e.target.value)}
                className="bg-secondary border-border"
              />
              
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  onClick={() => setSelectedMuscle(null)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                    !selectedMuscle ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  )}
                >
                  Todos
                </button>
                {MUSCLE_GROUPS.map((muscle) => (
                  <button
                    key={muscle.id}
                    onClick={() => setSelectedMuscle(muscle.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                      selectedMuscle === muscle.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {muscle.name}
                  </button>
                ))}
              </div>
            </div>
            
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-2 py-2">
                {filteredExercises?.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => handleAddExercise(ex.id)}
                    disabled={addExercise.isPending}
                    className="w-full flex items-center justify-between p-3 bg-secondary/50 hover:bg-secondary rounded-lg transition-colors text-left"
                  >
                    <div>
                      <span className="text-sm font-medium text-foreground">
                        {ex.name_es || ex.name}
                      </span>
                      <p className="text-xs text-muted-foreground capitalize">
                        {MUSCLE_GROUPS.find(m => m.id === ex.primary_muscle)?.name || ex.primary_muscle}
                      </p>
                    </div>
                    <Plus className="w-4 h-4 text-primary" />
                  </button>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Main view
  return (
    <div className="px-4 py-6 safe-top">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Entrenamiento</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary rounded-xl mb-6">
        <button
          onClick={() => setActiveTab('routines')}
          className={cn(
            "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
            activeTab === 'routines' 
              ? "bg-card text-foreground shadow-sm" 
              : "text-muted-foreground"
          )}
        >
          Mis Rutinas
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
            activeTab === 'history' 
              ? "bg-card text-foreground shadow-sm" 
              : "text-muted-foreground"
          )}
        >
          Historial
        </button>
      </div>

      {activeTab === 'routines' && (
        <>
          {/* Quick start */}
          <Button 
            className="w-full h-14 bg-primary text-primary-foreground mb-6 text-base font-semibold"
            onClick={handleStartEmptyWorkout}
            disabled={startSession.isPending}
          >
            <Play className="w-5 h-5 mr-2" />
            {startSession.isPending ? 'Iniciando...' : 'Empezar Entreno Vacío'}
          </Button>

          {/* Routines list */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground">Rutinas</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary"
              onClick={() => setIsNewRoutineOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Nueva
            </Button>
          </div>

          {workoutPlans && workoutPlans.length > 0 ? (
            <div className="space-y-3">
              {workoutPlans.map((routine) => (
                <button
                  key={routine.id}
                  onClick={() => setViewingRoutine(routine.id)}
                  className="w-full bg-card rounded-xl border border-border p-4 text-left hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{routine.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {routine.workout_plan_days?.length || 0} días
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-dashed border-border">
              <Dumbbell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No tienes rutinas</p>
              <Button onClick={() => setIsNewRoutineOpen(true)} className="bg-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Crear Rutina
              </Button>
            </div>
          )}
        </>
      )}

      {activeTab === 'history' && (
        <>
          {sessions && sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground">
                      {session.workout_plan_days?.name || 'Entreno libre'}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {new Date(session.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {session.duration_minutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {session.duration_minutes} min
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-dashed border-border">
              <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Sin entrenos registrados</p>
            </div>
          )}
        </>
      )}

      {/* New Routine Dialog */}
      <Dialog open={isNewRoutineOpen} onOpenChange={setIsNewRoutineOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Nueva Rutina</DialogTitle>
            <DialogDescription>Crea una rutina personalizada o genera una basada en tu objetivo</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Generate personalized routine button */}
            <Button 
              onClick={handleGenerateRoutine}
              variant="outline"
              className="w-full h-14 border-primary/50 hover:bg-primary/10 text-foreground"
              disabled={isGenerating || !profile}
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-5 h-5 mr-2 text-primary" />
              )}
              <div className="text-left">
                <span className="font-semibold">Generar Rutina Personalizada</span>
                <p className="text-xs text-muted-foreground">
                  Basada en tu objetivo: {profile?.fitness_goal === 'muscle_gain' ? 'Ganar músculo' : 
                    profile?.fitness_goal === 'fat_loss' ? 'Perder grasa' : 
                    profile?.fitness_goal === 'recomposition' ? 'Recomposición' : 'Mantenimiento'}
                </p>
              </div>
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">o crear manual</span>
              </div>
            </div>

            <Input
              placeholder="Nombre de la rutina..."
              value={newRoutineName}
              onChange={(e) => setNewRoutineName(e.target.value)}
              className="bg-secondary border-border"
            />
            <Button 
              onClick={handleCreateRoutine} 
              className="w-full bg-primary text-primary-foreground"
              disabled={!newRoutineName.trim() || createPlan.isPending}
            >
              {createPlan.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear Rutina Vacía'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainingPage;
