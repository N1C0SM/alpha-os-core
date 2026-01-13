import React, { useState } from 'react';
import { Droplets, Moon, Clock, Dumbbell, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PostWorkoutSummaryProps {
  durationMinutes: number;
  exerciseCount: number;
  totalSets: number;
  fitnessGoal: 'muscle_gain' | 'fat_loss' | 'recomposition' | 'maintenance';
  bodyWeightKg: number;
  onClose: () => void;
  onSaveFeedback?: (completed: boolean, feeling: 'good' | 'normal' | 'bad') => void;
  newPRs?: number;
  workoutName?: string;
}

type FeelingType = 'good' | 'normal' | 'bad';

const PostWorkoutSummary: React.FC<PostWorkoutSummaryProps> = ({
  durationMinutes,
  exerciseCount,
  totalSets,
  onClose,
  onSaveFeedback,
}) => {
  const [feedbackStep, setFeedbackStep] = useState<'questions' | 'summary'>('questions');
  const [completed, setCompleted] = useState<boolean | null>(null);
  const [feeling, setFeeling] = useState<FeelingType | null>(null);

  const handleContinue = () => {
    if (completed !== null && feeling !== null) {
      onSaveFeedback?.(completed, feeling);
      setFeedbackStep('summary');
    }
  };

  const handleFinish = () => {
    onClose();
  };

  // Feedback questions step
  if (feedbackStep === 'questions') {
    return (
      <div className="min-h-screen bg-background px-4 py-6 safe-top safe-bottom flex flex-col">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">¿Cómo fue el entreno?</h1>
          <p className="text-muted-foreground">Tus respuestas ajustarán futuros entrenos</p>
        </div>

        <div className="flex-1 space-y-8">
          {/* Question 1: Completed? */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">¿Completaste el entreno?</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: true, label: 'Sí, completo', emoji: '✅' },
                { value: false, label: 'Parcial', emoji: '⚡' },
              ].map((option) => (
                <button
                  key={String(option.value)}
                  onClick={() => setCompleted(option.value)}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all text-center',
                    completed === option.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-secondary hover:border-primary/50'
                  )}
                >
                  <span className="text-2xl block mb-1">{option.emoji}</span>
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Question 2: How did you feel? */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">¿Cómo te sentiste?</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'good' as FeelingType, label: 'Bien', emoji: '😊', color: 'bg-success/10 border-success' },
                { value: 'normal' as FeelingType, label: 'Normal', emoji: '😐', color: 'bg-warning/10 border-warning' },
                { value: 'bad' as FeelingType, label: 'Mal', emoji: '😓', color: 'bg-destructive/10 border-destructive' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFeeling(option.value)}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all text-center',
                    feeling === option.value
                      ? option.color
                      : 'border-border bg-secondary hover:border-primary/50'
                  )}
                >
                  <span className="text-3xl block mb-1">{option.emoji}</span>
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Continue button */}
        <Button
          onClick={handleContinue}
          disabled={completed === null || feeling === null}
          className="w-full h-14 bg-primary text-primary-foreground text-base font-semibold mt-6"
        >
          Continuar
        </Button>
      </div>
    );
  }

  // Summary step - Simple recovery tips (no macros)
  return (
    <div className="min-h-screen bg-background px-4 py-6 safe-top safe-bottom">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">¡Entreno Completado!</h1>
        <p className="text-muted-foreground">
          Buen trabajo, tu cuerpo te lo agradecerá
        </p>
      </div>

      {/* Workout Stats */}
      <div className="bg-card rounded-2xl p-4 border border-border mb-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-foreground">{durationMinutes}</p>
            <p className="text-xs text-muted-foreground">minutos</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <Dumbbell className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-foreground">{exerciseCount}</p>
            <p className="text-xs text-muted-foreground">ejercicios</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <TrendingUp className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-foreground">{totalSets}</p>
            <p className="text-xs text-muted-foreground">series</p>
          </div>
        </div>
      </div>

      {/* Hydration Reminder - Simple */}
      <div className="bg-card rounded-2xl p-4 border border-border mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Droplets className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Hidrátate</h2>
            <p className="text-sm text-muted-foreground">
              Bebe agua para reponer lo perdido durante el entreno
            </p>
          </div>
        </div>
      </div>

      {/* Recovery - Simple */}
      <div className="bg-card rounded-2xl p-4 border border-border mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <Moon className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Descansa bien</h2>
            <p className="text-sm text-muted-foreground">
              El músculo crece cuando descansas. Duerme 7-8 horas esta noche.
            </p>
          </div>
        </div>
      </div>

      {/* Motivational message based on feeling */}
      <div className="bg-primary/10 rounded-2xl p-4 border border-primary/20 mb-6">
        <p className="text-center text-foreground">
          {feeling === 'good' && '💪 ¡Genial! Sigue así, la consistencia es la clave.'}
          {feeling === 'normal' && '👍 Buen trabajo. No todos los días son perfectos, pero viniste.'}
          {feeling === 'bad' && '🙏 Lo importante es que lo hiciste. Mañana será mejor.'}
        </p>
      </div>

      {/* Action button */}
      <Button 
        onClick={handleFinish}
        className="w-full h-14 bg-primary text-primary-foreground text-base font-semibold"
      >
        ¡Entendido!
      </Button>
    </div>
  );
};

export default PostWorkoutSummary;
