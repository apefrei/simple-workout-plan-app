# Task ID: 7

**Title:** Implement workout logging and comment system

**Status:** pending

**Dependencies:** 5

**Priority:** high

**Description:** Create functionality to log completed sets with weight, reps, and optional comments per exercise

**Details:**

1. Create src/components/ExerciseLogger.tsx with controlled inputs for weight (number) and reps (number)
2. Add textarea for user_comment with placeholder: 'Notes on today's performance, injuries, etc.'
3. Implement saveWorkoutLog() function: INSERT INTO workout_logs (user_id, exercise_id, date, weight_used, reps_completed, user_comment) VALUES (...)
4. Use optimistic UI updates: show data immediately, sync to Supabase in background
5. Add timestamp and date tracking (use current date, allow manual date adjustment for logging past workouts)
6. Create visual indicator for successful save (checkmark animation using Framer Motion)
7. Implement input validation: weight and reps must be positive numbers
8. Add quick-adjust buttons: +/- 2.5kg for weight, +/- 1 rep for reps
9. Store logs locally in IndexedDB when offline, sync when online using workbox-background-sync
10. Show loading state and retry mechanism if sync fails

**Test Strategy:**

Test: Log weight and reps saves to database with correct user_id and exercise_id, comment text persists, date defaults to today, quick-adjust buttons increment correctly, optimistic UI updates immediately, offline logs sync when connection restored, validation prevents negative values

## Subtasks

### 7.1. Create ExerciseLogger component with weight and reps input fields

**Status:** pending  
**Dependencies:** None  

Build the ExerciseLogger.tsx component with controlled input fields for weight (number) and reps (number), including input validation to ensure positive values only

**Details:**

Create src/components/ExerciseLogger.tsx as a React functional component. Implement useState hooks for weight and reps state management. Add two number input fields with type='number', min='0', step='0.1' for weight (kg) and min='1' for reps. Include validation that prevents negative or zero values. Apply Tailwind CSS dark mode styling: bg-gray-800, text-gray-100, focus:ring-blue-500, border-gray-700. Add labels with text-lg font-bold for accessibility. Use controlled component pattern with onChange handlers. Set default placeholder values (e.g., 'Enter weight in kg', 'Enter reps').

### 7.2. Add comment textarea and quick-adjust buttons to ExerciseLogger

**Status:** pending  
**Dependencies:** 7.1  

Implement textarea for user comments and quick-adjust increment/decrement buttons for weight (+/- 2.5kg) and reps (+/- 1)

**Details:**

Add a textarea element with id='user_comment', placeholder='Notes on today's performance, injuries, etc.', rows={4}, className='w-full bg-gray-800 text-gray-100 rounded-lg p-3 border border-gray-700 focus:ring-2 focus:ring-blue-500'. Implement quick-adjust buttons using button elements positioned next to weight and reps inputs. Create handleWeightAdjust(delta: number) and handleRepsAdjust(delta: number) functions that increment/decrement values safely (prevent going below minimums). Style buttons with bg-gray-700 hover:bg-gray-600, rounded-md, p-2, and use '+' and '-' symbols or icons. Ensure quick-adjust respects validation rules (weight >= 0, reps >= 1).

### 7.3. Implement saveWorkoutLog function with Supabase integration

**Status:** pending  
**Dependencies:** 7.2  

Create saveWorkoutLog async function that inserts workout log data into Supabase workout_logs table with user_id, exercise_id, date, weight_used, reps_completed, and user_comment

**Details:**

Create src/services/workoutLogService.ts with async function saveWorkoutLog(userId: string, exerciseId: string, weight: number, reps: number, comment: string, date: Date = new Date()). Use Supabase client: import { supabase } from '@/services/supabase'. Implement: const { data, error } = await supabase.from('workout_logs').insert({ user_id: userId, exercise_id: exerciseId, date: date.toISOString(), weight_used: weight, reps_completed: reps, user_comment: comment }).select().single(). Add error handling with try-catch block and return { success: boolean, data?, error? }. Include TypeScript types: type WorkoutLog = { user_id: string; exercise_id: string; date: string; weight_used: number; reps_completed: number; user_comment: string }.

### 7.4. Implement optimistic UI updates with success animation

**Status:** pending  
**Dependencies:** 7.3  

Add optimistic UI updates that show data immediately upon save, implement background sync to Supabase, and create a checkmark success animation using Framer Motion

**Details:**

In ExerciseLogger component, create handleSave async function that: 1) Immediately updates local state with optimistic data, 2) Shows loading state (setIsSaving(true)), 3) Calls saveWorkoutLog in background, 4) On success: triggers checkmark animation using Framer Motion's <motion.div> with initial={{ scale: 0, opacity: 0 }}, animate={{ scale: 1, opacity: 1 }}, exit={{ scale: 0, opacity: 0 }}, transition={{ duration: 0.3 }}. Use a green checkmark SVG icon with AnimatePresence wrapper. 5) On error: revert optimistic update, show error toast. Add useState hooks for isSaving, showSuccess. Import { motion, AnimatePresence } from 'framer-motion'. Position checkmark overlay with absolute positioning, centered on screen with bg-black/50 backdrop.

### 7.5. Add offline support with IndexedDB and background sync

**Status:** pending  
**Dependencies:** 7.4  

Implement offline storage using IndexedDB to queue workout logs when offline, and sync to Supabase when connection is restored using workbox-background-sync

**Details:**

Install dependencies: npm install idb workbox-background-sync. Create src/lib/offlineStorage.ts using idb library: import { openDB } from 'idb'. Initialize IndexedDB: const db = await openDB('workout-logs-db', 1, { upgrade(db) { db.createObjectStore('pending-logs', { keyPath: 'id', autoIncrement: true }); } }). Implement queueOfflineLog(log: WorkoutLog) to store logs in 'pending-logs' store. Create syncOfflineLogs() function that: 1) Checks navigator.onLine, 2) Retrieves all pending logs from IndexedDB, 3) Calls saveWorkoutLog for each, 4) Deletes from IndexedDB on success. Register service worker with Workbox for background sync. Add online/offline event listeners: window.addEventListener('online', syncOfflineLogs). Update ExerciseLogger to use offline queue when navigator.onLine === false. Add visual indicator for offline mode (orange badge) and sync status (spinning icon during sync).
