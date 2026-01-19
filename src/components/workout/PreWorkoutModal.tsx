import React, { useState, useMemo } from 'react';
import { Play, Flame, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export interface WarmupSet {
  setNumber: number;
  percentage: number;
  weight: number;
  reps: number;
  rest: string;
}

export interface ExerciseWarmup {
  exerciseId: string;
  exerciseName: string;
  workingWeight: number;
  warmupSets: WarmupSet[];
}

interface Exercise {
  id: string;
  exerciseId?: string; // Actual exercise ID from exercises table (for warmup lookup)
  name: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  category?: string;
  maxWeight?: number; // From exercise_max_weights
}

interface PreWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartWorkout: (includeWarmup: boolean, exerciseWarmups: ExerciseWarmup[]) => void;
  dayName: string;
  exercises: Exercise[];
  isStarting?: boolean;
}

// Progressive warmup scheme for compound movements
const WARMUP_SCHEME = [
  { percentage: 0, reps: 10, rest: '1 min' },    // Bar only / very light
  { percentage: 40, reps: 8, rest: '1 min' },    // 40% working weight
  { percentage: 55, reps: 5, rest: '1.5 min' },  // 55% working weight
  { percentage: 70, reps: 3, rest: '2 min' },    // 70% working weight
  { percentage: 85, reps: 2, rest: '2-3 min' },  // 85% working weight (last approach)
];

// Shorter warmup for isolation/accessory
const LIGHT_WARMUP_SCHEME = [
  { percentage: 50, reps: 12, rest: '30s' },
  { percentage: 70, reps: 8, rest: '1 min' },
];

// Check if exercise is compound (needs full warmup)
const isCompoundExercise = (name: string): boolean => {
  const compoundKeywords = [
    'press', 'sentadilla', 'peso muerto', 'remo', 'dominada', 'fondos',
    'squat', 'deadlift', 'bench', 'row', 'pull-up', 'dip', 'militar',
    'hip thrust', 'zancada', 'lunge', 'clean', 'snatch', 'jerk'
  ];
  const lowerName = name.toLowerCase();
  return compoundKeywords.some(keyword => lowerName.includes(keyword));
};

const generateWarmupSets = (
  workingWeight: number,
  barWeight: number,
  isCompound: boolean
): WarmupSet[] => {
  if (!workingWeight || workingWeight <= 0) return [];
  
  const scheme = isCompound ? WARMUP_SCHEME : LIGHT_WARMUP_SCHEME;
  
  return scheme.map((s, index) => {
    const calculatedWeight = s.percentage === 0 
      ? barWeight 
      : Math.round((workingWeight * s.percentage) / 100 / 2.5) * 2.5;
    
    return {
      setNumber: index + 1,
      percentage: s.percentage,
      weight: Math.max(calculatedWeight, barWeight),
      reps: s.reps,
      rest: s.rest,
    };
  });
};

const PreWorkoutModal: React.FC<PreWorkoutModalProps> = ({
  isOpen,
  onClose,
  onStartWorkout,
  dayName,
  exercises,
  isStarting = false,
}) => {
  const [includeWarmup, setIncludeWarmup] = useState(true);
  const [barWeight, setBarWeight] = useState<number>(20);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  
  // Track working weights per exercise - initialize from maxWeight if available
  const [exerciseWeights, setExerciseWeights] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    exercises.forEach(ex => {
      if (ex.maxWeight && ex.maxWeight > 0) {
        initial[ex.id] = ex.maxWeight;
      }
    });
    return initial;
  });

  // Get compound exercises that need warmup
  const compoundExercises = useMemo(() => 
    exercises.filter(ex => isCompoundExercise(ex.name)),
    [exercises]
  );

  // Generate warmups for each exercise with a weight set
  const exerciseWarmups = useMemo((): ExerciseWarmup[] => {
    return exercises
      .filter(ex => exerciseWeights[ex.id] && exerciseWeights[ex.id] > 0)
      .map(ex => ({
        exerciseId: ex.id,
        exerciseName: ex.name,
        workingWeight: exerciseWeights[ex.id],
        warmupSets: generateWarmupSets(
          exerciseWeights[ex.id],
          barWeight,
          isCompoundExercise(ex.name)
        ),
      }));
  }, [exercises, exerciseWeights, barWeight]);

  const handleStart = () => {
    onStartWorkout(includeWarmup && exerciseWarmups.length > 0, exerciseWarmups);
  };

  const updateExerciseWeight = (exerciseId: string, weight: number) => {
    setExerciseWeights(prev => ({ ...prev, [exerciseId]: weight }));
  };

  const totalWarmupSets = exerciseWarmups.reduce((acc, ew) => acc + ew.warmupSets.length, 0);

  return (
    <Dialog open={isOpen} onOpenChange={() => !isStarting && onClose()}>
      <DialogContent className="bg-card border-border max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" />
            Preparar Entreno
          </DialogTitle>
          <DialogDescription>
            {dayName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2 overflow-y-auto flex-1">
          {/* Exercises preview */}
          <div className="bg-secondary/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-2">Ejercicios programados:</p>
            <div className="space-y-1">
              {exercises.slice(0, 4).map((ex, i) => (
                <div key={ex.id} className="flex items-center justify-between">
                  <p className="text-sm text-foreground">
                    {i + 1}. {ex.name} ({ex.sets}×{ex.repsMin}-{ex.repsMax})
                  </p>
                  {isCompoundExercise(ex.name) && (
                    <span className="text-xs text-primary">compuesto</span>
                  )}
                </div>
              ))}
              {exercises.length > 4 && (
                <p className="text-xs text-muted-foreground">
                  +{exercises.length - 4} más
                </p>
              )}
            </div>
          </div>

          {/* Warmup option */}
          <div className="space-y-3">
            <div 
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                includeWarmup 
                  ? "border-primary bg-primary/5" 
                  : "border-border bg-secondary/30"
              )}
              onClick={() => setIncludeWarmup(!includeWarmup)}
            >
              <Checkbox 
                checked={includeWarmup} 
                onCheckedChange={(checked) => setIncludeWarmup(checked === true)}
              />
              <div className="flex-1">
                <p className="font-medium text-foreground">Incluir calentamiento</p>
                <p className="text-xs text-muted-foreground">
                  Series de aproximación progresivas por ejercicio
                </p>
              </div>
              <Flame className={cn("w-5 h-5", includeWarmup ? "text-primary" : "text-muted-foreground")} />
            </div>

            {includeWarmup && (
              <div className="space-y-3 pl-3 border-l-2 border-primary/30">
                {/* Bar weight setting */}
                <div className="flex items-center gap-3">
                  <label className="text-xs text-muted-foreground whitespace-nowrap">
                    Peso barra (kg):
                  </label>
                  <Input
                    type="number"
                    value={barWeight}
                    onChange={(e) => setBarWeight(Number(e.target.value) || 20)}
                    className="bg-secondary border-border w-20 h-8 text-sm"
                  />
                </div>

                {/* Info about compound exercises */}
                {compoundExercises.length > 0 && (
                  <div className="flex items-start gap-2 p-2 bg-primary/10 rounded text-xs">
                    <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">
                      Indica el peso de trabajo para generar series de aproximación en ejercicios compuestos
                    </span>
                  </div>
                )}

                {/* Per-exercise weight inputs */}
                <div className="space-y-2">
                  {exercises.map((ex) => {
                    const isCompound = isCompoundExercise(ex.name);
                    const weight = exerciseWeights[ex.id] || 0;
                    const warmups = weight > 0 
                      ? generateWarmupSets(weight, barWeight, isCompound)
                      : [];
                    const isExpanded = expandedExercise === ex.id;

                    return (
                      <div 
                        key={ex.id} 
                        className={cn(
                          "rounded-lg border transition-colors",
                          weight > 0 ? "border-primary/50 bg-primary/5" : "border-border bg-secondary/30"
                        )}
                      >
                        <div className="flex items-center gap-2 p-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{ex.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {isCompound ? '5 series aprox.' : '2 series aprox.'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              placeholder="kg"
                              value={weight || ''}
                              onChange={(e) => updateExerciseWeight(ex.id, Number(e.target.value))}
                              className="bg-background border-border w-16 h-8 text-sm"
                            />
                            {warmups.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setExpandedExercise(isExpanded ? null : ex.id)}
                                className="p-1 text-primary"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Warmup sets preview */}
                        {isExpanded && warmups.length > 0 && (
                          <div className="px-2 pb-2 space-y-1">
                            {warmups.map((set) => (
                              <div
                                key={set.setNumber}
                                className="flex items-center justify-between py-1 px-2 bg-secondary/50 rounded text-xs"
                              >
                                <span className="text-muted-foreground">
                                  {set.percentage === 0 ? 'Barra' : `${set.percentage}%`}
                                </span>
                                <span className="font-medium text-foreground">
                                  {set.weight} kg × {set.reps}
                                </span>
                                <span className="text-muted-foreground">
                                  {set.rest}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Summary */}
                {totalWarmupSets > 0 && (
                  <p className="text-xs text-primary font-medium">
                    ✓ {totalWarmupSets} series de calentamiento configuradas
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isStarting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleStart}
              disabled={isStarting}
              className="flex-1 bg-primary text-primary-foreground"
            >
              <Play className="w-4 h-4 mr-2" />
              {isStarting ? 'Iniciando...' : 'Empezar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PreWorkoutModal;
