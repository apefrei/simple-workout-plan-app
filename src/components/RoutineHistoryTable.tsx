import type { RoutineHistory } from '../hooks/useWorkoutHistory';
import type { WorkoutLog } from '../hooks/useWorkoutLogs';

const COLOR_THEMES = [
  {
    accent: 'bg-blue-500',
    accentLight: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    headerBg: 'bg-blue-50 dark:bg-blue-900/30',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  {
    accent: 'bg-emerald-500',
    accentLight: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    headerBg: 'bg-emerald-50 dark:bg-emerald-900/30',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  },
  {
    accent: 'bg-purple-500',
    accentLight: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-700 dark:text-purple-300',
    headerBg: 'bg-purple-50 dark:bg-purple-900/30',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  },
  {
    accent: 'bg-amber-500',
    accentLight: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-300',
    headerBg: 'bg-amber-50 dark:bg-amber-900/30',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  },
  {
    accent: 'bg-rose-500',
    accentLight: 'bg-rose-50 dark:bg-rose-900/20',
    text: 'text-rose-700 dark:text-rose-300',
    headerBg: 'bg-rose-50 dark:bg-rose-900/30',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
  },
  {
    accent: 'bg-cyan-500',
    accentLight: 'bg-cyan-50 dark:bg-cyan-900/20',
    text: 'text-cyan-700 dark:text-cyan-300',
    headerBg: 'bg-cyan-50 dark:bg-cyan-900/30',
    badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
  },
];

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}.${month}.${year.slice(2)}`;
}

function findLogForDate(logs: WorkoutLog[], date: string): WorkoutLog | undefined {
  return logs.find((log) => log.logged_at.startsWith(date));
}

interface Props extends RoutineHistory {
  colorIndex: number;
}

export default function RoutineHistoryTable({ routine, exercises, logDates, colorIndex }: Props) {
  const theme = COLOR_THEMES[colorIndex % COLOR_THEMES.length];

  return (
    <div>
      {/* Header with color accent */}
      <div className={`flex items-center gap-3 px-4 py-3 ${theme.headerBg}`}>
        <div className={`h-8 w-1.5 rounded-full ${theme.accent}`} />
        <div className="flex-1">
          <h2 className={`text-lg font-bold ${theme.text}`}>{routine.name}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {exercises.length} {exercises.length === 1 ? 'Übung' : 'Übungen'} &middot;{' '}
            {logDates.length} {logDates.length === 1 ? 'Eintrag' : 'Einträge'}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px] border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="sticky left-0 z-10 bg-white px-3 py-2.5 text-left font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                Übung
              </th>
              <th className="px-3 py-2.5 text-left font-semibold text-gray-500 dark:text-gray-400">
                Ziel
              </th>
              {logDates.map((date) => (
                <th
                  key={date}
                  className="whitespace-nowrap px-3 py-2.5 text-center font-semibold text-gray-500 dark:text-gray-400"
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
                className={`border-b border-gray-100 transition-colors dark:border-gray-700/50 ${
                  idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'
                } hover:${theme.accentLight}`}
              >
                <td className="sticky left-0 z-10 px-3 py-2.5 bg-inherit">
                  <div className="font-medium text-gray-800 dark:text-gray-200">
                    {ew.exercise.name}
                  </div>
                  {ew.exercise.machine_info && (
                    <div className="text-[10px] text-gray-400 dark:text-gray-500">
                      {ew.exercise.machine_info}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  {ew.exercise.target_sets_reps ? (
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${theme.badge}`}
                    >
                      {ew.exercise.target_sets_reps}
                    </span>
                  ) : (
                    <span className="text-gray-300 dark:text-gray-600">-</span>
                  )}
                </td>
                {logDates.map((date) => {
                  const log = findLogForDate(ew.logs, date);
                  return (
                    <td key={date} className="whitespace-nowrap px-3 py-2.5 text-center">
                      {log ? (
                        <div>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">
                            {log.weight_kg}kg
                          </span>
                          <span className="text-gray-400 dark:text-gray-500"> x </span>
                          <span className="text-gray-600 dark:text-gray-300">{log.reps}</span>
                        </div>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
