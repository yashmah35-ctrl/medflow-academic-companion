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
      affiliate_payouts: {
        Row: {
          affiliate_id: string
          amount: number
          created_at: string
          id: string
          notes: string | null
          paid_at: string
          paid_by: string
          payment_method: string
        }
        Insert: {
          affiliate_id: string
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string
          paid_by: string
          payment_method?: string
        }
        Update: {
          affiliate_id?: string
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string
          paid_by?: string
          payment_method?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_subscriptions: {
        Row: {
          affiliate_code: string
          affiliate_id: string
          commission_amount: number
          id: string
          is_paid: boolean
          status: string
          stripe_payment_intent_id: string | null
          subscribed_at: string
          subscriber_email: string | null
          subscriber_user_id: string
          validated_at: string | null
        }
        Insert: {
          affiliate_code: string
          affiliate_id: string
          commission_amount?: number
          id?: string
          is_paid?: boolean
          status?: string
          stripe_payment_intent_id?: string | null
          subscribed_at?: string
          subscriber_email?: string | null
          subscriber_user_id: string
          validated_at?: string | null
        }
        Update: {
          affiliate_code?: string
          affiliate_id?: string
          commission_amount?: number
          id?: string
          is_paid?: boolean
          status?: string
          stripe_payment_intent_id?: string | null
          subscribed_at?: string
          subscriber_email?: string | null
          subscriber_user_id?: string
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_subscriptions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          affiliate_type: string
          available_balance: number
          code: string
          commission_per_subscriber: number
          created_at: string
          discount_amount: number
          id: string
          influencer_email: string | null
          influencer_name: string
          is_active: boolean
          pending_balance: number
          total_commission_earned: number
          total_paid_out: number
          total_subscribers: number
          user_id: string | null
        }
        Insert: {
          affiliate_type?: string
          available_balance?: number
          code: string
          commission_per_subscriber?: number
          created_at?: string
          discount_amount?: number
          id?: string
          influencer_email?: string | null
          influencer_name: string
          is_active?: boolean
          pending_balance?: number
          total_commission_earned?: number
          total_paid_out?: number
          total_subscribers?: number
          user_id?: string | null
        }
        Update: {
          affiliate_type?: string
          available_balance?: number
          code?: string
          commission_per_subscriber?: number
          created_at?: string
          discount_amount?: number
          id?: string
          influencer_email?: string | null
          influencer_name?: string
          is_active?: boolean
          pending_balance?: number
          total_commission_earned?: number
          total_paid_out?: number
          total_subscribers?: number
          user_id?: string | null
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          credits_spent: number | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          credits_spent?: number | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          credits_spent?: number | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
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
      credit_purchases: {
        Row: {
          amount_paid_cents: number
          completed_at: string | null
          created_at: string
          id: string
          pack_credits: number
          status: string
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          amount_paid_cents: number
          completed_at?: string | null
          created_at?: string
          id?: string
          pack_credits: number
          status?: string
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          amount_paid_cents?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          pack_credits?: number
          status?: string
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          id: string
          metadata: Json | null
          reason: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          id?: string
          metadata?: Json | null
          reason: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string
          user_id?: string
        }
        Relationships: []
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
      mentor_badges: {
        Row: {
          badge_icon: string | null
          badge_id: string
          badge_name: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          badge_icon?: string | null
          badge_id: string
          badge_name: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          badge_icon?: string | null
          badge_id?: string
          badge_name?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mentor_chapters: {
        Row: {
          chapter_title: string
          course_id: string
          created_at: string
          exercises_json: Json
          generated_by: string
          generation_model: string | null
          id: string
          qcm_final_json: Json | null
          source_text_length: number | null
          subject_id: string
          updated_at: string
        }
        Insert: {
          chapter_title: string
          course_id: string
          created_at?: string
          exercises_json?: Json
          generated_by: string
          generation_model?: string | null
          id?: string
          qcm_final_json?: Json | null
          source_text_length?: number | null
          subject_id: string
          updated_at?: string
        }
        Update: {
          chapter_title?: string
          course_id?: string
          created_at?: string
          exercises_json?: Json
          generated_by?: string
          generation_model?: string | null
          id?: string
          qcm_final_json?: Json | null
          source_text_length?: number | null
          subject_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      mentor_progress: {
        Row: {
          attempts: number
          best_score: number | null
          course_id: string
          created_at: string
          exercise_id: string
          id: string
          is_qcm_final: boolean
          last_attempted_at: string | null
          profile_snapshot: Json | null
          score: number | null
          stars: number
          status: string
          time_spent_seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          best_score?: number | null
          course_id: string
          created_at?: string
          exercise_id: string
          id?: string
          is_qcm_final?: boolean
          last_attempted_at?: string | null
          profile_snapshot?: Json | null
          score?: number | null
          stars?: number
          status?: string
          time_spent_seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          best_score?: number | null
          course_id?: string
          created_at?: string
          exercise_id?: string
          id?: string
          is_qcm_final?: boolean
          last_attempted_at?: string | null
          profile_snapshot?: Json | null
          score?: number | null
          stars?: number
          status?: string
          time_spent_seconds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mentor_student_profile: {
        Row: {
          chapter_status: string
          completed_diagnostic: boolean
          confidence_level: number
          created_at: string
          exam_date: string | null
          exam_type: string | null
          id: string
          learning_mode: string
          session_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_status?: string
          completed_diagnostic?: boolean
          confidence_level?: number
          created_at?: string
          exam_date?: string | null
          exam_type?: string | null
          id?: string
          learning_mode?: string
          session_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_status?: string
          completed_diagnostic?: boolean
          confidence_level?: number
          created_at?: string
          exam_date?: string | null
          exam_type?: string | null
          id?: string
          learning_mode?: string
          session_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          avatar_url: string | null
          bic: string | null
          created_at: string
          ent_login_encrypted: string | null
          ent_password_encrypted: string | null
          full_name: string | null
          iban_encrypted: string | null
          id: string
          university: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bic?: string | null
          created_at?: string
          ent_login_encrypted?: string | null
          ent_password_encrypted?: string | null
          full_name?: string | null
          iban_encrypted?: string | null
          id?: string
          university?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bic?: string | null
          created_at?: string
          ent_login_encrypted?: string | null
          ent_password_encrypted?: string | null
          full_name?: string | null
          iban_encrypted?: string | null
          id?: string
          university?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      schedule_blocks: {
        Row: {
          color: string | null
          completed: boolean
          course_id: string | null
          created_at: string
          deleted_by_user: boolean
          description: string | null
          duration_minutes: number
          end_hour: number | null
          end_minutes: number | null
          id: string
          scheduled_date: string
          start_hour: number
          start_minutes: number | null
          tags: string[] | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          color?: string | null
          completed?: boolean
          course_id?: string | null
          created_at?: string
          deleted_by_user?: boolean
          description?: string | null
          duration_minutes?: number
          end_hour?: number | null
          end_minutes?: number | null
          id?: string
          scheduled_date: string
          start_hour?: number
          start_minutes?: number | null
          tags?: string[] | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          color?: string | null
          completed?: boolean
          course_id?: string | null
          created_at?: string
          deleted_by_user?: boolean
          description?: string | null
          duration_minutes?: number
          end_hour?: number | null
          end_minutes?: number | null
          id?: string
          scheduled_date?: string
          start_hour?: number
          start_minutes?: number | null
          tags?: string[] | null
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
      schemas: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_public: boolean
          markers_json: Json
          subject_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_public?: boolean
          markers_json?: Json
          subject_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_public?: boolean
          markers_json?: Json
          subject_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schemas_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
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
      user_course_progress: {
        Row: {
          course_id: string
          folder_id: string
          id: string
          opened_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          folder_id: string
          id?: string
          opened_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          folder_id?: string
          id?: string
          opened_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          balance: number
          created_at: string
          id: string
          last_daily_claim: string | null
          last_subscription_reset_period_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          last_daily_claim?: string | null
          last_subscription_reset_period_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          last_daily_claim?: string | null
          last_subscription_reset_period_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_exercise_scores: {
        Row: {
          completed_at: string
          correct_count: number
          exercise_id: string
          id: string
          total_count: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          correct_count?: number
          exercise_id: string
          id?: string
          total_count?: number
          user_id: string
        }
        Update: {
          completed_at?: string
          correct_count?: number
          exercise_id?: string
          id?: string
          total_count?: number
          user_id?: string
        }
        Relationships: []
      }
      user_revision_scores: {
        Row: {
          completed_at: string
          correct_count: number
          folder_id: string
          id: string
          review_id: string
          total_count: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          correct_count?: number
          folder_id: string
          id?: string
          review_id: string
          total_count?: number
          user_id: string
        }
        Update: {
          completed_at?: string
          correct_count?: number
          folder_id?: string
          id?: string
          review_id?: string
          total_count?: number
          user_id?: string
        }
        Relationships: []
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
      add_purchased_credits: {
        Args: { _amount: number; _stripe_session_id: string; _user_id: string }
        Returns: number
      }
      claim_daily_credit: { Args: { _user_id: string }; Returns: number }
      consume_credits: {
        Args: {
          _amount: number
          _metadata?: Json
          _reason: string
          _user_id: string
        }
        Returns: number
      }
      ensure_user_affiliate: { Args: { _user_id: string }; Returns: string }
      ensure_user_credits: { Args: { _user_id: string }; Returns: undefined }
      generate_affiliate_code: { Args: { _prefix: string }; Returns: string }
      get_public_landing_stats: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      record_affiliate_payout: {
        Args: { _affiliate_id: string; _amount: number; _notes?: string }
        Returns: string
      }
      refund_credits: {
        Args: { _amount: number; _reason: string; _user_id: string }
        Returns: number
      }
      reset_subscription_credits: {
        Args: { _period_start: string; _user_id: string }
        Returns: number
      }
      validate_affiliate_commission: {
        Args: {
          _stripe_payment_intent_id?: string
          _subscriber_user_id: string
        }
        Returns: undefined
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
