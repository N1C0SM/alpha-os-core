import React, { useState, useEffect, useCallback } from 'react';
import { Timer, X, Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RestTimerProps {
  defaultSeconds?: number;
  onComplete?: () => void;
  autoStart?: boolean;
}

const PRESET_TIMES = [60, 90, 120, 180];

const RestTimer: React.FC<RestTimerProps> = ({ 
  defaultSeconds = 90, 
  onComplete,
  autoStart = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(defaultSeconds);
  const [remainingSeconds, setRemainingSeconds] = useState(defaultSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Timer logic
  useEffect(() => {
    if (!isRunning || remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          setHasCompleted(true);
          // Vibrate if available
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 200]);
          }
          // Play sound
          try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
          } catch (e) {
            // Audio not available
          }
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, remainingSeconds, onComplete]);

  const handleStart = useCallback(() => {
    if (remainingSeconds === 0) {
      setRemainingSeconds(totalSeconds);
    }
    setIsRunning(true);
    setHasCompleted(false);
  }, [remainingSeconds, totalSeconds]);

  const handlePause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setRemainingSeconds(totalSeconds);
    setHasCompleted(false);
  }, [totalSeconds]);

  const handleSetTime = useCallback((seconds: number) => {
    setTotalSeconds(seconds);
    setRemainingSeconds(seconds);
    setIsRunning(false);
    setHasCompleted(false);
  }, []);

  const handleAdjustTime = useCallback((delta: number) => {
    setTotalSeconds(prev => Math.max(15, Math.min(300, prev + delta)));
    setRemainingSeconds(prev => Math.max(0, prev + delta));
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 0;

  // Minimized state
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={cn(
          "fixed bottom-24 right-4 z-40 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all",
          hasCompleted 
            ? "bg-primary text-primary-foreground animate-pulse" 
            : isRunning 
              ? "bg-card border border-primary text-foreground"
              : "bg-card border border-border text-foreground"
        )}
      >
        <Timer className="w-4 h-4" />
        <span className="font-mono font-semibold">{formatTime(remainingSeconds)}</span>
      </button>
    );
  }

  // Expanded state
  return (
    <div className="fixed bottom-24 right-4 left-4 z-40 bg-card border border-border rounded-2xl shadow-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">Timer de descanso</span>
        </div>
        <Button 
          size="icon" 
          variant="ghost" 
          onClick={() => setIsExpanded(false)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Progress ring and time */}
      <div className="flex flex-col items-center mb-4">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-secondary"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={2 * Math.PI * 56}
              strokeDashoffset={2 * Math.PI * 56 * (1 - progress / 100)}
              className={cn(
                "transition-all duration-1000",
                hasCompleted ? "text-primary" : "text-primary"
              )}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn(
              "text-3xl font-mono font-bold",
              hasCompleted ? "text-primary" : "text-foreground"
            )}>
              {formatTime(remainingSeconds)}
            </span>
            {hasCompleted && (
              <span className="text-xs text-primary font-medium">¡A entrenar!</span>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <Button
          size="icon"
          variant="outline"
          onClick={() => handleAdjustTime(-15)}
          disabled={isRunning}
        >
          <Minus className="w-4 h-4" />
        </Button>
        
        {isRunning ? (
          <Button
            size="lg"
            onClick={handlePause}
            className="w-16 h-16 rounded-full bg-primary text-primary-foreground"
          >
            <Pause className="w-6 h-6" />
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={handleStart}
            className="w-16 h-16 rounded-full bg-primary text-primary-foreground"
          >
            <Play className="w-6 h-6 ml-1" />
          </Button>
        )}
        
        <Button
          size="icon"
          variant="outline"
          onClick={() => handleAdjustTime(15)}
          disabled={isRunning}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Reset button */}
      <div className="flex justify-center mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="text-muted-foreground"
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Reiniciar
        </Button>
      </div>

      {/* Preset times */}
      <div className="flex justify-center gap-2">
        {PRESET_TIMES.map(seconds => (
          <button
            key={seconds}
            onClick={() => handleSetTime(seconds)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              totalSeconds === seconds
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            )}
          >
            {formatTime(seconds)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RestTimer;
