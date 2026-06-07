import { routines as routinesApi, exercises as exercisesApi } from './api';
import { seedRoutines } from '../data/seedWorkouts';

export async function importSeedData(): Promise<{ imported: number; skipped: number }> {
  const existing = await routinesApi.list();
  const existingNames = new Set((existing ?? []).map((r) => r.name));

  let imported = 0;
  let skipped = 0;

  for (const seed of seedRoutines) {
    if (existingNames.has(seed.name)) {
      skipped++;
      continue;
    }

    const routine = await routinesApi.create(seed.name);
    if (!routine) throw new Error(`Failed to create routine "${seed.name}"`);

    const exList = seed.exercises.map((ex, index) => ({
      routine_id: routine.id,
      name: ex.name,
      muscle_group: ex.muscle_group,
      machine_info: ex.machine_info ?? null,
      target_sets_reps: ex.target_sets_reps ?? null,
      sort_order: index,
    }));

    for (const ex of exList) {
      await exercisesApi.create(ex);
    }

    imported++;
  }

  return { imported, skipped };
}
