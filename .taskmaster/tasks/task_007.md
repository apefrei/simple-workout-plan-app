# Task ID: 7

**Title:** Enhance workout session with service layer, quick-adjust controls, and offline sync

**Status:** pending

**Dependencies:** 5, 10

**Priority:** high

**Description:** Create the saveWorkoutLog service function used by Task 5's workout session, add quick-adjust buttons (+/- 2.5kg, +/- 1 rep), save animation, input validation, and integrate Task 10's offline utilities. Does NOT create a separate UI component - enhances the existing WorkoutSession from Task 5.

**Details:**

This task enhances Task 5's WorkoutSession UI with production-ready logging features. It does NOT create a separate ExerciseLogger component (Task 5 already has weight/reps/comment inputs in its Swiper slides).

1. Create src/services/workoutLogService.ts with saveWorkoutLog() function and TypeScript types
2. Add quick-adjust buttons to Task 5's exercise slide inputs: +/- 2.5kg for weight, +/- 1 rep
3. Implement input validation: weight >= 0, reps >= 1, prevent invalid values
4. Install framer-motion: `npm install framer-motion`
5. Add checkmark success animation after save using Framer Motion AnimatePresence
6. Integrate Task 10's offline utilities: import saveWorkoutLogLocally() and syncOfflineLogs() from src/utils/db.ts
7. Wire up WorkoutSession to use saveWorkoutLog() (online) or saveWorkoutLogLocally() (offline)
8. Show loading state and retry mechanism if sync fails

**Test Strategy:**

Test: saveWorkoutLog inserts to database with correct user_id and exercise_id, quick-adjust buttons increment weight by 2.5kg and reps by 1, validation prevents negative values, checkmark animation plays on save, offline logs use Task 10 utilities and sync when connection restored, no duplicate ExerciseLogger component exists

## Subtasks

### 7.1. Create saveWorkoutLog service function with TypeScript types

**Status:** pending  
**Dependencies:** None  

Create src/services/workoutLogService.ts with async saveWorkoutLog function that inserts workout log data into Supabase workout_logs table

**Details:**

Create src/services/workoutLogService.ts with async function saveWorkoutLog(userId: string, exerciseId: string, weight: number, reps: number, comment: string, date: Date = new Date()). Use Supabase client: import { supabase } from '@/services/supabase'. Implement: const { data, error } = await supabase.from('workout_logs').insert({ user_id: userId, exercise_id: exerciseId, date: date.toISOString(), weight_used: weight, reps_completed: reps, user_comment: comment }).select().single(). Add error handling with try-catch block and return { success: boolean, data?, error? }. Define and export TypeScript types: export type WorkoutLog = { id?: string; user_id: string; exercise_id: string; date: string; weight_used: number; reps_completed: number; user_comment: string }. This service is used by Task 5's WorkoutSession component.

### 7.2. Add quick-adjust buttons and input validation to WorkoutSession slides

**Status:** pending  
**Dependencies:** 7.1  

Enhance the existing weight/reps inputs in Task 5's WorkoutSession Swiper slides with +/- 2.5kg and +/- 1 rep quick-adjust buttons and input validation

**Details:**

Open src/pages/WorkoutSession.tsx (created in Task 5). For each exercise slide's weight and reps inputs, add quick-adjust button pairs. Create handleWeightAdjust(exerciseIndex: number, delta: number) and handleRepsAdjust(exerciseIndex: number, delta: number) functions that update local state safely (weight >= 0, reps >= 1). Render +/- buttons next to each input: <button onClick={() => handleWeightAdjust(i, -2.5)}>-2.5</button> <input .../> <button onClick={() => handleWeightAdjust(i, 2.5)}>+2.5</button>. Style buttons with bg-gray-700 hover:bg-gray-600, rounded-md, min-h-12 for touch targets. Add input validation on onChange: prevent negative values, enforce numeric input. Ensure quick-adjust updates trigger the existing debounced auto-save from Task 5.4.

### 7.3. Add save success animation with Framer Motion

**Status:** pending  
**Dependencies:** 7.2  

Install framer-motion and add a checkmark success animation to the WorkoutSession that plays after each successful auto-save

**Details:**

Install framer-motion: npm install framer-motion. In WorkoutSession.tsx, import { motion, AnimatePresence } from 'framer-motion'. Add state: const [showSaveSuccess, setShowSaveSuccess] = useState(false). After successful save in the debounced auto-save handler: setShowSaveSuccess(true), then setTimeout(() => setShowSaveSuccess(false), 1500). Render a small, non-intrusive save indicator (NOT a full-screen overlay): <AnimatePresence>{showSaveSuccess && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-4 right-4 text-green-400 text-sm flex items-center gap-1"><CheckmarkIcon /> Saved</motion.div>}</AnimatePresence>. On error: show brief red error indicator instead, with option to retry.

### 7.4. Integrate Task 10 offline utilities into WorkoutSession save flow

**Status:** pending  
**Dependencies:** 7.1, 7.3  

Wire up the WorkoutSession's save logic to use Task 10's offline utilities (saveWorkoutLogLocally, syncOfflineLogs) when offline, replacing any inline offline handling

**Details:**

Import offline utilities from Task 10: import { saveWorkoutLogLocally, syncOfflineLogs } from '@/utils/db'; import { useOnlineStatus } from '@/hooks/useOnlineStatus'. Update the WorkoutSession's debounced save handler: if (navigator.onLine) { await saveWorkoutLog(...) } else { await saveWorkoutLogLocally({ user_id, exercise_id, date, weight_used, reps_completed, user_comment }) }. On the 'online' event, call syncOfflineLogs() to flush queued entries. Remove any duplicate IndexedDB initialization or offline queue logic from WorkoutSession - all offline persistence goes through Task 10's central layer. Show save indicator text as 'Saved' when online or 'Queued' when offline, using different colors (green vs yellow).
