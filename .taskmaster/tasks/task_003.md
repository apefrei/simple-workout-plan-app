# Task ID: 3

**Title:** Implement authentication flow with Supabase Auth

**Status:** pending

**Dependencies:** 2

**Priority:** high

**Description:** Create login/signup pages with email authentication, protected routes, and session management

**Details:**

1. Create src/contexts/AuthContext.tsx using React Context API to manage auth state
2. Use Supabase's onAuthStateChange to track session changes
3. Create src/pages/Auth.tsx with Supabase Auth UI component for magic link/password login
4. Install react-router-dom: `npm install react-router-dom`
5. Create ProtectedRoute component that redirects to /auth if not authenticated
6. Configure routes in App.tsx: /auth (public), /routines, /workout/:id (protected)
7. Implement signOut functionality in header/nav component
8. Store user session in localStorage for persistence
9. Add loading state while checking authentication status
10. Style auth page with Tailwind dark theme (bg-gray-900, text-white)

**Test Strategy:**

Test: Sign up with new email creates user in Supabase, login redirects to /routines, protected routes redirect unauthenticated users to /auth, logout clears session, page refresh maintains authentication state

## Subtasks

### 3.1. Install react-router-dom and configure routing structure in App.tsx

**Status:** pending  
**Dependencies:** None  

Set up client-side routing with React Router v6, define public and protected route paths, and create the basic routing configuration

**Details:**

1. Install react-router-dom: `npm install react-router-dom@^6.21.0`
2. Install TypeScript types: `npm install -D @types/react-router-dom`
3. Open src/App.tsx and import routing components: import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
4. Wrap the app with <BrowserRouter> in the return statement
5. Define route structure:
   - /auth (public) - will render Auth page for login/signup
   - / (public) - redirect to /auth if not authenticated, /routines if authenticated
   - /routines (protected) - main dashboard listing routines
   - /workout/:routineId (protected) - workout session page
   - /routine/:routineId/edit (protected) - routine editor page
6. Create placeholder page components in src/pages/:
   - Auth.tsx (export default function Auth() { return <div>Auth Page</div> })
   - Routines.tsx
   - WorkoutSession.tsx
7. Import and render these pages in <Routes> component
8. Test navigation by manually changing URL in browser
9. Verify TypeScript compilation succeeds with no errors
10. Note: ProtectedRoute wrapper will be implemented in next subtask

### 3.2. Create AuthContext with session state management and Supabase auth listeners

**Status:** pending  
**Dependencies:** 3.1  

Build React Context provider to manage authentication state globally, listen to Supabase auth changes, and provide auth utilities to all components

**Details:**

1. Create src/contexts/AuthContext.tsx file
2. Import dependencies: import { createContext, useContext, useEffect, useState, ReactNode } from 'react'; import { Session, User } from '@supabase/supabase-js'; import { supabase } from '@/services/supabase';
3. Define TypeScript interface:
   interface AuthContextType {
     session: Session | null;
     user: User | null;
     loading: boolean;
     signOut: () => Promise<void>;
   }
4. Create context: const AuthContext = createContext<AuthContextType | undefined>(undefined)
5. Implement AuthProvider component:
   - State: const [session, setSession] = useState<Session | null>(null)
   - State: const [loading, setLoading] = useState(true)
   - Derived: const user = session?.user ?? null
6. Add useEffect to subscribe to auth changes:
   - Call supabase.auth.getSession() on mount to restore session
   - Subscribe with supabase.auth.onAuthStateChange((event, session) => { setSession(session); setLoading(false); })
   - Return cleanup function to unsubscribe
7. Implement signOut function: const signOut = async () => { await supabase.auth.signOut(); setSession(null); }
8. Return context provider with value: { session, user, loading, signOut }
9. Export custom hook: export const useAuth = () => { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used within AuthProvider'); return context; }
10. Wrap App.tsx content with <AuthProvider> in main.tsx or App.tsx

### 3.3. Build Auth.tsx page with Supabase Auth UI for email authentication

**Status:** pending  
**Dependencies:** 3.2  

Create the login/signup page using Supabase's pre-built Auth UI components with email/password and magic link authentication methods

**Details:**

1. Open src/pages/Auth.tsx and clear placeholder content
2. Import dependencies: import { Auth as SupabaseAuth } from '@supabase/auth-ui-react'; import { ThemeSupa } from '@supabase/auth-ui-shared'; import { supabase } from '@/services/supabase'; import { useAuth } from '@/contexts/AuthContext'; import { Navigate } from 'react-router-dom';
3. Use useAuth hook to get session and loading state
4. Add redirect logic: if (loading) return loading spinner, if (session) return <Navigate to="/routines" replace />
5. Render page container with dark theme Tailwind classes: <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
6. Add centered card container: <div className="w-full max-w-md bg-gray-800 p-8 rounded-lg shadow-xl">
7. Add app branding header: <h1 className="text-3xl font-bold text-white text-center mb-8">Workout Plan PWA</h1>
8. Render SupabaseAuth component:
   - supabaseClient={supabase}
   - appearance={{ theme: ThemeSupa, variables: { default: { colors: { brand: '#3B82F6', brandAccent: '#2563EB' } } } }}
   - providers={[]} (disable OAuth for MVP, email only)
   - theme="dark"
   - redirectTo={window.location.origin + '/routines'}
9. Add footer text with instructions: <p className="text-gray-400 text-sm text-center mt-6">Sign in with email or create a new account</p>
10. Test magic link and password authentication flows

### 3.4. Create ProtectedRoute component with authentication checks and redirects

**Status:** pending  
**Dependencies:** 3.2  

Build a wrapper component that protects routes from unauthenticated access by checking auth state and redirecting to login page

**Details:**

1. Create src/components/ProtectedRoute.tsx file
2. Import dependencies: import { Navigate, Outlet } from 'react-router-dom'; import { useAuth } from '@/contexts/AuthContext';
3. Define component that accepts no props (uses Outlet for nested routes)
4. Use useAuth hook to get session and loading state: const { session, loading } = useAuth();
5. Implement loading state: if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><div className="text-white">Loading...</div></div>
6. Implement redirect logic: if (!session) return <Navigate to="/auth" replace />
7. If authenticated, render child routes: return <Outlet />
8. Add TypeScript export: export default ProtectedRoute
9. Update src/App.tsx routing to wrap protected routes:
   - Import ProtectedRoute
   - Wrap /routines and /workout/:routineId routes with <Route element={<ProtectedRoute />}>
   - Use nested <Route> elements inside for protected paths
10. Add layout wrapper to ProtectedRoute that includes header with sign out button (optional for this subtask, can be separate component later)

### 3.5. Implement sign out functionality with header component and navigation

**Status:** pending  
**Dependencies:** 3.3, 3.4  

Create a persistent header or navigation component with sign out button, display user email, and handle logout with proper session cleanup

**Details:**

1. Create src/components/Header.tsx component
2. Import dependencies: import { useAuth } from '@/contexts/AuthContext'; import { useNavigate } from 'react-router-dom';
3. Get auth utilities: const { user, signOut } = useAuth(); const navigate = useNavigate();
4. Implement handleSignOut function:
   - Call await signOut()
   - Navigate to '/auth' using navigate('/auth', { replace: true })
   - Wrap in try-catch, log errors to console
5. Design header layout with Tailwind:
   - <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
   - Flex container with space-between for app name and user controls
   - Left: App name/logo <h1 className="text-xl font-bold text-white">Workout Plan</h1>
   - Right: User email (if available) and sign out button
6. User info display: {user?.email && <span className="text-gray-400 text-sm mr-4">{user.email}</span>}
7. Sign out button: <button onClick={handleSignOut} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors">Sign Out</button>
8. Import Header in ProtectedRoute.tsx and render above <Outlet />:
   - return (<><Header /><Outlet /></>)
9. Verify header appears on all protected routes (/routines, /workout/:id)
10. Optional: Add loading state to button during sign out, disable button to prevent double-clicks
