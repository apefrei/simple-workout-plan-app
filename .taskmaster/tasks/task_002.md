# Task ID: 2

**Title:** Configure Supabase backend with database schema

**Status:** pending

**Dependencies:** 1

**Priority:** high

**Description:** Set up Supabase project, create database schema (routines, exercises, workout_logs), configure RLS and Storage bucket.

**Details:**

1. Create Supabase project, install client, create .env.local and supabase.ts
2. Create tables with foreign keys, constraints, and indexes
3. Enable RLS: users can only access own data
4. Create Storage bucket 'exercise-media' (public read, auth upload, 10MB, JPG/GIF)

**Test Strategy:**

Verify: Client connects, tables exist, RLS blocks unauthorized access, Storage works

## Subtasks

### 2.1. Create Supabase project and initialize client

**Status:** pending
**Dependencies:** None

Create project on supabase.com. Install client packages. Create .env.local and src/services/supabase.ts with createClient().

### 2.2. Create database schema

**Status:** pending
**Dependencies:** 2.1

Create tables: routines, exercises (with muscle_group CHECK constraint using English values), workout_logs. Add performance indexes.

### 2.3. Enable Row Level Security

**Status:** pending
**Dependencies:** 2.2

Enable RLS on all tables. Routines/workout_logs: auth.uid() = user_id. Exercises: via JOIN to routines.user_id.

### 2.4. Configure Storage bucket

**Status:** pending
**Dependencies:** 2.1

Create 'exercise-media' bucket (public, 10MB, JPG/GIF). Policies: auth upload, public read, owner delete.
