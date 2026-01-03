import React, { useState, useRef } from 'react';
import { Share2, Download, X, Instagram, Copy, Check, Trophy, Clock, Dumbbell, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ShareWorkoutProps {
  durationMinutes: number;
  exerciseCount: number;
  totalSets: number;
  totalVolume?: number;
  newPRs?: number;
  workoutName?: string;
  onClose?: () => void;
}

const ShareWorkoutCard: React.FC<ShareWorkoutProps & { cardRef: React.RefObject<HTMLDivElement> }> = ({
  durationMinutes,
  exerciseCount,
  totalSets,
  totalVolume,
  newPRs,
  workoutName,
  cardRef,
}) => {
  return (
    <div 
      ref={cardRef}
      className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 rounded-2xl text-white w-full max-w-sm mx-auto"
      style={{ aspectRatio: '1/1' }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
        </p>
        <h2 className="text-2xl font-bold text-primary">
          {workoutName || 'Entreno completado'}
        </h2>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/10 rounded-xl p-4 text-center">
          <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">{durationMinutes}</p>
          <p className="text-xs text-gray-400">minutos</p>
        </div>
        <div className="bg-white/10 rounded-xl p-4 text-center">
          <Dumbbell className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">{exerciseCount}</p>
          <p className="text-xs text-gray-400">ejercicios</p>
        </div>
        <div className="bg-white/10 rounded-xl p-4 text-center">
          <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">{totalSets}</p>
          <p className="text-xs text-gray-400">series</p>
        </div>
        {newPRs && newPRs > 0 ? (
          <div className="bg-primary/20 rounded-xl p-4 text-center">
            <Trophy className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-primary">{newPRs}</p>
            <p className="text-xs text-gray-400">nuevos PRs</p>
          </div>
        ) : totalVolume ? (
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Volumen</p>
            <p className="text-xl font-bold">{(totalVolume / 1000).toFixed(1)}t</p>
          </div>
        ) : (
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">💪</p>
            <p className="text-xs text-gray-400">¡Hecho!</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Trackeado con <span className="text-primary font-semibold">AlphaSupps OS</span>
        </p>
      </div>
    </div>
  );
};

const ShareWorkoutModal: React.FC<ShareWorkoutProps & { isOpen: boolean }> = ({
  isOpen,
  onClose,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopyText = () => {
    const text = `🏋️ Entreno completado!

⏱️ ${props.durationMinutes} min
💪 ${props.exerciseCount} ejercicios
🔥 ${props.totalSets} series
${props.newPRs ? `🏆 ${props.newPRs} nuevos PRs!` : ''}

#gym #fitness #workout`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: 'Copiado al portapapeles' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mi entreno',
          text: `🏋️ Entreno completado! ${props.durationMinutes}min, ${props.exerciseCount} ejercicios, ${props.totalSets} series`,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      handleCopyText();
    }
  };

  const handleDownloadImage = () => {
    // For now, just copy text - native screenshot is recommended
    handleCopyText();
    toast({ 
      title: 'Texto copiado', 
      description: 'Haz captura de pantalla para la imagen' 
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose?.()}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Compartir entreno
          </DialogTitle>
          <DialogDescription>Comparte tu entreno en redes sociales</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <ShareWorkoutCard {...props} cardRef={cardRef} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="flex flex-col items-center gap-1 h-auto py-3"
            onClick={handleDownloadImage}
          >
            <Download className="w-5 h-5" />
            <span className="text-xs">Descargar</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center gap-1 h-auto py-3"
            onClick={handleCopyText}
          >
            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
            <span className="text-xs">Copiar</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center gap-1 h-auto py-3"
            onClick={handleShareNative}
          >
            <Share2 className="w-5 h-5" />
            <span className="text-xs">Compartir</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareWorkoutModal;
