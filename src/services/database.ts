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
          class_id: string
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
          class_id: string
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
          class_id?: string
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
          role: Database["public"]["Enums"]["role"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          class_id: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          role?: Database["public"]["Enums"]["role"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          class_id?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          role?: Database["public"]["Enums"]["role"] | null
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
          correct_moves: number | null
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
          correct_moves?: number | null
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
          correct_moves?: number | null
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
          monthly: Json | null
          updated_at: string | null
          weekly: Json | null
          weeklySticker: Json | null
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          monthly?: Json | null
          updated_at?: string | null
          weekly?: Json | null
          weeklySticker?: Json | null
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          monthly?: Json | null
          updated_at?: string | null
          weekly?: Json | null
          weeklySticker?: Json | null
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
          role: Database["public"]["Enums"]["role"] | null
          school_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          role?: Database["public"]["Enums"]["role"] | null
          school_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          role?: Database["public"]["Enums"]["role"] | null
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
          updated_at: string | null
        }
        Insert: {
          age?: number | null
          avatar?: string | null
          created_at?: string
          curriculum_id?: string | null
          email?: string | null
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
          updated_at?: string | null
        }
        Update: {
          age?: number | null
          avatar?: string | null
          created_at?: string
          curriculum_id?: string | null
          email?: string | null
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
          updated_at: string | null
          user_id: string
        }
        Insert: {
          badge_id: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          badge_id?: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
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
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bonus_id: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bonus_id?: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
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
          sticker_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          sticker_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_deleted?: boolean | null
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
      [_ in never]: never
    }
    Functions: {
      isUserExists: {
        Args: {
          user_phone: string
          user_email: string
        }
        Returns: boolean
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
