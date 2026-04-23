import { useWorkoutHistory } from '../hooks/useWorkoutHistory'
import RoutineHistoryTable from '../components/RoutineHistoryTable'

export default function WorkoutHistoryPage() {
  const { data: history, isLoading } = useWorkoutHistory()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  const hasLogs = history?.some((r) => r.logDates.length > 0)

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-800 dark:text-gray-100">
        Trainingshistorie
      </h1>

      {!hasLogs ? (
        <div className="rounded-xl bg-white p-8 text-center shadow dark:bg-gray-800">
          <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
            Noch keine Trainingseinträge vorhanden.
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Starte dein erstes Workout, um deine Historie aufzubauen!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {history?.reduce<{ elements: React.ReactNode[]; colorIdx: number }>(
            (acc, routineHistory) => {
              if (routineHistory.logDates.length === 0) return acc
              acc.elements.push(
                <div
                  key={routineHistory.routine.id}
                  className="overflow-hidden rounded-xl bg-white shadow dark:bg-gray-800"
                >
                  <RoutineHistoryTable {...routineHistory} colorIndex={acc.colorIdx} />
                </div>
              )
              acc.colorIdx++
              return acc
            },
            { elements: [], colorIdx: 0 },
          ).elements}
        </div>
      )}
    </div>
  )
}
