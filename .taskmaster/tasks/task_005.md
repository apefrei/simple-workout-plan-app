# Task ID: 5

**Title:** Implement swipe-based workout session interface

**Status:** pending

**Dependencies:** 4

**Priority:** high

**Description:** Create mobile-first workout mode with horizontal swipe navigation between exercises, showing exercise media and input fields

**Details:**

1. Install Swiper for touch gestures: `npm install swiper`
2. Create src/pages/WorkoutSession.tsx receiving routineId from route params
3. Use Swiper component with effect='cards' or 'creative' for smooth transitions
4. Fetch routine exercises ordered by sort_order on mount
5. Each slide displays: exercise name, muscle_group, machine_info, target_sets_reps, media (IMG or GIF), input fields for weight and reps
6. Pre-fill weight/reps with last logged values from workout_logs query: SELECT weight_used, reps_completed FROM workout_logs WHERE exercise_id = ? AND user_id = ? ORDER BY date DESC LIMIT 1
7. Implement auto-save on input change with debouncing (500ms)
8. Add progress indicator showing current exercise number / total exercises
9. Full-screen design optimized for one-hand use: large touch targets (min 44px), bottom-positioned controls
10. Add 'Complete Workout' button on last slide that saves session and navigates to summary

**Test Strategy:**

Test: Swipe left/right navigates between exercises, media loads correctly (JPG/GIF), weight/reps pre-fill from previous workout, input changes auto-save, progress bar updates, complete button saves all logs to database, works in airplane mode (offline PWA)

## Subtasks

### 5.1. Install Swiper library and configure base WorkoutSession page structure

**Status:** pending  
**Dependencies:** None  

Install the Swiper library for touch gesture handling and create the foundational WorkoutSession page component with route parameter handling for routineId.

**Details:**

Run `npm install swiper` to add the Swiper library to the project. Create src/pages/WorkoutSession.tsx and set up React Router integration using useParams() to extract routineId from the URL. Import necessary Swiper modules (Swiper, SwiperSlide) and Swiper CSS files ('swiper/css', 'swiper/css/effect-cards' or 'swiper/css/effect-creative'). Create basic page layout with a container div that will hold the Swiper component. Add TypeScript interfaces for Exercise data structure matching the database schema (id, name, muscle_group, machine_info, target_sets_reps, media_url). Ensure the page is wrapped with proper error boundaries and has loading states.

### 5.2. Implement exercise data fetching with sort order and pre-fill logic

**Status:** pending  
**Dependencies:** 5.1  

Create data fetching logic to load routine exercises ordered by sort_order, and implement query to pre-fill weight/reps from last workout logs.

**Details:**

Use Supabase client to fetch exercises for the given routineId: `SELECT * FROM exercises WHERE routine_id = ? ORDER BY sort_order ASC`. Store exercises in component state using useState. For each exercise, fetch the most recent workout log: `SELECT weight_used, reps_completed FROM workout_logs WHERE exercise_id = ? AND user_id = ? ORDER BY date DESC LIMIT 1`. Implement this as a parallel fetch using Promise.all() to avoid sequential delays. Create a data structure that merges exercise details with pre-filled values. Add loading state management and error handling for network failures. Use useEffect to trigger data fetching on component mount. Handle cases where no previous logs exist (default to empty or zero values).

### 5.3. Configure Swiper component with card/creative effect and render exercise slides

**Status:** pending  
**Dependencies:** 5.2  

Set up the Swiper component with smooth card-based transition effects and render each exercise as a full-screen slide with all required information.

**Details:**

Configure Swiper with effect='cards' or effect='creative' for smooth swipe transitions. Set grabCursor={true} for better UX. Each SwiperSlide should render: exercise name (large, bold heading), muscle_group badge, machine_info display, target_sets_reps label, media element (IMG for JPG or video/gif for GIF based on media_url file extension), controlled input fields for weight (type='number') and reps (type='number') pre-filled with fetched values. Apply mobile-first styling: full-screen slides (min-h-screen), large touch targets (min-h-[44px]), bottom-positioned input controls for one-handed use. Use Tailwind CSS dark mode classes (bg-gray-900, text-gray-100). Add proper image loading states and error handling for missing media. Implement proper keyboard types for mobile (inputMode='numeric' for weight/reps inputs).
<info added on 2026-04-16T15:53:41.709Z>
Add a textarea input field for user_comment below the weight and reps inputs on each SwiperSlide. Use placeholder text 'Notizen zur Tagesform, Verletzungen...' or similar German text aligned with the PRD's German context. The textarea should be a controlled component with value bound to workout log state and onChange handler to capture user notes. Style it with mobile-first considerations: min-h-[80px] for comfortable text entry, bg-gray-800 dark:bg-gray-700, rounded borders, proper padding for touch targets. The comment value must be included in the auto-save payload to the workout_logs.user_comment column along with weight_used and reps_completed values as specified in Task 7's implementation.
</info added on 2026-04-16T15:53:41.709Z>

### 5.4. Implement auto-save functionality with debouncing and progress indicator

**Status:** pending  
**Dependencies:** 5.3  

Add debounced auto-save logic that persists weight/reps changes to workout_logs table, and display a progress indicator showing current exercise position.

**Details:**

Create a debounced save function using useCallback and a 500ms delay (use setTimeout or a library like lodash.debounce). On input change (onChange event), trigger the debounced save. The save function should INSERT or UPDATE workout_logs: `INSERT INTO workout_logs (user_id, exercise_id, date, weight_used, reps_completed) VALUES (...) ON CONFLICT (user_id, exercise_id, date) DO UPDATE SET weight_used=?, reps_completed=?`. Use optimistic UI updates: update local state immediately before database call completes. Add a visual save indicator (small checkmark or 'Saved' text that appears briefly after save). Implement progress indicator at top of screen showing 'Exercise X / Total' (e.g., '3 / 8'). Use Swiper's onSlideChange event to update the current exercise index. Add visual progress bar using a linear gradient or progress element. Handle offline scenarios gracefully with queue-based sync logic (store saves locally if offline, sync when online).
<info added on 2026-04-16T11:07:28.773Z>
I need to analyze the codebase to understand the current implementation and database schema before generating the update.Based on my analysis of the PRD document, I can see that the database schema only includes the following tables:

- `users` (authentication)
- `routines` (training plans)
- `exercises` (exercises within routines)
- `workout_logs` (performance tracking with user_id, exercise_id, date, weight_used, reps_completed, user_comment)

There is NO `workout_sessions` table in the schema, and the `workout_logs` table does not have a unique constraint on (user_id, exercise_id, date). Each workout log entry should be inserted as a new row, representing individual set records.

Here is the corrected implementation guidance:

CORRECTED IMPLEMENTATION: The debounced save function should INSERT a new row into workout_logs for each save event (representing each set performed): `INSERT INTO workout_logs (user_id, exercise_id, date, weight_used, reps_completed) VALUES (?, ?, ?, ?, ?)`. Do NOT use ON CONFLICT or UPSERT logic since there is no unique constraint on (user_id, exercise_id, date). Each INSERT creates a new record representing a completed set. When the 'Complete Workout' button on the last slide is triggered, flush all pending debounced saves to ensure all data is persisted, then navigate back to /routines with a success message (e.g., 'Workout completed!'). Do not create or reference any workout_sessions table, as it does not exist in the schema.
</info added on 2026-04-16T11:07:28.773Z>

### 5.5. Add 'Complete Workout' button on last slide with session finalization

**Status:** pending  
**Dependencies:** 5.4  

Implement a prominent 'Complete Workout' button that appears on the final exercise slide, which finalizes the workout session and navigates to a summary view.

**Details:**

Detect when user is on the last slide (use Swiper's activeIndex === exercises.length - 1). Show a large, prominent 'Complete Workout' button at the bottom of the last slide with distinct styling (bg-green-600, large text, full-width or nearly full-width). On button click: (1) Ensure all pending auto-saves are flushed to the database (use Promise.all on any pending save operations), (2) Create a workout_sessions record if needed (table storing session metadata: user_id, routine_id, date, completion_status), (3) Navigate to a summary page (e.g., /workout-summary/:sessionId) using React Router's navigate() function. Add loading state to the button while finalizing (show spinner, disable button). Implement confirmation haptic feedback on mobile (if supported). Add analytics tracking for workout completion. Handle edge cases: partial workouts (some exercises skipped), network failures during finalization (retry logic).
<info added on 2026-04-16T15:53:18.195Z>
I need to analyze the database schema to understand what tables actually exist and how workout completion should work.Based on my analysis of the database schema in the PRD and task definitions, the database only contains three main tables: users, routines, exercises, and workout_logs. There is NO workout_sessions table. The workout_logs table stores individual set entries (user_id, exercise_id, date, weight_used, reps_completed, user_comment).

Here is the new text to append to the subtask:

CRITICAL CORRECTION: The database schema does NOT include a workout_sessions table. The workout_logs table stores individual set entries only. Revised implementation: On the last slide (activeIndex === exercises.length - 1), display a large 'Complete Workout' button with green styling (bg-green-600, large text, full-width). On button click: (1) Use Promise.all to flush all pending debounced auto-save operations to workout_logs table, ensuring no data loss. (2) Show loading spinner and disable button during flush operation. (3) After successful save completion, use React Router's navigate('/routines', { state: { message: 'Workout completed!', type: 'success' } }) to redirect back to routines page. (4) Display success toast/banner on routines page using the passed state message. Handle errors: if flush fails due to network issues, show error toast and allow user to retry. Add haptic feedback on successful completion if navigator.vibrate is supported. The workout_logs entries themselves serve as the completion record (all entries for a given user_id + date combination represent a completed workout).
</info added on 2026-04-16T15:53:18.195Z>
