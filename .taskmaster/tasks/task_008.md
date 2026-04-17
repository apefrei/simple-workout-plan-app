# Task ID: 8

**Title:** Import initial workout data from PRD specifications

**Status:** pending

**Dependencies:** 2, 3

**Priority:** medium

**Description:** Create seed data script to populate database with 4 initial routines (Brust & Bizeps, Beine & Schultern, Rücken & Trizeps, Ganzkörper) from PRD

**Details:**

1. Create src/data/seedData.ts with typed interfaces for RoutineData and ExerciseData
2. Define 4 routines array based on PRD 'Training 1-4' structure:
   - Training 1: Brust & Bizeps (exercises like 'Flachbank LH', 'Schrägbank LH', etc.)
   - Training 2: Beine & Schultern (exercises like 'Beinpresse', 'Beinstrecker', etc.)
   - Training 3: Rücken & Trizeps (exercises like 'Latzug', 'Rudern', etc.)
   - Training 4: Ganzkörper Bonus (compound exercises)
3. For each exercise, include: name (German, user-facing), muscle_group (MUST be one of the English enum values: Chest, Back, Legs, Shoulders, Arms, Core, Full Body - German values will fail the DB CHECK constraint), machine_info, target_sets_reps (e.g. '12/10/8')
4. Create importSeedData() function that checks if user already has routines, prompts before import
5. Implement batch insert: await supabase.from('routines').insert(...).select() to get IDs, then insert exercises with routine_id foreign keys
6. Add UI button in settings/profile page: 'Import Sample Workouts'
7. Show progress modal during import with exercise count
8. Handle errors: rollback on failure, show user-friendly error messages
9. Optionally fetch placeholder media URLs from public CDN for demo purposes
10. Log import completion with timestamp

**Test Strategy:**

Test: Import creates exactly 4 routines in database, all exercises linked to correct routines, muscle_group values match English enum constraint ('Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body'), machine_info and target_sets_reps populated, import button disabled after first use, error handling shows message if database unavailable, CHECK constraint rejects invalid muscle_group values

## Subtasks

### 8.1. Create seedData.ts with typed interfaces and PRD workout data structures

**Status:** pending  
**Dependencies:** None  

Define TypeScript interfaces for RoutineData and ExerciseData, and create the 4 workout routines array based on PRD specifications (Training 1-4) with English muscle_group enum values

**Details:**

1. Create src/data/seedData.ts file
2. Define interface RoutineData with fields: name (string), description (string)
3. Define interface ExerciseData with fields: name (string), muscle_group (string), machine_info (string), target_sets_reps (string)
4. Create const WORKOUT_ROUTINES array containing 4 routines:
   - Training 1: Brust & Bizeps with exercises like 'Flachbank LH', 'Schrägbank LH', 'Butterfly', 'Bizeps Curls KH', 'Bizeps Curls Maschine', 'Hammer Curls'
   - Training 2: Beine & Schultern with exercises like 'Beinpresse', 'Beinstrecker', 'Beinbeuger', 'Waden', 'Schulterdrücken', 'Seitheben', 'Facepulls'
   - Training 3: Rücken & Trizeps with exercises like 'Latzug', 'Rudern horizontal', 'Rudern vertikal', 'Trizeps Pushdown', 'Trizeps über Kopf'
   - Training 4: Ganzkörper Bonus with compound exercises
5. CRITICAL: Each exercise object must include muscle_group using ONLY the English enum values from the database CHECK constraint: 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body'. Correct mappings:
   - 'Flachbank LH', 'Schrägbank LH', 'Butterfly' → muscle_group='Chest'
   - 'Bizeps Curls KH', 'Bizeps Curls Maschine', 'Hammer Curls' → muscle_group='Arms'
   - 'Beinpresse', 'Beinstrecker', 'Beinbeuger', 'Waden' → muscle_group='Legs'
   - 'Schulterdrücken', 'Seitheben', 'Facepulls' → muscle_group='Shoulders'
   - 'Latzug', 'Rudern horizontal', 'Rudern vertikal' → muscle_group='Back'
   - 'Trizeps Pushdown', 'Trizeps über Kopf' → muscle_group='Arms'
   - All compound exercises in Training 4 → muscle_group='Full Body'
6. Add target_sets_reps format like '12/10/8' or '3x12'
7. Add optional machine_info field for equipment references (e.g., 'Gerät 41')
8. Export WORKOUT_ROUTINES constant for use in import function
NOTE: Routine names and exercise names remain in German (user-facing), but muscle_group MUST be one of the 7 English enum values from the CHECK constraint defined in Task 2.3 (exercises table schema).

### 8.2. Implement importSeedData function with database insertion logic

**Status:** pending  
**Dependencies:** 8.1  

Create the core import function that inserts routines and exercises into Supabase with proper foreign key relationships and error handling

**Details:**

1. In seedData.ts, create async function importSeedData(userId: string) that accepts the authenticated user's ID
2. First, check if user already has routines: const { data: existingRoutines } = await supabase.from('routines').select('id').eq('user_id', userId).limit(1)
3. If existingRoutines.length > 0, return early with message 'User already has workout routines'
4. Use batch insert for routines: const { data: insertedRoutines, error } = await supabase.from('routines').insert(WORKOUT_ROUTINES.map(r => ({ user_id: userId, name: r.name }))).select()
5. Check for errors after routine insert and throw descriptive error if failed
6. Map inserted routine IDs to exercise data and prepare exercises array with routine_id foreign keys
7. Batch insert all exercises: await supabase.from('exercises').insert(exercisesWithRoutineIds)
8. Implement try-catch block with rollback logic: if exercises insert fails, delete the inserted routines to maintain data consistency
9. Return success object with counts: { routinesCreated: insertedRoutines.length, exercisesCreated: totalExercises }
10. Add detailed error messages for common failures (network, RLS policy, foreign key constraint, CHECK constraint violation for invalid muscle_group values)

### 8.3. Create ImportWorkoutsButton component with progress modal UI

**Status:** pending  
**Dependencies:** 8.2  

Build a React component with import button and modal that shows real-time progress during the data import process

**Details:**

1. Create src/components/ImportWorkoutsButton.tsx React component
2. Add state for import status: useState<'idle' | 'importing' | 'success' | 'error'>('idle')
3. Add state for progress tracking: useState<{ routines: number, exercises: number, total: number }>()
4. Create handleImport async function that:
   - Sets status to 'importing'
   - Gets current user from Supabase auth
   - Calls importSeedData(user.id)
   - Updates progress state incrementally (show routine count, then exercise count)
   - Sets status to 'success' or 'error' based on result
5. Render primary button: 'Import Sample Workouts' disabled when status !== 'idle'
6. Render modal dialog when status === 'importing' showing:
   - Spinner/loading animation
   - Progress text: 'Importing {X} of 4 routines...'
   - Exercise count: '{Y} exercises imported'
7. Show success modal with checkmark icon and summary when status === 'success'
8. Show error modal with error message and retry button when status === 'error'
9. Add onClick to button that triggers handleImport
10. Style with Tailwind CSS dark mode classes for consistency

### 8.4. Integrate ImportWorkoutsButton into settings/profile page UI

**Status:** pending  
**Dependencies:** 8.3  

Add the import button to the user settings or profile page with appropriate context and placement

**Details:**

1. Identify or create src/pages/SettingsPage.tsx or src/pages/ProfilePage.tsx component
2. Import ImportWorkoutsButton component
3. Add a section titled 'Workout Data' or 'Initial Setup' in the settings page
4. Place ImportWorkoutsButton within this section with explanatory text:
   - Heading: 'Sample Workout Routines'
   - Description: 'Import 4 pre-configured workout routines based on a 3-day split plus full-body bonus (Brust & Bizeps, Beine & Schultern, Rücken & Trizeps, Ganzkörper)'
   - Warning text: 'This will only work if you have no existing routines'
5. Add conditional rendering: only show import section if user has 0 routines (check on page load)
6. Ensure page is accessible from main navigation (bottom nav or settings menu)
7. Add proper spacing and styling to match mobile-first design
8. Consider adding a dismissible info banner at the top of the page explaining first-time setup
9. Ensure authenticated users can access the page (add auth guard if needed)
10. Test responsive layout for mobile devices

### 8.5. Add optional placeholder media URLs and implement import completion logging

**Status:** pending  
**Dependencies:** 8.2, 8.3  

Enhance seed data with demo media URLs from public CDN and add timestamp logging for successful imports

**Details:**

1. In seedData.ts, extend ExerciseData interface with optional media_url?: string field
2. Research and select a public CDN or placeholder image service (e.g., Unsplash, Pexels, or fitness-specific stock photos)
3. Add media_url values to select exercises in WORKOUT_ROUTINES array:
   - Prioritize compound movements like 'Flachbank LH', 'Beinpresse', 'Latzug' for demo GIFs/images
   - Use placeholder URLs or actual fitness demonstration images
   - Ensure URLs are https and publicly accessible without authentication
4. Update database insert logic to include media_url when present
5. Add logging to importSeedData function:
   - Log timestamp with new Date().toISOString() after successful import
   - Store import_completed_at in user metadata or local storage
   - Log summary: 'Seed data import completed: {routineCount} routines, {exerciseCount} exercises at {timestamp}'
6. Optionally create a workout_imports table to track import history with columns: user_id, imported_at, routine_count, exercise_count
7. Update ImportWorkoutsButton to display import timestamp in success modal
8. Add console.log statements for debugging during development
9. Ensure media_url field is nullable and import doesn't fail if URLs become unavailable
10. Document the media URL strategy in code comments
