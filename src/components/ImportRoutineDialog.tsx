import { useState } from 'react';
import type { MuscleGroup } from '../types/database';

export interface AIPlan {
  routineName: string;
  exercises: {
    name: string;
    muscleGroup: string;
    sets?: string;
    weight?: number;
  }[];
}

const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'legs',
  'glutes',
  'abs',
  'forearms',
  'calves',
  'full_body',
];

const MUSCLE_GROUP_MAP: Record<string, MuscleGroup> = {
  chest: 'chest',
  pectorals: 'chest',
  pecs: 'chest',
  back: 'back',
  lats: 'back',
  'upper back': 'back',
  'lower back': 'back',
  shoulders: 'shoulders',
  delts: 'shoulders',
  deltoids: 'shoulders',
  biceps: 'biceps',
  bis: 'biceps',
  triceps: 'triceps',
  tris: 'triceps',
  legs: 'legs',
  quads: 'legs',
  quadriceps: 'legs',
  hamstrings: 'legs',
  glutes: 'glutes',
  gluteus: 'glutes',
  abs: 'abs',
  core: 'abs',
  abdominals: 'abs',
  forearms: 'forearms',
  calves: 'calves',
  'full body': 'full_body',
  full_body: 'full_body',
  compound: 'full_body',
};

function mapMuscleGroup(raw: string): MuscleGroup {
  const normalized = raw.toLowerCase().trim();
  return MUSCLE_GROUP_MAP[normalized] ?? 'full_body';
}

interface Props {
  plan: AIPlan;
  onImport: (
    plan: AIPlan & {
      exercises: { name: string; muscleGroup: MuscleGroup; sets?: string; weight?: number }[];
    }
  ) => void;
  onCancel: () => void;
  isImporting: boolean;
}

export default function ImportRoutineDialog({ plan, onImport, onCancel, isImporting }: Props) {
  const [exercises, setExercises] = useState(
    plan.exercises.map((e) => ({
      name: e.name,
      muscleGroup: mapMuscleGroup(e.muscleGroup),
      sets: e.sets,
      weight: e.weight,
    }))
  );

  const handleMuscleGroupChange = (index: number, value: MuscleGroup) => {
    setExercises((prev) => prev.map((e, i) => (i === index ? { ...e, muscleGroup: value } : e)));
  };

  const handleImport = () => {
    onImport({ routineName: plan.routineName, exercises });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold">Import Routine</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Create &ldquo;{plan.routineName}&rdquo; with {exercises.length} exercises
        </p>

        <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
          {exercises.map((ex, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-lg border border-gray-200 p-2 dark:border-gray-700"
            >
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{ex.name}</p>
                <p className="text-xs text-gray-400">
                  {ex.sets ?? '3x10'}
                  {ex.weight ? ` @ ${ex.weight}kg` : ''}
                </p>
              </div>
              <select
                value={ex.muscleGroup}
                onChange={(e) => handleMuscleGroupChange(i, e.target.value as MuscleGroup)}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700"
              >
                {MUSCLE_GROUPS.map((mg) => (
                  <option key={mg} value={mg}>
                    {mg.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={onCancel}
            disabled={isImporting}
            className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium transition hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={isImporting}
            className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {isImporting ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Extract a valid AIPlan from an AI response string, or return null. */
// eslint-disable-next-line react-refresh/only-export-components
export function extractPlan(text: string): AIPlan | null {
  // Try code-fenced JSON first
  const fencedMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  const jsonStr = fencedMatch ? fencedMatch[1] : tryInlineJson(text);
  if (!jsonStr) return null;

  try {
    const parsed = JSON.parse(jsonStr.trim());
    if (
      typeof parsed.routineName === 'string' &&
      Array.isArray(parsed.exercises) &&
      parsed.exercises.length > 0 &&
      parsed.exercises.every(
        (e: Record<string, unknown>) =>
          typeof e.name === 'string' && typeof e.muscleGroup === 'string'
      )
    ) {
      return parsed as AIPlan;
    }
  } catch {
    // Not valid JSON
  }

  return null;
}

function tryInlineJson(text: string): string | null {
  // Find the outermost { ... } that looks like a plan
  const start = text.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') depth--;
    if (depth === 0) return text.slice(start, i + 1);
  }
  return null;
}
