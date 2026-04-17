# Task ID: 8

**Title:** Import initial workout data from PRD

**Status:** pending

**Dependencies:** 2, 3

**Priority:** medium

**Description:** Seed data with 4 routines (Brust & Bizeps, Beine & Schultern, Ruecken & Trizeps, Ganzkoerper) and import button.

**Details:**

1. seedData.ts with typed interfaces and 4 routines (German names, English muscle_group enums)
2. importSeedData(): check existing, batch insert routines + exercises
3. ImportWorkoutsButton with progress modal, only shown if 0 routines

**Test Strategy:**

Verify: 4 routines created correctly, English muscle_group values, blocked if routines exist

## Subtasks

### 8.1. Create seed data structures

**Status:** pending
**Dependencies:** None

seedData.ts: RoutineData/ExerciseData interfaces. WORKOUT_ROUTINES with 4 routines. muscle_group = English enum values. Names in German.

### 8.2. Implement importSeedData function

**Status:** pending
**Dependencies:** 8.1

Check for existing routines. Batch insert routines, get IDs. Insert exercises with foreign keys. Rollback on failure.

### 8.3. Create ImportWorkoutsButton

**Status:** pending
**Dependencies:** 8.2

Button with idle/importing/success/error states. Progress modal. Place in settings page. Only show if 0 routines.
