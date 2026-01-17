import React from 'react';
import { ThumbsUp, Minus, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type SetFeeling = 'easy' | 'correct' | 'hard';

interface SetFeelingButtonsProps {
  feeling: SetFeeling | null;
  onFeelingChange: (feeling: SetFeeling) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

const FEELINGS: { value: SetFeeling; icon: React.ReactNode; label: string; color: string; bgColor: string }[] = [
  { 
    value: 'easy', 
    icon: <ThumbsUp className="w-3.5 h-3.5" />, 
    label: 'Fácil',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-500/20 border-green-500/50 hover:bg-green-500/30',
  },
  { 
    value: 'correct', 
    icon: <Minus className="w-3.5 h-3.5" />, 
    label: 'Bien',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/30',
  },
  { 
    value: 'hard', 
    icon: <ThumbsDown className="w-3.5 h-3.5" />, 
    label: 'Duro',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-500/20 border-red-500/50 hover:bg-red-500/30',
  },
];

export function SetFeelingButtons({ 
  feeling, 
  onFeelingChange, 
  disabled = false,
  size = 'sm',
}: SetFeelingButtonsProps) {
  return (
    <div className="flex gap-1.5 justify-center">
      {FEELINGS.map((f) => (
        <Button
          key={f.value}
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onFeelingChange(f.value)}
          className={cn(
            "flex-1 h-8 text-xs font-medium transition-all border",
            size === 'sm' ? 'px-2' : 'px-3',
            feeling === f.value 
              ? `${f.bgColor} ${f.color}` 
              : 'bg-secondary/50 border-border text-muted-foreground hover:text-foreground'
          )}
        >
          {f.icon}
          <span className="ml-1">{f.label}</span>
        </Button>
      ))}
    </div>
  );
}

// Compact inline version for set rows
export function SetFeelingIndicator({ feeling }: { feeling: SetFeeling | null }) {
  if (!feeling) return null;

  const config = FEELINGS.find(f => f.value === feeling);
  if (!config) return null;

  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded",
      feeling === 'easy' && 'bg-green-500/20 text-green-600 dark:text-green-400',
      feeling === 'correct' && 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
      feeling === 'hard' && 'bg-red-500/20 text-red-600 dark:text-red-400',
    )}>
      {config.icon}
    </span>
  );
}

export function getFeelingEmoji(feeling: SetFeeling | null): string {
  switch (feeling) {
    case 'easy': return '💪';
    case 'correct': return '✓';
    case 'hard': return '😤';
    default: return '';
  }
}
