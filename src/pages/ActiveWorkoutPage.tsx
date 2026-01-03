import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, X, Check, Trash2, Clock, Dumbbell, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useExercises, useLogExercise, useCompleteWorkoutSession } from '@/hooks/useWorkouts';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import PostWorkoutSummary from '@/components/workout/PostWorkoutSummary';

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

interface WorkoutExercise {
  id: string;
  exerciseId: string;
  name: string;
  sets: SetData[];
  isExpanded: boolean;
}

interface SetData {
  id: string;
  weight: string;
  reps: string;
  completed: boolean;
}

const ActiveWorkoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [startTime] = useState(() => new Date());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [searchExercise, setSearchExercise] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [showPostWorkout, setShowPostWorkout] = useState(false);
  const [workoutDuration, setWorkoutDuration] = useState(0);

  const { data: allExercises } = useExercises();
  const { data: profile } = useProfile();
  const logExercise = useLogExercise();
  const completeSession = useCompleteWorkoutSession();
  const { toast } = useToast();

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredExercises = useMemo(() => {
    return allExercises?.filter(ex => {
      const matchesSearch = !searchExercise ||
        ex.name_es?.toLowerCase().includes(searchExercise.toLowerCase()) ||
        ex.name?.toLowerCase().includes(searchExercise.toLowerCase());
      const matchesMuscle = !selectedMuscle || ex.primary_muscle === selectedMuscle;
      return matchesSearch && matchesMuscle;
    });
  }, [allExercises, searchExercise, selectedMuscle]);

  const handleAddExercise = (exercise: { id: string; name: string; name_es?: string | null }) => {
    const newExercise: WorkoutExercise = {
      id: crypto.randomUUID(),
      exerciseId: exercise.id,
      name: exercise.name_es || exercise.name,
      sets: [{ id: crypto.randomUUID(), weight: '', reps: '', completed: false }],
      isExpanded: true,
    };
    setExercises(prev => [...prev, newExercise]);
    setIsAddExerciseOpen(false);
    setSearchExercise('');
    setSelectedMuscle(null);
  };

  const handleAddSet = (exerciseIdx: number) => {
    setExercises(prev => {
      const updated = [...prev];
      const lastSet = updated[exerciseIdx].sets[updated[exerciseIdx].sets.length - 1];
      updated[exerciseIdx].sets.push({
        id: crypto.randomUUID(),
        weight: lastSet?.weight || '',
        reps: lastSet?.reps || '',
        completed: false,
      });
      return updated;
    });
  };

  const handleRemoveSet = (exerciseIdx: number, setIdx: number) => {
    setExercises(prev => {
      const updated = [...prev];
      if (updated[exerciseIdx].sets.length > 1) {
        updated[exerciseIdx].sets.splice(setIdx, 1);
      }
      return updated;
    });
  };

  const handleSetChange = (exerciseIdx: number, setIdx: number, field: 'weight' | 'reps', value: string) => {
    setExercises(prev => {
      const updated = [...prev];
      updated[exerciseIdx].sets[setIdx][field] = value;
      return updated;
    });
  };

  const handleToggleSetComplete = (exerciseIdx: number, setIdx: number) => {
    setExercises(prev => {
      const updated = [...prev];
      updated[exerciseIdx].sets[setIdx].completed = !updated[exerciseIdx].sets[setIdx].completed;
      return updated;
    });
  };

  const handleToggleExpand = (exerciseIdx: number) => {
    setExercises(prev => {
      const updated = [...prev];
      updated[exerciseIdx].isExpanded = !updated[exerciseIdx].isExpanded;
      return updated;
    });
  };

  const handleRemoveExercise = (exerciseIdx: number) => {
    setExercises(prev => prev.filter((_, i) => i !== exerciseIdx));
  };

  const handleFinishWorkout = async () => {
    if (!sessionId) {
      toast({ title: 'Error', description: 'No hay sesión activa', variant: 'destructive' });
      return;
    }

    try {
      // Log all completed sets
      for (const exercise of exercises) {
        for (let i = 0; i < exercise.sets.length; i++) {
          const set = exercise.sets[i];
          if (set.completed && (set.weight || set.reps)) {
            await logExercise.mutateAsync({
              workout_session_id: sessionId,
              exercise_id: exercise.exerciseId,
              set_number: i + 1,
              weight_kg: set.weight ? parseFloat(set.weight) : undefined,
              reps_completed: set.reps ? parseInt(set.reps) : undefined,
            });
          }
        }
      }

      // Complete the session
      await completeSession.mutateAsync({ sessionId });
      
      // Save duration and show post-workout summary
      setWorkoutDuration(Math.floor(elapsedTime / 60));
      setShowPostWorkout(true);
    } catch (error) {
      toast({ title: 'Error al guardar', variant: 'destructive' });
    }
  };

  const handleCancelWorkout = () => {
    navigate('/entreno');
  };

  const handleClosePostWorkout = () => {
    toast({ title: '¡Entreno completado!' });
    navigate('/entreno');
  };

  const totalCompletedSets = exercises.reduce(
    (acc, ex) => acc + ex.sets.filter(s => s.completed).length,
    0
  );

  // Show post-workout summary
  if (showPostWorkout) {
    return (
      <PostWorkoutSummary
        durationMinutes={workoutDuration}
        exerciseCount={exercises.length}
        totalSets={totalCompletedSets}
        fitnessGoal={(profile?.fitness_goal as 'muscle_gain' | 'fat_loss' | 'recomposition' | 'maintenance') || 'muscle_gain'}
        bodyWeightKg={profile?.weight_kg || 75}
        onClose={handleClosePostWorkout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 safe-top">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsCancelDialogOpen(true)}
            className="text-muted-foreground"
          >
            Cancelar
          </Button>
          
          <div className="flex items-center gap-2 text-foreground">
            <Clock className="w-4 h-4" />
            <span className="font-mono text-lg font-semibold">{formatTime(elapsedTime)}</span>
          </div>
          
          <Button 
            size="sm"
            onClick={handleFinishWorkout}
            disabled={completeSession.isPending}
            className="bg-primary text-primary-foreground"
          >
            Finalizar
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="px-4 py-2 bg-card border-b border-border flex items-center justify-around text-center">
        <div>
          <p className="text-2xl font-bold text-foreground">{exercises.length}</p>
          <p className="text-xs text-muted-foreground">Ejercicios</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{totalCompletedSets}</p>
          <p className="text-xs text-muted-foreground">Series</p>
        </div>
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-auto px-4 py-4 pb-24">
        {exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Dumbbell className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">No hay ejercicios aún</p>
            <Button onClick={() => setIsAddExerciseOpen(true)} className="bg-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Añadir ejercicio
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {exercises.map((exercise, exerciseIdx) => (
              <div key={exercise.id} className="bg-card rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => handleToggleExpand(exerciseIdx)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{exercise.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {exercise.sets.filter(s => s.completed).length}/{exercise.sets.length} series
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveExercise(exerciseIdx);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    {exercise.isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {exercise.isExpanded && (
                  <div className="px-4 pb-4 space-y-2">
                    {/* Header */}
                    <div className="grid grid-cols-[40px_1fr_1fr_40px] gap-2 text-xs text-muted-foreground px-1">
                      <span>Set</span>
                      <span>Kg</span>
                      <span>Reps</span>
                      <span></span>
                    </div>

                    {/* Sets */}
                    {exercise.sets.map((set, setIdx) => (
                      <div 
                        key={set.id} 
                        className={cn(
                          "grid grid-cols-[40px_1fr_1fr_40px] gap-2 items-center",
                          set.completed && "opacity-60"
                        )}
                      >
                        <span className="text-sm font-medium text-foreground text-center">{setIdx + 1}</span>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          value={set.weight}
                          onChange={(e) => handleSetChange(exerciseIdx, setIdx, 'weight', e.target.value)}
                          className="h-10 text-center bg-secondary border-border"
                        />
                        <Input
                          type="number"
                          inputMode="numeric"
                          placeholder="0"
                          value={set.reps}
                          onChange={(e) => handleSetChange(exerciseIdx, setIdx, 'reps', e.target.value)}
                          className="h-10 text-center bg-secondary border-border"
                        />
                        <Button
                          size="icon"
                          variant={set.completed ? "default" : "outline"}
                          className={cn(
                            "h-10 w-10",
                            set.completed && "bg-primary text-primary-foreground"
                          )}
                          onClick={() => handleToggleSetComplete(exerciseIdx, setIdx)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}

                    {/* Add/Remove set buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleAddSet(exerciseIdx)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Serie
                      </Button>
                      {exercise.sets.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveSet(exerciseIdx, exercise.sets.length - 1)}
                          className="text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating add button */}
      {exercises.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 safe-bottom">
          <Button 
            onClick={() => setIsAddExerciseOpen(true)}
            className="w-full h-12 bg-primary text-primary-foreground shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Añadir ejercicio
          </Button>
        </div>
      )}

      {/* Add Exercise Dialog */}
      <Dialog open={isAddExerciseOpen} onOpenChange={setIsAddExerciseOpen}>
        <DialogContent className="bg-card border-border max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Añadir ejercicio</DialogTitle>
            <DialogDescription>Busca y selecciona un ejercicio</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 pt-2">
            <Input
              placeholder="Buscar ejercicio..."
              value={searchExercise}
              onChange={(e) => setSearchExercise(e.target.value)}
              className="bg-secondary border-border"
              autoFocus
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
                  onClick={() => handleAddExercise(ex)}
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

      {/* Cancel Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>¿Cancelar entreno?</DialogTitle>
            <DialogDescription>
              Se perderán todos los datos de esta sesión.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setIsCancelDialogOpen(false)}
            >
              Continuar
            </Button>
            <Button 
              variant="destructive" 
              className="flex-1"
              onClick={handleCancelWorkout}
            >
              Cancelar entreno
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActiveWorkoutPage;
