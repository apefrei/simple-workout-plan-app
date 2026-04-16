# Task ID: 4

**Title:** Create routine management interface (CRUD operations)

**Status:** pending

**Dependencies:** 3

**Priority:** high

**Description:** Build interface to create, view, edit, and delete workout routines with exercise lists

**Details:**

1. Create src/pages/Routines.tsx as main dashboard listing all routines
2. Create src/components/RoutineCard.tsx displaying routine name with exercise count
3. Implement createRoutine() service function: INSERT INTO routines (user_id, name) VALUES (...)
4. Create src/pages/RoutineEditor.tsx for adding/editing exercises within a routine
5. Implement drag-and-drop sorting using @dnd-kit/core: `npm install @dnd-kit/core @dnd-kit/sortable`
6. Exercise form fields: name (text), muscle_group (select: Chest, Back, Legs, Shoulders, Arms), machine_info (text), target_sets_reps (text e.g. '12/10/8'), media upload
7. Implement updateExerciseOrder() to save sort_order to database
8. Add deleteRoutine() with confirmation modal using Headless UI: `npm install @headlessui/react`
9. Create responsive grid layout for routine cards (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
10. Add empty state with CTA button when no routines exist

**Test Strategy:**

Test: Create new routine saves to database and appears in list, add exercises to routine, drag-and-drop reordering persists after page refresh, edit routine name updates correctly, delete routine removes from database, media upload stores URL in exercise.media_url

## Subtasks

### 4.1. Create Routines.tsx dashboard page with routine listing and empty state

**Status:** pending  
**Dependencies:** None  

Build the main routines dashboard page that fetches and displays all user routines in a responsive grid layout with an empty state when no routines exist

**Details:**

1. Create src/pages/Routines.tsx file with TypeScript
2. Import dependencies: import { useEffect, useState } from 'react'; import { supabase } from '@/services/supabase'; import { useAuth } from '@/contexts/AuthContext';
3. Define Routine interface: interface Routine { id: string; name: string; created_at: string; exercise_count?: number }
4. Create state: const [routines, setRoutines] = useState<Routine[]>([]); const [loading, setLoading] = useState(true)
5. Implement fetchRoutines function that queries: supabase.from('routines').select('*, exercises(count)').eq('user_id', user.id).order('created_at', { ascending: false })
6. Map exercise count from nested query result to exercise_count property
7. Call fetchRoutines in useEffect on component mount
8. Create responsive grid layout: <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
9. Render RoutineCard components (placeholder for now) for each routine
10. Implement empty state when routines.length === 0:
    - <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    - Icon or illustration
    - <h2 className="text-2xl text-gray-400 mb-4">No routines yet</h2>
    - <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg" onClick={handleCreateRoutine}>Create Your First Routine</button>
11. Add loading spinner while fetching: {loading && <div>Loading...</div>}
12. Implement error handling with try-catch and display error message if fetch fails

### 4.2. Build RoutineCard component with routine info and action buttons

**Status:** pending  
**Dependencies:** 4.1  

Create a reusable card component to display individual routine information including name, exercise count, and edit/delete action buttons

**Details:**

1. Create src/components/RoutineCard.tsx file
2. Define props interface: interface RoutineCardProps { routine: { id: string; name: string; exercise_count: number; created_at: string }; onEdit: (id: string) => void; onDelete: (id: string) => void; onStartWorkout: (id: string) => void; }
3. Implement card layout with dark theme:
   - <div className="bg-gray-800 rounded-lg shadow-lg p-6 hover:bg-gray-750 transition-colors">
4. Display routine name: <h3 className="text-xl font-bold text-white mb-2">{routine.name}</h3>
5. Show exercise count with icon: <p className="text-gray-400 mb-4"><span className="inline-block mr-2">💪</span>{routine.exercise_count} exercises</p>
6. Add created date formatted: new Date(routine.created_at).toLocaleDateString()
7. Create action buttons row:
   - Start Workout button (primary): <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded w-full mb-2" onClick={() => onStartWorkout(routine.id)}>Start Workout</button>
   - Edit button: <button className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded mr-2" onClick={() => onEdit(routine.id)}>Edit</button>
   - Delete button: <button className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded" onClick={() => onDelete(routine.id)}>Delete</button>
8. Add TypeScript export: export default RoutineCard
9. Import and use in Routines.tsx, passing callback functions
10. Add hover effects and transitions for better UX

### 4.3. Implement createRoutine service function and create routine modal

**Status:** pending  
**Dependencies:** 4.1  

Build the routine creation functionality with a modal form using Headless UI, including name input validation and database insertion

**Details:**

1. Install Headless UI: npm install @headlessui/react
2. Install React Hook Form for form handling: npm install react-hook-form
3. Create src/services/routines.ts file
4. Implement createRoutine function:
   - export const createRoutine = async (userId: string, name: string): Promise<{ data: any; error: any }> => {
   - Validate name length (1-100 characters)
   - Execute: return await supabase.from('routines').insert({ user_id: userId, name }).select().single()
5. Create src/components/CreateRoutineModal.tsx component
6. Import Headless UI Dialog: import { Dialog, Transition } from '@headlessui/react'
7. Define props: interface CreateRoutineModalProps { isOpen: boolean; onClose: () => void; onSuccess: () => void; }
8. Use React Hook Form: const { register, handleSubmit, formState: { errors }, reset } = useForm<{ name: string }>()
9. Implement onSubmit handler:
   - Get user from useAuth()
   - Call createRoutine(user.id, data.name)
   - Handle success: show toast notification, call onSuccess() to refresh list, reset form, close modal
   - Handle error: display error message
10. Render Dialog with dark theme styling:
    - Backdrop with opacity transition
    - Centered modal panel: <Dialog.Panel className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
    - Input field: <input {...register('name', { required: 'Name is required', maxLength: 100 })} className="w-full bg-gray-700 text-white border border-gray-600 rounded px-4 py-2" />
    - Submit button and Cancel button
11. Add modal state management in Routines.tsx: const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
12. Import and render CreateRoutineModal in Routines.tsx

### 4.4. Create RoutineEditor page with exercise list and drag-and-drop reordering

**Status:** pending  
**Dependencies:** 4.2, 4.3  

Build the routine editor interface for adding, editing, and reordering exercises within a routine using dnd-kit for drag-and-drop functionality

**Details:**

1. Install dnd-kit libraries: npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
2. Create src/pages/RoutineEditor.tsx file
3. Import dependencies: import { useParams } from 'react-router-dom'; import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'; import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
4. Get routineId from URL params: const { routineId } = useParams<{ routineId: string }>()
5. Define Exercise interface: interface Exercise { id: string; routine_id: string; name: string; muscle_group: string | null; machine_info: string | null; target_sets_reps: string | null; media_url: string | null; sort_order: number }
6. Create state: const [exercises, setExercises] = useState<Exercise[]>([]); const [routine, setRoutine] = useState<{ name: string } | null>(null)
7. Fetch routine and exercises on mount:
   - Query routine: supabase.from('routines').select('*').eq('id', routineId).single()
   - Query exercises: supabase.from('exercises').select('*').eq('routine_id', routineId).order('sort_order')
8. Set up dnd-kit sensors: const sensors = useSensors(useSensor(PointerSensor))
9. Implement handleDragEnd function:
   - const { active, over } = event
   - Find old and new index using exercises array
   - Update local state: setExercises(arrayMove(exercises, oldIndex, newIndex))
   - Update sort_order in database for all affected exercises
10. Render DndContext wrapper with vertical sortable list:
    - <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
    - <SortableContext items={exercises.map(e => e.id)} strategy={verticalListSortingStrategy}>
    - Map exercises to SortableExerciseItem components (to be created separately)
11. Add 'Add Exercise' button that opens exercise form modal
12. Implement page header with routine name and back navigation button

### 4.5. Build exercise form with all fields and deleteRoutine functionality

**Status:** pending  
**Dependencies:** 4.3, 4.4  

Create a comprehensive exercise form component with all required fields (name, muscle_group, machine_info, target_sets_reps, media) and implement routine deletion with confirmation modal

**Details:**

1. Create src/components/ExerciseForm.tsx component
2. Define props: interface ExerciseFormProps { routineId: string; exercise?: Exercise; onSuccess: () => void; onCancel: () => void; }
3. Use React Hook Form with default values if editing: const { register, handleSubmit, formState: { errors } } = useForm<ExerciseFormData>({ defaultValues: exercise || {} })
4. Define form fields:
   - name: <input {...register('name', { required: true })} className="w-full bg-gray-700 text-white border border-gray-600 rounded px-4 py-2" />
   - muscle_group: <select {...register('muscle_group')} className="w-full bg-gray-700 text-white border border-gray-600 rounded px-4 py-2"><option value="">Select muscle group</option><option value="Chest">Chest</option><option value="Back">Back</option><option value="Legs">Legs</option><option value="Shoulders">Shoulders</option><option value="Arms">Arms</option><option value="Core">Core</option><option value="Full Body">Full Body</option></select>
   - machine_info: <input {...register('machine_info')} placeholder="e.g., Machine 41" className="w-full bg-gray-700 text-white border border-gray-600 rounded px-4 py-2" />
   - target_sets_reps: <input {...register('target_sets_reps')} placeholder="e.g., 12/10/8" className="w-full bg-gray-700 text-white border border-gray-600 rounded px-4 py-2" />
5. Add media_url field (text input for now, will integrate with MediaUpload component later)
6. Implement onSubmit handler:
   - If exercise prop exists: UPDATE exercises SET ... WHERE id = exercise.id
   - Else: INSERT INTO exercises (routine_id, name, muscle_group, machine_info, target_sets_reps, media_url, sort_order) VALUES (...)
   - sort_order should be max(existing sort_orders) + 1 for new exercises
7. Wrap form in Dialog modal from Headless UI with dark theme
8. Create src/services/routines.ts deleteRoutine function:
   - export const deleteRoutine = async (routineId: string) => { return await supabase.from('routines').delete().eq('id', routineId) }
9. Create DeleteConfirmationModal component:
   - Show routine name: "Are you sure you want to delete [routine name]? This will also delete all exercises."
   - Two buttons: Cancel (gray) and Delete (red)
10. Integrate delete functionality in RoutineCard onDelete callback:
    - Open confirmation modal
    - On confirm: call deleteRoutine, show success message, refresh routine list
11. Handle cascade deletion (exercises automatically deleted due to ON DELETE CASCADE foreign key)
