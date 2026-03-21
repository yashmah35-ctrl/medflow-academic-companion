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
      admin_exercises: {
        Row: {
          created_at: string
          created_by: string
          format: string
          id: string
          questions_json: Json | null
          score_label: string | null
          source_label: string | null
          subject_id: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          format?: string
          id?: string
          questions_json?: Json | null
          score_label?: string | null
          source_label?: string | null
          subject_id: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          format?: string
          id?: string
          questions_json?: Json | null
          score_label?: string | null
          source_label?: string | null
          subject_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_exercises_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      annales: {
        Row: {
          analysis_json: Json | null
          city: string | null
          created_at: string
          format: string
          id: string
          name: string | null
          pages_json: Json | null
          questions_json: Json | null
          session: string | null
          subject_id: string | null
          user_id: string
          year: string | null
        }
        Insert: {
          analysis_json?: Json | null
          city?: string | null
          created_at?: string
          format?: string
          id?: string
          name?: string | null
          pages_json?: Json | null
          questions_json?: Json | null
          session?: string | null
          subject_id?: string | null
          user_id: string
          year?: string | null
        }
        Update: {
          analysis_json?: Json | null
          city?: string | null
          created_at?: string
          format?: string
          id?: string
          name?: string | null
          pages_json?: Json | null
          questions_json?: Json | null
          session?: string | null
          subject_id?: string | null
          user_id?: string
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "annales_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          attachment_url: string | null
          created_at: string
          created_by: string
          id: string
          link_url: string | null
          message: string
          target_roles: string[]
          title: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          created_by: string
          id?: string
          link_url?: string | null
          message: string
          target_roles?: string[]
          title: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          created_by?: string
          id?: string
          link_url?: string | null
          message?: string
          target_roles?: string[]
          title?: string
        }
        Relationships: []
      }
      chapter_reviews: {
        Row: {
          course_id: string
          created_at: string
          created_by: string
          format: string
          id: string
          questions_json: Json | null
          subject_id: string
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          created_by: string
          format?: string
          id?: string
          questions_json?: Json | null
          subject_id: string
          title?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          created_by?: string
          format?: string
          id?: string
          questions_json?: Json | null
          subject_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapter_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_reviews_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          content: string | null
          created_at: string
          file_url: string | null
          folder_id: string
          id: string
          reading_time: string | null
          source: string
          title: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          file_url?: string | null
          folder_id: string
          id?: string
          reading_time?: string | null
          source?: string
          title: string
        }
        Update: {
          content?: string | null
          created_at?: string
          file_url?: string | null
          folder_id?: string
          id?: string
          reading_time?: string | null
          source?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      errors: {
        Row: {
          consecutive_wrong: number
          correct_answer: string
          correction_count: number | null
          course_id: string | null
          created_at: string
          error_type: string | null
          id: string
          is_critical: boolean
          last_response_time_ms: number | null
          last_seen: string
          mastered: boolean | null
          mastery_score: number
          next_review: string | null
          occurrence_count: number
          personal_notes: string | null
          propositions_json: Json | null
          question: string
          source: string
          subject_name: string | null
          total_attempts: number
          user_id: string
          wrong_answer: string
        }
        Insert: {
          consecutive_wrong?: number
          correct_answer: string
          correction_count?: number | null
          course_id?: string | null
          created_at?: string
          error_type?: string | null
          id?: string
          is_critical?: boolean
          last_response_time_ms?: number | null
          last_seen?: string
          mastered?: boolean | null
          mastery_score?: number
          next_review?: string | null
          occurrence_count?: number
          personal_notes?: string | null
          propositions_json?: Json | null
          question: string
          source?: string
          subject_name?: string | null
          total_attempts?: number
          user_id: string
          wrong_answer: string
        }
        Update: {
          consecutive_wrong?: number
          correct_answer?: string
          correction_count?: number | null
          course_id?: string | null
          created_at?: string
          error_type?: string | null
          id?: string
          is_critical?: boolean
          last_response_time_ms?: number | null
          last_seen?: string
          mastered?: boolean | null
          mastery_score?: number
          next_review?: string | null
          occurrence_count?: number
          personal_notes?: string | null
          propositions_json?: Json | null
          question?: string
          source?: string
          subject_name?: string | null
          total_attempts?: number
          user_id?: string
          wrong_answer?: string
        }
        Relationships: [
          {
            foreignKeyName: "errors_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          created_at: string
          date: string | null
          format: string
          id: string
          name: string
          questions_json: Json | null
          score: number | null
          subject_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string | null
          format?: string
          id?: string
          name: string
          questions_json?: Json | null
          score?: number | null
          subject_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string | null
          format?: string
          id?: string
          name?: string
          questions_json?: Json | null
          score?: number | null
          subject_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcard_decks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          parent_deck_id: string | null
          subject_id: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_deck_id?: string | null
          subject_id?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_deck_id?: string | null
          subject_id?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_decks_parent_deck_id_fkey"
            columns: ["parent_deck_id"]
            isOneToOne: false
            referencedRelation: "flashcard_decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcard_decks_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcard_reviews: {
        Row: {
          flashcard_id: string
          id: string
          rating: string
          reviewed_at: string
          user_id: string
        }
        Insert: {
          flashcard_id: string
          id?: string
          rating: string
          reviewed_at?: string
          user_id: string
        }
        Update: {
          flashcard_id?: string
          id?: string
          rating?: string
          reviewed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_reviews_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          back: string
          card_type: string
          cloze_text: string | null
          created_at: string
          deck_id: string
          difficulty: number | null
          ease_factor: number | null
          explanation: string | null
          front: string
          id: string
          image_url: string | null
          interval_days: number | null
          next_review: string | null
          occlusion_data: Json | null
          review_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          back?: string
          card_type?: string
          cloze_text?: string | null
          created_at?: string
          deck_id: string
          difficulty?: number | null
          ease_factor?: number | null
          explanation?: string | null
          front?: string
          id?: string
          image_url?: string | null
          interval_days?: number | null
          next_review?: string | null
          occlusion_data?: Json | null
          review_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          back?: string
          card_type?: string
          cloze_text?: string | null
          created_at?: string
          deck_id?: string
          difficulty?: number | null
          ease_factor?: number | null
          explanation?: string | null
          front?: string
          id?: string
          image_url?: string | null
          interval_days?: number | null
          next_review?: string | null
          occlusion_data?: Json | null
          review_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "flashcard_decks"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          course_count: number
          created_at: string
          created_by: string | null
          exercise_count: number
          id: string
          is_public: boolean
          name: string
          subject_id: string | null
        }
        Insert: {
          course_count?: number
          created_at?: string
          created_by?: string | null
          exercise_count?: number
          id?: string
          is_public?: boolean
          name: string
          subject_id?: string | null
        }
        Update: {
          course_count?: number
          created_at?: string
          created_by?: string | null
          exercise_count?: number
          id?: string
          is_public?: boolean
          name?: string
          subject_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "folders_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      kholles: {
        Row: {
          created_at: string
          date: string | null
          format: string
          id: string
          name: string | null
          questions_json: Json | null
          subject_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string | null
          format?: string
          id?: string
          name?: string | null
          questions_json?: Json | null
          subject_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string | null
          format?: string
          id?: string
          name?: string | null
          questions_json?: Json | null
          subject_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kholles_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          ent_login_encrypted: string | null
          ent_password_encrypted: string | null
          full_name: string | null
          id: string
          university: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ent_login_encrypted?: string | null
          ent_password_encrypted?: string | null
          full_name?: string | null
          id?: string
          university?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ent_login_encrypted?: string | null
          ent_password_encrypted?: string | null
          full_name?: string | null
          id?: string
          university?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      schedule_blocks: {
        Row: {
          completed: boolean
          course_id: string | null
          created_at: string
          deleted_by_user: boolean
          duration_minutes: number
          id: string
          scheduled_date: string
          start_hour: number
          title: string
          type: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          course_id?: string | null
          created_at?: string
          deleted_by_user?: boolean
          duration_minutes?: number
          id?: string
          scheduled_date: string
          start_hour?: number
          title: string
          type?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          course_id?: string | null
          created_at?: string
          deleted_by_user?: boolean
          duration_minutes?: number
          id?: string
          scheduled_date?: string
          start_hour?: number
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_blocks_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_announcement_reads: {
        Row: {
          announcement_id: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          created_at: string
          id: string
          last_active_date: string | null
          level: number
          streak_days: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          id?: string
          last_active_date?: string | null
          level?: number
          streak_days?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          id?: string
          last_active_date?: string | null
          level?: number
          streak_days?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "medical_student"
        | "lyceen"
        | "pass"
        | "lass"
        | "college"
        | "lycee"
        | "prepa_du_peuple"
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
      app_role: [
        "medical_student",
        "lyceen",
        "pass",
        "lass",
        "college",
        "lycee",
        "prepa_du_peuple",
      ],
    },
  },
} as const
