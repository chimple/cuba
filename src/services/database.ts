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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      announcement: {
        Row: {
          created_at: string
          custom_icon: string | null
          id: string
          image_url: string | null
          message: string | null
          send_at: string | null
          target_ids: string[] | null
          title: string | null
          type: string | null
        }
        Insert: {
          created_at?: string
          custom_icon?: string | null
          id?: string
          image_url?: string | null
          message?: string | null
          send_at?: string | null
          target_ids?: string[] | null
          title?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string
          custom_icon?: string | null
          id?: string
          image_url?: string | null
          message?: string | null
          send_at?: string | null
          target_ids?: string[] | null
          title?: string | null
          type?: string | null
        }
        Relationships: []
      }
      assignment: {
        Row: {
          batch_id: string | null
          chapter_id: string | null
          class_id: string
          course_id: string | null
          created_at: string
          created_by: string | null
          ends_at: string | null
          firebase_id: string | null
          id: string
          is_class_wise: boolean
          is_deleted: boolean | null
          is_firebase: boolean | null
          lesson_id: string
          school_id: string
          source: string | null
          starts_at: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          batch_id?: string | null
          chapter_id?: string | null
          class_id: string
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          firebase_id?: string | null
          id?: string
          is_class_wise?: boolean
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          lesson_id: string
          school_id: string
          source?: string | null
          starts_at?: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          batch_id?: string | null
          chapter_id?: string | null
          class_id?: string
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          firebase_id?: string | null
          id?: string
          is_class_wise?: boolean
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          lesson_id?: string
          school_id?: string
          source?: string | null
          starts_at?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_assignment_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_assignment_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_assignment_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lesson"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_assignment_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_cart: {
        Row: {
          created_at: string
          id: string
          is_deleted: boolean | null
          is_firebase: boolean | null
          lessons: string | null
          source: Database["public"]["Enums"]["assignment_source"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          lessons?: string | null
          source?: Database["public"]["Enums"]["assignment_source"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          lessons?: string | null
          source?: Database["public"]["Enums"]["assignment_source"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_cart_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_user: {
        Row: {
          assignment_id: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          is_firebase: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assignment_id: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assignment_id?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_assignment_user_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_assignment_user_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_chatbot: {
        Row: {
          created_at: string
          id: string
          is_deleted: boolean | null
          school_id: string
          task_data: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          school_id: string
          task_data?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          school_id?: string
          task_data?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_auto_chatbot_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school"
            referencedColumns: ["id"]
          },
        ]
      }
      badge: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image: string | null
          is_deleted: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          is_deleted?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          is_deleted?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      chapter: {
        Row: {
          course_id: string | null
          created_at: string
          id: string
          image: string | null
          is_deleted: boolean | null
          name: string | null
          sort_index: number | null
          sub_topics: string | null
          updated_at: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          id?: string
          image?: string | null
          is_deleted?: boolean | null
          name?: string | null
          sort_index?: number | null
          sub_topics?: string | null
          updated_at?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string
          id?: string
          image?: string | null
          is_deleted?: boolean | null
          name?: string | null
          sort_index?: number | null
          sub_topics?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_chapter_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course"
            referencedColumns: ["id"]
          },
        ]
      }
      chapter_lesson: {
        Row: {
          chapter_id: string
          created_at: string
          id: string
          is_deleted: boolean | null
          lesson_id: string
          sort_index: number | null
          updated_at: string | null
        }
        Insert: {
          chapter_id: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          lesson_id: string
          sort_index?: number | null
          updated_at?: string | null
        }
        Update: {
          chapter_id?: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          lesson_id?: string
          sort_index?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_chapter_lesson_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_chapter_lesson_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lesson"
            referencedColumns: ["id"]
          },
        ]
      }
      chapter_links: {
        Row: {
          chapter_id: string | null
          course_id: string | null
          created_at: string
          curriculum_id: string | null
          grade_id: string | null
          id: string
          is_deleted: boolean | null
          link: string | null
          updated_at: string | null
        }
        Insert: {
          chapter_id?: string | null
          course_id?: string | null
          created_at?: string
          curriculum_id?: string | null
          grade_id?: string | null
          id?: string
          is_deleted?: boolean | null
          link?: string | null
          updated_at?: string | null
        }
        Update: {
          chapter_id?: string | null
          course_id?: string | null
          created_at?: string
          curriculum_id?: string | null
          grade_id?: string | null
          id?: string
          is_deleted?: boolean | null
          link?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chapter_links_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_links_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_links_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curriculum"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_links_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grade"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot: {
        Row: {
          chatbot_doc: Json | null
          created_at: string
          id: string
          is_deleted: boolean | null
          phonenumber: string
          updated_at: string | null
        }
        Insert: {
          chatbot_doc?: Json | null
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          phonenumber: string
          updated_at?: string | null
        }
        Update: {
          chatbot_doc?: Json | null
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          phonenumber?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      class: {
        Row: {
          academic_year: string | null
          created_at: string
          firebase_id: string | null
          group_id: string | null
          id: string
          image: string | null
          is_deleted: boolean | null
          is_firebase: boolean | null
          is_ops: boolean | null
          name: string
          ops_created_by: string | null
          school_id: string
          standard: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          academic_year?: string | null
          created_at?: string
          firebase_id?: string | null
          group_id?: string | null
          id?: string
          image?: string | null
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          is_ops?: boolean | null
          name: string
          ops_created_by?: string | null
          school_id: string
          standard?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_year?: string | null
          created_at?: string
          firebase_id?: string | null
          group_id?: string | null
          id?: string
          image?: string | null
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          is_ops?: boolean | null
          name?: string
          ops_created_by?: string | null
          school_id?: string
          standard?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_ops_created_by_fkey"
            columns: ["ops_created_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_class_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school"
            referencedColumns: ["id"]
          },
        ]
      }
      class_course: {
        Row: {
          class_id: string
          course_id: string
          created_at: string
          id: string
          is_deleted: boolean | null
          is_firebase: boolean | null
          is_ops: boolean | null
          ops_created_by: string | null
          updated_at: string | null
        }
        Insert: {
          class_id: string
          course_id: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          is_ops?: boolean | null
          ops_created_by?: string | null
          updated_at?: string | null
        }
        Update: {
          class_id?: string
          course_id?: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          is_ops?: boolean | null
          ops_created_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_course_ops_created_by_fkey"
            columns: ["ops_created_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_class_course_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_class_course_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course"
            referencedColumns: ["id"]
          },
        ]
      }
      class_invite_code: {
        Row: {
          class_id: string
          code: number
          created_at: string
          expires_at: string
          id: string
          is_class_code: boolean | null
          is_deleted: boolean | null
          is_firebase: boolean | null
          updated_at: string | null
        }
        Insert: {
          class_id: string
          code: number
          created_at?: string
          expires_at: string
          id?: string
          is_class_code?: boolean | null
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          updated_at?: string | null
        }
        Update: {
          class_id?: string
          code?: number
          created_at?: string
          expires_at?: string
          id?: string
          is_class_code?: boolean | null
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_class_invite_code_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class"
            referencedColumns: ["id"]
          },
        ]
      }
      class_user: {
        Row: {
          class_id: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          is_firebase: boolean | null
          is_ops: boolean | null
          ops_created_by: string | null
          role: Database["public"]["Enums"]["role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          class_id: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          is_ops?: boolean | null
          ops_created_by?: string | null
          role: Database["public"]["Enums"]["role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          class_id?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          is_ops?: boolean | null
          ops_created_by?: string | null
          role?: Database["public"]["Enums"]["role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_user_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_user_ops_created_by_fkey"
            columns: ["ops_created_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_user_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }

      connector_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
      course: {
        Row: {
          code: string | null
          color: string | null
          created_at: string
          curriculum_id: string | null
          description: string | null
          firebase_id: string | null
          grade_id: string | null
          id: string
          image: string | null
          is_deleted: boolean | null
          name: string
          sort_index: number | null
          subject_id: string | null
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          color?: string | null
          created_at?: string
          curriculum_id?: string | null
          description?: string | null
          firebase_id?: string | null
          grade_id?: string | null
          id?: string
          image?: string | null
          is_deleted?: boolean | null
          name: string
          sort_index?: number | null
          subject_id?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          color?: string | null
          created_at?: string
          curriculum_id?: string | null
          description?: string | null
          firebase_id?: string | null
          grade_id?: string | null
          id?: string
          image?: string | null
          is_deleted?: boolean | null
          name?: string
          sort_index?: number | null
          subject_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_course_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curriculum"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_course_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_course_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subject"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum: {
        Row: {
          created_at: string
          description: string | null
          firebase_id: string | null
          id: string
          image: string | null
          is_deleted: boolean | null
          name: string
          sort_index: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          firebase_id?: string | null
          id?: string
          image?: string | null
          is_deleted?: boolean | null
          name: string
          sort_index?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          firebase_id?: string | null
          id?: string
          image?: string | null
          is_deleted?: boolean | null
          name?: string
          sort_index?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          created_at: string
          id: number
          message: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          message?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          message?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "error_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_lesson: {
        Row: {
          created_at: string | null
          id: string
          is_deleted: boolean | null
          is_firebase: boolean | null
          lesson_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          lesson_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          lesson_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_lesson_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lesson"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_lesson_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      gb_response: {
        Row: {
          content: Json | null
        }
        Insert: {
          content?: Json | null
        }
        Update: {
          content?: Json | null
        }
        Relationships: []
      }
      geo_locations: {
        Row: {
          block: string | null
          country: string
          created_at: string
          district: string | null
          id: string
          is_deleted: boolean | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          block?: string | null
          country: string
          created_at?: string
          district?: string | null
          id?: string
          is_deleted?: boolean | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          block?: string | null
          country?: string
          created_at?: string
          district?: string | null
          id?: string
          is_deleted?: boolean | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      grade: {
        Row: {
          created_at: string
          description: string | null
          firebase_id: string | null
          id: string
          image: string | null
          is_deleted: boolean | null
          name: string
          sort_index: number | null
          test: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          firebase_id?: string | null
          id?: string
          image?: string | null
          is_deleted?: boolean | null
          name: string
          sort_index?: number | null
          test?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          firebase_id?: string | null
          id?: string
          image?: string | null
          is_deleted?: boolean | null
          name?: string
          sort_index?: number | null
          test?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      issue_debug: {
        Row: {
          created_at: string
          firebase_id: string | null
          id: string
          is_firebase: boolean | null
          result_id: string | null
          student_id: string | null
        }
        Insert: {
          created_at?: string
          firebase_id?: string | null
          id?: string
          is_firebase?: boolean | null
          result_id?: string | null
          student_id?: string | null
        }
        Update: {
          created_at?: string
          firebase_id?: string | null
          id?: string
          is_firebase?: boolean | null
          result_id?: string | null
          student_id?: string | null
        }
        Relationships: []
      }
      language: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          firebase_id: string | null
          id: string
          image: string | null
          is_deleted: boolean | null
          name: string
          sort_index: number | null
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          firebase_id?: string | null
          id?: string
          image?: string | null
          is_deleted?: boolean | null
          name: string
          sort_index?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          firebase_id?: string | null
          id?: string
          image?: string | null
          is_deleted?: boolean | null
          name?: string
          sort_index?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lesson: {
        Row: {
          cocos_chapter_code: string | null
          cocos_lesson_id: string | null
          cocos_subject_code: string | null
          color: string | null
          created_at: string
          created_by: string | null
          id: string
          image: string | null
          is_deleted: boolean | null
          language_id: string | null
          name: string | null
          outcome: string | null
          plugin_type: string | null
          status: string | null
          subject_id: string | null
          target_age_from: number | null
          target_age_to: number | null
          updated_at: string | null
        }
        Insert: {
          cocos_chapter_code?: string | null
          cocos_lesson_id?: string | null
          cocos_subject_code?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image?: string | null
          is_deleted?: boolean | null
          language_id?: string | null
          name?: string | null
          outcome?: string | null
          plugin_type?: string | null
          status?: string | null
          subject_id?: string | null
          target_age_from?: number | null
          target_age_to?: number | null
          updated_at?: string | null
        }
        Update: {
          cocos_chapter_code?: string | null
          cocos_lesson_id?: string | null
          cocos_subject_code?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image?: string | null
          is_deleted?: boolean | null
          language_id?: string | null
          name?: string | null
          outcome?: string | null
          plugin_type?: string | null
          status?: string | null
          subject_id?: string | null
          target_age_from?: number | null
          target_age_to?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_lesson_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "language"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_lesson_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subject"
            referencedColumns: ["id"]
          },
        ]
      }
      live_quiz_room: {
        Row: {
          assignment_id: string
          class_id: string
          course_id: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          lesson_id: string
          participants: string[] | null
          results: Json | null
          school_id: string
          starts_at: string
          updated_at: string | null
        }
        Insert: {
          assignment_id: string
          class_id: string
          course_id: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          lesson_id: string
          participants?: string[] | null
          results?: Json | null
          school_id: string
          starts_at: string
          updated_at?: string | null
        }
        Update: {
          assignment_id?: string
          class_id?: string
          course_id?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          lesson_id?: string
          participants?: string[] | null
          results?: Json | null
          school_id?: string
          starts_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lesson"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_requests: {
        Row: {
          class_id: string | null
          created_at: string
          id: string
          is_deleted: boolean | null
          rejected_reason_description: string | null
          rejected_reason_type: string | null
          request_ends_at: string | null
          request_id: string | null
          request_status:
            | Database["public"]["Enums"]["ops_request_status"]
            | null
          request_type: Database["public"]["Enums"]["ops_request_type"] | null
          requested_by: string | null
          requested_to: string | null
          responded_by: string | null
          school_id: string | null
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          rejected_reason_description?: string | null
          rejected_reason_type?: string | null
          request_ends_at?: string | null
          request_id?: string | null
          request_status?:
            | Database["public"]["Enums"]["ops_request_status"]
            | null
          request_type?: Database["public"]["Enums"]["ops_request_type"] | null
          requested_by?: string | null
          requested_to?: string | null
          responded_by?: string | null
          school_id?: string | null
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          rejected_reason_description?: string | null
          rejected_reason_type?: string | null
          request_ends_at?: string | null
          request_id?: string | null
          request_status?:
            | Database["public"]["Enums"]["ops_request_status"]
            | null
          request_type?: Database["public"]["Enums"]["ops_request_type"] | null
          requested_by?: string | null
          requested_to?: string | null
          responded_by?: string | null
          school_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opps_requests_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opps_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opps_requests_requested_to_fkey"
            columns: ["requested_to"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opps_requests_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opps_requests_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_user: {
        Row: {
          created_at: string | null
          id: string
          is_deleted: boolean | null
          is_firebase: boolean | null
          is_ops: boolean | null
          ops_created_by: string | null
          parent_id: string
          student_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          is_ops?: boolean | null
          ops_created_by?: string | null
          parent_id: string
          student_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          is_ops?: boolean | null
          ops_created_by?: string | null
          parent_id?: string
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parent_user_ops_created_by_fkey"
            columns: ["ops_created_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_user_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_user_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      program: {
        Row: {
          block: string | null
          cluster: string | null
          country: string | null
          created_at: string
          devices_count: string | null
          district: string | null
          end_date: string | null
          funding_partner: string | null
          id: string
          implementation_partner: string | null
          institute_partner: string | null
          institutes_count: string | null
          is_deleted: boolean | null
          is_ops: boolean | null
          model: string | null
          name: string
          program_type: Database["public"]["Enums"]["program_type"] | null
          start_date: string | null
          state: string | null
          students_count: string | null
          updated_at: string
          village: string | null
        }
        Insert: {
          block?: string | null
          cluster?: string | null
          country?: string | null
          created_at?: string
          devices_count?: string | null
          district?: string | null
          end_date?: string | null
          funding_partner?: string | null
          id?: string
          implementation_partner?: string | null
          institute_partner?: string | null
          institutes_count?: string | null
          is_deleted?: boolean | null
          is_ops?: boolean | null
          model?: string | null
          name: string
          program_type?: Database["public"]["Enums"]["program_type"] | null
          start_date?: string | null
          state?: string | null
          students_count?: string | null
          updated_at?: string
          village?: string | null
        }
        Update: {
          block?: string | null
          cluster?: string | null
          country?: string | null
          created_at?: string
          devices_count?: string | null
          district?: string | null
          end_date?: string | null
          funding_partner?: string | null
          id?: string
          implementation_partner?: string | null
          institute_partner?: string | null
          institutes_count?: string | null
          is_deleted?: boolean | null
          is_ops?: boolean | null
          model?: string | null
          name?: string
          program_type?: Database["public"]["Enums"]["program_type"] | null
          start_date?: string | null
          state?: string | null
          students_count?: string | null
          updated_at?: string
          village?: string | null
        }
        Relationships: []
      }
      program_user: {
        Row: {
          created_at: string
          id: string
          is_deleted: boolean
          is_ops: boolean | null
          program_id: string
          role: Database["public"]["Enums"]["role"] | null
          updated_at: string
          user: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_deleted?: boolean
          is_ops?: boolean | null
          program_id: string
          role?: Database["public"]["Enums"]["role"] | null
          updated_at?: string
          user?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_deleted?: boolean
          is_ops?: boolean | null
          program_id?: string
          role?: Database["public"]["Enums"]["role"] | null
          updated_at?: string
          user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_user_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "program"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_user_user_fkey"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      req_new_school: {
        Row: {
          city: string | null
          created_at: string | null
          district: string | null
          id: string
          image: string | null
          is_deleted: boolean | null
          is_resolved: boolean | null
          name: string | null
          state: string | null
          udise_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          district?: string | null
          id?: string
          image?: string | null
          is_deleted?: boolean | null
          is_resolved?: boolean | null
          name?: string | null
          state?: string | null
          udise_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          district?: string | null
          id?: string
          image?: string | null
          is_deleted?: boolean | null
          is_resolved?: boolean | null
          name?: string | null
          state?: string | null
          udise_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "req_new_school_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      result: {
        Row: {
          assignment_id: string | null
          chapter_id: string | null
          class_id: string | null
          
          correct_moves: number | null
          course_id: string | null
          created_at: string
          
          firebase_id: string | null
          id: string
          is_deleted: boolean | null
          is_firebase: boolean | null
          lesson_id: string | null
          school_id: string | null
          score: number | null
          student_id: string
          time_spent: number | null
          updated_at: string | null
          wrong_moves: number | null
        }
        Insert: {
          assignment_id?: string | null
          chapter_id?: string | null
          class_id?: string | null
          correct_moves?: number | null
          course_id?: string | null
          created_at?: string
          firebase_id?: string | null
          id?: string
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          
          
          lesson_id?: string | null
          school_id?: string | null
          score?: number | null
          student_id: string
          time_spent?: number | null
          updated_at?: string | null
          wrong_moves?: number | null
        }
        Update: {
          assignment_id?: string | null
          chapter_id?: string | null
          class_id?: string | null
          
          correct_moves?: number | null
          course_id?: string | null
          created_at?: string
          
          firebase_id?: string | null
          id?: string
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          
          
          lesson_id?: string | null
          school_id?: string | null
          score?: number | null
          student_id?: string
          time_spent?: number | null
          updated_at?: string | null
          wrong_moves?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "public_result_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_result_lesson_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lesson"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_result_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "result_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapter"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "result_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "result_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course"
            referencedColumns: ["id"]
          },

          {
            foreignKeyName: "result_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      reward: {
        Row: {
          created_at: string
          id: string
          is_deleted: boolean | null
          monthly: string | null
          updated_at: string | null
          weekly: string | null
          weeklySticker: string | null
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          monthly?: string | null
          updated_at?: string | null
          weekly?: string | null
          weeklySticker?: string | null
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          monthly?: string | null
          updated_at?: string | null
          weekly?: string | null
          weeklySticker?: string | null
          year?: number
        }
        Relationships: []
      }
      rive_reward: {
        Row: {
          accessory_name: string
          animation_name: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          max_state_value: number
          state_input_name: string | null
          state_machine: string | null
          state_number_input: number | null
          type: Database["public"]["Enums"]["rive_type"]
          updated_at: string | null
        }
        Insert: {
          accessory_name: string
          animation_name: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          max_state_value?: number
          state_input_name?: string | null
          state_machine?: string | null
          state_number_input?: number | null
          type?: Database["public"]["Enums"]["rive_type"]
          updated_at?: string | null
        }
        Update: {
          accessory_name?: string
          animation_name?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          max_state_value?: number
          state_input_name?: string | null
          state_machine?: string | null
          state_number_input?: number | null
          type?: Database["public"]["Enums"]["rive_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      saved_queries: {
        Row: {
          created_at: string | null
          id: string
          query: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          query: string
        }
        Update: {
          created_at?: string | null
          id?: string
          query?: string
        }
        Relationships: []
      }
      school: {
        Row: {
          academic_year: string | null
          address: string | null
          country: string | null
          created_at: string
          firebase_id: string | null
          group1: string | null
          group2: string | null
          group3: string | null
          group4: string | null
          id: string
          image: string | null
          is_deleted: boolean | null
          is_firebase: boolean | null
          is_ops: boolean | null
          key_contacts: string | null
          language: string | null
          location_link: string | null
          model: Database["public"]["Enums"]["program_model"] | null
          name: string
          ops_created_by: string | null
          program_id: string | null
          status: Database["public"]["Enums"]["status"] | null
          student_login_type: Database["public"]["Enums"]["login_type"] | null
          udise: string | null
          updated_at: string | null
        }
        Insert: {
          academic_year?: string | null
          address?: string | null
          country?: string | null
          created_at?: string
          firebase_id?: string | null
          group1?: string | null
          group2?: string | null
          group3?: string | null
          group4?: string | null
          id?: string
          image?: string | null
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          is_ops?: boolean | null
          key_contacts?: string | null
          language?: string | null
          location_link?: string | null
          model?: Database["public"]["Enums"]["program_model"] | null
          name: string
          ops_created_by?: string | null
          program_id?: string | null
          status?: Database["public"]["Enums"]["status"] | null
          student_login_type?: Database["public"]["Enums"]["login_type"] | null
          udise?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_year?: string | null
          address?: string | null
          country?: string | null
          created_at?: string
          firebase_id?: string | null
          group1?: string | null
          group2?: string | null
          group3?: string | null
          group4?: string | null
          id?: string
          image?: string | null
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          is_ops?: boolean | null
          key_contacts?: string | null
          language?: string | null
          location_link?: string | null
          model?: Database["public"]["Enums"]["program_model"] | null
          name?: string
          ops_created_by?: string | null
          program_id?: string | null
          status?: Database["public"]["Enums"]["status"] | null
          student_login_type?: Database["public"]["Enums"]["login_type"] | null
          udise?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_language_fkey"
            columns: ["language"]
            isOneToOne: false
            referencedRelation: "language"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_ops_created_by_fkey"
            columns: ["ops_created_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "program"
            referencedColumns: ["id"]
          },
        ]
      }
      school_course: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_deleted: boolean | null
          is_firebase: boolean | null
          is_ops: boolean | null
          ops_created_by: string | null
          school_id: string
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          is_ops?: boolean | null
          ops_created_by?: string | null
          school_id: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          is_ops?: boolean | null
          ops_created_by?: string | null
          school_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_school_course_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_school_course_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_course_ops_created_by_fkey"
            columns: ["ops_created_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      school_data: {
        Row: {
          block: string | null
          classes: string | null
          cluster: string | null
          country: string | null
          created_at: string
          district: string | null
          head_teacher: string | null
          head_teachers: string | null
          id: string
          instruction_medium: string | null
          pre_primary_section_available: boolean | null
          school_name: string | null
          school_type: string | null
          state: string | null
          total_teachers: number | null
          udise_code: string | null
          updated_at: string | null
          village: string | null
        }
        Insert: {
          block?: string | null
          classes?: string | null
          cluster?: string | null
          country?: string | null
          created_at?: string
          district?: string | null
          head_teacher?: string | null
          head_teachers?: string | null
          id?: string
          instruction_medium?: string | null
          pre_primary_section_available?: boolean | null
          school_name?: string | null
          school_type?: string | null
          state?: string | null
          total_teachers?: number | null
          udise_code?: string | null
          updated_at?: string | null
          village?: string | null
        }
        Update: {
          block?: string | null
          classes?: string | null
          cluster?: string | null
          country?: string | null
          created_at?: string
          district?: string | null
          head_teacher?: string | null
          head_teachers?: string | null
          id?: string
          instruction_medium?: string | null
          pre_primary_section_available?: boolean | null
          school_name?: string | null
          school_type?: string | null
          state?: string | null
          total_teachers?: number | null
          udise_code?: string | null
          updated_at?: string | null
          village?: string | null
        }
        Relationships: []
      }
      school_user: {
        Row: {
          created_at: string
          id: string
          is_deleted: boolean | null
          is_firebase: boolean | null
          is_ops: boolean | null
          ops_created_by: string | null
          role: Database["public"]["Enums"]["role"]
          school_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          is_ops?: boolean | null
          ops_created_by?: string | null
          role: Database["public"]["Enums"]["role"]
          school_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          is_ops?: boolean | null
          ops_created_by?: string | null
          role?: Database["public"]["Enums"]["role"]
          school_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_user_ops_created_by_fkey"
            columns: ["ops_created_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_user_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_user_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      special_users: {
        Row: {
          created_at: string
          id: string
          is_deleted: boolean | null
          role: Database["public"]["Enums"]["special_roles"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          role?: Database["public"]["Enums"]["special_roles"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          role?: Database["public"]["Enums"]["special_roles"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "special_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      sticker: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image: string | null
          is_deleted: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          is_deleted?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          is_deleted?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      subject: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image: string | null
          is_deleted: boolean | null
          name: string
          sort_index: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          is_deleted?: boolean | null
          name: string
          sort_index?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          is_deleted?: boolean | null
          name?: string
          sort_index?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      upload_queue: {
        Row: {
          batch_number: number | null
          created_at: string | null
          error: string | null
          id: string
          is_locked: boolean | null
          locked_at: string | null
          locked_by: string | null
          locked_until: string | null
          payload: Json
          process_started_at: string | null
          start_time: string | null
          status: string | null
          updated_at: string | null
          uploading_user: string | null
        }
        Insert: {
          batch_number?: number | null
          created_at?: string | null
          error?: string | null
          id?: string
          is_locked?: boolean | null
          locked_at?: string | null
          locked_by?: string | null
          locked_until?: string | null
          payload: Json
          process_started_at?: string | null
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
          uploading_user?: string | null
        }
        Update: {
          batch_number?: number | null
          created_at?: string | null
          error?: string | null
          id?: string
          is_locked?: boolean | null
          locked_at?: string | null
          locked_by?: string | null
          locked_until?: string | null
          payload?: Json
          process_started_at?: string | null
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
          uploading_user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "upload_queue_uploading_user_fkey"
            columns: ["uploading_user"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      user: {
        Row: {
          age: number | null
          avatar: string | null
          created_at: string
          curriculum_id: string | null
          email: string | null
          fcm_token: string | null
          firebase_id: string | null
          gender: string | null
          grade_id: string | null
          id: string
          image: string | null
          is_deleted: boolean | null
          is_firebase: boolean | null
          is_ops: boolean | null
          is_tc_accepted: boolean | null
          language_id: string | null
          learning_path: string | null
          music_off: boolean | null
          name: string | null
          ops_created_by: string | null
          phone: string | null
          reward: string | null
          sfx_off: boolean | null
          stars: number | null
          student_id: string | null
          updated_at: string | null
        }
        Insert: {
          age?: number | null
          avatar?: string | null
          created_at?: string
          curriculum_id?: string | null
          email?: string | null
          fcm_token?: string | null
          firebase_id?: string | null
          gender?: string | null
          grade_id?: string | null
          id?: string
          image?: string | null
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          is_ops?: boolean | null
          is_tc_accepted?: boolean | null
          language_id?: string | null
          learning_path?: string | null
          music_off?: boolean | null
          name?: string | null
          ops_created_by?: string | null
          phone?: string | null
          reward?: string | null
          sfx_off?: boolean | null
          stars?: number | null
          student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          age?: number | null
          avatar?: string | null
          created_at?: string
          curriculum_id?: string | null
          email?: string | null
          fcm_token?: string | null
          firebase_id?: string | null
          gender?: string | null
          grade_id?: string | null
          id?: string
          image?: string | null
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          is_ops?: boolean | null
          is_tc_accepted?: boolean | null
          language_id?: string | null
          learning_path?: string | null
          music_off?: boolean | null
          name?: string | null
          ops_created_by?: string | null
          phone?: string | null
          reward?: string | null
          sfx_off?: boolean | null
          stars?: number | null
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_user_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curriculum"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_user_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "language"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_ops_created_by_fkey"
            columns: ["ops_created_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badge: {
        Row: {
          badge_id: string
          created_at: string
          id: string
          is_deleted: boolean | null
          is_firebase: boolean | null
          is_seen: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          badge_id: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          is_seen?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          badge_id?: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          is_seen?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_user_badge_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badge"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_user_badge_parent_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bonus: {
        Row: {
          bonus_id: string
          created_at: string
          id: string
          is_deleted: boolean | null
          is_firebase: boolean | null
          is_seen: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bonus_id: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          is_seen?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bonus_id?: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          is_seen?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_user_bonus_bonus_id_fkey"
            columns: ["bonus_id"]
            isOneToOne: false
            referencedRelation: "lesson"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_user_bonus_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      user_course: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_deleted: boolean | null
          is_firebase: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_user_course_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_user_course_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sticker: {
        Row: {
          created_at: string
          id: string
          is_deleted: boolean | null
          is_firebase: boolean | null
          is_seen: boolean | null
          sticker_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          is_seen?: boolean | null
          sticker_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_firebase?: boolean | null
          is_seen?: boolean | null
          sticker_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_user_sticker_sticker_id_fkey"
            columns: ["sticker_id"]
            isOneToOne: false
            referencedRelation: "sticker"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_user_sticker_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      
    }
    Views: {
      get_leaderboard_generic_data: {
        Row: {
          lessons_played: number | null
          name: string | null
          student_id: string | null
          total_score: number | null
          total_time_spent: number | null
          type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_parent_to_newclass: {
        Args: { _class_id: string; _student_id: string }
        Returns: undefined
      }
      call_send_badges: { Args: never; Returns: undefined }
      call_send_bonuses: { Args: never; Returns: undefined }
      can_soft_delete_ops_request: {
        Args: {
          is_sponsor_enabled: boolean
          p_class_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      check_class_exists_by_name_and_school: {
        Args: { class_name: string; input_school_udise_code: string }
        Returns: Json
      }
      check_parent_and_student_in_class: {
        Args: {
          class_name: string
          input_school_udise_code: string
          phone_number: string
          student_name: string
        }
        Returns: Json
      }
      check_student_duplicate_in_class_without_phone_number: {
        Args: {
          class_name: string
          input_school_udise_code: string
          student_name: string
        }
        Returns: Json
      }
      clear_assignment_info_queue: {
        Args: { p_class_id: string; p_school_id: string }
        Returns: undefined
      }
      count_users_by_school: {
        Args: { p_school_id: string }
        Returns: {
          active_students: number
          active_teachers: number
          avg_time_spent: number
          total_students: number
          total_teachers: number
        }[]
      }
      create_user: {
        Args: { phone_number: string }
        Returns: {
          id: string
          phone: string
        }[]
      }
      delete_class_firebase_trigger: {
        Args: { input_firebase_id: string }
        Returns: string
      }
      delete_group_assignment_message: {
        Args: { msg_id: number; queue_name: string }
        Returns: boolean
      }
      delete_school_firebase_trigger: {
        Args: { input_firebase_id: string }
        Returns: string
      }
      delete_student: { Args: { student_id: string }; Returns: undefined }
      delete_student_profile: {
        Args: { p_student_id: string }
        Returns: undefined
      }
      delete_user: { Args: { uuid: string }; Returns: boolean }
      dump_user_table_policies: { Args: never; Returns: string }
      enqueue_message: {
        Args: { delay_seconds?: number; payload: Json; queue_name: string }
        Returns: number
      }
      execute_saved_query: { Args: { p_query_id: string }; Returns: Json }
      fetch_leaderboard_data: {
        Args: never
        Returns: {
          lessons_played: number
          name: string
          student_id: string
          total_score: number
          total_time_spent: number
          type: string
        }[]
      }
      find_similar_lessons: {
        Args: { search_text: string }
        Returns: {
          cocos_chapter_code: string
          cocos_lesson_id: string
          cocos_subject_code: string
          color: string
          created_at: string
          created_by: string
          id: string
          image: string
          is_deleted: boolean
          language_id: string
          name: string
          outcome: string
          plugin_type: string
          status: string
          subject_id: string
          target_age_from: number
          target_age_to: number
          updated_at: string
        }[]
      }
      generate_custom_request_id: { Args: never; Returns: string }
      generate_unique_class_code: {
        Args: { class_id_input: string }
        Returns: number
      }
      get_active_students_count_by_class: {
        Args: { p_class_id: string; p_days: number }
        Returns: number
      }
      get_class_leaderboard: {
        Args: { current_class_id: string }
        Returns: {
          lessons_played: number
          name: string
          student_id: string
          total_score: number
          total_time_spent: number
          type: string
        }[]
      }
      get_classes_by_school_id: {
        Args: { school_id_input: string }
        Returns: {
          academic_year: string | null
          created_at: string
          firebase_id: string | null
          group_id: string | null
          id: string
          image: string | null
          is_deleted: boolean | null
          is_firebase: boolean | null
          is_ops: boolean | null
          name: string
          ops_created_by: string | null
          school_id: string
          standard: string | null
          status: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "class"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_filtered_schools_with_optional_program: {
        Args: {
          _program_id?: string
          filters?: Json
          order_by?: string
          order_dir?: string
          page?: number
          page_size?: number
          search?: string
        }
        Returns: Json
      }
      get_geo_data: {
        Args: {
          p_block?: string
          p_country?: string
          p_district?: string
          p_state?: string
        }
        Returns: string[]
      }
      get_latest_results_by_student: {
        Args: { student_uuid: string }
        Returns: {
          assignment_id: string | null
          chapter_id: string | null
          class_id: string | null
          
          correct_moves: number | null
          course_id: string | null
          created_at: string
          
          firebase_id: string | null
          id: string
          is_deleted: boolean | null
          is_firebase: boolean | null
          learning_indicator_id: string | null
          learning_outcome_id: string | null
          lesson_id: string | null
          school_id: string | null
          score: number | null
          student_id: string
          time_spent: number | null
          updated_at: string | null
          wrong_moves: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "result"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_leaderboard: {
        Args: never
        Returns: {
          lessons_played: number
          name: string
          student_id: string
          total_score: number
          total_time_spent: number
          type: string
        }[]
      }
      get_program_activity_stats: {
        Args: { p_program_id: string }
        Returns: Json
      }
      get_program_filter_options: { Args: never; Returns: Json }
      get_program_filters: { Args: never; Returns: Json }
      get_program_for_user_v2: {
        Args: {
          _current_user_id: string
          _filters: Json
          _search_term: string
          _tab: string
        }
        Returns: {
          devices_count: number
          id: string
          institutes_count: number
          manager_names: string
          name: string
          state: string
          students_count: number
        }[]
      }
      get_program_managers: {
        Args: never
        Returns: {
          id: string
          name: string
        }[]
      }
      get_programs_for_user: {
        Args: {
          _current_user_id: string
          _filters: Json
          _limit?: number
          _offset?: number
          _order?: string
          _order_by?: string
          _search_term: string
          _tab: string
        }
        Returns: {
          devices_count: number
          id: string
          institutes_count: number
          manager_names: string
          name: string
          state: string
          students_count: number
          total_count: number
        }[]
      }
      get_query_data: { Args: { p_query_id: string }; Returns: Json }
      get_query_data_v2: {
        Args: { p_query: string; p_secret: string }
        Returns: Json
      }
      get_query_metadata: { Args: { p_query_id: string }; Returns: Json }
      get_query_metadata_v2: {
        Args: { p_query: string; p_secret: string }
        Returns: Json
      }
      get_results_by_assignment: {
        Args: { _assignment_id: string }
        Returns: {
          result_data: Database["public"]["Tables"]["result"]["Row"][]
          user_data: Database["public"]["Tables"]["user"]["Row"][]
        }[]
      }
      get_school_activity_stats: {
        Args: { p_school_id: string }
        Returns: Json
      }
      get_school_filter_options: { Args: never; Returns: Json }
      get_school_filter_options_for_program: {
        Args: { input_program_id: string }
        Returns: Json
      }
      get_schools_by_filters_with_program_id: {
        Args: { _program_id?: string; filters?: Json }
        Returns: {
          district: string
          field_coordinators: string[]
          num_students: number
          num_teachers: number
          program_managers: string[]
          sch_id: string
          school_name: string
        }[]
      }
      get_schools_for_user: {
        Args: { in_page?: number; in_page_size?: number; in_user_id: string }
        Returns: {
          role: string
          school: Json
        }[]
      }
      get_unique_geo_data: { Args: never; Returns: Json }
      get_user_by_email: {
        Args: { p_email: string }
        Returns: {
          age: number | null
          avatar: string | null
          created_at: string
          curriculum_id: string | null
          email: string | null
          fcm_token: string | null
          firebase_id: string | null
          gender: string | null
          grade_id: string | null
          id: string
          image: string | null
          is_deleted: boolean | null
          is_firebase: boolean | null
          is_ops: boolean | null
          is_tc_accepted: boolean | null
          language_id: string | null
          learning_path: string | null
          music_off: boolean | null
          name: string | null
          ops_created_by: string | null
          phone: string | null
          reward: string | null
          sfx_off: boolean | null
          stars: number | null
          student_id: string | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "user"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_user_by_phone: {
        Args: { phone_number: string }
        Returns: {
          id: string
          phone: string
        }[]
      }
      get_user_by_phonenumber: {
        Args: { p_phone: string }
        Returns: {
          age: number | null
          avatar: string | null
          created_at: string
          curriculum_id: string | null
          email: string | null
          fcm_token: string | null
          firebase_id: string | null
          gender: string | null
          grade_id: string | null
          id: string
          image: string | null
          is_deleted: boolean | null
          is_firebase: boolean | null
          is_ops: boolean | null
          is_tc_accepted: boolean | null
          language_id: string | null
          learning_path: string | null
          music_off: boolean | null
          name: string | null
          ops_created_by: string | null
          phone: string | null
          reward: string | null
          sfx_off: boolean | null
          stars: number | null
          student_id: string | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "user"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_users_for_parent_or_self_or_school: {
        Args: { p_uid: string; p_updated_at: string }
        Returns: {
          age: number | null
          avatar: string | null
          created_at: string
          curriculum_id: string | null
          email: string | null
          fcm_token: string | null
          firebase_id: string | null
          gender: string | null
          grade_id: string | null
          id: string
          image: string | null
          is_deleted: boolean | null
          is_firebase: boolean | null
          is_ops: boolean | null
          is_tc_accepted: boolean | null
          language_id: string | null
          learning_path: string | null
          music_off: boolean | null
          name: string | null
          ops_created_by: string | null
          phone: string | null
          reward: string | null
          sfx_off: boolean | null
          stars: number | null
          student_id: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "user"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      getDataByInviteCode: { Args: { invite_code: number }; Returns: Json }
      getfiltered_schools: {
        Args: { filters: Json }
        Returns: {
          field_coordinators: string[]
          num_students: number
          num_teachers: number
          program_managers: string[]
          sch_id: string
          school_name: string
        }[]
      }
      insert_firebase_assignment_trigger: {
        Args: {
          assign_type?: string
          assigner_firebase_id: string
          chapter_code: string
          class_firebase_id: string
          course_firebase_id: string
          ends_at?: string
          firebase_assignment_id: string
          is_classwise?: boolean
          lesson_chapter_code: string
          lesson_id_text: string
          lesson_subject_code: string
          school_firebase_id: string
          source?: string
          starts_at?: string
        }
        Returns: string
      }
      insert_firebase_class_trigger: {
        Args: {
          p_class_name: string
          p_course_firebase_ids: string[]
          p_firebase_class_id: string
          p_image: string
          p_school_firebase_id: string
          p_status: string
        }
        Returns: string
      }
      insert_firebase_classconnection_trigger: {
        Args: {
          firebase_class_id: string
          firebase_user_id: string
          p_role: string
          p_soft_delete?: boolean
        }
        Returns: string
      }
      insert_firebase_result_trigger: {
        Args: {
          chapter_code: string
          correct_moves: number
          firebase_assignment_id: string
          firebase_class_id: string
          firebase_course_id: string
          firebase_result_id: string
          firebase_school_id: string
          firebase_user_id: string
          lesson_code: string
          score: number
          subject_code: string
          time_spent: number
          wrong_moves: number
        }
        Returns: string
      }
      insert_firebase_school_trigger: {
        Args: {
          p_course_firebase_ids: string[]
          p_firebase_school_id: string
          p_group1: string
          p_group2: string
          p_group3: string
          p_image: string
          p_school_name: string
        }
        Returns: string
      }
      insert_firebase_schoolconnection_trigger: {
        Args: {
          firebase_school_id: string
          firebase_user_id: string
          p_role: string
          p_soft_delete?: boolean
        }
        Returns: string
      }
      insert_firebase_user_trigger: {
        Args: {
          age: string
          avatar: string
          email: string
          fcm_token: string
          firebase_curriculum_id: string
          firebase_grade_id: string
          firebase_id: string
          firebase_language_id: string
          gender: string
          id: string
          image: string
          is_tc_accepted: string
          music_off: string
          name: string
          phone: string
          sfx_off: string
          student_id: string
        }
        Returns: string
      }
      insert_student_firebase_trigger: {
        Args: {
          input_age: string
          input_avatar: string
          input_email: string
          input_fcm_token: string
          input_firebase_curriculum_id: string
          input_firebase_grade_id: string
          input_firebase_id: string
          input_firebase_language_id: string
          input_gender: string
          input_image: string
          input_is_parent_delete?: boolean
          input_is_tc_accepted: string
          input_music_off: string
          input_name: string
          input_p_course_firebase_ids: string[]
          input_parent_firebase_id: string
          input_phone: string
          input_sfx_off: string
          input_student_id: string
          input_supabase_student_id: string
        }
        Returns: string
      }
      invoke_master_checker_edge_function: { Args: never; Returns: undefined }
      is_program_admin_for_class: {
        Args: { p_class_id: string; p_user_id: string }
        Returns: boolean
      }
      is_program_admin_for_class_user: {
        Args: { p_class_user_id: string; p_user_id: string }
        Returns: boolean
      }
      is_program_admin_for_school: {
        Args: { p_school_id: string; p_user_id: string }
        Returns: boolean
      }
      is_program_admin_for_school_user: {
        Args: { p_school_user_id: string; p_user_id: string }
        Returns: boolean
      }
      is_program_manager_or_field_coordinator: { Args: never; Returns: boolean }
      is_special_or_program_user: { Args: never; Returns: boolean }
      is_special_user_privileged: { Args: never; Returns: boolean }
      is_student_already_in_class: {
        Args: { _class_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin_or_operational_director: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      isUserExists: {
        Args: { user_email: string; user_phone: string }
        Returns: boolean
      }
      join_live_quiz: {
        Args: { _assignment_id: string; _student_id: string }
        Returns: string
      }
      linkStudent: {
        Args: { invite_code: number; student_id: string }
        Returns: boolean
      }
      read_group_assignment_queue_v2: {
        Args: { qty: number; queue_name: string; vt: number }
        Returns: {
          enqueued_at: string
          message: Json
          msg_id: number
          read_ct: number
          visible_at: string
        }[]
      }
      read_group_notification_queue: {
        Args: { queue_name: string; vt: number }
        Returns: {
          enqueued_at: string
          message: Json
          msg_id: number
          read_ct: number
          visible_at: string
        }[]
      }
      read_queue_generic: {
        Args: { queue_name: string; read_limit?: number; vt_seconds?: number }
        Returns: {
          enqueued_at: string
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      reading_queue: {
        Args: { qty: number; queue_name: string; vt: number }
        Returns: {
          enqueued_at: string
          message: Json
          msg_id: number
          read_ct: number
          visible_at: string
        }[]
      }
      research_get_programs_for_user: {
        Args: {
          _current_user_id: string
          _filters: Json
          _limit?: number
          _offset?: number
          _order?: string
          _order_by?: string
          _search_term: string
          _tab: string
        }
        Returns: {
          devices_count: number
          id: string
          institutes_count: number
          manager_names: string
          name: string
          state: string
          students_count: number
          total_count: number
        }[]
      }
      resend_otp: { Args: { phone_number: string }; Returns: Json }
      run_both_notifications: { Args: never; Returns: undefined }
      search_schools: {
        Args: {
          p_block?: string
          p_cluster?: string
          p_country?: string
          p_district?: string
          p_page_limit?: number
          p_page_offset?: number
          p_search_text?: string
          p_state?: string
        }
        Returns: {
          schools: Json
          total_count: number
        }[]
      }
      search_students_in_school: {
        Args: {
          p_limit: number
          p_page: number
          p_school_id: string
          p_search_term: string
        }
        Returns: {
          class_id: string
          class_name: string
          id: string
          name: string
          parent_id: string
          parent_name: string
          phone: string
          student_id: string
        }[]
      }
      search_teachers_in_school: {
        Args: {
          p_limit: number
          p_page: number
          p_school_id: string
          p_search_term: string
        }
        Returns: {
          class_id: string
          class_name: string
          email: string
          id: string
          name: string
          parent_id: string
          parent_name: string
          phone: string
        }[]
      }
      send_otp_request: { Args: { input_data: Json }; Returns: Json }
      set_confirmation: {
        Args: { code: string; phone_number: string }
        Returns: string
      }
      sql_get_assignment_cart: {
        Args: { p_updated_at?: string }
        Returns: {
          created_at: string
          id: string
          is_deleted: boolean | null
          is_firebase: boolean | null
          lessons: string | null
          source: Database["public"]["Enums"]["assignment_source"] | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "assignment_cart"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sql_get_assignment_users: {
        Args: { p_updated_at: string }
        Returns: {
          assignment_id: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          is_firebase: boolean | null
          updated_at: string | null
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "assignment_user"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sql_get_assignments: {
        Args: { p_updated_at: string }
        Returns: {
          batch_id: string | null
          chapter_id: string | null
          class_id: string
          course_id: string | null
          created_at: string
          created_by: string | null
          ends_at: string | null
          firebase_id: string | null
          id: string
          is_class_wise: boolean
          is_deleted: boolean | null
          is_firebase: boolean | null
          lesson_id: string
          school_id: string
          source: string | null
          starts_at: string
          type: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "assignment"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sql_get_badge: {
        Args: { p_updated_at?: string }
        Returns: {
          created_at: string | null
          description: string | null
          id: string
          image: string | null
          is_deleted: boolean | null
          name: string
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "badge"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sql_get_chapter: {
        Args: { p_updated_at?: string }
        Returns: {
          course_id: string | null
          created_at: string
          id: string
          image: string | null
          is_deleted: boolean | null
          name: string | null
          sort_index: number | null
          sub_topics: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "chapter"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sql_get_chapter_lesson: {
        Args: { p_updated_at?: string }
        Returns: {
          chapter_id: string
          created_at: string
          id: string
          is_deleted: boolean | null
          lesson_id: string
          sort_index: number | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "chapter_lesson"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sql_get_class: {
        Args: { p_updated_at: string }
        Returns: {
          academic_year: string | null
          created_at: string
          firebase_id: string | null
          group_id: string | null
          id: string
          image: string | null
          is_deleted: boolean | null
          is_firebase: boolean | null
          is_ops: boolean | null
          name: string
          ops_created_by: string | null
          school_id: string
          standard: string | null
          status: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "class"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sql_get_class_course: {
        Args: { p_updated_at: string }
        Returns: {
          class_id: string
          course_id: string
          created_at: string
          id: string
          is_deleted: boolean | null
          is_firebase: boolean | null
          is_ops: boolean | null
          ops_created_by: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "class_course"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sql_get_class_invite_codes: {
        Args: { p_updated_at: string }
        Returns: {
          class_id: string
          code: number
          created_at: string
          expires_at: string
          id: string
          is_class_code: boolean | null
          is_deleted: boolean | null
          is_firebase: boolean | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "class_invite_code"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sql_get_class_user: {
        Args: { p_updated_at?: string }
        Returns: {
          class_id: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          is_firebase: boolean | null
          is_ops: boolean | null
          ops_created_by: string | null
          role: Database["public"]["Enums"]["role"]
          updated_at: string | null
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "class_user"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sql_get_course: {
        Args: { p_updated_at?: string }
        Returns: {
          code: string | null
          color: string | null
          created_at: string
          curriculum_id: string | null
          description: string | null
          firebase_id: string | null
          grade_id: string | null
          id: string
          image: string | null
          is_deleted: boolean | null
          name: string
          sort_index: number | null
          subject_id: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "course"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sql_get_curriculum: {
        Args: { p_updated_at?: string }
        Returns: {
          created_at: string
          description: string | null
          firebase_id: string | null
          id: string
          image: string | null
          is_deleted: boolean | null
          name: string
          sort_index: number | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "curriculum"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sql_get_favorite_lessons: {
        Args: { p_updated_at?: string }
        Returns: {
          created_at: string | null
          id: string
          is_deleted: boolean | null
          is_firebase: boolean | null
          lesson_id: string
          updated_at: string | null
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "favorite_lesson"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sql_get_grade: {
        Args: { p_updated_at?: string }
        Returns: {
          created_at: string
          description: string | null
          firebase_id: string | null
          id: string
          image: string | null
          is_deleted: boolean | null
          name: string
          sort_index: number | null
          test: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "grade"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sql_get_language: {
        Args: { p_updated_at?: string }
        Returns: {
          code: string | null
          created_at: string
          description: string | null
          firebase_id: string | null
          id: string
          image: string | null
          is_deleted: boolean | null
          name: string
          sort_index: number | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "language"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sql_get_lessons: {
        Args: { p_updated_at?: string }
        Returns: {
          cocos_chapter_code: string | null
          cocos_lesson_id: string | null
          cocos_subject_code: string | null
          color: string | null
          created_at: string
          created_by: string | null
          id: string
          image: string | null
          is_deleted: boolean | null
          language_id: string | null
          name: string | null
          outcome: string | null
          plugin_type: string | null
          status: string | null
          subject_id: string | null
          target_age_from: number | null
          target_age_to: number | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "lesson"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sql_get_live_quiz_rooms: {
        Args: { p_updated_at?: string }
        Returns: {
          assignment_id: string
          class_id: string
          course_id: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          lesson_id: string
          participants: string[] | null
          results: Json | null
          school_id: string
          starts_at: string
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "live_quiz_room"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sql_get_ops_requests: {
        Args: { p_updated_at?: string }
        Returns: {
          class_id: string | null
          created_at: string
          id: string
          is_deleted: boolean | null
          rejected_reason_description: string | null
          rejected_reason_type: string | null
          request_ends_at: string | null
          request_id: string | null
          request_status:
            | Database["public"]["Enums"]["ops_request_status"]
            | null
          request_type: Database["public"]["Enums"]["ops_request_type"] | null
          requested_by: string | null
          requested_to: string | null
          responded_by: string | null
          school_id: string | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "ops_requests"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sql_get_parent_users: {
        Args: { p_updated_at?: string }
        Returns: {
          created_at: string | null
          id: string
          is_deleted: boolean | null
          is_firebase: boolean | null
          is_ops: boolean | null
          ops_created_by: string | null
          parent_id: string
          student_id: string
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "parent_user"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sql_get_results: {
        Args: { p_updated_at: string }
        Returns: {
          assignment_id: string | null
          chapter_id: string | null
          class_id: string | null
          
          correct_moves: number | null
          course_id: string | null
          created_at: string
          
          firebase_id: string | null
          id: string
          is_deleted: boolean | null
          is_firebase: boolean | null
          learning_indicator_id: string | null
          learning_outcome_id: string | null
          lesson_id: string | null
          school_id: string | null
          score: number | null
          student_id: string
          time_spent: number | null
          updated_at: string | null
          wrong_moves: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "result"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sql_get_reward: {
        Args: { p_updated_at?: string }
        Returns: {
          created_at: string
          id: string
          is_deleted: boolean | null
          monthly: string | null
          updated_at: string | null
          weekly: string | null
          weeklySticker: string | null
          year: number
        }[]
        SetofOptions: {
          from: "*"
          to: "reward"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sql_get_school_courses: {
        Args: { p_updated_at: string }
        Returns: {
          course_id: string
          created_at: string
          id: string
          is_deleted: boolean | null
          is_firebase: boolean | null
          is_ops: boolean | null
          ops_created_by: string | null
          school_id: string
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "school_course"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sql_get_school_user: {
        Args: { p_updated_at?: string }
        Returns: {
          created_at: string
          id: string
          is_deleted: boolean | null
          is_firebase: boolean | null
          is_ops: boolean | null
          ops_created_by: string | null
          role: Database["public"]["Enums"]["role"]
          school_id: string
          updated_at: string | null
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "school_user"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sql_get_schools: {
        Args: { p_updated_at: string }
        Returns: {
          academic_year: string | null
          address: string | null
          country: string | null
          created_at: string
          firebase_id: string | null
          group1: string | null
          group2: string | null
          group3: string | null
          group4: string | null
          id: string
          image: string | null
          is_deleted: boolean | null
          is_firebase: boolean | null
          is_ops: boolean | null
          key_contacts: string | null
          language: string | null
          location_link: string | null
          model: Database["public"]["Enums"]["program_model"] | null
          name: string
          ops_created_by: string | null
          program_id: string | null
          status: Database["public"]["Enums"]["status"] | null
          student_login_type: Database["public"]["Enums"]["login_type"] | null
          udise: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "school"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sql_get_sticker: {
        Args: { p_updated_at?: string }
        Returns: {
          created_at: string
          description: string | null
          id: string
          image: string | null
          is_deleted: boolean | null
          name: string
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "sticker"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sql_get_subject: {
        Args: { p_updated_at?: string }
        Returns: {
          created_at: string
          description: string | null
          id: string
          image: string | null
          is_deleted: boolean | null
          name: string
          sort_index: number | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "subject"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sql_get_user_badges: {
        Args: { p_updated_at: string }
        Returns: {
          badge_id: string
          created_at: string
          id: string
          is_deleted: boolean | null
          is_firebase: boolean | null
          is_seen: boolean | null
          updated_at: string | null
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "user_badge"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sql_get_user_bonus: {
        Args: { p_updated_at: string }
        Returns: {
          bonus_id: string
          created_at: string
          id: string
          is_deleted: boolean | null
          is_firebase: boolean | null
          is_seen: boolean | null
          updated_at: string | null
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "user_bonus"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sql_get_user_courses: {
        Args: { p_updated_at: string }
        Returns: {
          course_id: string
          created_at: string
          id: string
          is_deleted: boolean | null
          is_firebase: boolean | null
          updated_at: string | null
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "user_course"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sql_get_user_stickers: {
        Args: { p_updated_at: string }
        Returns: {
          created_at: string
          id: string
          is_deleted: boolean | null
          is_firebase: boolean | null
          is_seen: boolean | null
          sticker_id: string
          updated_at: string | null
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "user_sticker"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sql_get_users: {
        Args: { p_updated_at: string }
        Returns: {
          age: number | null
          avatar: string | null
          created_at: string
          curriculum_id: string | null
          email: string | null
          fcm_token: string | null
          firebase_id: string | null
          gender: string | null
          grade_id: string | null
          id: string
          image: string | null
          is_deleted: boolean | null
          is_firebase: boolean | null
          is_ops: boolean | null
          is_tc_accepted: boolean | null
          language_id: string | null
          learning_path: string | null
          music_off: boolean | null
          name: string | null
          ops_created_by: string | null
          phone: string | null
          reward: string | null
          sfx_off: boolean | null
          stars: number | null
          student_id: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "user"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sql_get_users_test: {
        Args: { p_updated_at: string }
        Returns: {
          age: number | null
          avatar: string | null
          created_at: string
          curriculum_id: string | null
          email: string | null
          fcm_token: string | null
          firebase_id: string | null
          gender: string | null
          grade_id: string | null
          id: string
          image: string | null
          is_deleted: boolean | null
          is_firebase: boolean | null
          is_ops: boolean | null
          is_tc_accepted: boolean | null
          language_id: string | null
          learning_path: string | null
          music_off: boolean | null
          name: string | null
          ops_created_by: string | null
          phone: string | null
          reward: string | null
          sfx_off: boolean | null
          stars: number | null
          student_id: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "user"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      update_class_firebase_trigger: {
        Args: {
          p_course_firebase_ids: string[]
          p_firebase_class_id: string
          p_name: string
          p_status: string
        }
        Returns: undefined
      }
      update_live_quiz: {
        Args: {
          question_id: string
          room_id: string
          score: number
          student_id: string
          time_spent: number
        }
        Returns: undefined
      }
      
      update_school_firebase_trigger: {
        Args: {
          p_course_firebase_ids: string[]
          p_firebase_school_id: string
          p_group1: string
          p_group2: string
          p_group3: string
          p_image: string
          p_name: string
        }
        Returns: undefined
      }
      update_student_firebase_trigger: {
        Args: {
          input_age: string
          input_avatar: string
          input_course_firebase_ids: string[]
          input_curriculum_id: string
          input_gender: string
          input_grade_id: string
          input_image: string
          input_language_id: string
          input_name: string
          input_new_badge_id: string
          input_new_bonus_id: string
          input_new_sticker_id: string
          input_user_id: string
        }
        Returns: string
      }
      user_exists: { Args: { user_id: string }; Returns: boolean }
      validate_class_existence_rpc: {
        Args: {
          input_class_name: string
          input_school_id: string
          input_student_name?: string
        }
        Returns: Json
      }
      validate_program_name: {
        Args: { input_program_name: string }
        Returns: Json
      }
      validate_school_data_rpc: {
        Args: { input_school_id: string; input_school_name: string }
        Returns: Json
      }
      validate_school_udise_code: {
        Args: { input_school_udise_code: string }
        Returns: Json
      }
      validate_user_contacts_rpc: {
        Args: {
          field_coordinator_contact?: string
          program_manager_contact: string
        }
        Returns: Json
      }
    }
    Enums: {
      assignment_source: "manual" | "recommended" | "qr_code" | "chatbot"
      login_type: "student_id" | "parent_phone_number"
      ops_request_status: "requested" | "rejected" | "approved" | "flagged"
      ops_request_type: "student" | "teacher" | "principal" | "school"
      program_model: "hybrid" | "at_home" | "at_school"
      program_type: "government" | "private" | "learning_centers"
      rive_type: "idle" | "normal" | "celebrating"
      role:
        | "coordinator"
        | "principal"
        | "sponsor"
        | "teacher"
        | "parent"
        | "student"
        | "autouser"
        | "program_manager"
        | "operational_director"
        | "field_coordinator"
        | "super_admin"
      special_roles:
        | "super_admin"
        | "operational_director"
        | "program_manager"
        | "field_coordinator"
      status: "active" | "rejected" | "requested" | "migrated"
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
      assignment_source: ["manual", "recommended", "qr_code", "chatbot"],
      login_type: ["student_id", "parent_phone_number"],
      ops_request_status: ["requested", "rejected", "approved", "flagged"],
      ops_request_type: ["student", "teacher", "principal", "school"],
      program_model: ["hybrid", "at_home", "at_school"],
      program_type: ["government", "private", "learning_centers"],
      rive_type: ["idle", "normal", "celebrating"],
      role: [
        "coordinator",
        "principal",
        "sponsor",
        "teacher",
        "parent",
        "student",
        "autouser",
        "program_manager",
        "operational_director",
        "field_coordinator",
        "super_admin",
      ],
      special_roles: [
        "super_admin",
        "operational_director",
        "program_manager",
        "field_coordinator",
      ],
      status: ["active", "rejected", "requested", "migrated"],
    },
  },
} as const
