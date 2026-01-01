import React, { useState } from 'react';
import { Dumbbell, Play, History, Plus, Loader2, ChevronDown, ChevronUp, Sparkles, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useWorkoutPlans, useCreateWorkoutPlan, useExercises, useCreateWorkoutDay, useAddExerciseToPlan } from '@/hooks/useWorkouts';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const MUSCLE_GROUPS = [
  { id: 'chest', name: 'Pecho' },
  { id: 'back', name: 'Espalda' },
  { id: 'shoulders', name: 'Hombros' },
  { id: 'biceps', name: 'Bíceps' },
  { id: 'triceps', name: 'Tríceps' },
  { id: 'quadriceps', name: 'Cuádriceps' },
  { id: 'hamstrings', name: 'Isquiotibiales' },
  { id: 'glutes', name: 'Glúteos' },
  { id: 'calves', name: 'Gemelos' },
  { id: 'core', name: 'Core' },
];

const ROUTINE_TEMPLATES = [
  {
    id: 'push_pull_legs',
    name: 'Push / Pull / Legs',
    description: '6 días, 2 ciclos por semana',
    days: ['Push (Pecho, Hombro, Tríceps)', 'Pull (Espalda, Bíceps)', 'Legs (Pierna)'],
  },
  {
    id: 'upper_lower',
    name: 'Upper / Lower',
    description: '4 días, tren superior e inferior',
    days: ['Upper (Tren Superior)', 'Lower (Tren Inferior)', 'Upper (Tren Superior)', 'Lower (Tren Inferior)'],
  },
  {
    id: 'full_body',
    name: 'Full Body',
    description: '3 días, cuerpo completo',
    days: ['Full Body A', 'Full Body B', 'Full Body C'],
  },
  {
    id: 'bro_split',
    name: 'Bro Split',
    description: '5 días, un músculo por día',
    days: ['Pecho', 'Espalda', 'Hombros', 'Brazos', 'Pierna'],
  },
];

type CreateMode = 'select' | 'custom' | 'template';

const TrainingPage: React.FC = () => {
  const [isNewPlanOpen, setIsNewPlanOpen] = useState(false);
  const [createMode, setCreateMode] = useState<CreateMode>('select');
  const [isAddDayOpen, setIsAddDayOpen] = useState(false);
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [expandedDayId, setExpandedDayId] = useState<string | null>(null);
  
  const [newPlanName, setNewPlanName] = useState('');
  const [newDayName, setNewDayName] = useState('');
  const [searchExercise, setSearchExercise] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);

  const { data: workoutPlans, isLoading } = useWorkoutPlans();
  const { data: exercises } = useExercises();
  const createPlan = useCreateWorkoutPlan();
  const createDay = useCreateWorkoutDay();
  const addExercise = useAddExerciseToPlan();
  const { toast } = useToast();

  const handleCreateCustomPlan = async () => {
    if (!newPlanName.trim()) return;
    try {
      const plan = await createPlan.mutateAsync({ name: newPlanName, split_type: 'custom' });
      setSelectedPlanId(plan.id);
      setNewPlanName('');
      resetDialog();
      toast({ title: 'Rutina creada', description: newPlanName });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo crear la rutina', variant: 'destructive' });
    }
  };

  const handleCreateFromTemplate = async (template: typeof ROUTINE_TEMPLATES[0]) => {
    setIsCreatingTemplate(true);
    try {
      const plan = await createPlan.mutateAsync({ 
        name: template.name, 
        split_type: template.id as 'push_pull_legs' | 'upper_lower' | 'full_body' | 'bro_split',
        days_per_week: template.days.length
      });
      
      // Create all days for the template
      for (let i = 0; i < template.days.length; i++) {
        await createDay.mutateAsync({
          workout_plan_id: plan.id,
          name: template.days[i],
          day_number: i + 1,
        });
      }
      
      setSelectedPlanId(plan.id);
      resetDialog();
      toast({ title: 'Rutina creada', description: `${template.name} con ${template.days.length} días` });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo crear la rutina', variant: 'destructive' });
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  const resetDialog = () => {
    setIsNewPlanOpen(false);
    setCreateMode('select');
    setNewPlanName('');
  };

  const handleCreateDay = async () => {
    if (!newDayName.trim() || !selectedPlanId) return;
    const plan = workoutPlans?.find(p => p.id === selectedPlanId);
    const dayNumber = (plan?.workout_plan_days?.length || 0) + 1;
    
    try {
      const day = await createDay.mutateAsync({
        workout_plan_id: selectedPlanId,
        name: newDayName,
        day_number: dayNumber,
      });
      setNewDayName('');
      setIsAddDayOpen(false);
      setExpandedDayId(day.id);
      toast({ title: 'Día añadido' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo añadir el día', variant: 'destructive' });
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
      toast({ title: 'Error', description: 'No se pudo añadir el ejercicio', variant: 'destructive' });
    }
  };

  const activePlan = workoutPlans?.find(p => p.id === selectedPlanId) || workoutPlans?.[0];

  const filteredExercises = exercises?.filter(ex => {
    const matchesSearch = !searchExercise || 
      (ex.name_es?.toLowerCase().includes(searchExercise.toLowerCase())) ||
      (ex.name?.toLowerCase().includes(searchExercise.toLowerCase()));
    const matchesMuscle = !selectedMuscle || ex.primary_muscle === selectedMuscle;
    return matchesSearch && matchesMuscle;
  });

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
        <Button 
          size="icon" 
          className="bg-primary text-primary-foreground rounded-full"
          onClick={() => setIsNewPlanOpen(true)}
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* New Plan Dialog */}
      <Dialog open={isNewPlanOpen} onOpenChange={(open) => {
        if (!open) resetDialog();
        else setIsNewPlanOpen(true);
      }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Nueva rutina</DialogTitle>
            <DialogDescription>
              {createMode === 'select' && 'Elige cómo crear tu rutina'}
              {createMode === 'custom' && 'Escribe el nombre de tu rutina'}
              {createMode === 'template' && 'Selecciona una plantilla'}
            </DialogDescription>
          </DialogHeader>
          
          {createMode === 'select' && (
            <div className="grid grid-cols-2 gap-3 pt-4">
              <button
                onClick={() => setCreateMode('template')}
                className="flex flex-col items-center gap-3 p-5 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors border border-border"
              >
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">Plantilla</p>
                  <p className="text-xs text-muted-foreground">PPL, Upper/Lower...</p>
                </div>
              </button>
              
              <button
                onClick={() => setCreateMode('custom')}
                className="flex flex-col items-center gap-3 p-5 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors border border-border"
              >
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <PenLine className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">Personalizada</p>
                  <p className="text-xs text-muted-foreground">Crea desde cero</p>
                </div>
              </button>
            </div>
          )}
          
          {createMode === 'custom' && (
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Nombre de la rutina"
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                className="bg-secondary border-border"
                autoFocus
              />
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setCreateMode('select')}
                  className="flex-1"
                >
                  Atrás
                </Button>
                <Button 
                  onClick={handleCreateCustomPlan} 
                  className="flex-1 bg-primary text-primary-foreground"
                  disabled={!newPlanName.trim() || createPlan.isPending}
                >
                  {createPlan.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear'}
                </Button>
              </div>
            </div>
          )}
          
          {createMode === 'template' && (
            <div className="space-y-3 pt-4">
              {ROUTINE_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleCreateFromTemplate(template)}
                  disabled={isCreatingTemplate}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors border border-border text-left disabled:opacity-50"
                >
                  <div>
                    <p className="font-medium text-foreground">{template.name}</p>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </div>
                  {isCreatingTemplate ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  ) : (
                    <Plus className="w-5 h-5 text-primary" />
                  )}
                </button>
              ))}
              <Button 
                variant="outline"
                onClick={() => setCreateMode('select')}
                className="w-full mt-2"
              >
                Atrás
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
          {/* Active Plan Header */}
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-5 mb-6 border border-primary/30">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">{activePlan.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {activePlan.workout_plan_days?.length || 0} días
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
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary"
              onClick={() => setIsAddDayOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1" /> Añadir día
            </Button>
          </div>

          {/* Add Day Dialog */}
          <Dialog open={isAddDayOpen} onOpenChange={setIsAddDayOpen}>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Añadir día</DialogTitle>
                <DialogDescription>Añade un nuevo día a tu rutina</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="Nombre del día (ej: Push, Pull, Pierna...)"
                  value={newDayName}
                  onChange={(e) => setNewDayName(e.target.value)}
                  className="bg-secondary border-border"
                  autoFocus
                />
                <Button 
                  onClick={handleCreateDay} 
                  className="w-full bg-primary text-primary-foreground"
                  disabled={!newDayName.trim() || createDay.isPending}
                >
                  {createDay.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Añadir día'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {activePlan.workout_plan_days && activePlan.workout_plan_days.length > 0 ? (
            <div className="space-y-3 mb-6">
              {activePlan.workout_plan_days
                .sort((a, b) => a.day_number - b.day_number)
                .map((day) => (
                <div key={day.id} className="bg-card rounded-xl border border-border overflow-hidden">
                  <button
                    onClick={() => setExpandedDayId(expandedDayId === day.id ? null : day.id)}
                    className="w-full p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                        {day.day_number}
                      </div>
                      <div className="text-left">
                        <span className="font-medium text-foreground">{day.name}</span>
                        <p className="text-xs text-muted-foreground">
                          {day.workout_plan_exercises?.length || 0} ejercicios
                        </p>
                      </div>
                    </div>
                    {expandedDayId === day.id ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                  
                  {expandedDayId === day.id && (
                    <div className="px-4 pb-4 border-t border-border pt-3">
                      {day.workout_plan_exercises && day.workout_plan_exercises.length > 0 ? (
                        <div className="space-y-2 mb-3">
                          {day.workout_plan_exercises.map((ex) => (
                            <div key={ex.id} className="flex items-center justify-between py-2 px-3 bg-secondary/50 rounded-lg">
                              <span className="text-sm text-foreground">
                                {ex.exercises?.name_es || ex.exercises?.name}
                              </span>
                              <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded">
                                {ex.sets}×{ex.reps_min}-{ex.reps_max}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mb-3">Sin ejercicios aún</p>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-dashed border-primary/50 text-primary hover:bg-primary/10"
                        onClick={() => {
                          setSelectedDayId(day.id);
                          setIsAddExerciseOpen(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Añadir ejercicio
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 mb-6 bg-card rounded-xl border border-dashed border-border">
              <p className="text-muted-foreground mb-3">Tu rutina está vacía</p>
              <Button 
                variant="outline" 
                onClick={() => setIsAddDayOpen(true)}
                className="border-primary/50 text-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Añadir primer día
              </Button>
            </div>
          )}

          {/* Add Exercise Dialog */}
          <Dialog open={isAddExerciseOpen} onOpenChange={setIsAddExerciseOpen}>
            <DialogContent className="bg-card border-border max-h-[85vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Añadir ejercicio</DialogTitle>
                <DialogDescription>Selecciona un ejercicio para añadir</DialogDescription>
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
                          {ex.primary_muscle?.replace('_', ' ')}
                        </p>
                      </div>
                      <Plus className="w-4 h-4 text-primary" />
                    </button>
                  ))}
                  
                  {filteredExercises?.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No se encontraron ejercicios
                    </p>
                  )}
                </div>
              </ScrollArea>
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
