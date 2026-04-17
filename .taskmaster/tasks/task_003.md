# Task ID: 3

**Title:** Implement authentication flow with Supabase Auth

**Status:** pending

**Dependencies:** 2

**Priority:** high

**Description:** Create login/signup with email auth, protected routes, session management, and sign-out.

**Details:**

1. Install react-router-dom, configure public and protected routes
2. Create AuthContext with session state and onAuthStateChange
3. Create Auth.tsx with Supabase Auth UI (dark theme, email only)
4. Create ProtectedRoute and Header (with sign-out) components

**Test Strategy:**

Verify: Sign up/login works, protected routes redirect, logout clears session, refresh maintains auth

## Subtasks

### 3.1. Install react-router-dom and configure routes

**Status:** pending
**Dependencies:** None

Define routes: /auth (public), /routines, /workout/:routineId, /routine/:routineId/edit (protected). Create placeholder pages.

### 3.2. Create AuthContext with session management

**Status:** pending
**Dependencies:** 3.1

AuthContext with session/user/loading. Subscribe to onAuthStateChange. signOut function. useAuth hook. Wrap app with AuthProvider.

### 3.3. Build Auth page with Supabase Auth UI

**Status:** pending
**Dependencies:** 3.2

Auth.tsx with Supabase Auth UI (dark theme, email only). Redirect to /routines if authenticated.

### 3.4. Create ProtectedRoute and Header components

**Status:** pending
**Dependencies:** 3.2

ProtectedRoute: redirect to /auth if unauthenticated. Header: user email + sign-out button. Include Header in ProtectedRoute layout.
