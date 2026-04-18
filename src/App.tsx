import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { queryClient, persister } from './lib/queryClient'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Header from './components/Header'
import AuthPage from './pages/AuthPage'
import RoutinesPage from './pages/RoutinesPage'
import RoutineEditorPage from './pages/RoutineEditorPage'
import WorkoutSessionPage from './pages/WorkoutSessionPage'
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
                  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                    <Header />
                    <Routes>
                      <Route path="/" element={<RoutinesPage />} />
                      <Route path="/routines/:id" element={<RoutineEditorPage />} />
                      <Route path="/routines/:id/workout" element={<WorkoutSessionPage />} />
                    </Routes>
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
