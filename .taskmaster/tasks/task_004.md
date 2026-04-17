# Task ID: 4

**Title:** Create routine management interface (CRUD)

**Status:** pending

**Dependencies:** 3

**Priority:** high

**Description:** Build UI to create, view, edit, and delete routines with exercise lists and drag-and-drop reordering.

**Details:**

1. Routines.tsx dashboard with grid layout and empty state
2. RoutineCard component (name, exercise count, Start/Edit/Delete)
3. Create routine modal (Headless UI + React Hook Form)
4. RoutineEditor with dnd-kit drag-and-drop for exercises
5. ExerciseForm and delete routine with confirmation

**Test Strategy:**

Verify: CRUD routines, add exercises, drag-and-drop persists, cascade delete

## Subtasks

### 4.1. Create Routines dashboard

**Status:** pending
**Dependencies:** None

Fetch routines with exercise count, render in responsive grid. Empty state with CTA.

### 4.2. Build RoutineCard component

**Status:** pending
**Dependencies:** 4.1

Card: routine name, exercise count, date. Buttons: Start Workout, Edit, Delete.

### 4.3. Implement create routine modal

**Status:** pending
**Dependencies:** 4.1

Install @headlessui/react + react-hook-form. CreateRoutineModal with name input. createRoutine service function.

### 4.4. Create RoutineEditor with drag-and-drop

**Status:** pending
**Dependencies:** 4.3

Install @dnd-kit. RoutineEditor page: sortable exercise list, persist sort_order. "Add Exercise" button.

### 4.5. Build ExerciseForm and delete functionality

**Status:** pending
**Dependencies:** 4.4

ExerciseForm: name, muscle_group (English enum), machine_info, target_sets_reps. Create + edit mode. Delete routine with confirmation modal.
