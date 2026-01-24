export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          completed: boolean | null
          completed_at: string | null
          current_value: number | null
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean | null
          completed_at?: string | null
          current_value?: number | null
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean | null
          completed_at?: string | null
          current_value?: number | null
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          challenge_type: string
          created_at: string
          description: string | null
          end_date: string
          id: string
          is_active: boolean | null
          start_date: string
          target_unit: string | null
          target_value: number | null
          title: string
        }
        Insert: {
          challenge_type: string
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          start_date: string
          target_unit?: string | null
          target_value?: number | null
          title: string
        }
        Update: {
          challenge_type?: string
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          start_date?: string
          target_unit?: string | null
          target_value?: number | null
          title?: string
        }
        Relationships: []
      }
      daily_priorities: {
        Row: {
          category: string | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          date: string
          description: string | null
          id: string
          priority_order: number
          title: string
          user_id: string
        }
        Insert: {
          category?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          priority_order: number
          title: string
          user_id: string
        }
        Update: {
          category?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          priority_order?: number
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_states: {
        Row: {
          created_at: string | null
          date: string
          energy_level: number | null
          id: string
          is_rest_day: boolean | null
          mood: number | null
          notes: string | null
          sleep_hours: number | null
          sleep_quality: number | null
          soreness_level: number | null
          stress_level: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          energy_level?: number | null
          id?: string
          is_rest_day?: boolean | null
          mood?: number | null
          notes?: string | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          soreness_level?: number | null
          stress_level?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          energy_level?: number | null
          id?: string
          is_rest_day?: boolean | null
          mood?: number | null
          notes?: string | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          soreness_level?: number | null
          stress_level?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      exercise_logs: {
        Row: {
          created_at: string | null
          exercise_id: string
          feeling: string | null
          id: string
          is_pr: boolean | null
          is_warmup: boolean | null
          notes: string | null
          reps_completed: number | null
          rpe: number | null
          set_number: number
          weight_kg: number | null
          workout_session_id: string
        }
        Insert: {
          created_at?: string | null
          exercise_id: string
          feeling?: string | null
          id?: string
          is_pr?: boolean | null
          is_warmup?: boolean | null
          notes?: string | null
          reps_completed?: number | null
          rpe?: number | null
          set_number: number
          weight_kg?: number | null
          workout_session_id: string
        }
        Update: {
          created_at?: string | null
          exercise_id?: string
          feeling?: string | null
          id?: string
          is_pr?: boolean | null
          is_warmup?: boolean | null
          notes?: string | null
          reps_completed?: number | null
          rpe?: number | null
          set_number?: number
          weight_kg?: number | null
          workout_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_logs_workout_session_id_fkey"
            columns: ["workout_session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_max_weights: {
        Row: {
          best_reps: number
          best_weight_kg: number
          consecutive_successful_sessions: number | null
          created_at: string
          exercise_id: string
          functional_max_kg: number
          id: string
          last_feeling: string | null
          last_session_date: string | null
          notes: string | null
          should_progress: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          best_reps?: number
          best_weight_kg?: number
          consecutive_successful_sessions?: number | null
          created_at?: string
          exercise_id: string
          functional_max_kg?: number
          id?: string
          last_feeling?: string | null
          last_session_date?: string | null
          notes?: string | null
          should_progress?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          best_reps?: number
          best_weight_kg?: number
          consecutive_successful_sessions?: number | null
          created_at?: string
          exercise_id?: string
          functional_max_kg?: number
          id?: string
          last_feeling?: string | null
          last_session_date?: string | null
          notes?: string | null
          should_progress?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_max_weights_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          category: Database["public"]["Enums"]["exercise_category"] | null
          created_at: string | null
          description: string | null
          difficulty: Database["public"]["Enums"]["experience_level"] | null
          equipment: string | null
          id: string
          image_url: string | null
          instructions: string | null
          is_active: boolean | null
          name: string
          name_es: string | null
          primary_muscle: Database["public"]["Enums"]["muscle_group"]
          secondary_muscles:
            | Database["public"]["Enums"]["muscle_group"][]
            | null
          video_url: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["exercise_category"] | null
          created_at?: string | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["experience_level"] | null
          equipment?: string | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_active?: boolean | null
          name: string
          name_es?: string | null
          primary_muscle: Database["public"]["Enums"]["muscle_group"]
          secondary_muscles?:
            | Database["public"]["Enums"]["muscle_group"][]
            | null
          video_url?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["exercise_category"] | null
          created_at?: string | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["experience_level"] | null
          equipment?: string | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_active?: boolean | null
          name?: string
          name_es?: string | null
          primary_muscle?: Database["public"]["Enums"]["muscle_group"]
          secondary_muscles?:
            | Database["public"]["Enums"]["muscle_group"][]
            | null
          video_url?: string | null
        }
        Relationships: []
      }
      food_preferences: {
        Row: {
          allergies: string | null
          created_at: string | null
          disliked_foods: string | null
          id: string
          liked_foods: string | null
          preference: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allergies?: string | null
          created_at?: string | null
          disliked_foods?: string | null
          id?: string
          liked_foods?: string | null
          preference?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allergies?: string | null
          created_at?: string | null
          disliked_foods?: string | null
          id?: string
          liked_foods?: string | null
          preference?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          date: string
          habit_id: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          date?: string
          habit_id: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          date?: string
          habit_id?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          target_frequency: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          target_frequency?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          target_frequency?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      hydration_logs: {
        Row: {
          consumed_ml: number | null
          created_at: string | null
          date: string
          id: string
          target_ml: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          consumed_ml?: number | null
          created_at?: string | null
          date?: string
          id?: string
          target_ml?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          consumed_ml?: number | null
          created_at?: string | null
          date?: string
          id?: string
          target_ml?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      manual_subscriptions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          tier: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          tier?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          tier?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meal_logs: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          date: string
          id: string
          meal_id: string | null
          notes: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          date?: string
          id?: string
          meal_id?: string | null
          notes?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          date?: string
          id?: string
          meal_id?: string | null
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_logs_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          calories: number | null
          carbs_grams: number | null
          created_at: string | null
          fat_grams: number | null
          id: string
          image_url: string | null
          ingredients: Json | null
          instructions: string | null
          meal_type: Database["public"]["Enums"]["meal_type"]
          name: string
          nutrition_plan_id: string
          order_index: number | null
          protein_grams: number | null
          scheduled_time: string | null
        }
        Insert: {
          calories?: number | null
          carbs_grams?: number | null
          created_at?: string | null
          fat_grams?: number | null
          id?: string
          image_url?: string | null
          ingredients?: Json | null
          instructions?: string | null
          meal_type: Database["public"]["Enums"]["meal_type"]
          name: string
          nutrition_plan_id: string
          order_index?: number | null
          protein_grams?: number | null
          scheduled_time?: string | null
        }
        Update: {
          calories?: number | null
          carbs_grams?: number | null
          created_at?: string | null
          fat_grams?: number | null
          id?: string
          image_url?: string | null
          ingredients?: Json | null
          instructions?: string | null
          meal_type?: Database["public"]["Enums"]["meal_type"]
          name?: string
          nutrition_plan_id?: string
          order_index?: number | null
          protein_grams?: number | null
          scheduled_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meals_nutrition_plan_id_fkey"
            columns: ["nutrition_plan_id"]
            isOneToOne: false
            referencedRelation: "nutrition_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_plans: {
        Row: {
          carbs_grams: number | null
          created_at: string | null
          daily_calories: number | null
          fat_grams: number | null
          id: string
          is_active: boolean | null
          name: string
          protein_grams: number | null
          protein_per_kg: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          carbs_grams?: number | null
          created_at?: string | null
          daily_calories?: number | null
          fat_grams?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          protein_grams?: number | null
          protein_per_kg?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          carbs_grams?: number | null
          created_at?: string | null
          daily_calories?: number | null
          fat_grams?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          protein_grams?: number | null
          protein_per_kg?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number | null
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          is_public: boolean | null
          likes_count: number | null
          post_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comments_count?: number | null
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          likes_count?: number | null
          post_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comments_count?: number | null
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          likes_count?: number | null
          post_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          available_equipment: string[] | null
          avatar_url: string | null
          body_fat_percentage: number | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          experience_level:
            | Database["public"]["Enums"]["experience_level"]
            | null
          fitness_goal: Database["public"]["Enums"]["fitness_goal"] | null
          full_name: string | null
          gender: Database["public"]["Enums"]["gender"] | null
          height_cm: number | null
          id: string
          onboarding_completed: boolean | null
          secondary_goals: string[] | null
          show_goals: boolean | null
          show_habits: boolean | null
          show_hydration: boolean | null
          show_schedule: boolean | null
          show_supplements: boolean | null
          training_style: string | null
          training_types: string[] | null
          updated_at: string | null
          weight_kg: number | null
        }
        Insert: {
          available_equipment?: string[] | null
          avatar_url?: string | null
          body_fat_percentage?: number | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          fitness_goal?: Database["public"]["Enums"]["fitness_goal"] | null
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          height_cm?: number | null
          id: string
          onboarding_completed?: boolean | null
          secondary_goals?: string[] | null
          show_goals?: boolean | null
          show_habits?: boolean | null
          show_hydration?: boolean | null
          show_schedule?: boolean | null
          show_supplements?: boolean | null
          training_style?: string | null
          training_types?: string[] | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Update: {
          available_equipment?: string[] | null
          avatar_url?: string | null
          body_fat_percentage?: number | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          fitness_goal?: Database["public"]["Enums"]["fitness_goal"] | null
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          height_cm?: number | null
          id?: string
          onboarding_completed?: boolean | null
          secondary_goals?: string[] | null
          show_goals?: boolean | null
          show_habits?: boolean | null
          show_hydration?: boolean | null
          show_schedule?: boolean | null
          show_supplements?: boolean | null
          training_style?: string | null
          training_types?: string[] | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      progress_photos: {
        Row: {
          body_fat_percentage: number | null
          created_at: string | null
          date: string
          id: string
          notes: string | null
          photo_type: string | null
          photo_url: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          body_fat_percentage?: number | null
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          photo_type?: string | null
          photo_url: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          body_fat_percentage?: number | null
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          photo_type?: string | null
          photo_url?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sleep_logs: {
        Row: {
          bedtime: string | null
          created_at: string | null
          date: string
          hours_slept: number | null
          id: string
          notes: string | null
          quality: number | null
          user_id: string
          wake_time: string | null
        }
        Insert: {
          bedtime?: string | null
          created_at?: string | null
          date?: string
          hours_slept?: number | null
          id?: string
          notes?: string | null
          quality?: number | null
          user_id: string
          wake_time?: string | null
        }
        Update: {
          bedtime?: string | null
          created_at?: string | null
          date?: string
          hours_slept?: number | null
          id?: string
          notes?: string | null
          quality?: number | null
          user_id?: string
          wake_time?: string | null
        }
        Relationships: []
      }
      supplement_logs: {
        Row: {
          created_at: string | null
          date: string
          id: string
          supplement_plan_id: string | null
          taken: boolean | null
          taken_at: string | null
          timing: Database["public"]["Enums"]["supplement_timing"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          id?: string
          supplement_plan_id?: string | null
          taken?: boolean | null
          taken_at?: string | null
          timing: Database["public"]["Enums"]["supplement_timing"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          supplement_plan_id?: string | null
          taken?: boolean | null
          taken_at?: string | null
          timing?: Database["public"]["Enums"]["supplement_timing"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplement_logs_supplement_plan_id_fkey"
            columns: ["supplement_plan_id"]
            isOneToOne: false
            referencedRelation: "supplement_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      supplement_plans: {
        Row: {
          created_at: string | null
          dosage: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          supplement_id: string
          timing: Database["public"]["Enums"]["supplement_timing"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dosage?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          supplement_id: string
          timing: Database["public"]["Enums"]["supplement_timing"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dosage?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          supplement_id?: string
          timing?: Database["public"]["Enums"]["supplement_timing"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplement_plans_supplement_id_fkey"
            columns: ["supplement_id"]
            isOneToOne: false
            referencedRelation: "supplements"
            referencedColumns: ["id"]
          },
        ]
      }
      supplements: {
        Row: {
          amazon_url: string | null
          benefits: string[] | null
          brand: string
          category: string
          created_at: string | null
          description: string | null
          dosage: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price_eur: number | null
        }
        Insert: {
          amazon_url?: string | null
          benefits?: string[] | null
          brand: string
          category: string
          created_at?: string | null
          description?: string | null
          dosage?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price_eur?: number | null
        }
        Update: {
          amazon_url?: string | null
          benefits?: string[] | null
          brand?: string
          category?: string
          created_at?: string | null
          description?: string | null
          dosage?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price_eur?: number | null
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          avoided_foods: string[] | null
          created_at: string | null
          dietary_restrictions: string[] | null
          id: string
          notifications_enabled: boolean | null
          preferred_foods: string[] | null
          preferred_supplements: string[] | null
          sleep_quality: number | null
          stress_level: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avoided_foods?: string[] | null
          created_at?: string | null
          dietary_restrictions?: string[] | null
          id?: string
          notifications_enabled?: boolean | null
          preferred_foods?: string[] | null
          preferred_supplements?: string[] | null
          sleep_quality?: number | null
          stress_level?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avoided_foods?: string[] | null
          created_at?: string | null
          dietary_restrictions?: string[] | null
          id?: string
          notifications_enabled?: boolean | null
          preferred_foods?: string[] | null
          preferred_supplements?: string[] | null
          sleep_quality?: number | null
          stress_level?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_schedules: {
        Row: {
          breakfast_time: string | null
          created_at: string | null
          dinner_time: string | null
          external_activities: Json | null
          id: string
          lunch_time: string | null
          preferred_workout_days: string[] | null
          sleep_time: string | null
          time_blocks: Json | null
          updated_at: string | null
          user_id: string
          wake_time: string | null
          workout_days_per_week: number | null
          workout_duration_minutes: number | null
          workout_time: string | null
        }
        Insert: {
          breakfast_time?: string | null
          created_at?: string | null
          dinner_time?: string | null
          external_activities?: Json | null
          id?: string
          lunch_time?: string | null
          preferred_workout_days?: string[] | null
          sleep_time?: string | null
          time_blocks?: Json | null
          updated_at?: string | null
          user_id: string
          wake_time?: string | null
          workout_days_per_week?: number | null
          workout_duration_minutes?: number | null
          workout_time?: string | null
        }
        Update: {
          breakfast_time?: string | null
          created_at?: string | null
          dinner_time?: string | null
          external_activities?: Json | null
          id?: string
          lunch_time?: string | null
          preferred_workout_days?: string[] | null
          sleep_time?: string | null
          time_blocks?: Json | null
          updated_at?: string | null
          user_id?: string
          wake_time?: string | null
          workout_days_per_week?: number | null
          workout_duration_minutes?: number | null
          workout_time?: string | null
        }
        Relationships: []
      }
      workout_plan_days: {
        Row: {
          assigned_weekday: string | null
          assigned_weekdays: string[] | null
          created_at: string | null
          day_number: number
          focus: Database["public"]["Enums"]["muscle_group"][] | null
          id: string
          is_rest_day: boolean | null
          name: string
          workout_plan_id: string
        }
        Insert: {
          assigned_weekday?: string | null
          assigned_weekdays?: string[] | null
          created_at?: string | null
          day_number: number
          focus?: Database["public"]["Enums"]["muscle_group"][] | null
          id?: string
          is_rest_day?: boolean | null
          name: string
          workout_plan_id: string
        }
        Update: {
          assigned_weekday?: string | null
          assigned_weekdays?: string[] | null
          created_at?: string | null
          day_number?: number
          focus?: Database["public"]["Enums"]["muscle_group"][] | null
          id?: string
          is_rest_day?: boolean | null
          name?: string
          workout_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_plan_days_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plan_exercises: {
        Row: {
          created_at: string | null
          exercise_id: string
          id: string
          notes: string | null
          order_index: number | null
          reps_max: number | null
          reps_min: number | null
          rest_seconds: number | null
          sets: number | null
          workout_plan_day_id: string
        }
        Insert: {
          created_at?: string | null
          exercise_id: string
          id?: string
          notes?: string | null
          order_index?: number | null
          reps_max?: number | null
          reps_min?: number | null
          rest_seconds?: number | null
          sets?: number | null
          workout_plan_day_id: string
        }
        Update: {
          created_at?: string | null
          exercise_id?: string
          id?: string
          notes?: string | null
          order_index?: number | null
          reps_max?: number | null
          reps_min?: number | null
          rest_seconds?: number | null
          sets?: number | null
          workout_plan_day_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_plan_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_plan_exercises_workout_plan_day_id_fkey"
            columns: ["workout_plan_day_id"]
            isOneToOne: false
            referencedRelation: "workout_plan_days"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plans: {
        Row: {
          created_at: string | null
          days_per_week: number | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          name: string
          split_type: Database["public"]["Enums"]["workout_split"] | null
          start_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          days_per_week?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          split_type?: Database["public"]["Enums"]["workout_split"] | null
          start_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          days_per_week?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          split_type?: Database["public"]["Enums"]["workout_split"] | null
          start_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          calories_burned: number | null
          completed_at: string | null
          completion_status: string | null
          created_at: string | null
          date: string
          duration_minutes: number | null
          feeling: string | null
          id: string
          notes: string | null
          rating: number | null
          started_at: string | null
          user_id: string
          workout_plan_day_id: string | null
        }
        Insert: {
          calories_burned?: number | null
          completed_at?: string | null
          completion_status?: string | null
          created_at?: string | null
          date?: string
          duration_minutes?: number | null
          feeling?: string | null
          id?: string
          notes?: string | null
          rating?: number | null
          started_at?: string | null
          user_id: string
          workout_plan_day_id?: string | null
        }
        Update: {
          calories_burned?: number | null
          completed_at?: string | null
          completion_status?: string | null
          created_at?: string | null
          date?: string
          duration_minutes?: number | null
          feeling?: string | null
          id?: string
          notes?: string | null
          rating?: number | null
          started_at?: string | null
          user_id?: string
          workout_plan_day_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_workout_plan_day_id_fkey"
            columns: ["workout_plan_day_id"]
            isOneToOne: false
            referencedRelation: "workout_plan_days"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          experience_level:
            | Database["public"]["Enums"]["experience_level"]
            | null
          fitness_goal: Database["public"]["Enums"]["fitness_goal"] | null
          full_name: string | null
          id: string | null
        }
        Insert: {
          avatar_url?: string | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          fitness_goal?: Database["public"]["Enums"]["fitness_goal"] | null
          full_name?: string | null
          id?: string | null
        }
        Update: {
          avatar_url?: string | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          fitness_goal?: Database["public"]["Enums"]["fitness_goal"] | null
          full_name?: string | null
          id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_followers_count: { Args: { target_user_id: string }; Returns: number }
      get_following_count: { Args: { target_user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      exercise_category: "compound" | "isolation" | "cardio" | "stretching"
      experience_level: "beginner" | "intermediate" | "advanced"
      fitness_goal: "muscle_gain" | "fat_loss" | "recomposition" | "maintenance"
      gender: "male" | "female" | "other"
      meal_type:
        | "breakfast"
        | "lunch"
        | "snack"
        | "dinner"
        | "pre_workout"
        | "post_workout"
      muscle_group:
        | "chest"
        | "back"
        | "shoulders"
        | "biceps"
        | "triceps"
        | "forearms"
        | "core"
        | "quadriceps"
        | "hamstrings"
        | "glutes"
        | "calves"
        | "full_body"
      supplement_timing:
        | "morning"
        | "pre_workout"
        | "intra_workout"
        | "post_workout"
        | "with_meal"
        | "before_bed"
      workout_split:
        | "push_pull_legs"
        | "upper_lower"
        | "full_body"
        | "bro_split"
        | "custom"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      exercise_category: ["compound", "isolation", "cardio", "stretching"],
      experience_level: ["beginner", "intermediate", "advanced"],
      fitness_goal: ["muscle_gain", "fat_loss", "recomposition", "maintenance"],
      gender: ["male", "female", "other"],
      meal_type: [
        "breakfast",
        "lunch",
        "snack",
        "dinner",
        "pre_workout",
        "post_workout",
      ],
      muscle_group: [
        "chest",
        "back",
        "shoulders",
        "biceps",
        "triceps",
        "forearms",
        "core",
        "quadriceps",
        "hamstrings",
        "glutes",
        "calves",
        "full_body",
      ],
      supplement_timing: [
        "morning",
        "pre_workout",
        "intra_workout",
        "post_workout",
        "with_meal",
        "before_bed",
      ],
      workout_split: [
        "push_pull_legs",
        "upper_lower",
        "full_body",
        "bro_split",
        "custom",
      ],
    },
  },
} as const
