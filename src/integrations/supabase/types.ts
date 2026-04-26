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
      account_deletion_requests: {
        Row: {
          cancelled_at: string | null
          created_at: string
          delete_content: boolean
          email: string
          id: string
          purged_at: string | null
          requested_at: string
          scheduled_purge_at: string
          status: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          delete_content?: boolean
          email: string
          id?: string
          purged_at?: string | null
          requested_at?: string
          scheduled_purge_at?: string
          status?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          delete_content?: boolean
          email?: string
          id?: string
          purged_at?: string | null
          requested_at?: string
          scheduled_purge_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      achievement_badges: {
        Row: {
          category: string
          created_at: string
          criteria_type: string
          criteria_value: number
          description: string
          icon: string
          id: string
          name: string
          slug: string
          xp_reward: number
        }
        Insert: {
          category?: string
          created_at?: string
          criteria_type: string
          criteria_value?: number
          description: string
          icon?: string
          id?: string
          name: string
          slug: string
          xp_reward?: number
        }
        Update: {
          category?: string
          created_at?: string
          criteria_type?: string
          criteria_value?: number
          description?: string
          icon?: string
          id?: string
          name?: string
          slug?: string
          xp_reward?: number
        }
        Relationships: []
      }
      admin_api_keys: {
        Row: {
          api_key_encrypted: string
          created_at: string
          id: string
          is_enabled: boolean
          provider_id: string
          updated_at: string
        }
        Insert: {
          api_key_encrypted: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          provider_id: string
          updated_at?: string
        }
        Update: {
          api_key_encrypted?: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          provider_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_sessions: {
        Row: {
          course_id: string | null
          created_at: string
          id: string
          lesson_id: string | null
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_chat_sessions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      api_rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          request_count: number
          user_id: string
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          request_count?: number
          user_id: string
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          request_count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          course_id: string
          course_title: string
          created_at: string
          id: string
          issued_at: string
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          student_name: string
          user_id: string
          verification_code: string
        }
        Insert: {
          course_id: string
          course_title: string
          created_at?: string
          id?: string
          issued_at?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          student_name: string
          user_id: string
          verification_code: string
        }
        Update: {
          course_id?: string
          course_title?: string
          created_at?: string
          id?: string
          issued_at?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          student_name?: string
          user_id?: string
          verification_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          source: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          source?: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          source?: string
          subject?: string | null
        }
        Relationships: []
      }
      continue_later: {
        Row: {
          course_id: string
          lesson_id: string | null
          textbook_page: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          lesson_id?: string | null
          textbook_page?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          lesson_id?: string | null
          textbook_page?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "continue_later_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "continue_later_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      course_essays: {
        Row: {
          course_id: string
          created_at: string
          id: string
          prompts: Json
          rubric: Json
          title: string
          updated_at: string
          word_limit: number | null
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          prompts?: Json
          rubric?: Json
          title: string
          updated_at?: string
          word_limit?: number | null
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          prompts?: Json
          rubric?: Json
          title?: string
          updated_at?: string
          word_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "course_essays_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: true
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_final_exams: {
        Row: {
          course_id: string
          created_at: string
          id: string
          instructions: string | null
          passing_score: number
          question_count: number
          questions: Json
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          instructions?: string | null
          passing_score?: number
          question_count?: number
          questions?: Json
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          instructions?: string | null
          passing_score?: number
          question_count?: number
          questions?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_final_exams_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: true
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_projects: {
        Row: {
          ai_feedback: string | null
          ai_feedback_at: string | null
          course_id: string
          created_at: string
          file_urls: string[] | null
          id: string
          status: Database["public"]["Enums"]["project_status"]
          submission_content: string | null
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_feedback?: string | null
          ai_feedback_at?: string | null
          course_id: string
          created_at?: string
          file_urls?: string[] | null
          id?: string
          status?: Database["public"]["Enums"]["project_status"]
          submission_content?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_feedback?: string | null
          ai_feedback_at?: string | null
          course_id?: string
          created_at?: string
          file_urls?: string[] | null
          id?: string
          status?: Database["public"]["Enums"]["project_status"]
          submission_content?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_projects_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          discussion_question: string | null
          id: string
          is_published: boolean
          order_number: number
          phase: Database["public"]["Enums"]["course_phase"]
          plug_and_play_asset: string | null
          price_cents: number
          project_description: string | null
          project_title: string | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          discussion_question?: string | null
          id?: string
          is_published?: boolean
          order_number: number
          phase: Database["public"]["Enums"]["course_phase"]
          plug_and_play_asset?: string | null
          price_cents?: number
          project_description?: string | null
          project_title?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          discussion_question?: string | null
          id?: string
          is_published?: boolean
          order_number?: number
          phase?: Database["public"]["Enums"]["course_phase"]
          plug_and_play_asset?: string | null
          price_cents?: number
          project_description?: string | null
          project_title?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      discussion_comments: {
        Row: {
          content: string
          created_at: string
          discussion_id: string
          id: string
          parent_comment_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          discussion_id: string
          id?: string
          parent_comment_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          discussion_id?: string
          id?: string
          parent_comment_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_comments_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "discussions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "discussion_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_votes: {
        Row: {
          created_at: string
          discussion_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discussion_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          discussion_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_votes_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "discussions"
            referencedColumns: ["id"]
          },
        ]
      }
      discussions: {
        Row: {
          content: string
          course_id: string
          created_at: string
          id: string
          is_pinned: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          course_id: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      grade_settings: {
        Row: {
          activity_weight: number
          course_id: string | null
          created_at: string
          essay_weight: number
          exam_weight: number
          id: string
          quiz_weight: number
          updated_at: string
          worksheet_weight: number
        }
        Insert: {
          activity_weight?: number
          course_id?: string | null
          created_at?: string
          essay_weight?: number
          exam_weight?: number
          id?: string
          quiz_weight?: number
          updated_at?: string
          worksheet_weight?: number
        }
        Update: {
          activity_weight?: number
          course_id?: string | null
          created_at?: string
          essay_weight?: number
          exam_weight?: number
          id?: string
          quiz_weight?: number
          updated_at?: string
          worksheet_weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "grade_settings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: true
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          activity_data: Json | null
          content: string | null
          course_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_published: boolean
          order_number: number
          quiz_data: Json | null
          title: string
          type: Database["public"]["Enums"]["lesson_type"]
          updated_at: string
          video_url: string | null
          worksheet_data: Json | null
        }
        Insert: {
          activity_data?: Json | null
          content?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean
          order_number: number
          quiz_data?: Json | null
          title: string
          type?: Database["public"]["Enums"]["lesson_type"]
          updated_at?: string
          video_url?: string | null
          worksheet_data?: Json | null
        }
        Update: {
          activity_data?: Json | null
          content?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean
          order_number?: number
          quiz_data?: Json | null
          title?: string
          type?: Database["public"]["Enums"]["lesson_type"]
          updated_at?: string
          video_url?: string | null
          worksheet_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_recovery_codes: {
        Row: {
          code_hash: string
          created_at: string
          id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          code_hash: string
          created_at?: string
          id?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          code_hash?: string
          created_at?: string
          id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio_entries: {
        Row: {
          connective_narrative: string
          course_id: string
          created_at: string
          deliverable_content: string
          executive_summary: string
          id: string
          order_number: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          connective_narrative?: string
          course_id: string
          created_at?: string
          deliverable_content?: string
          executive_summary?: string
          id?: string
          order_number?: number
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          connective_narrative?: string
          course_id?: string
          created_at?: string
          deliverable_content?: string
          executive_summary?: string
          id?: string
          order_number?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_entries_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_labs: {
        Row: {
          created_at: string
          deliverable_description: string
          difficulty: string
          estimated_minutes: number | null
          id: string
          instructions: string
          lesson_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deliverable_description: string
          difficulty?: string
          estimated_minutes?: number | null
          id?: string
          instructions: string
          lesson_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deliverable_description?: string
          difficulty?: string
          estimated_minutes?: number | null
          id?: string
          instructions?: string
          lesson_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_labs_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_submissions: {
        Row: {
          ai_feedback: string | null
          ai_feedback_at: string | null
          created_at: string
          file_urls: string[] | null
          id: string
          practice_lab_id: string
          score: number | null
          status: string
          submission_content: string
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_feedback?: string | null
          ai_feedback_at?: string | null
          created_at?: string
          file_urls?: string[] | null
          id?: string
          practice_lab_id: string
          score?: number | null
          status?: string
          submission_content?: string
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_feedback?: string | null
          ai_feedback_at?: string | null
          created_at?: string
          file_urls?: string[] | null
          id?: string
          practice_lab_id?: string
          score?: number | null
          status?: string
          submission_content?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_submissions_practice_lab_id_fkey"
            columns: ["practice_lab_id"]
            isOneToOne: false
            referencedRelation: "practice_labs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          course_updates: boolean
          created_at: string
          discussion_replies: boolean
          display_name: string | null
          email_notifications: boolean
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          course_updates?: boolean
          created_at?: string
          discussion_replies?: boolean
          display_name?: string | null
          email_notifications?: boolean
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          course_updates?: boolean
          created_at?: string
          discussion_replies?: boolean
          display_name?: string | null
          email_notifications?: boolean
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_milestone_submissions: {
        Row: {
          ai_feedback: string | null
          ai_feedback_at: string | null
          created_at: string
          file_urls: string[] | null
          id: string
          milestone_id: string
          status: string
          submission_content: string
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_feedback?: string | null
          ai_feedback_at?: string | null
          created_at?: string
          file_urls?: string[] | null
          id?: string
          milestone_id: string
          status?: string
          submission_content?: string
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_feedback?: string | null
          ai_feedback_at?: string | null
          created_at?: string
          file_urls?: string[] | null
          id?: string
          milestone_id?: string
          status?: string
          submission_content?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestone_submissions_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          course_id: string
          created_at: string
          deliverable_prompt: string
          description: string
          id: string
          order_number: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          deliverable_prompt?: string
          description?: string
          id?: string
          order_number: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          deliverable_prompt?: string
          description?: string
          id?: string
          order_number?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      project_rubric_categories: {
        Row: {
          course_id: string
          created_at: string
          description: string
          id: string
          max_points: number
          name: string
          order_number: number
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string
          id?: string
          max_points?: number
          name: string
          order_number?: number
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string
          id?: string
          max_points?: number
          name?: string
          order_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_rubric_categories_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      project_rubric_scores: {
        Row: {
          category_id: string
          created_at: string
          feedback: string | null
          id: string
          score: number
          submission_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          feedback?: string | null
          id?: string
          score?: number
          submission_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          feedback?: string | null
          id?: string
          score?: number
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_rubric_scores_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "project_rubric_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_rubric_scores_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "project_milestone_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          amount_cents: number
          course_id: string
          id: string
          purchased_at: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          course_id: string
          id?: string
          purchased_at?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          course_id?: string
          id?: string
          purchased_at?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_sessions: {
        Row: {
          course_id: string
          created_at: string
          duration_seconds: number
          ended_at: string | null
          id: string
          started_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          duration_seconds?: number
          ended_at?: string | null
          id?: string
          started_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          duration_seconds?: number
          ended_at?: string | null
          id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      student_essay_submissions: {
        Row: {
          admin_feedback: string | null
          admin_graded_at: string | null
          admin_score: number | null
          ai_feedback: string | null
          ai_graded_at: string | null
          ai_rubric_scores: Json | null
          ai_score: number | null
          content: string
          created_at: string
          essay_id: string
          id: string
          selected_prompt_index: number
          status: string
          submitted_at: string | null
          updated_at: string
          user_id: string
          word_count: number | null
        }
        Insert: {
          admin_feedback?: string | null
          admin_graded_at?: string | null
          admin_score?: number | null
          ai_feedback?: string | null
          ai_graded_at?: string | null
          ai_rubric_scores?: Json | null
          ai_score?: number | null
          content?: string
          created_at?: string
          essay_id: string
          id?: string
          selected_prompt_index?: number
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id: string
          word_count?: number | null
        }
        Update: {
          admin_feedback?: string | null
          admin_graded_at?: string | null
          admin_score?: number | null
          ai_feedback?: string | null
          ai_graded_at?: string | null
          ai_rubric_scores?: Json | null
          ai_score?: number | null
          content?: string
          created_at?: string
          essay_id?: string
          id?: string
          selected_prompt_index?: number
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_essay_submissions_essay_id_fkey"
            columns: ["essay_id"]
            isOneToOne: false
            referencedRelation: "course_essays"
            referencedColumns: ["id"]
          },
        ]
      }
      student_exam_attempts: {
        Row: {
          answers: Json
          created_at: string
          exam_id: string
          id: string
          passed: boolean | null
          score: number | null
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          exam_id: string
          id?: string
          passed?: boolean | null
          score?: number | null
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          exam_id?: string
          id?: string
          passed?: boolean | null
          score?: number | null
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "course_final_exams"
            referencedColumns: ["id"]
          },
        ]
      }
      student_notes: {
        Row: {
          content: string
          course_id: string | null
          created_at: string
          height: number | null
          id: string
          is_minimized: boolean
          position_x: number | null
          position_y: number | null
          title: string
          updated_at: string
          user_id: string
          width: number | null
        }
        Insert: {
          content?: string
          course_id?: string | null
          created_at?: string
          height?: number | null
          id?: string
          is_minimized?: boolean
          position_x?: number | null
          position_y?: number | null
          title?: string
          updated_at?: string
          user_id: string
          width?: number | null
        }
        Update: {
          content?: string
          course_id?: string | null
          created_at?: string
          height?: number | null
          id?: string
          is_minimized?: boolean
          position_x?: number | null
          position_y?: number | null
          title?: string
          updated_at?: string
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_notes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      textbook_chapter_objectives: {
        Row: {
          chapter_id: string
          created_at: string
          id: string
          objective_text: string
          order_number: number
        }
        Insert: {
          chapter_id: string
          created_at?: string
          id?: string
          objective_text: string
          order_number?: number
        }
        Update: {
          chapter_id?: string
          created_at?: string
          id?: string
          objective_text?: string
          order_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "textbook_chapter_objectives_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "textbook_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      textbook_chapters: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_preview: boolean
          lesson_id: string | null
          order_number: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_preview?: boolean
          lesson_id?: string | null
          order_number: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_preview?: boolean
          lesson_id?: string | null
          order_number?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "textbook_chapters_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "textbook_chapters_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      textbook_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          page_id: string
          paragraph_index: number
          parent_comment_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          page_id: string
          paragraph_index?: number
          parent_comment_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          page_id?: string
          paragraph_index?: number
          parent_comment_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "textbook_comments_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "textbook_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "textbook_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "textbook_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      textbook_pages: {
        Row: {
          chapter_id: string
          content: string
          created_at: string
          embedded_quiz: Json | null
          id: string
          page_number: number
          updated_at: string
        }
        Insert: {
          chapter_id: string
          content?: string
          created_at?: string
          embedded_quiz?: Json | null
          id?: string
          page_number: number
          updated_at?: string
        }
        Update: {
          chapter_id?: string
          content?: string
          created_at?: string
          embedded_quiz?: Json | null
          id?: string
          page_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "textbook_pages_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "textbook_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "achievement_badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_flashcards: {
        Row: {
          back_text: string
          course_id: string
          created_at: string
          ease_factor: number
          front_text: string
          highlight_id: string | null
          id: string
          interval_days: number
          last_reviewed_at: string | null
          next_review_at: string
          repetitions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          back_text: string
          course_id: string
          created_at?: string
          ease_factor?: number
          front_text: string
          highlight_id?: string | null
          id?: string
          interval_days?: number
          last_reviewed_at?: string | null
          next_review_at?: string
          repetitions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          back_text?: string
          course_id?: string
          created_at?: string
          ease_factor?: number
          front_text?: string
          highlight_id?: string | null
          id?: string
          interval_days?: number
          last_reviewed_at?: string | null
          next_review_at?: string
          repetitions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_flashcards_highlight_id_fkey"
            columns: ["highlight_id"]
            isOneToOne: false
            referencedRelation: "user_textbook_highlights"
            referencedColumns: ["id"]
          },
        ]
      }
      user_gamification: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_activity_date: string | null
          longest_streak: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_objective_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          objective_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          objective_id: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          objective_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_objective_progress_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "textbook_chapter_objectives"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          activity_score: number | null
          admin_notes: string | null
          admin_override_score: number | null
          completed: boolean
          completed_at: string | null
          created_at: string
          graded_at: string | null
          graded_by: string | null
          id: string
          lesson_id: string
          notes: string | null
          quiz_attempts: number
          quiz_score: number | null
          updated_at: string
          user_id: string
          worksheet_answers: Json | null
        }
        Insert: {
          activity_score?: number | null
          admin_notes?: string | null
          admin_override_score?: number | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          lesson_id: string
          notes?: string | null
          quiz_attempts?: number
          quiz_score?: number | null
          updated_at?: string
          user_id: string
          worksheet_answers?: Json | null
        }
        Update: {
          activity_score?: number | null
          admin_notes?: string | null
          admin_override_score?: number | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          lesson_id?: string
          notes?: string | null
          quiz_attempts?: number
          quiz_score?: number | null
          updated_at?: string
          user_id?: string
          worksheet_answers?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
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
      user_textbook_bookmarks: {
        Row: {
          chapter_id: string
          course_id: string
          id: string
          page_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_id: string
          course_id: string
          id?: string
          page_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string
          course_id?: string
          id?: string
          page_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_textbook_bookmarks_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "textbook_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_textbook_bookmarks_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_textbook_bookmarks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "textbook_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_textbook_highlights: {
        Row: {
          color: string
          created_at: string
          end_offset: number
          id: string
          note: string | null
          page_id: string
          start_offset: number
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          end_offset: number
          id?: string
          note?: string | null
          page_id: string
          start_offset: number
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          end_offset?: number
          id?: string
          note?: string | null
          page_id?: string
          start_offset?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_textbook_highlights_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "textbook_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_config: {
        Row: {
          action_key: string
          created_at: string
          id: string
          label: string
          updated_at: string
          xp_amount: number
        }
        Insert: {
          action_key: string
          created_at?: string
          id?: string
          label?: string
          updated_at?: string
          xp_amount?: number
        }
        Update: {
          action_key?: string
          created_at?: string
          id?: string
          label?: string
          updated_at?: string
          xp_amount?: number
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard_view: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          rank: number | null
          total_xp: number | null
          user_id: string | null
        }
        Relationships: []
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          id: string | null
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string | null
          id?: string | null
        }
        Update: {
          avatar_url?: string | null
          display_name?: string | null
          id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      award_xp: {
        Args: { _action?: string; _user_id: string; _xp_amount: number }
        Returns: Json
      }
      cancel_account_deletion: { Args: never; Returns: Json }
      check_textbook_quiz_answer: {
        Args: { _page_id: string; _selected_answer: number }
        Returns: Json
      }
      confirm_mfa_recovery_code: { Args: { _code: string }; Returns: Json }
      consume_mfa_recovery_code: { Args: { _code: string }; Returns: boolean }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_mfa_recovery_codes: { Args: never; Returns: Json }
      get_exam_for_student: { Args: { _course_id: string }; Returns: Json }
      get_my_deletion_request: { Args: never; Returns: Json }
      get_overall_progress: { Args: { _user_id: string }; Returns: Json }
      get_textbook_pages_for_student: {
        Args: { _course_id: string }
        Returns: Json
      }
      grade_and_submit_exam: {
        Args: { _answers: Json; _exam_id: string }
        Returns: Json
      }
      has_completed_course: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
      has_purchased_course: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      request_account_deletion: {
        Args: { _delete_content?: boolean }
        Returns: Json
      }
      verify_certificate_by_code: {
        Args: { code: string }
        Returns: {
          course_id: string
          course_title: string
          created_at: string
          id: string
          issued_at: string
          student_name: string
          user_id: string
          verification_code: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "student"
      course_phase: "initialization" | "orchestration" | "launch"
      lesson_type:
        | "text"
        | "video"
        | "quiz"
        | "assignment"
        | "worksheet"
        | "activity"
      project_status: "draft" | "submitted" | "reviewed"
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
      app_role: ["admin", "student"],
      course_phase: ["initialization", "orchestration", "launch"],
      lesson_type: [
        "text",
        "video",
        "quiz",
        "assignment",
        "worksheet",
        "activity",
      ],
      project_status: ["draft", "submitted", "reviewed"],
    },
  },
} as const
