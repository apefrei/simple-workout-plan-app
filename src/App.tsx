import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { queryClient, persister } from './lib/queryClient'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import AuthPage from './pages/AuthPage'
import RoutinesPage from './pages/RoutinesPage'
import RoutineEditorPage from './pages/RoutineEditorPage'
import WorkoutSessionPage from './pages/WorkoutSessionPage'
import SettingsPage from './pages/SettingsPage'
import OfflineIndicator from './components/OfflineIndicator'

function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <BrowserRouter>
        <AuthProvider>
          <OfflineIndicator />
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <div className="flex min-h-screen flex-col bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                    <Header />
                    <main className="flex-1 pb-20">
                      <Routes>
                        <Route path="/" element={<RoutinesPage />} />
                        <Route path="/routines/:id" element={<RoutineEditorPage />} />
                        <Route path="/routines/:id/workout" element={<WorkoutSessionPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                      </Routes>
                    </main>
                    <BottomNav />
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </PersistQueryClientProvider>
  )
}

export default App
