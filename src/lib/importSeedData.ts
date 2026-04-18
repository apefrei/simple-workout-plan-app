import { supabase } from './supabase'
import { seedRoutines } from '../data/seedWorkouts'

export async function importSeedData(userId: string): Promise<{ imported: number; skipped: number }> {
  // Fetch existing routine names for this user to avoid duplicates
  const { data: existing, error: fetchErr } = await supabase
    .from('routines')
    .select('name')
    .eq('user_id', userId)

  if (fetchErr) throw new Error(`Failed to check existing routines: ${fetchErr.message}`)

  const existingNames = new Set((existing ?? []).map((r) => r.name))

  let imported = 0
  let skipped = 0

  for (const seed of seedRoutines) {
    if (existingNames.has(seed.name)) {
      skipped++
      continue
    }

    // Insert routine
    const { data: routine, error: routineErr } = await supabase
      .from('routines')
      .insert({ name: seed.name, user_id: userId })
      .select('id')
      .single()

    if (routineErr) throw new Error(`Failed to create routine "${seed.name}": ${routineErr.message}`)

    // Insert exercises
    const exercises = seed.exercises.map((ex, index) => ({
      routine_id: routine.id,
      name: ex.name,
      muscle_group: ex.muscle_group,
      machine_info: ex.machine_info ?? null,
      target_sets_reps: ex.target_sets_reps ?? null,
      sort_order: index,
    }))

    const { error: exErr } = await supabase.from('exercises').insert(exercises)

    if (exErr) throw new Error(`Failed to add exercises for "${seed.name}": ${exErr.message}`)

    imported++
  }

  return { imported, skipped }
}
