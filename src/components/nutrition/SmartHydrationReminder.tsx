import React, { useState, useEffect } from 'react';
import { Droplets, X, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SmartHydrationReminderProps {
  consumedMl: number;
  targetMl: number;
  onAddWater: (amount: number) => void;
  onDismiss?: () => void;
}

// Determines if a reminder should be shown based on time and progress
function shouldShowReminder(consumedMl: number, targetMl: number): {
  show: boolean;
  message: string;
  urgency: 'low' | 'medium' | 'high';
} {
  const now = new Date();
  const hour = now.getHours();
  const progress = targetMl > 0 ? (consumedMl / targetMl) * 100 : 0;

  // Night time (after 22h or before 7h) - no reminders
  if (hour >= 22 || hour < 7) {
    return { show: false, message: '', urgency: 'low' };
  }

  // Calculate expected progress based on time of day
  // Assume hydration should be distributed from 7:00 to 21:00 (14 hours)
  const startHour = 7;
  const endHour = 21;
  const totalHours = endHour - startHour;
  const elapsedHours = Math.max(0, hour - startHour);
  const expectedProgress = (elapsedHours / totalHours) * 100;

  // Already completed target
  if (progress >= 100) {
    return { show: false, message: '', urgency: 'low' };
  }

  // Calculate how far behind
  const behind = expectedProgress - progress;

  // Morning boost (7-10): Encourage starting the day hydrated
  if (hour >= 7 && hour < 10 && progress < 15) {
    return {
      show: true,
      message: '💧 Empieza el día con un vaso de agua para activar el metabolismo',
      urgency: 'low',
    };
  }

  // Pre-workout reminder (if it's around typical workout times)
  if ((hour === 10 || hour === 17 || hour === 18) && progress < expectedProgress - 10) {
    return {
      show: true,
      message: '💪 Hidrátate bien antes del entreno para rendir al máximo',
      urgency: 'medium',
    };
  }

  // Significantly behind (more than 20% behind schedule)
  if (behind > 20) {
    return {
      show: true,
      message: `⚠️ Llevas ${Math.round(behind)}% menos agua de lo ideal para esta hora`,
      urgency: 'high',
    };
  }

  // Moderately behind (10-20% behind)
  if (behind > 10) {
    return {
      show: true,
      message: '💧 Un par de vasos más te pondrían al día',
      urgency: 'medium',
    };
  }

  // Afternoon reminder if haven't drunk in a while (check every 2 hours)
  if (hour % 2 === 0 && hour >= 12 && progress < expectedProgress) {
    return {
      show: true,
      message: '💧 ¿Ya tomaste agua recientemente?',
      urgency: 'low',
    };
  }

  // Evening catch-up (18-21)
  if (hour >= 18 && hour < 21 && progress < 80) {
    const remaining = targetMl - consumedMl;
    const liters = (remaining / 1000).toFixed(1);
    return {
      show: true,
      message: `🌙 Te quedan ${liters}L antes de dormir - ve terminando`,
      urgency: behind > 15 ? 'high' : 'medium',
    };
  }

  return { show: false, message: '', urgency: 'low' };
}

const SmartHydrationReminder: React.FC<SmartHydrationReminderProps> = ({
  consumedMl,
  targetMl,
  onAddWater,
  onDismiss,
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [lastDismissTime, setLastDismissTime] = useState<number>(0);

  const reminder = shouldShowReminder(consumedMl, targetMl);

  // Reset dismissed state after 2 hours
  useEffect(() => {
    if (dismissed && Date.now() - lastDismissTime > 2 * 60 * 60 * 1000) {
      setDismissed(false);
    }
  }, [dismissed, lastDismissTime, consumedMl]);

  // Don't show if dismissed recently or no reminder needed
  if (!reminder.show || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    setLastDismissTime(Date.now());
    onDismiss?.();
  };

  const handleQuickAdd = (amount: number) => {
    onAddWater(amount);
    // Auto-dismiss after adding water
    handleDismiss();
  };

  const urgencyStyles = {
    low: 'bg-blue-500/10 border-blue-500/20',
    medium: 'bg-amber-500/10 border-amber-500/20',
    high: 'bg-red-500/10 border-red-500/20',
  };

  const iconStyles = {
    low: 'text-blue-400',
    medium: 'text-amber-400',
    high: 'text-red-400',
  };

  return (
    <div
      className={cn(
        'rounded-xl p-4 border animate-in slide-in-from-top-2 duration-300',
        urgencyStyles[reminder.urgency]
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Droplets className={cn('w-5 h-5 shrink-0 mt-0.5', iconStyles[reminder.urgency])} />
          <div>
            <p className="text-sm text-foreground">{reminder.message}</p>
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAdd(250)}
                className="border-blue-400/30 text-blue-400 hover:bg-blue-400/10"
              >
                +250ml
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAdd(500)}
                className="border-blue-400/30 text-blue-400 hover:bg-blue-400/10"
              >
                +500ml
              </Button>
            </div>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-secondary rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

export default SmartHydrationReminder;
