import type { RoutineHistory } from '../hooks/useWorkoutHistory'
import type { WorkoutLog } from '../hooks/useWorkoutLogs'

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}.${month}.${year.slice(2)}`
}

function findLogForDate(logs: WorkoutLog[], date: string): WorkoutLog | undefined {
  return logs.find((log) => log.logged_at.startsWith(date))
}

export default function RoutineHistoryTable({ routine, exercises, logDates }: RoutineHistory) {
  return (
    <div className="mb-6">
      <h2 className="mb-2 px-4 text-lg font-semibold text-gray-800 dark:text-gray-100">
        {routine.name}
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
              <th className="sticky left-0 z-10 bg-gray-100 px-2 py-2 text-left font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                Nr.
              </th>
              <th className="sticky left-8 z-10 bg-gray-100 px-2 py-2 text-left font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                Übung
              </th>
              <th className="px-2 py-2 text-left font-medium text-gray-600 dark:text-gray-400">
                Gerät/Info
              </th>
              <th className="px-2 py-2 text-left font-medium text-gray-600 dark:text-gray-400">
                Sätze/Wdh.
              </th>
              {logDates.map((date) => (
                <th
                  key={date}
                  className="whitespace-nowrap px-2 py-2 text-center font-medium text-gray-600 dark:text-gray-400"
                >
                  {formatDate(date)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {exercises.map((ew, idx) => (
              <tr
                key={ew.exercise.id}
                className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
              >
                <td className="sticky left-0 z-10 bg-white px-2 py-2 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                  {idx + 1}
                </td>
                <td className="sticky left-8 z-10 bg-white px-2 py-2 font-medium text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                  {ew.exercise.name}
                </td>
                <td className="px-2 py-2 text-gray-600 dark:text-gray-400">
                  {ew.exercise.machine_info || '-'}
                </td>
                <td className="px-2 py-2 text-gray-600 dark:text-gray-400">
                  {ew.exercise.target_sets_reps || '-'}
                </td>
                {logDates.map((date) => {
                  const log = findLogForDate(ew.logs, date)
                  return (
                    <td
                      key={date}
                      className="whitespace-nowrap px-2 py-2 text-center text-gray-700 dark:text-gray-300"
                    >
                      {log ? `${log.weight_kg}kg × ${log.reps}` : '-'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
