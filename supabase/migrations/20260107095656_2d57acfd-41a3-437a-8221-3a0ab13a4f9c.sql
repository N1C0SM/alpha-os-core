-- Add external activities field to user_schedules
ALTER TABLE public.user_schedules 
ADD COLUMN IF NOT EXISTS external_activities JSONB DEFAULT '{}';

-- JSONB structure example:
-- {
--   "monday": { "activity": "boxing", "time": "18:00", "duration": 60 },
--   "tuesday": null,
--   "wednesday": { "activity": "running", "time": "07:00", "duration": 45 },
--   "thursday": { "activity": "climbing", "time": "18:45", "duration": 60 },
--   ...
-- }

COMMENT ON COLUMN public.user_schedules.external_activities IS 'Stores external activities (climbing, swimming, boxing, running, etc.) per day of week as JSON';