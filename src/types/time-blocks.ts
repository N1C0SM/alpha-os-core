// Time block types for detailed user schedules
export type TimeBlockType = 
  | 'class'      // Academic class
  | 'work'       // Work hours
  | 'appointment' // Doctor, psicólogo, etc.
  | 'activity'   // Chess, music, etc.
  | 'gym'        // Auto-assigned gym slot
  | 'meal'       // Meal times
  | 'sleep'      // Sleep window
  | 'other';     // Custom

export interface TimeBlock {
  id: string;
  type: TimeBlockType;
  name: string;
  start: string;  // HH:mm format
  end: string;    // HH:mm format
  color?: string;
}

export interface WeeklyTimeBlocks {
  monday?: TimeBlock[];
  tuesday?: TimeBlock[];
  wednesday?: TimeBlock[];
  thursday?: TimeBlock[];
  friday?: TimeBlock[];
  saturday?: TimeBlock[];
  sunday?: TimeBlock[];
}

export const TIME_BLOCK_LABELS: Record<TimeBlockType, { label: string; emoji: string; color: string }> = {
  class: { label: 'Clase', emoji: '📚', color: 'blue' },
  work: { label: 'Trabajo', emoji: '💼', color: 'gray' },
  appointment: { label: 'Cita', emoji: '🏥', color: 'green' },
  activity: { label: 'Actividad', emoji: '🎯', color: 'purple' },
  gym: { label: 'Gimnasio', emoji: '🏋️', color: 'primary' },
  meal: { label: 'Comida', emoji: '🍽️', color: 'orange' },
  sleep: { label: 'Dormir', emoji: '😴', color: 'indigo' },
  other: { label: 'Otro', emoji: '📌', color: 'muted' },
};

// Helper to check if a time slot is available
export function isTimeSlotAvailable(
  blocks: TimeBlock[],
  startTime: string,
  endTime: string
): boolean {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  return !blocks.some(block => {
    const blockStart = timeToMinutes(block.start);
    const blockEnd = timeToMinutes(block.end);
    
    // Check for overlap
    return (startMinutes < blockEnd && endMinutes > blockStart);
  });
}

// Helper to find available slots for workout
export function findAvailableWorkoutSlots(
  blocks: TimeBlock[],
  workoutDurationMinutes: number,
  preferredTime?: string
): { start: string; end: string; priority: number }[] {
  const slots: { start: string; end: string; priority: number }[] = [];
  const sortedBlocks = [...blocks].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  
  // Define search windows (preferred times for gym)
  const preferredWindows = [
    { start: '06:00', end: '09:00', priority: 2 },  // Morning
    { start: '17:00', end: '21:00', priority: 3 },  // Evening (most preferred)
    { start: '12:00', end: '14:00', priority: 1 },  // Lunch
  ];

  for (const window of preferredWindows) {
    let currentStart = timeToMinutes(window.start);
    const windowEnd = timeToMinutes(window.end);

    while (currentStart + workoutDurationMinutes <= windowEnd) {
      const slotStart = minutesToTime(currentStart);
      const slotEnd = minutesToTime(currentStart + workoutDurationMinutes);

      if (isTimeSlotAvailable(sortedBlocks, slotStart, slotEnd)) {
        let priority = window.priority;
        
        // Boost priority if close to preferred time
        if (preferredTime) {
          const preferredMinutes = timeToMinutes(preferredTime);
          const diff = Math.abs(currentStart - preferredMinutes);
          if (diff <= 60) priority += 2;
          else if (diff <= 120) priority += 1;
        }

        slots.push({ start: slotStart, end: slotEnd, priority });
      }

      currentStart += 30; // Check every 30 minutes
    }
  }

  return slots.sort((a, b) => b.priority - a.priority);
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Calculate total occupied time in a day
export function getTotalOccupiedMinutes(blocks: TimeBlock[]): number {
  return blocks.reduce((total, block) => {
    const start = timeToMinutes(block.start);
    const end = timeToMinutes(block.end);
    return total + (end - start);
  }, 0);
}

// Get free time windows for a day
export function getFreeWindows(blocks: TimeBlock[]): { start: string; end: string; durationMinutes: number }[] {
  const sortedBlocks = [...blocks].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  const windows: { start: string; end: string; durationMinutes: number }[] = [];
  
  let lastEnd = 6 * 60; // Start at 6:00 AM
  const dayEnd = 23 * 60; // End at 11:00 PM

  for (const block of sortedBlocks) {
    const blockStart = timeToMinutes(block.start);
    const blockEnd = timeToMinutes(block.end);

    if (blockStart > lastEnd) {
      const duration = blockStart - lastEnd;
      if (duration >= 30) { // Only count windows >= 30 min
        windows.push({
          start: minutesToTime(lastEnd),
          end: minutesToTime(blockStart),
          durationMinutes: duration,
        });
      }
    }
    lastEnd = Math.max(lastEnd, blockEnd);
  }

  // Check remaining time until end of day
  if (dayEnd > lastEnd) {
    const duration = dayEnd - lastEnd;
    if (duration >= 30) {
      windows.push({
        start: minutesToTime(lastEnd),
        end: minutesToTime(dayEnd),
        durationMinutes: duration,
      });
    }
  }

  return windows;
}
