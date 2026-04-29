-- ============================================================
-- Add length constraints to text columns to prevent abuse
-- ============================================================

-- Routines
alter table public.routines
  add constraint routines_name_length check (char_length(name) <= 200);

-- Exercises
alter table public.exercises
  add constraint exercises_name_length check (char_length(name) <= 200),
  add constraint exercises_machine_info_length check (machine_info is null or char_length(machine_info) <= 500),
  add constraint exercises_target_sets_reps_length check (target_sets_reps is null or char_length(target_sets_reps) <= 200),
  add constraint exercises_media_url_length check (media_url is null or char_length(media_url) <= 2000);

-- Workout logs
alter table public.workout_logs
  add constraint workout_logs_comment_length check (comment is null or char_length(comment) <= 1000);
