# Task ID: 2

**Title:** Configure Supabase backend with authentication and database schema

**Status:** pending

**Dependencies:** 1

**Priority:** high

**Description:** Set up Supabase project, configure authentication, and create PostgreSQL schema for users, routines, exercises, and workout_logs

**Details:**

1. Create Supabase project at supabase.com
2. Install Supabase client: `npm install @supabase/supabase-js @supabase/auth-ui-react @supabase/auth-ui-shared`
3. Create .env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
4. Create src/services/supabase.ts client initialization using createClient()
5. Execute SQL schema:
   - CREATE TABLE routines (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID REFERENCES auth.users NOT NULL, name TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW());
   - CREATE TABLE exercises (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), routine_id UUID REFERENCES routines ON DELETE CASCADE, name TEXT NOT NULL, muscle_group TEXT, machine_info TEXT, target_sets_reps TEXT, media_url TEXT, sort_order INTEGER DEFAULT 0);
   - CREATE TABLE workout_logs (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID REFERENCES auth.users NOT NULL, exercise_id UUID REFERENCES exercises, date DATE DEFAULT CURRENT_DATE, weight_used DECIMAL(5,2), reps_completed INTEGER, user_comment TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
6. Enable Row Level Security (RLS) policies: users can only read/write their own data
7. Set up Storage bucket 'exercise-media' for JPG/GIF uploads with public read access
8. Create database indexes on user_id, routine_id, exercise_id for query performance

**Test Strategy:**

Verify: Supabase client connects successfully, tables exist in Supabase dashboard, RLS policies prevent unauthorized access, can upload test image to Storage bucket, queries execute without errors

## Subtasks

### 2.1. Create Supabase project and install client dependencies

**Status:** pending  
**Dependencies:** None  

Set up a new Supabase project through the web dashboard and install the required Supabase client libraries for authentication and database access

**Details:**

1. Navigate to https://supabase.com and create a new account or sign in
2. Click 'New Project' and configure:
   - Organization: Create new or select existing
   - Project name: 'workout-plan-pwa' (or preferred name)
   - Database password: Generate strong password and save securely
   - Region: Select closest to target users (e.g., 'West EU (London)' for Europe)
   - Pricing plan: Select 'Free' tier for development
3. Wait for project provisioning (typically 2-3 minutes)
4. Once ready, navigate to Project Settings > API to find:
   - Project URL (format: https://xxxxx.supabase.co)
   - anon/public API key (starts with 'eyJ...')
5. Install Supabase client packages:
   - Run: npm install @supabase/supabase-js@^2.39.0
   - Run: npm install @supabase/auth-ui-react@^0.4.7 @supabase/auth-ui-shared@^0.1.8
6. Verify installation in package.json shows correct versions
7. Note: @supabase/supabase-js is the core client, auth-ui packages provide pre-built auth components
8. Keep Supabase dashboard tab open for next configuration steps

### 2.2. Configure environment variables and initialize Supabase client

**Status:** pending  
**Dependencies:** 2.1  

Set up environment variables for Supabase credentials and create the TypeScript client initialization file with proper typing

**Details:**

1. Create .env.local file in project root (this file should be in .gitignore)
2. Add Supabase credentials from dashboard:
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJxxx...your-anon-key
3. Verify .gitignore contains .env.local to prevent committing secrets
4. Create src/services/supabase.ts file
5. Import Supabase client: import { createClient } from '@supabase/supabase-js'
6. Add environment variable type safety:
   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string
7. Add validation to throw error if env vars missing:
   if (!supabaseUrl || !supabaseAnonKey) { throw new Error('Missing Supabase environment variables') }
8. Initialize and export client:
   export const supabase = createClient(supabaseUrl, supabaseAnonKey)
9. Add JSDoc comment explaining usage: /** Supabase client instance for database and auth operations */
10. Create src/types/database.types.ts placeholder for generated types (will be populated after schema creation)

### 2.3. Create database schema with tables for routines, exercises, and workout logs

**Status:** pending  
**Dependencies:** 2.2  

Execute SQL commands in Supabase SQL Editor to create the core database tables with proper relationships, constraints, and indexes

**Details:**

1. Open Supabase dashboard > SQL Editor > New Query
2. Enable UUID extension (required for uuid_generate_v4()):
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
3. Create routines table:
   CREATE TABLE routines (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
     name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
     created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
   );
4. Create exercises table with foreign key to routines:
   CREATE TABLE exercises (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     routine_id UUID REFERENCES routines(id) ON DELETE CASCADE NOT NULL,
     name TEXT NOT NULL CHECK (char_length(name) >= 1),
     muscle_group TEXT CHECK (muscle_group IN ('Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body')),
     machine_info TEXT,
     target_sets_reps TEXT,
     media_url TEXT,
     sort_order INTEGER DEFAULT 0 NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
   );
5. Create workout_logs table:
   CREATE TABLE workout_logs (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
     exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL,
     date DATE DEFAULT CURRENT_DATE NOT NULL,
     weight_used DECIMAL(6,2) CHECK (weight_used >= 0),
     reps_completed INTEGER CHECK (reps_completed >= 0 AND reps_completed <= 1000),
     user_comment TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
   );
6. Create performance indexes:
   CREATE INDEX idx_routines_user_id ON routines(user_id);
   CREATE INDEX idx_exercises_routine_id ON exercises(routine_id);
   CREATE INDEX idx_exercises_sort_order ON exercises(routine_id, sort_order);
   CREATE INDEX idx_workout_logs_user_date ON workout_logs(user_id, date DESC);
   CREATE INDEX idx_workout_logs_exercise ON workout_logs(exercise_id, date DESC);
7. Run the query and verify 'Success' message
8. Navigate to Table Editor to visually confirm all tables exist with correct columns

### 2.4. Enable Row Level Security policies for multi-tenant data isolation

**Status:** pending  
**Dependencies:** 2.3  

Configure RLS policies on all tables to ensure users can only access their own data, implementing secure multi-tenant architecture

**Details:**

1. In Supabase dashboard > Authentication > Policies, enable RLS on all tables:
   - Click 'routines' table > Enable RLS
   - Click 'exercises' table > Enable RLS
   - Click 'workout_logs' table > Enable RLS
2. Create RLS policy for routines table:
   - Policy name: 'Users can manage their own routines'
   - Allowed operations: SELECT, INSERT, UPDATE, DELETE
   - USING expression: (auth.uid() = user_id)
   - WITH CHECK expression: (auth.uid() = user_id)
3. Create RLS policy for exercises table (via routines relationship):
   - Policy name: 'Users can manage exercises in their routines'
   - Allowed operations: SELECT, INSERT, UPDATE, DELETE
   - USING expression: EXISTS (SELECT 1 FROM routines WHERE routines.id = exercises.routine_id AND routines.user_id = auth.uid())
   - WITH CHECK expression: EXISTS (SELECT 1 FROM routines WHERE routines.id = exercises.routine_id AND routines.user_id = auth.uid())
4. Create RLS policy for workout_logs table:
   - Policy name: 'Users can manage their own workout logs'
   - Allowed operations: SELECT, INSERT, UPDATE, DELETE
   - USING expression: (auth.uid() = user_id)
   - WITH CHECK expression: (auth.uid() = user_id)
5. Alternative SQL approach (more efficient):
   -- For routines:
   CREATE POLICY "Users manage own routines" ON routines FOR ALL USING (auth.uid() = user_id);
   -- For exercises:
   CREATE POLICY "Users manage own exercises" ON exercises FOR ALL USING (EXISTS (SELECT 1 FROM routines WHERE routines.id = exercises.routine_id AND routines.user_id = auth.uid()));
   -- For workout_logs:
   CREATE POLICY "Users manage own logs" ON workout_logs FOR ALL USING (auth.uid() = user_id);
6. Test RLS by attempting query without auth (should return empty, not error)
7. Verify policies appear in Table Editor under 'Policies' tab for each table

### 2.5. Configure Storage bucket for exercise media uploads with public access

**Status:** pending  
**Dependencies:** 2.2  

Set up Supabase Storage bucket for JPG and GIF exercise demonstration media with appropriate security policies and public read access

**Details:**

1. Navigate to Supabase dashboard > Storage
2. Click 'Create a new bucket'
3. Configure bucket settings:
   - Name: 'exercise-media'
   - Public bucket: Toggle ON (enables public read access for URLs)
   - File size limit: 10485760 (10MB in bytes)
   - Allowed MIME types: image/jpeg, image/jpg, image/gif
4. Click 'Create bucket'
5. Configure storage policies for the bucket:
   - Click 'Policies' tab under exercise-media bucket
   - Create policy for INSERT:
     * Policy name: 'Authenticated users can upload media'
     * Allowed operation: INSERT
     * Policy definition: (auth.role() = 'authenticated')
   - Create policy for SELECT (public read):
     * Policy name: 'Public read access'
     * Allowed operation: SELECT
     * Policy definition: true
   - Create policy for DELETE:
     * Policy name: 'Users can delete their own media'
     * Allowed operation: DELETE
     * Policy definition: (auth.uid()::text = (storage.foldername(name))[1])
6. Create folder structure pattern: user_id/exercise_id/filename.jpg
7. Configure CORS if needed (usually not required for same-origin requests)
8. Test upload using Supabase dashboard: upload test image manually
9. Verify public URL generation works: get public URL and open in new tab
10. Document storage URL pattern for frontend: https://xxxxx.supabase.co/storage/v1/object/public/exercise-media/{user_id}/{exercise_id}/{filename}
