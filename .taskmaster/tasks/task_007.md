# Task ID: 7

**Title:** Enhance workout session with service layer, quick-adjust, and offline sync

**Status:** pending

**Dependencies:** 5, 10.4

**Priority:** high

**Description:** Create saveWorkoutLog service, add +/- buttons for weight/reps, save animation, integrate offline utilities from Task 10.4.

**Details:**

1. workoutLogService.ts with saveWorkoutLog() function
2. Quick-adjust buttons: +/- 2.5kg weight, +/- 1 rep
3. Input validation (weight >= 0, reps >= 1)
4. Framer Motion save animation
5. Offline routing: online -> Supabase, offline -> IndexedDB (Task 10.4)

**Test Strategy:**

Verify: saveWorkoutLog works, quick-adjust buttons work, validation, animation, offline sync

## Subtasks

### 7.1. Create saveWorkoutLog service

**Status:** pending
**Dependencies:** None

workoutLogService.ts: saveWorkoutLog(userId, exerciseId, weight, reps, comment, date). Date as 'YYYY-MM-DD'. Export WorkoutLog type.

### 7.2. Add quick-adjust buttons and validation

**Status:** pending
**Dependencies:** 7.1

+/- 2.5kg around weight, +/- 1 around reps in WorkoutSession slides. Enforce min values. Large touch targets.

### 7.3. Add save animation

**Status:** pending
**Dependencies:** 7.2

Install framer-motion. Small "Saved" checkmark indicator with AnimatePresence. Auto-hide 1.5s. Red error on failure.

### 7.4. Integrate offline utilities

**Status:** pending
**Dependencies:** 7.1, 7.3

Import from Task 10.4. Online -> saveWorkoutLog, offline -> saveWorkoutLogLocally. Sync on reconnect. "Saved" (green) vs "Queued" (yellow).
