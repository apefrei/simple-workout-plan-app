import type { RoutineWithExercises } from '../hooks/useRoutines'

interface RoutineCardProps {
  routine: RoutineWithExercises
  onOpen: (id: string) => void
  onDelete: (id: string) => void
}

const MUSCLE_GROUP_COLORS: Record<string, string> = {
  chest: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  back: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  shoulders: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  biceps: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  triceps: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  legs: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  glutes: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
  abs: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  forearms: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  calves: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  full_body: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
}

export default function RoutineCard({ routine, onOpen, onDelete }: RoutineCardProps) {
  const muscleGroups = [...new Set(routine.exercises.map((e) => e.muscle_group))]

  return (
    <div
      className="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
      onClick={() => onOpen(routine.id)}
    >
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold">{routine.name}</h3>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(routine.id)
          }}
          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30"
          title="Delete routine"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {routine.exercises.length} exercise{routine.exercises.length !== 1 ? 's' : ''}
      </p>

      {muscleGroups.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {muscleGroups.map((mg) => (
            <span
              key={mg}
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${MUSCLE_GROUP_COLORS[mg] ?? 'bg-gray-100 text-gray-600'}`}
            >
              {mg.replace('_', ' ')}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
