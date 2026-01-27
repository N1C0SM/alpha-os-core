import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Dumbbell, Target, Apple, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
  routineName?: string;
  daysPerWeek?: number;
  exerciseCount?: number;
}

const features = [
  {
    icon: Dumbbell,
    title: 'Rutina personalizada',
    description: 'Generada con IA según tus objetivos',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Target,
    title: 'Progresión automática',
    description: 'El peso sube cuando estés listo',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    icon: Apple,
    title: 'Nutrición inteligente',
    description: 'Macros calculados para ti',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
  },
];

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  open,
  onClose,
  routineName,
  daysPerWeek,
  exerciseCount,
}) => {
  const navigate = useNavigate();

  const handleStartNow = () => {
    onClose();
    navigate('/hoy');
  };

  const handleViewRoutine = () => {
    onClose();
    navigate('/entreno');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary-foreground" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center border-2 border-background">
                <Zap className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>
          <DialogTitle className="text-2xl">¡Tu plan está listo!</DialogTitle>
          <DialogDescription className="text-base">
            AUTOPILOT ha creado todo lo que necesitas
          </DialogDescription>
        </DialogHeader>

        {/* Routine Summary */}
        {routineName && (
          <div className="bg-secondary/50 rounded-xl p-4 text-center mb-4">
            <p className="text-sm text-muted-foreground mb-1">Tu rutina</p>
            <p className="font-bold text-lg text-foreground">{routineName}</p>
            <div className="flex items-center justify-center gap-4 mt-2 text-sm text-muted-foreground">
              {daysPerWeek && (
                <span className="flex items-center gap-1">
                  <Dumbbell className="w-4 h-4" />
                  {daysPerWeek} días/semana
                </span>
              )}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="space-y-3 mb-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border"
            >
              <div className={cn('p-2 rounded-lg', feature.bg)}>
                <feature.icon className={cn('w-5 h-5', feature.color)} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-foreground">
                  {feature.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button onClick={handleStartNow} size="lg" className="w-full">
            <Zap className="w-4 h-4 mr-2" />
            Empezar ahora
          </Button>
          <Button onClick={handleViewRoutine} variant="outline" size="lg" className="w-full">
            Ver mi rutina
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
