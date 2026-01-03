import React, { useEffect, useState } from 'react';
import { Trophy, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PRCelebrationProps {
  exerciseName: string;
  weight: number;
  reps: number;
  estimated1RM: number;
  previousBest?: number;
  onClose: () => void;
}

const PRCelebration: React.FC<PRCelebrationProps> = ({
  exerciseName,
  weight,
  reps,
  estimated1RM,
  previousBest,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 50);
    
    // Vibrate on supported devices
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }

    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const improvement = previousBest ? estimated1RM - previousBest : 0;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300",
        isVisible ? "bg-black/60" : "bg-black/0 pointer-events-none"
      )}
      onClick={handleClose}
    >
      <div 
        className={cn(
          "relative bg-card border-2 border-primary rounded-2xl p-6 max-w-sm w-full text-center transition-all duration-500",
          isVisible ? "scale-100 opacity-100" : "scale-50 opacity-0"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2"
          onClick={handleClose}
        >
          <X className="w-4 h-4" />
        </Button>

        {/* Confetti-like sparkles */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
        </div>

        {/* Trophy */}
        <div className="w-20 h-20 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center animate-bounce">
          <Trophy className="w-10 h-10 text-primary" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-foreground mb-2">
          🎉 ¡NUEVO PR!
        </h2>

        {/* Exercise name */}
        <p className="text-lg text-muted-foreground mb-4">
          {exerciseName}
        </p>

        {/* Stats */}
        <div className="bg-secondary/50 rounded-xl p-4 mb-4">
          <div className="text-3xl font-bold text-primary mb-1">
            {weight}kg × {reps}
          </div>
          <div className="text-sm text-muted-foreground">
            1RM Estimado: <span className="text-foreground font-semibold">{estimated1RM}kg</span>
          </div>
          {improvement > 0 && (
            <div className="mt-2 text-sm text-green-500 font-medium">
              +{improvement}kg desde tu anterior mejor 🚀
            </div>
          )}
        </div>

        {/* Motivational message */}
        <p className="text-sm text-muted-foreground">
          {improvement > 5 
            ? "¡Increíble progreso! Sigue así 💪"
            : improvement > 0
              ? "¡Cada kilo cuenta! Vas por buen camino 🔥"
              : "¡Tu primer récord en este ejercicio! 🏆"
          }
        </p>
      </div>
    </div>
  );
};

export default PRCelebration;
