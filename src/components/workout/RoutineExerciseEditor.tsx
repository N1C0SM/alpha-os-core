import React, { useState } from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import ExerciseImage from './ExerciseImage';

interface RoutineExerciseEditorProps {
  exerciseId: string;
  planExerciseId: string;
  name: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
  onUpdate: (updates: { sets?: number; repsMin?: number; repsMax?: number; restSeconds?: number }) => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

const RoutineExerciseEditor: React.FC<RoutineExerciseEditorProps> = ({
  exerciseId,
  planExerciseId,
  name,
  sets,
  repsMin,
  repsMax,
  restSeconds,
  onUpdate,
  onDelete,
  isDeleting,
}) => {
  const [localSets, setLocalSets] = useState(sets);
  const [localRepsMin, setLocalRepsMin] = useState(repsMin);
  const [localRepsMax, setLocalRepsMax] = useState(repsMax);
  const [localRest, setLocalRest] = useState(restSeconds);

  const handleSetsChange = (delta: number) => {
    const newSets = Math.max(1, Math.min(10, localSets + delta));
    setLocalSets(newSets);
    onUpdate({ sets: newSets });
  };

  const handleRepsMinChange = (value: string) => {
    const num = parseInt(value) || 1;
    setLocalRepsMin(num);
    onUpdate({ repsMin: num });
  };

  const handleRepsMaxChange = (value: string) => {
    const num = parseInt(value) || 1;
    setLocalRepsMax(num);
    onUpdate({ repsMax: num });
  };

  const handleRestChange = (delta: number) => {
    const newRest = Math.max(30, Math.min(300, localRest + delta));
    setLocalRest(newRest);
    onUpdate({ restSeconds: newRest });
  };

  const formatRest = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden p-4">
      {/* Exercise header with image - like active workout */}
      <div className="flex items-center gap-3 mb-3">
        <ExerciseImage exerciseName={name} size="md" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{name}</h3>
          <p className="text-xs text-muted-foreground">
            {localSets} series • {localRepsMin}-{localRepsMax} reps • {formatRest(localRest)}
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="text-destructive h-8 w-8"
          onClick={onDelete}
          disabled={isDeleting}
          aria-label="Eliminar ejercicio"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Table header - matching active workout style */}
      <div className="grid grid-cols-[44px_1fr_1fr_1fr] gap-2 text-[10px] text-muted-foreground px-1 mb-2">
        <span className="text-center">SET</span>
        <span className="text-center">SERIES</span>
        <span className="text-center">REPS</span>
        <span className="text-center">DESC</span>
      </div>

      {/* Single editable row */}
      <div className="grid grid-cols-[44px_1fr_1fr_1fr] gap-2 items-center py-2 px-1 rounded-lg bg-secondary/50">
        {/* Set indicator */}
        <div className="h-10 w-10 rounded-lg mx-auto flex items-center justify-center bg-secondary">
          <span className="text-sm font-bold text-foreground">×</span>
        </div>
        
        {/* Sets control */}
        <div className="flex items-center justify-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 bg-background"
            onClick={() => handleSetsChange(-1)}
            disabled={localSets <= 1}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <span className="w-8 text-center font-bold text-foreground">{localSets}</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 bg-background"
            onClick={() => handleSetsChange(1)}
            disabled={localSets >= 10}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        {/* Reps range */}
        <div className="flex items-center justify-center gap-1">
          <Input
            type="number"
            inputMode="numeric"
            value={localRepsMin}
            onChange={(e) => handleRepsMinChange(e.target.value)}
            className="w-10 h-10 text-center text-sm font-semibold bg-background border-0 rounded-lg p-0"
            min={1}
            max={50}
          />
          <span className="text-muted-foreground text-xs">-</span>
          <Input
            type="number"
            inputMode="numeric"
            value={localRepsMax}
            onChange={(e) => handleRepsMaxChange(e.target.value)}
            className="w-10 h-10 text-center text-sm font-semibold bg-background border-0 rounded-lg p-0"
            min={1}
            max={50}
          />
        </div>

        {/* Rest control */}
        <div className="flex items-center justify-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 bg-background"
            onClick={() => handleRestChange(-15)}
            disabled={localRest <= 30}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <span className="w-10 text-center text-xs font-semibold text-foreground">{formatRest(localRest)}</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 bg-background"
            onClick={() => handleRestChange(15)}
            disabled={localRest >= 300}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoutineExerciseEditor;
