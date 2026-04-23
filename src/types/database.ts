export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'legs'
  | 'glutes'
  | 'abs'
  | 'forearms'
  | 'calves'
  | 'full_body'

export interface Database {
  public: {
    Tables: {
      routines: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      exercises: {
        Row: {
          id: string
          routine_id: string
          name: string
          muscle_group: MuscleGroup
          machine_info: string | null
          target_sets_reps: string | null
          media_url: string | null
          starting_weight_kg: number | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          routine_id: string
          name: string
          muscle_group: MuscleGroup
          machine_info?: string | null
          target_sets_reps?: string | null
          media_url?: string | null
          starting_weight_kg?: number | null
          sort_order: number
          created_at?: string
        }
        Update: {
          id?: string
          routine_id?: string
          name?: string
          muscle_group?: MuscleGroup
          machine_info?: string | null
          target_sets_reps?: string | null
          media_url?: string | null
          starting_weight_kg?: number | null
          sort_order?: number
          created_at?: string
        }
      }
      workout_logs: {
        Row: {
          id: string
          user_id: string
          exercise_id: string
          weight_kg: number
          reps: number
          comment: string | null
          logged_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          exercise_id: string
          weight_kg: number
          reps: number
          comment?: string | null
          logged_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          exercise_id?: string
          weight_kg?: number
          reps?: number
          comment?: string | null
          logged_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      muscle_group: MuscleGroup
    }
  }
}
