import React, { useState } from 'react';
import { Droplets, Utensils, Pill, Moon, ExternalLink, Clock, Dumbbell, TrendingUp, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { recoveryDecision } from '@/services/decision-engine/recovery-decision';
import ShareWorkoutModal from './ShareWorkoutModal';
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
  fitnessGoal,
  bodyWeightKg,
  onClose,
  onSaveFeedback,
  newPRs = 0,
  workoutName,
}) => {
  const [showShare, setShowShare] = useState(false);
  const [feedbackStep, setFeedbackStep] = useState<'questions' | 'summary'>('questions');
  const [completed, setCompleted] = useState<boolean | null>(null);
  const [feeling, setFeeling] = useState<FeelingType | null>(null);

  const recommendations = recoveryDecision({
    workoutDurationMinutes: durationMinutes,
    exerciseCount,
    totalSets,
    fitnessGoal,
    bodyWeightKg,
  });

  const goalLabels: Record<string, string> = {
    muscle_gain: 'Ganar músculo',
    fat_loss: 'Perder grasa',
    recomposition: 'Recomposición',
    maintenance: 'Mantenimiento',
  };

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
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: true, label: 'Sí', emoji: '✅' },
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

  // Summary step (existing UI)
  return (
    <div className="min-h-screen bg-background px-4 py-6 safe-top safe-bottom">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">¡Entreno Completado!</h1>
        <p className="text-muted-foreground">
          Recomendaciones personalizadas para tu recuperación
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

      {/* Hydration */}
      <div className="bg-card rounded-2xl p-4 border border-border mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Droplets className="w-4 h-4 text-blue-400" />
          </div>
          <h2 className="font-semibold text-foreground">Hidratación</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-secondary/50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-blue-400">
              {(recommendations.hydration.duringWorkout / 1000).toFixed(1)}L
            </p>
            <p className="text-xs text-muted-foreground">Durante entreno</p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-blue-400">
              {recommendations.hydration.postWorkout}ml
            </p>
            <p className="text-xs text-muted-foreground">Post-entreno</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          💧 {recommendations.hydration.tip}
        </p>
      </div>

      {/* Nutrition */}
      <div className="bg-card rounded-2xl p-4 border border-border mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <Utensils className="w-4 h-4 text-green-400" />
          </div>
          <h2 className="font-semibold text-foreground">Nutrición Post-Entreno</h2>
          <span className="ml-auto text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            {goalLabels[fitnessGoal]}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-secondary/50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-400">
              {recommendations.nutrition.proteinGrams}g
            </p>
            <p className="text-xs text-muted-foreground">Proteína</p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">
              {recommendations.nutrition.carbsGrams}g
            </p>
            <p className="text-xs text-muted-foreground">Carbohidratos</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          ⏰ {recommendations.nutrition.timing}
        </p>
        <p className="text-sm text-muted-foreground">
          💡 {recommendations.nutrition.tip}
        </p>
      </div>

      {/* Supplements */}
      <div className="bg-card rounded-2xl p-4 border border-border mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Pill className="w-4 h-4 text-purple-400" />
          </div>
          <h2 className="font-semibold text-foreground">Suplementos Recomendados</h2>
        </div>
        <div className="space-y-3">
          {recommendations.supplements.map((supp, idx) => (
            <div key={idx} className="bg-secondary/50 rounded-xl p-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <p className="font-medium text-foreground">{supp.name}</p>
                  <p className="text-sm text-primary font-semibold">{supp.dosage}</p>
                </div>
                <a
                  href={supp.amazonUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FF9900]/20 text-[#FF9900] text-xs font-medium hover:bg-[#FF9900]/30 transition-colors flex-shrink-0"
                >
                  <ExternalLink className="w-3 h-3" />
                  Amazon
                </a>
              </div>
              <p className="text-xs text-muted-foreground mb-1">⏰ {supp.timing}</p>
              <p className="text-xs text-muted-foreground">{supp.reason}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recovery */}
      <div className="bg-card rounded-2xl p-4 border border-border mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <Moon className="w-4 h-4 text-indigo-400" />
          </div>
          <h2 className="font-semibold text-foreground">Recuperación</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-secondary/50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-indigo-400">
              {recommendations.recovery.muscleRecoveryDays}
            </p>
            <p className="text-xs text-muted-foreground">días descanso músculos</p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-indigo-400">
              {recommendations.recovery.sleepHours}h
            </p>
            <p className="text-xs text-muted-foreground">sueño recomendado</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          😴 {recommendations.recovery.tip}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button 
          variant="outline"
          onClick={() => setShowShare(true)}
          className="flex-1 h-14 text-base font-semibold"
        >
          <Share2 className="w-5 h-5 mr-2" />
          Compartir
        </Button>
        <Button 
          onClick={handleFinish}
          className="flex-1 h-14 bg-primary text-primary-foreground text-base font-semibold"
        >
          ¡Entendido!
        </Button>
      </div>

      {/* Share Modal */}
      <ShareWorkoutModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        durationMinutes={durationMinutes}
        exerciseCount={exerciseCount}
        totalSets={totalSets}
        newPRs={newPRs}
        workoutName={workoutName}
      />
    </div>
  );
};

export default PostWorkoutSummary;