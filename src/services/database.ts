export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      assignment: {
        Row: {
          chapter_id: string | null
          class_id: string
          course_id: string | null
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          is_class_wise: boolean
          is_deleted: boolean | null
          lesson_id: string
          school_id: string
          starts_at: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          chapter_id?: string | null
          class_id: string
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_class_wise?: boolean
          is_deleted?: boolean | null
          lesson_id: string
          school_id: string
          starts_at?: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          chapter_id?: string | null
          class_id?: string
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_class_wise?: boolean
          is_deleted?: boolean | null
          lesson_id?: string
          school_id?: string
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
          lessons: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          lessons?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          lessons?: string | null
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
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assignment_id: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assignment_id?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
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
      chatbot: {
        Row: {
          created_at: string
          id: string
          is_deleted: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      class: {
        Row: {
          created_at: string
          id: string
          image: string | null
          is_deleted: boolean | null
          name: string
          school_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image?: string | null
          is_deleted?: boolean | null
          name: string
          school_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image?: string | null
          is_deleted?: boolean | null
          name?: string
          school_id?: string
          updated_at?: string | null
        }
        Relationships: [
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
          updated_at: string | null
        }
        Insert: {
          class_id: string
          course_id: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          updated_at?: string | null
        }
        Update: {
          class_id?: string
          course_id?: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
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
          role: Database["public"]["Enums"]["role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          class_id: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          role: Database["public"]["Enums"]["role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          class_id?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
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
            foreignKeyName: "class_user_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      course: {
        Row: {
          code: string | null
          color: string | null
          created_at: string
          curriculum_id: string | null
          description: string | null
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
      favorite_lesson: {
        Row: {
          created_at: string | null
          id: string
          is_deleted: boolean | null
          lesson_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          lesson_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
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
      grade: {
        Row: {
          created_at: string
          description: string | null
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
      language: {
        Row: {
          code: string | null
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
          code?: string | null
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
          code?: string | null
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
      parent_user: {
        Row: {
          created_at: string | null
          id: string
          is_deleted: boolean | null
          parent_id: string
          student_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          parent_id: string
          student_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          parent_id?: string
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
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
      result: {
        Row: {
          assignment_id: string | null
          chapter_id: string | null
          correct_moves: number | null
          course_id: string | null
          created_at: string
          id: string
          is_deleted: boolean | null
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
          correct_moves?: number | null
          course_id?: string | null
          created_at?: string
          id?: string
          is_deleted?: boolean | null
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
          correct_moves?: number | null
          course_id?: string | null
          created_at?: string
          id?: string
          is_deleted?: boolean | null
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
      school: {
        Row: {
          created_at: string
          group1: string | null
          group2: string | null
          group3: string | null
          id: string
          image: string | null
          is_deleted: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          group1?: string | null
          group2?: string | null
          group3?: string | null
          id?: string
          image?: string | null
          is_deleted?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          group1?: string | null
          group2?: string | null
          group3?: string | null
          id?: string
          image?: string | null
          is_deleted?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      school_course: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_deleted: boolean | null
          school_id: string
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          school_id: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
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
        ]
      }
      school_user: {
        Row: {
          created_at: string
          id: string
          is_deleted: boolean | null
          role: Database["public"]["Enums"]["role"]
          school_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          role: Database["public"]["Enums"]["role"]
          school_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          role?: Database["public"]["Enums"]["role"]
          school_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
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
      user: {
        Row: {
          age: number | null
          avatar: string | null
          created_at: string
          curriculum_id: string | null
          email: string | null
          fcm_token: string | null
          gender: string | null
          grade_id: string | null
          id: string
          image: string | null
          is_deleted: boolean | null
          is_tc_accepted: boolean | null
          language_id: string | null
          music_off: boolean | null
          name: string | null
          phone: string | null
          sfx_off: boolean | null
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
          gender?: string | null
          grade_id?: string | null
          id?: string
          image?: string | null
          is_deleted?: boolean | null
          is_tc_accepted?: boolean | null
          language_id?: string | null
          music_off?: boolean | null
          name?: string | null
          phone?: string | null
          sfx_off?: boolean | null
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
          gender?: string | null
          grade_id?: string | null
          id?: string
          image?: string | null
          is_deleted?: boolean | null
          is_tc_accepted?: boolean | null
          language_id?: string | null
          music_off?: boolean | null
          name?: string | null
          phone?: string | null
          sfx_off?: boolean | null
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
        ]
      }
      user_badge: {
        Row: {
          badge_id: string
          created_at: string
          id: string
          is_deleted: boolean | null
          is_seen: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          badge_id: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_seen?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          badge_id?: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
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
          is_seen: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bonus_id: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_seen?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bonus_id?: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
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
          updated_at: string | null
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
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
          is_seen: boolean | null
          sticker_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_seen?: boolean | null
          sticker_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_deleted?: boolean | null
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
      call_send_badges: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      call_send_bonuses: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_user: {
        Args: {
          phone_number: string
        }
        Returns: {
          id: string
          phone: string
        }[]
      }
      delete_student: {
        Args: {
          student_id: string
        }
        Returns: undefined
      }
      delete_user: {
        Args: {
          uuid: string
        }
        Returns: boolean
      }
      fetch_leaderboard_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          type: string
          student_id: string
          name: string
          lessons_played: number
          total_score: number
          total_time_spent: number
        }[]
      }
      find_similar_lessons: {
        Args: {
          search_text: string
        }
        Returns: {
          id: string
          name: string
          image: string
          outcome: string
          plugin_type: string
          status: string
          cocos_subject_code: string
          cocos_chapter_code: string
          created_by: string
          subject_id: string
          target_age_from: number
          target_age_to: number
          language_id: string
          created_at: string
          updated_at: string
          is_deleted: boolean
          cocos_lesson_id: string
          color: string
        }[]
      }
      generate_otp_msg91: {
        Args: {
          phone_number: string
        }
        Returns: Json
      }
      generate_unique_class_code: {
        Args: {
          class_id_input: string
        }
        Returns: number
      }
      get_class_leaderboard: {
        Args: {
          current_class_id: string
        }
        Returns: {
          type: string
          student_id: string
          name: string
          lessons_played: number
          total_score: number
          total_time_spent: number
        }[]
      }
      get_leaderboard: {
        Args: Record<PropertyKey, never>
        Returns: {
          type: string
          student_id: string
          name: string
          lessons_played: number
          total_score: number
          total_time_spent: number
        }[]
      }
      get_results_by_assignment: {
        Args: {
          _assignment_id: string
        }
        Returns: {
          result_data: Database["public"]["Tables"]["result"]["Row"][]
          user_data: Database["public"]["Tables"]["user"]["Row"][]
        }[]
      }
      get_school_users: {
        Args: {
          _school_id: string
          _role: string
        }
        Returns: {
          id: string
          name: string
          email: string
          age: number
          avatar: string
          created_at: string
          curriculum_id: string
          fcm_token: string
          gender: string
          grade_id: string
          student_id: string
          image: string
          is_deleted: boolean
          is_tc_accepted: boolean
          language_id: string
          music_off: boolean
          phone: string
          sfx_off: boolean
          updated_at: string
        }[]
      }
      get_user_by_email: {
        Args: {
          p_email: string
        }
        Returns: {
          id: string
          name: string
          email: string
          age: number
          avatar: string
          created_at: string
          curriculum_id: string
          fcm_token: string
          gender: string
          grade_id: string
          image: string
          is_deleted: boolean
          is_tc_accepted: boolean
          language_id: string
          music_off: boolean
          phone: string
          sfx_off: boolean
          updated_at: string
          student_id: string
        }[]
      }
      get_user_by_phone: {
        Args: {
          phone_number: string
        }
        Returns: {
          id: string
          phone: string
        }[]
      }
      get_user_by_phonenumber: {
        Args: {
          p_phone: string
        }
        Returns: {
          id: string
          name: string
          email: string
          age: number
          avatar: string
          created_at: string
          curriculum_id: string
          fcm_token: string
          gender: string
          grade_id: string
          image: string
          is_deleted: boolean
          is_tc_accepted: boolean
          language_id: string
          music_off: boolean
          phone: string
          sfx_off: boolean
          updated_at: string
          student_id: string
        }[]
      }
      getDataByInviteCode: {
        Args: {
          invite_code: number
        }
        Returns: Json
      }
      isUserExists: {
        Args: {
          user_phone: string
          user_email: string
        }
        Returns: boolean
      }
      join_live_quiz: {
        Args: {
          _assignment_id: string
          _student_id: string
        }
        Returns: string
      }
      linkStudent: {
        Args: {
          invite_code: number
          student_id: string
        }
        Returns: boolean
      }
      resend_otp: {
        Args: {
          phone_number: string
        }
        Returns: Json
      }
      set_confirmation: {
        Args: {
          phone_number: string
          code: string
        }
        Returns: string
      }
      update_live_quiz: {
        Args: {
          room_id: string
          student_id: string
          question_id: string
          time_spent: number
          score: number
        }
        Returns: undefined
      }
    }
    Enums: {
      role:
        | "coordinator"
        | "principal"
        | "sponsor"
        | "teacher"
        | "parent"
        | "student"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
