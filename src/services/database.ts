export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      assignment: {
        Row: {
          batch_id: string | null
          chapter_id: string | null;
          class_id: string;
          course_id: string | null;
          created_at: string;
          created_by: string | null;
          ends_at: string | null;
          firebase_id: string | null;
          id: string;
          is_class_wise: boolean;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          lesson_id: string;
          school_id: string;
          source: string | null;
          starts_at: string;
          type: string | null;
          updated_at: string | null;
        };
        Insert: {
          batch_id: string | null
          chapter_id?: string | null;
          class_id: string;
          course_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          ends_at?: string | null;
          firebase_id?: string | null;
          id?: string;
          is_class_wise?: boolean;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          lesson_id: string;
          school_id: string;
          source?: string | null;
          starts_at?: string;
          type?: string | null;
          updated_at?: string | null;
        };
        Update: {
          batch_id: string | null
          chapter_id?: string | null;
          class_id?: string;
          course_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          ends_at?: string | null;
          firebase_id?: string | null;
          id?: string;
          is_class_wise?: boolean;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          lesson_id?: string;
          school_id?: string;
          source?: string | null;
          starts_at?: string;
          type?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "assignment_chapter_id_fkey";
            columns: ["chapter_id"];
            isOneToOne: false;
            referencedRelation: "chapter";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assignment_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "course";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_assignment_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "class";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_assignment_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_assignment_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lesson";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_assignment_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "school";
            referencedColumns: ["id"];
          },
        ];
      };
      assignment_cart: {
        Row: {
          created_at: string;
          id: string;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          lessons: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          lessons?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          lessons?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "assignment_cart_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      assignment_user: {
        Row: {
          assignment_id: string;
          created_at: string | null;
          id: string;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          assignment_id: string;
          created_at?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          assignment_id?: string;
          created_at?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "public_assignment_user_assignment_id_fkey";
            columns: ["assignment_id"];
            isOneToOne: false;
            referencedRelation: "assignment";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_assignment_user_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      auto_chatbot: {
        Row: {
          created_at: string;
          id: string;
          is_deleted: boolean | null;
          school_id: string;
          task_data: Json | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_deleted?: boolean | null;
          school_id: string;
          task_data?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_deleted?: boolean | null;
          school_id?: string;
          task_data?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "public_auto_chatbot_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "school";
            referencedColumns: ["id"];
          },
        ];
      };
      badge: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          image: string | null;
          is_deleted: boolean | null;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image?: string | null;
          is_deleted?: boolean | null;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image?: string | null;
          is_deleted?: boolean | null;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      chapter: {
        Row: {
          course_id: string | null;
          created_at: string;
          id: string;
          image: string | null;
          is_deleted: boolean | null;
          name: string | null;
          sort_index: number | null;
          sub_topics: string | null;
          updated_at: string | null;
        };
        Insert: {
          course_id?: string | null;
          created_at?: string;
          id?: string;
          image?: string | null;
          is_deleted?: boolean | null;
          name?: string | null;
          sort_index?: number | null;
          sub_topics?: string | null;
          updated_at?: string | null;
        };
        Update: {
          course_id?: string | null;
          created_at?: string;
          id?: string;
          image?: string | null;
          is_deleted?: boolean | null;
          name?: string | null;
          sort_index?: number | null;
          sub_topics?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "public_chapter_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "course";
            referencedColumns: ["id"];
          },
        ];
      };
      chapter_lesson: {
        Row: {
          chapter_id: string;
          created_at: string;
          id: string;
          is_deleted: boolean | null;
          lesson_id: string;
          sort_index: number | null;
          updated_at: string | null;
        };
        Insert: {
          chapter_id: string;
          created_at?: string;
          id?: string;
          is_deleted?: boolean | null;
          lesson_id: string;
          sort_index?: number | null;
          updated_at?: string | null;
        };
        Update: {
          chapter_id?: string;
          created_at?: string;
          id?: string;
          is_deleted?: boolean | null;
          lesson_id?: string;
          sort_index?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "public_chapter_lesson_chapter_id_fkey";
            columns: ["chapter_id"];
            isOneToOne: false;
            referencedRelation: "chapter";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_chapter_lesson_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lesson";
            referencedColumns: ["id"];
          },
        ];
      };
      chatbot: {
        Row: {
          chatbot_doc: Json | null;
          created_at: string;
          id: string;
          is_deleted: boolean | null;
          phonenumber: string;
          updated_at: string | null;
        };
        Insert: {
          chatbot_doc?: Json | null;
          created_at?: string;
          id?: string;
          is_deleted?: boolean | null;
          phonenumber: string;
          updated_at?: string | null;
        };
        Update: {
          chatbot_doc?: Json | null;
          created_at?: string;
          id?: string;
          is_deleted?: boolean | null;
          phonenumber?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      class: {
        Row: {
          academic_year: string | null;
          created_at: string;
          firebase_id: string | null;
          id: string;
          image: string | null;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          is_ops: boolean | null;
          name: string;
          ops_created_by: string | null;
          school_id: string;
          standard: string | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          academic_year?: string | null;
          created_at?: string;
          firebase_id?: string | null;
          id?: string;
          image?: string | null;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          is_ops?: boolean | null;
          name: string;
          ops_created_by?: string | null;
          school_id: string;
          standard?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          academic_year?: string | null;
          created_at?: string;
          firebase_id?: string | null;
          id?: string;
          image?: string | null;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          is_ops?: boolean | null;
          name?: string;
          ops_created_by?: string | null;
          school_id?: string;
          standard?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "class_ops_created_by_fkey";
            columns: ["ops_created_by"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_class_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "school";
            referencedColumns: ["id"];
          },
        ];
      };
      class_course: {
        Row: {
          class_id: string;
          course_id: string;
          created_at: string;
          id: string;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          is_ops: boolean | null;
          ops_created_by: string | null;
          updated_at: string | null;
        };
        Insert: {
          class_id: string;
          course_id: string;
          created_at?: string;
          id?: string;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          is_ops?: boolean | null;
          ops_created_by?: string | null;
          updated_at?: string | null;
        };
        Update: {
          class_id?: string;
          course_id?: string;
          created_at?: string;
          id?: string;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          is_ops?: boolean | null;
          ops_created_by?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "class_course_ops_created_by_fkey";
            columns: ["ops_created_by"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_class_course_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "class";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_class_course_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "course";
            referencedColumns: ["id"];
          },
        ];
      };
      class_invite_code: {
        Row: {
          class_id: string;
          code: number;
          created_at: string;
          expires_at: string;
          id: string;
          is_class_code: boolean | null;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          class_id: string;
          code: number;
          created_at?: string;
          expires_at: string;
          id?: string;
          is_class_code?: boolean | null;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          class_id?: string;
          code?: number;
          created_at?: string;
          expires_at?: string;
          id?: string;
          is_class_code?: boolean | null;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "public_class_invite_code_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "class";
            referencedColumns: ["id"];
          },
        ];
      };
      class_user: {
        Row: {
          class_id: string;
          created_at: string | null;
          id: string;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          is_ops: boolean | null;
          ops_created_by: string | null;
          role: Database["public"]["Enums"]["role"];
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          class_id: string;
          created_at?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          is_ops?: boolean | null;
          ops_created_by?: string | null;
          role: Database["public"]["Enums"]["role"];
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          class_id?: string;
          created_at?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          is_ops?: boolean | null;
          ops_created_by?: string | null;
          role?: Database["public"]["Enums"]["role"];
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "class_user_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "class";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "class_user_ops_created_by_fkey";
            columns: ["ops_created_by"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "class_user_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      connector_users: {
        Row: {
          created_at: string | null;
          email: string;
          id: string;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          id?: string;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          id?: string;
        };
        Relationships: [];
      };
      course: {
        Row: {
          code: string | null;
          color: string | null;
          created_at: string;
          curriculum_id: string | null;
          description: string | null;
          firebase_id: string | null;
          grade_id: string | null;
          id: string;
          image: string | null;
          is_deleted: boolean | null;
          name: string;
          sort_index: number | null;
          subject_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          code?: string | null;
          color?: string | null;
          created_at?: string;
          curriculum_id?: string | null;
          description?: string | null;
          firebase_id?: string | null;
          grade_id?: string | null;
          id?: string;
          image?: string | null;
          is_deleted?: boolean | null;
          name: string;
          sort_index?: number | null;
          subject_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          code?: string | null;
          color?: string | null;
          created_at?: string;
          curriculum_id?: string | null;
          description?: string | null;
          firebase_id?: string | null;
          grade_id?: string | null;
          id?: string;
          image?: string | null;
          is_deleted?: boolean | null;
          name?: string;
          sort_index?: number | null;
          subject_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "public_course_curriculum_id_fkey";
            columns: ["curriculum_id"];
            isOneToOne: false;
            referencedRelation: "curriculum";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_course_grade_id_fkey";
            columns: ["grade_id"];
            isOneToOne: false;
            referencedRelation: "grade";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_course_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subject";
            referencedColumns: ["id"];
          },
        ];
      };
      curriculum: {
        Row: {
          created_at: string;
          description: string | null;
          firebase_id: string | null;
          id: string;
          image: string | null;
          is_deleted: boolean | null;
          name: string;
          sort_index: number | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          firebase_id?: string | null;
          id?: string;
          image?: string | null;
          is_deleted?: boolean | null;
          name: string;
          sort_index?: number | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          firebase_id?: string | null;
          id?: string;
          image?: string | null;
          is_deleted?: boolean | null;
          name?: string;
          sort_index?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      favorite_lesson: {
        Row: {
          created_at: string | null;
          id: string;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          lesson_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          lesson_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          lesson_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorite_lesson_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lesson";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "favorite_lesson_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      grade: {
        Row: {
          created_at: string;
          description: string | null;
          firebase_id: string | null;
          id: string;
          image: string | null;
          is_deleted: boolean | null;
          name: string;
          sort_index: number | null;
          test: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          firebase_id?: string | null;
          id?: string;
          image?: string | null;
          is_deleted?: boolean | null;
          name: string;
          sort_index?: number | null;
          test?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          firebase_id?: string | null;
          id?: string;
          image?: string | null;
          is_deleted?: boolean | null;
          name?: string;
          sort_index?: number | null;
          test?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      issue_debug: {
        Row: {
          created_at: string;
          firebase_id: string | null;
          id: string;
          is_firebase: boolean | null;
          result_id: string | null;
          student_id: string | null;
        };
        Insert: {
          created_at?: string;
          firebase_id?: string | null;
          id?: string;
          is_firebase?: boolean | null;
          result_id?: string | null;
          student_id?: string | null;
        };
        Update: {
          created_at?: string;
          firebase_id?: string | null;
          id?: string;
          is_firebase?: boolean | null;
          result_id?: string | null;
          student_id?: string | null;
        };
        Relationships: [];
      };
      language: {
        Row: {
          code: string | null;
          created_at: string;
          description: string | null;
          firebase_id: string | null;
          id: string;
          image: string | null;
          is_deleted: boolean | null;
          name: string;
          sort_index: number | null;
          updated_at: string | null;
        };
        Insert: {
          code?: string | null;
          created_at?: string;
          description?: string | null;
          firebase_id?: string | null;
          id?: string;
          image?: string | null;
          is_deleted?: boolean | null;
          name: string;
          sort_index?: number | null;
          updated_at?: string | null;
        };
        Update: {
          code?: string | null;
          created_at?: string;
          description?: string | null;
          firebase_id?: string | null;
          id?: string;
          image?: string | null;
          is_deleted?: boolean | null;
          name?: string;
          sort_index?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      lesson: {
        Row: {
          cocos_chapter_code: string | null;
          cocos_lesson_id: string | null;
          cocos_subject_code: string | null;
          color: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          image: string | null;
          is_deleted: boolean | null;
          language_id: string | null;
          name: string | null;
          outcome: string | null;
          plugin_type: string | null;
          status: string | null;
          subject_id: string | null;
          target_age_from: number | null;
          target_age_to: number | null;
          updated_at: string | null;
        };
        Insert: {
          cocos_chapter_code?: string | null;
          cocos_lesson_id?: string | null;
          cocos_subject_code?: string | null;
          color?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          image?: string | null;
          is_deleted?: boolean | null;
          language_id?: string | null;
          name?: string | null;
          outcome?: string | null;
          plugin_type?: string | null;
          status?: string | null;
          subject_id?: string | null;
          target_age_from?: number | null;
          target_age_to?: number | null;
          updated_at?: string | null;
        };
        Update: {
          cocos_chapter_code?: string | null;
          cocos_lesson_id?: string | null;
          cocos_subject_code?: string | null;
          color?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          image?: string | null;
          is_deleted?: boolean | null;
          language_id?: string | null;
          name?: string | null;
          outcome?: string | null;
          plugin_type?: string | null;
          status?: string | null;
          subject_id?: string | null;
          target_age_from?: number | null;
          target_age_to?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "public_lesson_language_id_fkey";
            columns: ["language_id"];
            isOneToOne: false;
            referencedRelation: "language";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_lesson_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subject";
            referencedColumns: ["id"];
          },
        ];
      };
      live_quiz_room: {
        Row: {
          assignment_id: string;
          class_id: string;
          course_id: string;
          created_at: string | null;
          id: string;
          is_deleted: boolean | null;
          lesson_id: string;
          participants: string[] | null;
          results: Json | null;
          school_id: string;
          starts_at: string;
          updated_at: string | null;
        };
        Insert: {
          assignment_id: string;
          class_id: string;
          course_id: string;
          created_at?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          lesson_id: string;
          participants?: string[] | null;
          results?: Json | null;
          school_id: string;
          starts_at: string;
          updated_at?: string | null;
        };
        Update: {
          assignment_id?: string;
          class_id?: string;
          course_id?: string;
          created_at?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          lesson_id?: string;
          participants?: string[] | null;
          results?: Json | null;
          school_id?: string;
          starts_at?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "assignment_id_fkey";
            columns: ["assignment_id"];
            isOneToOne: false;
            referencedRelation: "assignment";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "class";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "course";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lesson";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "school";
            referencedColumns: ["id"];
          },
        ];
      };
      parent_user: {
        Row: {
          created_at: string | null;
          id: string;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          is_ops: boolean | null;
          ops_created_by: string | null;
          parent_id: string;
          student_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          is_ops?: boolean | null;
          ops_created_by?: string | null;
          parent_id: string;
          student_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          is_ops?: boolean | null;
          ops_created_by?: string | null;
          parent_id?: string;
          student_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "parent_user_ops_created_by_fkey";
            columns: ["ops_created_by"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "parent_user_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "parent_user_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      program: {
        Row: {
          block: string | null;
          cluster: string | null;
          country: string | null;
          created_at: string;
          devices_count: string | null;
          district: string | null;
          end_date: string | null;
          funding_partner: string | null;
          id: string;
          implementation_partner: string | null;
          institute_partner: string | null;
          institutes_count: string | null;
          is_deleted: boolean | null;
          is_ops: boolean | null;
          model: string | null;
          name: string;
          program_type: Database["public"]["Enums"]["program_type"] | null;
          start_date: string | null;
          state: string | null;
          students_count: string | null;
          updated_at: string;
          village: string | null;
        };
        Insert: {
          block?: string | null;
          cluster?: string | null;
          country?: string | null;
          created_at?: string;
          devices_count?: string | null;
          district?: string | null;
          end_date?: string | null;
          funding_partner?: string | null;
          id?: string;
          implementation_partner?: string | null;
          institute_partner?: string | null;
          institutes_count?: string | null;
          is_deleted?: boolean | null;
          is_ops?: boolean | null;
          model?: string | null;
          name: string;
          program_type?: Database["public"]["Enums"]["program_type"] | null;
          start_date?: string | null;
          state?: string | null;
          students_count?: string | null;
          updated_at?: string;
          village?: string | null;
        };
        Update: {
          block?: string | null;
          cluster?: string | null;
          country?: string | null;
          created_at?: string;
          devices_count?: string | null;
          district?: string | null;
          end_date?: string | null;
          funding_partner?: string | null;
          id?: string;
          implementation_partner?: string | null;
          institute_partner?: string | null;
          institutes_count?: string | null;
          is_deleted?: boolean | null;
          is_ops?: boolean | null;
          model?: string | null;
          name?: string;
          program_type?: Database["public"]["Enums"]["program_type"] | null;
          start_date?: string | null;
          state?: string | null;
          students_count?: string | null;
          updated_at?: string;
          village?: string | null;
        };
        Relationships: [];
      };
      program_user: {
        Row: {
          created_at: string;
          id: string;
          is_deleted: boolean;
          is_ops: boolean | null;
          program_id: string;
          role: Database["public"]["Enums"]["role"] | null;
          updated_at: string;
          user: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_deleted?: boolean;
          is_ops?: boolean | null;
          program_id: string;
          role?: Database["public"]["Enums"]["role"] | null;
          updated_at?: string;
          user?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_deleted?: boolean;
          is_ops?: boolean | null;
          program_id?: string;
          role?: Database["public"]["Enums"]["role"] | null;
          updated_at?: string;
          user?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "program_user_user_fkey";
            columns: ["user"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      req_new_school: {
        Row: {
          city: string | null;
          created_at: string | null;
          district: string | null;
          id: string;
          image: string | null;
          is_deleted: boolean | null;
          is_resolved: boolean | null;
          name: string | null;
          state: string | null;
          udise_id: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          city?: string | null;
          created_at?: string | null;
          district?: string | null;
          id?: string;
          image?: string | null;
          is_deleted?: boolean | null;
          is_resolved?: boolean | null;
          name?: string | null;
          state?: string | null;
          udise_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          city?: string | null;
          created_at?: string | null;
          district?: string | null;
          id?: string;
          image?: string | null;
          is_deleted?: boolean | null;
          is_resolved?: boolean | null;
          name?: string | null;
          state?: string | null;
          udise_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "req_new_school_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      result: {
        Row: {
          assignment_id: string | null;
          chapter_id: string | null;
          class_id: string | null;
          correct_moves: number | null;
          course_id: string | null;
          created_at: string;
          firebase_id: string | null;
          id: string;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          lesson_id: string | null;
          school_id: string | null;
          score: number | null;
          student_id: string;
          time_spent: number | null;
          updated_at: string | null;
          wrong_moves: number | null;
        };
        Insert: {
          assignment_id?: string | null;
          chapter_id?: string | null;
          class_id?: string | null;
          correct_moves?: number | null;
          course_id?: string | null;
          created_at?: string;
          firebase_id?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          lesson_id?: string | null;
          school_id?: string | null;
          score?: number | null;
          student_id: string;
          time_spent?: number | null;
          updated_at?: string | null;
          wrong_moves?: number | null;
        };
        Update: {
          assignment_id?: string | null;
          chapter_id?: string | null;
          class_id?: string | null;
          correct_moves?: number | null;
          course_id?: string | null;
          created_at?: string;
          firebase_id?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          lesson_id?: string | null;
          school_id?: string | null;
          score?: number | null;
          student_id?: string;
          time_spent?: number | null;
          updated_at?: string | null;
          wrong_moves?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "public_result_assignment_id_fkey";
            columns: ["assignment_id"];
            isOneToOne: false;
            referencedRelation: "assignment";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_result_lesson_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lesson";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_result_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "school";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "result_chapter_id_fkey";
            columns: ["chapter_id"];
            isOneToOne: false;
            referencedRelation: "chapter";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "result_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "class";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "result_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "course";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "result_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      reward: {
        Row: {
          created_at: string;
          id: string;
          is_deleted: boolean | null;
          monthly: string | null;
          updated_at: string | null;
          weekly: string | null;
          weeklySticker: string | null;
          year: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_deleted?: boolean | null;
          monthly?: string | null;
          updated_at?: string | null;
          weekly?: string | null;
          weeklySticker?: string | null;
          year: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_deleted?: boolean | null;
          monthly?: string | null;
          updated_at?: string | null;
          weekly?: string | null;
          weeklySticker?: string | null;
          year?: number;
        };
        Relationships: [];
      };
      saved_queries: {
        Row: {
          created_at: string | null;
          id: string;
          query: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          query: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          query?: string;
        };
        Relationships: [];
      };
      school: {
        Row: {
          academic_year: string | null;
          address: string | null;
          created_at: string;
          firebase_id: string | null;
          group1: string | null;
          group2: string | null;
          group3: string | null;
          group4: string | null;
          id: string;
          image: string | null;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          is_ops: boolean | null;
          language: string | null;
          model: Database["public"]["Enums"]["program_model"] | null;
          name: string;
          ops_created_by: string | null;
          program_id: string | null;
          student_login_type: Database["public"]["Enums"]["login_type"] | null;
          udise: string | null;
          updated_at: string | null;
        };
        Insert: {
          academic_year?: string | null;
          address?: string | null;
          created_at?: string;
          firebase_id?: string | null;
          group1?: string | null;
          group2?: string | null;
          group3?: string | null;
          group4?: string | null;
          id?: string;
          image?: string | null;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          is_ops?: boolean | null;
          language?: string | null;
          model?: Database["public"]["Enums"]["program_model"] | null;
          name: string;
          ops_created_by?: string | null;
          program_id?: string | null;
          student_login_type?: Database["public"]["Enums"]["login_type"] | null;
          udise?: string | null;
          updated_at?: string | null;
        };
        Update: {
          academic_year?: string | null;
          address?: string | null;
          created_at?: string;
          firebase_id?: string | null;
          group1?: string | null;
          group2?: string | null;
          group3?: string | null;
          group4?: string | null;
          id?: string;
          image?: string | null;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          is_ops?: boolean | null;
          language?: string | null;
          model?: Database["public"]["Enums"]["program_model"] | null;
          name?: string;
          ops_created_by?: string | null;
          program_id?: string | null;
          student_login_type?: Database["public"]["Enums"]["login_type"] | null;
          udise?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "school_ops_created_by_fkey";
            columns: ["ops_created_by"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "school_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "program";
            referencedColumns: ["id"];
          },
        ];
      };
      school_course: {
        Row: {
          course_id: string;
          created_at: string;
          id: string;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          is_ops: boolean | null;
          ops_created_by: string | null;
          school_id: string;
          updated_at: string | null;
        };
        Insert: {
          course_id: string;
          created_at?: string;
          id?: string;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          is_ops?: boolean | null;
          ops_created_by?: string | null;
          school_id: string;
          updated_at?: string | null;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          id?: string;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          is_ops?: boolean | null;
          ops_created_by?: string | null;
          school_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "public_school_course_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "course";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_school_course_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "school";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "school_course_ops_created_by_fkey";
            columns: ["ops_created_by"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      school_data: {
        Row: {
          block: string | null;
          classes: string | null;
          cluster: string | null;
          country: string | null;
          created_at: string;
          district: string | null;
          head_teacher: string | null;
          head_teachers: string | null;
          id: string;
          instruction_medium: string | null;
          pre_primary_section_available: boolean | null;
          school_name: string | null;
          school_type: string | null;
          state: string | null;
          total_teachers: number | null;
          udise_code: string | null;
          updated_at: string | null;
          village: string | null;
        };
        Insert: {
          block?: string | null;
          classes?: string | null;
          cluster?: string | null;
          country?: string | null;
          created_at?: string;
          district?: string | null;
          head_teacher?: string | null;
          head_teachers?: string | null;
          id?: string;
          instruction_medium?: string | null;
          pre_primary_section_available?: boolean | null;
          school_name?: string | null;
          school_type?: string | null;
          state?: string | null;
          total_teachers?: number | null;
          udise_code?: string | null;
          updated_at?: string | null;
          village?: string | null;
        };
        Update: {
          block?: string | null;
          classes?: string | null;
          cluster?: string | null;
          country?: string | null;
          created_at?: string;
          district?: string | null;
          head_teacher?: string | null;
          head_teachers?: string | null;
          id?: string;
          instruction_medium?: string | null;
          pre_primary_section_available?: boolean | null;
          school_name?: string | null;
          school_type?: string | null;
          state?: string | null;
          total_teachers?: number | null;
          udise_code?: string | null;
          updated_at?: string | null;
          village?: string | null;
        };
        Relationships: [];
      };
      school_user: {
        Row: {
          created_at: string;
          id: string;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          is_ops: boolean | null;
          ops_created_by: string | null;
          role: Database["public"]["Enums"]["role"];
          school_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          is_ops?: boolean | null;
          ops_created_by?: string | null;
          role: Database["public"]["Enums"]["role"];
          school_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          is_ops?: boolean | null;
          ops_created_by?: string | null;
          role?: Database["public"]["Enums"]["role"];
          school_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "school_user_ops_created_by_fkey";
            columns: ["ops_created_by"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "school_user_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "school";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "school_user_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      special_users: {
        Row: {
          created_at: string;
          id: string;
          is_deleted: boolean | null;
          role: Database["public"]["Enums"]["special_roles"] | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_deleted?: boolean | null;
          role?: Database["public"]["Enums"]["special_roles"] | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_deleted?: boolean | null;
          role?: Database["public"]["Enums"]["special_roles"] | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "special_users_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      sticker: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          image: string | null;
          is_deleted: boolean | null;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image?: string | null;
          is_deleted?: boolean | null;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image?: string | null;
          is_deleted?: boolean | null;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      subject: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          image: string | null;
          is_deleted: boolean | null;
          name: string;
          sort_index: number | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image?: string | null;
          is_deleted?: boolean | null;
          name: string;
          sort_index?: number | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image?: string | null;
          is_deleted?: boolean | null;
          name?: string;
          sort_index?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      upload_queue: {
        Row: {
          id: string;
          uploading_user: string | null;
          start_time: string | null;
          payload: Record<string, unknown>;
          status: string | null;
          error: string | null;
          process_started_at: string | null;
          batch_number: number | null;
          is_locked: boolean | null;
          locked_at: string | null;
          locked_by: string | null;
        };
        Insert: {
          id?: string;
          uploading_user?: string | null;
          start_time?: string | null;
          payload: Record<string, unknown>;
          status?: string | null;
          error?: string | null;
          process_started_at?: string | null;
          batch_number?: number | null;
          is_locked?: boolean | null;
          locked_at?: string | null;
          locked_by?: string | null;
        };
        Update: {
          id?: string;
          uploading_user?: string | null;
          start_time?: string | null;
          payload?: Record<string, unknown>;
          status?: string | null;
          error?: string | null;
          process_started_at?: string | null;
          batch_number?: number | null;
          is_locked?: boolean | null;
          locked_at?: string | null;
          locked_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "upload_queue_uploading_user_fkey";
            columns: ["uploading_user"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      user: {
        Row: {
          age: number | null;
          avatar: string | null;
          created_at: string;
          curriculum_id: string | null;
          email: string | null;
          fcm_token: string | null;
          firebase_id: string | null;
          gender: string | null;
          grade_id: string | null;
          id: string;
          image: string | null;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          is_ops: boolean | null;
          is_tc_accepted: boolean | null;
          language_id: string | null;
          learning_path: string | null;
          music_off: boolean | null;
          name: string | null;
          ops_created_by: string | null;
          phone: string | null;
          sfx_off: boolean | null;
          stars: number | null;
          student_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          age?: number | null;
          avatar?: string | null;
          created_at?: string;
          curriculum_id?: string | null;
          email?: string | null;
          fcm_token?: string | null;
          firebase_id?: string | null;
          gender?: string | null;
          grade_id?: string | null;
          id?: string;
          image?: string | null;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          is_ops?: boolean | null;
          is_tc_accepted?: boolean | null;
          language_id?: string | null;
          learning_path?: string | null;
          music_off?: boolean | null;
          name?: string | null;
          ops_created_by?: string | null;
          phone?: string | null;
          sfx_off?: boolean | null;
          stars?: number | null;
          student_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          age?: number | null;
          avatar?: string | null;
          created_at?: string;
          curriculum_id?: string | null;
          email?: string | null;
          fcm_token?: string | null;
          firebase_id?: string | null;
          gender?: string | null;
          grade_id?: string | null;
          id?: string;
          image?: string | null;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          is_ops?: boolean | null;
          is_tc_accepted?: boolean | null;
          language_id?: string | null;
          learning_path?: string | null;
          music_off?: boolean | null;
          name?: string | null;
          ops_created_by?: string | null;
          phone?: string | null;
          sfx_off?: boolean | null;
          stars?: number | null;
          student_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "public_user_curriculum_id_fkey";
            columns: ["curriculum_id"];
            isOneToOne: false;
            referencedRelation: "curriculum";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_user_language_id_fkey";
            columns: ["language_id"];
            isOneToOne: false;
            referencedRelation: "language";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_grade_id_fkey";
            columns: ["grade_id"];
            isOneToOne: false;
            referencedRelation: "grade";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_ops_created_by_fkey";
            columns: ["ops_created_by"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      user_badge: {
        Row: {
          badge_id: string;
          created_at: string;
          id: string;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          is_seen: boolean | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          badge_id: string;
          created_at?: string;
          id?: string;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          is_seen?: boolean | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          badge_id?: string;
          created_at?: string;
          id?: string;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          is_seen?: boolean | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "public_user_badge_badge_id_fkey";
            columns: ["badge_id"];
            isOneToOne: false;
            referencedRelation: "badge";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_user_badge_parent_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      user_bonus: {
        Row: {
          bonus_id: string;
          created_at: string;
          id: string;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          is_seen: boolean | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          bonus_id: string;
          created_at?: string;
          id?: string;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          is_seen?: boolean | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          bonus_id?: string;
          created_at?: string;
          id?: string;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          is_seen?: boolean | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "public_user_bonus_bonus_id_fkey";
            columns: ["bonus_id"];
            isOneToOne: false;
            referencedRelation: "lesson";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_user_bonus_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      user_course: {
        Row: {
          course_id: string;
          created_at: string;
          id: string;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          course_id: string;
          created_at?: string;
          id?: string;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          id?: string;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "public_user_course_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "course";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_user_course_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      user_sticker: {
        Row: {
          created_at: string;
          id: string;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          is_seen: boolean | null;
          sticker_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          is_seen?: boolean | null;
          sticker_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_deleted?: boolean | null;
          is_firebase?: boolean | null;
          is_seen?: boolean | null;
          sticker_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "public_user_sticker_sticker_id_fkey";
            columns: ["sticker_id"];
            isOneToOne: false;
            referencedRelation: "sticker";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "public_user_sticker_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      get_leaderboard_generic_data: {
        Row: {
          lessons_played: number | null;
          name: string | null;
          student_id: string | null;
          total_score: number | null;
          total_time_spent: number | null;
          type: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      call_send_badges: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      call_send_bonuses: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      check_class_exists_by_name_and_school: {
        Args: { class_name: string; input_school_udise_code: string };
        Returns: Json;
      };
      check_parent_and_student_in_class: {
        Args: {
          phone_number: string;
          student_name: string;
          class_name: string;
          input_school_udise_code: string;
        };
        Returns: Json;
      };
      check_student_duplicate_in_class_without_phone_number: {
        Args: {
          student_name: string;
          class_name: string;
          input_school_udise_code: string;
        };
        Returns: Json;
      };
      get_program_activity_stats: {
        Args: { p_program_id: string };
        Returns: {
          total_students: number;
          total_teachers: number;
          total_institutes: number;
          active_student_percentage: number;
          active_teacher_percentage: number;
          avg_weekly_time_minutes: number;
        };
      };
      get_school_activity_stats: {
        Args: { p_school_id: string };
        Returns: {
          active_student_percentage: number;
          active_teacher_percentage: number;
          avg_weekly_time_minutes: number;
        };
      };
      count_total_and_active_students_by_program: {
        Args: { p_program_id: string };
        Returns: {
          total_students: number;
          active_students: number;
          avg_time_spent: number;
        }[];
      };
      count_total_and_active_teachers_by_program: {
        Args: { p_program_id: string };
        Returns: {
          total_teachers: number;
          active_teachers: number;
          total_institutes: number;
        }[];
      };
      create_user: {
        Args: { phone_number: string };
        Returns: {
          id: string;
          phone: string;
        }[];
      };
      delete_class_firebase_trigger: {
        Args: { input_firebase_id: string };
        Returns: string;
      };
      delete_school_firebase_trigger: {
        Args: { input_firebase_id: string };
        Returns: string;
      };
      delete_student: {
        Args: { student_id: string };
        Returns: undefined;
      };
      delete_user: {
        Args: { uuid: string };
        Returns: boolean;
      };
      execute_saved_query: {
        Args: { p_query_id: string };
        Returns: Json;
      };
      fetch_leaderboard_data: {
        Args: Record<PropertyKey, never>;
        Returns: {
          type: string;
          student_id: string;
          name: string;
          lessons_played: number;
          total_score: number;
          total_time_spent: number;
        }[];
      };
      find_similar_lessons: {
        Args: { search_text: string };
        Returns: {
          id: string;
          name: string;
          image: string;
          outcome: string;
          plugin_type: string;
          status: string;
          cocos_subject_code: string;
          cocos_chapter_code: string;
          created_by: string;
          subject_id: string;
          target_age_from: number;
          target_age_to: number;
          language_id: string;
          created_at: string;
          updated_at: string;
          is_deleted: boolean;
          cocos_lesson_id: string;
          color: string;
        }[];
      };
      generate_otp_msg91: {
        Args: { phone_number: string };
        Returns: Json;
      };
      generate_unique_class_code: {
        Args: { class_id_input: string };
        Returns: number;
      };
      get_class_leaderboard: {
        Args: { current_class_id: string };
        Returns: {
          type: string;
          student_id: string;
          name: string;
          lessons_played: number;
          total_score: number;
          total_time_spent: number;
        }[];
      };
      get_filtered_schools: {
        Args: { filters: Json };
        Returns: {
          sch_id: string;
          school_name: string;
          district: string;
          num_students: number;
          num_teachers: number;
          program_managers: string[];
          field_coordinators: string[];
        }[];
      };
      get_filtered_schools_with_optional_program: {
        Args: {
          filters?: Json;
          _program_id?: string | null;
        };
        Returns: {
          sch_id: string;
          school_name: string;
          district: string;
          num_students: number;
          num_teachers: number;
          program_managers: string[];
          field_coordinators: string[];
        }[];
      };
      get_latest_results_by_student: {
        Args: { student_uuid: string };
        Returns: {
          assignment_id: string | null;
          chapter_id: string | null;
          class_id: string | null;
          correct_moves: number | null;
          course_id: string | null;
          created_at: string;
          firebase_id: string | null;
          id: string;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          lesson_id: string | null;
          school_id: string | null;
          score: number | null;
          student_id: string;
          time_spent: number | null;
          updated_at: string | null;
          wrong_moves: number | null;
        }[];
      };
      get_leaderboard: {
        Args: Record<PropertyKey, never>;
        Returns: {
          type: string;
          student_id: string;
          name: string;
          lessons_played: number;
          total_score: number;
          total_time_spent: number;
        }[];
      };
      get_program_filter_options: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_program_filters: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_program_managers: {
        Args: Record<PropertyKey, never>;
        Returns: {
          name: string;
        }[];
      };
      is_student_already_in_class: {
        Args: {
          _class_id: string;
          _user_id: string;
        };
        Returns: boolean;
      };
      get_programs_for_user: {
        Args: {
          _current_user_id: string;
          _filters: Json;
          _tab: string;
          _search_term: string;
          _limit: number;
          _offset: number;
          _order_by: string;
          _order: string;
        };
        Returns: {
          id: string;
          name: string;
          state: string;
          institutes_count: number;
          students_count: number;
          devices_count: number;
          manager_names: string;
          total_count: number;
        }[];
      };
      get_programs_with_count: {
        Args: {
          _filters: Json;
          _search: string;
          _tab: string;
          _limit: number;
          _offset: number;
        };
        Returns: {
          programs: Json;
          total_count: number;
        }[];
      };
      get_query_data: {
        Args: { p_query_id: string };
        Returns: Json;
      };
      get_query_data_v2: {
        Args: { p_query: string; p_secret: string };
        Returns: Json;
      };
      get_query_metadata: {
        Args: { p_query_id: string };
        Returns: Json;
      };
      get_query_metadata_v2: {
        Args: { p_query: string; p_secret: string };
        Returns: Json;
      };
      get_results_by_assignment: {
        Args: { _assignment_id: string };
        Returns: {
          result_data: Database["public"]["Tables"]["result"]["Row"][];
          user_data: Database["public"]["Tables"]["user"]["Row"][];
        }[];
      };
      get_school_filter_options: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_unique_geo_data: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_user_by_email: {
        Args: { p_email: string };
        Returns: {
          age: number | null;
          avatar: string | null;
          created_at: string;
          curriculum_id: string | null;
          email: string | null;
          fcm_token: string | null;
          firebase_id: string | null;
          gender: string | null;
          grade_id: string | null;
          id: string;
          image: string | null;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          is_ops: boolean | null;
          is_tc_accepted: boolean | null;
          language_id: string | null;
          learning_path: string | null;
          music_off: boolean | null;
          name: string | null;
          ops_created_by: string | null;
          phone: string | null;
          sfx_off: boolean | null;
          stars: number | null;
          student_id: string | null;
          updated_at: string | null;
        };
      };
      get_user_by_phone: {
        Args: { phone_number: string };
        Returns: {
          id: string;
          phone: string;
        }[];
      };
      get_user_by_phonenumber: {
        Args: { p_phone: string };
        Returns: {
          age: number | null;
          avatar: string | null;
          created_at: string;
          curriculum_id: string | null;
          email: string | null;
          fcm_token: string | null;
          firebase_id: string | null;
          gender: string | null;
          grade_id: string | null;
          id: string;
          image: string | null;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          is_ops: boolean | null;
          is_tc_accepted: boolean | null;
          language_id: string | null;
          learning_path: string | null;
          music_off: boolean | null;
          name: string | null;
          ops_created_by: string | null;
          phone: string | null;
          sfx_off: boolean | null;
          stars: number | null;
          student_id: string | null;
          updated_at: string | null;
        };
      };
      get_users_for_parent_or_self_or_school: {
        Args: { p_uid: string; p_updated_at: string };
        Returns: {
          age: number | null;
          avatar: string | null;
          created_at: string;
          curriculum_id: string | null;
          email: string | null;
          fcm_token: string | null;
          firebase_id: string | null;
          gender: string | null;
          grade_id: string | null;
          id: string;
          image: string | null;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          is_ops: boolean | null;
          is_tc_accepted: boolean | null;
          language_id: string | null;
          learning_path: string | null;
          music_off: boolean | null;
          name: string | null;
          ops_created_by: string | null;
          phone: string | null;
          sfx_off: boolean | null;
          stars: number | null;
          student_id: string | null;
          updated_at: string | null;
        }[];
      };
      getDataByInviteCode: {
        Args: { invite_code: number };
        Returns: Json;
      };
      insert_firebase_assignment_trigger: {
        Args: {
          firebase_assignment_id: string;
          assigner_firebase_id: string;
          class_firebase_id: string;
          course_firebase_id: string;
          school_firebase_id: string;
          chapter_code: string;
          lesson_id_text: string;
          lesson_chapter_code: string;
          lesson_subject_code: string;
          starts_at?: string;
          ends_at?: string;
          is_classwise?: boolean;
          assign_type?: string;
          source?: string;
        };
        Returns: string;
      };
      insert_firebase_class_trigger: {
        Args: {
          p_firebase_class_id: string;
          p_class_name: string;
          p_image: string;
          p_status: string;
          p_school_firebase_id: string;
          p_course_firebase_ids: string[];
        };
        Returns: string;
      };
      insert_firebase_classconnection_trigger: {
        Args: {
          firebase_class_id: string;
          firebase_user_id: string;
          p_role: string;
          p_soft_delete?: boolean;
        };
        Returns: string;
      };
      insert_firebase_result_trigger: {
        Args: {
          subject_code: string;
          chapter_code: string;
          lesson_code: string;
          firebase_user_id: string;
          firebase_class_id: string;
          firebase_school_id: string;
          firebase_course_id: string;
          firebase_assignment_id: string;
          score: number;
          correct_moves: number;
          time_spent: number;
          wrong_moves: number;
          firebase_result_id: string;
        };
        Returns: string;
      };
      insert_firebase_school_trigger: {
        Args: {
          p_firebase_school_id: string;
          p_school_name: string;
          p_image: string;
          p_group1: string;
          p_group2: string;
          p_group3: string;
          p_course_firebase_ids: string[];
        };
        Returns: string;
      };
      insert_firebase_schoolconnection_trigger: {
        Args: {
          firebase_school_id: string;
          firebase_user_id: string;
          p_role: string;
          p_soft_delete?: boolean;
        };
        Returns: string;
      };
      insert_firebase_user_trigger: {
        Args: {
          id: string;
          name: string;
          email: string;
          phone: string;
          gender: string;
          image: string;
          avatar: string;
          firebase_language_id: string;
          firebase_curriculum_id: string;
          is_tc_accepted: string;
          age: string;
          firebase_grade_id: string;
          music_off: string;
          sfx_off: string;
          fcm_token: string;
          student_id: string;
          firebase_id: string;
        };
        Returns: string;
      };
      insert_student_firebase_trigger: {
        Args: {
          input_name: string;
          input_email: string;
          input_phone: string;
          input_gender: string;
          input_image: string;
          input_avatar: string;
          input_firebase_language_id: string;
          input_firebase_curriculum_id: string;
          input_is_tc_accepted: string;
          input_age: string;
          input_firebase_grade_id: string;
          input_music_off: string;
          input_sfx_off: string;
          input_fcm_token: string;
          input_student_id: string;
          input_firebase_id: string;
          input_parent_firebase_id: string;
          input_p_course_firebase_ids: string[];
          input_supabase_student_id: string;
          input_is_parent_delete?: boolean;
        };
        Returns: string;
      };
      isUserExists: {
        Args: { user_phone: string; user_email: string };
        Returns: boolean;
      };
      join_live_quiz: {
        Args: { _assignment_id: string; _student_id: string };
        Returns: string;
      };
      linkStudent: {
        Args: { invite_code: number; student_id: string };
        Returns: boolean;
      };
      reseach_get_assignment_users: {
        Args: { p_updated_at: string };
        Returns: {
          assignment_id: string;
          created_at: string | null;
          id: string;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          updated_at: string | null;
          user_id: string;
        }[];
      };
      reseach_get_class_user: {
        Args: { p_updated_at?: string };
        Returns: {
          class_id: string;
          created_at: string | null;
          id: string;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          is_ops: boolean | null;
          ops_created_by: string | null;
          role: Database["public"]["Enums"]["role"];
          updated_at: string | null;
          user_id: string;
        }[];
      };
      reseach_get_favorite_lessons: {
        Args: { p_updated_at?: string };
        Returns: {
          created_at: string | null;
          id: string;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          lesson_id: string;
          updated_at: string | null;
          user_id: string;
        }[];
      };
      reseach_get_live_quiz_rooms: {
        Args: { p_updated_at?: string };
        Returns: {
          assignment_id: string;
          class_id: string;
          course_id: string;
          created_at: string | null;
          id: string;
          is_deleted: boolean | null;
          lesson_id: string;
          participants: string[] | null;
          results: Json | null;
          school_id: string;
          starts_at: string;
          updated_at: string | null;
        }[];
      };
      reseach_get_parent_users: {
        Args: { p_updated_at?: string };
        Returns: {
          created_at: string | null;
          id: string;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          is_ops: boolean | null;
          ops_created_by: string | null;
          parent_id: string;
          student_id: string;
          updated_at: string | null;
        }[];
      };
      reseach_get_results: {
        Args: { p_updated_at: string };
        Returns: {
          assignment_id: string | null;
          chapter_id: string | null;
          class_id: string | null;
          correct_moves: number | null;
          course_id: string | null;
          created_at: string;
          firebase_id: string | null;
          id: string;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          lesson_id: string | null;
          school_id: string | null;
          score: number | null;
          student_id: string;
          time_spent: number | null;
          updated_at: string | null;
          wrong_moves: number | null;
        }[];
      };
      reseach_get_school_users: {
        Args: { p_updated_at?: string };
        Returns: {
          created_at: string;
          id: string;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          is_ops: boolean | null;
          ops_created_by: string | null;
          role: Database["public"]["Enums"]["role"];
          school_id: string;
          updated_at: string | null;
          user_id: string;
        }[];
      };
      reseach_get_schools: {
        Args: { p_updated_at: string };
        Returns: {
          academic_year: string | null;
          address: string | null;
          created_at: string;
          firebase_id: string | null;
          group1: string | null;
          group2: string | null;
          group3: string | null;
          group4: string | null;
          id: string;
          image: string | null;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          is_ops: boolean | null;
          language: string | null;
          model: Database["public"]["Enums"]["program_model"] | null;
          name: string;
          ops_created_by: string | null;
          program_id: string | null;
          student_login_type: Database["public"]["Enums"]["login_type"] | null;
          udise: string | null;
          updated_at: string | null;
        }[];
      };
      reseach_get_users: {
        Args: { p_updated_at: string };
        Returns: {
          age: number | null;
          avatar: string | null;
          created_at: string;
          curriculum_id: string | null;
          email: string | null;
          fcm_token: string | null;
          firebase_id: string | null;
          gender: string | null;
          grade_id: string | null;
          id: string;
          image: string | null;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          is_ops: boolean | null;
          is_tc_accepted: boolean | null;
          language_id: string | null;
          learning_path: string | null;
          music_off: boolean | null;
          name: string | null;
          ops_created_by: string | null;
          phone: string | null;
          sfx_off: boolean | null;
          stars: number | null;
          student_id: string | null;
          updated_at: string | null;
        }[];
      };
      resend_otp: {
        Args: { phone_number: string };
        Returns: Json;
      };
      set_confirmation: {
        Args: { phone_number: string; code: string };
        Returns: string;
      };
      sql_get_assignment_cart: {
        Args: { p_updated_at?: string };
        Returns: {
          created_at: string;
          id: string;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          lessons: string | null;
          updated_at: string | null;
        }[];
      };
      sql_get_assignment_users: {
        Args: { p_updated_at: string };
        Returns: {
          assignment_id: string;
          created_at: string | null;
          id: string;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          updated_at: string | null;
          user_id: string;
        }[];
      };
      sql_get_assignments: {
        Args: { p_updated_at: string };
        Returns: {
          chapter_id: string | null;
          class_id: string;
          course_id: string | null;
          created_at: string;
          created_by: string | null;
          ends_at: string | null;
          firebase_id: string | null;
          id: string;
          is_class_wise: boolean;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          lesson_id: string;
          school_id: string;
          source: string | null;
          starts_at: string;
          type: string | null;
          updated_at: string | null;
        }[];
      };
      sql_get_badge: {
        Args: { p_updated_at?: string };
        Returns: {
          created_at: string | null;
          description: string | null;
          id: string;
          image: string | null;
          is_deleted: boolean | null;
          name: string;
          updated_at: string | null;
        }[];
      };
      sql_get_chapter: {
        Args: { p_updated_at?: string };
        Returns: {
          course_id: string | null;
          created_at: string;
          id: string;
          image: string | null;
          is_deleted: boolean | null;
          name: string | null;
          sort_index: number | null;
          sub_topics: string | null;
          updated_at: string | null;
        }[];
      };
      sql_get_chapter_lesson: {
        Args: { p_updated_at?: string };
        Returns: {
          chapter_id: string;
          created_at: string;
          id: string;
          is_deleted: boolean | null;
          lesson_id: string;
          sort_index: number | null;
          updated_at: string | null;
        }[];
      };
      sql_get_class: {
        Args: { p_updated_at: string };
        Returns: {
          academic_year: string | null;
          created_at: string;
          firebase_id: string | null;
          id: string;
          image: string | null;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          is_ops: boolean | null;
          name: string;
          ops_created_by: string | null;
          school_id: string;
          standard: string | null;
          status: string | null;
          updated_at: string | null;
        }[];
      };
      sql_get_class_course: {
        Args: { p_updated_at: string };
        Returns: {
          class_id: string;
          course_id: string;
          created_at: string;
          id: string;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          is_ops: boolean | null;
          ops_created_by: string | null;
          updated_at: string | null;
        }[];
      };
      sql_get_class_invite_codes: {
        Args: { p_updated_at: string };
        Returns: {
          class_id: string;
          code: number;
          created_at: string;
          expires_at: string;
          id: string;
          is_class_code: boolean | null;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          updated_at: string | null;
        }[];
      };
      sql_get_class_user: {
        Args: { p_updated_at?: string };
        Returns: {
          class_id: string;
          created_at: string | null;
          id: string;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          is_ops: boolean | null;
          ops_created_by: string | null;
          role: Database["public"]["Enums"]["role"];
          updated_at: string | null;
          user_id: string;
        }[];
      };
      sql_get_course: {
        Args: { p_updated_at?: string };
        Returns: {
          code: string | null;
          color: string | null;
          created_at: string;
          curriculum_id: string | null;
          description: string | null;
          firebase_id: string | null;
          grade_id: string | null;
          id: string;
          image: string | null;
          is_deleted: boolean | null;
          name: string;
          sort_index: number | null;
          subject_id: string | null;
          updated_at: string | null;
        }[];
      };
      sql_get_curriculum: {
        Args: { p_updated_at?: string };
        Returns: {
          created_at: string;
          description: string | null;
          firebase_id: string | null;
          id: string;
          image: string | null;
          is_deleted: boolean | null;
          name: string;
          sort_index: number | null;
          updated_at: string | null;
        }[];
      };
      sql_get_favorite_lessons: {
        Args: { p_updated_at?: string };
        Returns: {
          created_at: string | null;
          id: string;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          lesson_id: string;
          updated_at: string | null;
          user_id: string;
        }[];
      };
      sql_get_grade: {
        Args: { p_updated_at?: string };
        Returns: {
          created_at: string;
          description: string | null;
          firebase_id: string | null;
          id: string;
          image: string | null;
          is_deleted: boolean | null;
          name: string;
          sort_index: number | null;
          test: string | null;
          updated_at: string | null;
        }[];
      };
      sql_get_language: {
        Args: { p_updated_at?: string };
        Returns: {
          code: string | null;
          created_at: string;
          description: string | null;
          firebase_id: string | null;
          id: string;
          image: string | null;
          is_deleted: boolean | null;
          name: string;
          sort_index: number | null;
          updated_at: string | null;
        }[];
      };
      sql_get_lessons: {
        Args: { p_updated_at?: string };
        Returns: {
          cocos_chapter_code: string | null;
          cocos_lesson_id: string | null;
          cocos_subject_code: string | null;
          color: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          image: string | null;
          is_deleted: boolean | null;
          language_id: string | null;
          name: string | null;
          outcome: string | null;
          plugin_type: string | null;
          status: string | null;
          subject_id: string | null;
          target_age_from: number | null;
          target_age_to: number | null;
          updated_at: string | null;
        }[];
      };
      sql_get_live_quiz_rooms: {
        Args: { p_updated_at?: string };
        Returns: {
          assignment_id: string;
          class_id: string;
          course_id: string;
          created_at: string | null;
          id: string;
          is_deleted: boolean | null;
          lesson_id: string;
          participants: string[] | null;
          results: Json | null;
          school_id: string;
          starts_at: string;
          updated_at: string | null;
        }[];
      };
      sql_get_parent_users: {
        Args: { p_updated_at?: string };
        Returns: {
          created_at: string | null;
          id: string;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          is_ops: boolean | null;
          ops_created_by: string | null;
          parent_id: string;
          student_id: string;
          updated_at: string | null;
        }[];
      };
      sql_get_results: {
        Args: { p_updated_at: string };
        Returns: {
          assignment_id: string | null;
          chapter_id: string | null;
          class_id: string | null;
          correct_moves: number | null;
          course_id: string | null;
          created_at: string;
          firebase_id: string | null;
          id: string;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          lesson_id: string | null;
          school_id: string | null;
          score: number | null;
          student_id: string;
          time_spent: number | null;
          updated_at: string | null;
          wrong_moves: number | null;
        }[];
      };
      sql_get_reward: {
        Args: { p_updated_at?: string };
        Returns: {
          created_at: string;
          id: string;
          is_deleted: boolean | null;
          monthly: string | null;
          updated_at: string | null;
          weekly: string | null;
          weeklySticker: string | null;
          year: number;
        }[];
      };
      sql_get_school_courses: {
        Args: { p_updated_at: string };
        Returns: {
          course_id: string;
          created_at: string;
          id: string;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          is_ops: boolean | null;
          ops_created_by: string | null;
          school_id: string;
          updated_at: string | null;
        }[];
      };
      sql_get_school_user: {
        Args: { p_updated_at?: string };
        Returns: {
          created_at: string;
          id: string;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          is_ops: boolean | null;
          ops_created_by: string | null;
          role: Database["public"]["Enums"]["role"];
          school_id: string;
          updated_at: string | null;
          user_id: string;
        }[];
      };
      sql_get_schools: {
        Args: { p_updated_at: string };
        Returns: {
          academic_year: string | null;
          address: string | null;
          created_at: string;
          firebase_id: string | null;
          group1: string | null;
          group2: string | null;
          group3: string | null;
          group4: string | null;
          id: string;
          image: string | null;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          is_ops: boolean | null;
          language: string | null;
          model: Database["public"]["Enums"]["program_model"] | null;
          name: string;
          ops_created_by: string | null;
          program_id: string | null;
          student_login_type: Database["public"]["Enums"]["login_type"] | null;
          udise: string | null;
          updated_at: string | null;
        }[];
      };
      sql_get_sticker: {
        Args: { p_updated_at?: string };
        Returns: {
          created_at: string;
          description: string | null;
          id: string;
          image: string | null;
          is_deleted: boolean | null;
          name: string;
          updated_at: string | null;
        }[];
      };
      sql_get_subject: {
        Args: { p_updated_at?: string };
        Returns: {
          created_at: string;
          description: string | null;
          id: string;
          image: string | null;
          is_deleted: boolean | null;
          name: string;
          sort_index: number | null;
          updated_at: string | null;
        }[];
      };
      sql_get_user_badges: {
        Args: { p_updated_at: string };
        Returns: {
          badge_id: string;
          created_at: string;
          id: string;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          is_seen: boolean | null;
          updated_at: string | null;
          user_id: string;
        }[];
      };
      sql_get_user_bonus: {
        Args: { p_updated_at: string };
        Returns: {
          bonus_id: string;
          created_at: string;
          id: string;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          is_seen: boolean | null;
          updated_at: string | null;
          user_id: string;
        }[];
      };
      sql_get_user_courses: {
        Args: { p_updated_at: string };
        Returns: {
          course_id: string;
          created_at: string;
          id: string;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          updated_at: string | null;
          user_id: string;
        }[];
      };
      sql_get_user_stickers: {
        Args: { p_updated_at: string };
        Returns: {
          created_at: string;
          id: string;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          is_seen: boolean | null;
          sticker_id: string;
          updated_at: string | null;
          user_id: string;
        }[];
      };
      sql_get_users: {
        Args: { p_updated_at: string };
        Returns: {
          age: number | null;
          avatar: string | null;
          created_at: string;
          curriculum_id: string | null;
          email: string | null;
          fcm_token: string | null;
          firebase_id: string | null;
          gender: string | null;
          grade_id: string | null;
          id: string;
          image: string | null;
          is_deleted: boolean | null;
          is_firebase: boolean | null;
          is_ops: boolean | null;
          is_tc_accepted: boolean | null;
          language_id: string | null;
          learning_path: string | null;
          music_off: boolean | null;
          name: string | null;
          ops_created_by: string | null;
          phone: string | null;
          sfx_off: boolean | null;
          stars: number | null;
          student_id: string | null;
          updated_at: string | null;
        }[];
      };
      update_class_firebase_trigger: {
        Args: {
          p_firebase_class_id: string;
          p_name: string;
          p_status: string;
          p_course_firebase_ids: string[];
        };
        Returns: undefined;
      };
      update_live_quiz: {
        Args: {
          room_id: string;
          student_id: string;
          question_id: string;
          time_spent: number;
          score: number;
        };
        Returns: undefined;
      };
      update_school_firebase_trigger: {
        Args: {
          p_firebase_school_id: string;
          p_name: string;
          p_image: string;
          p_group1: string;
          p_group2: string;
          p_group3: string;
          p_course_firebase_ids: string[];
        };
        Returns: undefined;
      };
      update_student_firebase_trigger: {
        Args: {
          input_user_id: string;
          input_name: string;
          input_age: string;
          input_avatar: string;
          input_gender: string;
          input_image: string;
          input_curriculum_id: string;
          input_grade_id: string;
          input_language_id: string;
          input_new_badge_id: string;
          input_new_bonus_id: string;
          input_new_sticker_id: string;
          input_course_firebase_ids: string[];
        };
        Returns: string;
      };
      user_exists: {
        Args: { user_id: string };
        Returns: boolean;
      };
      validate_class_existence_rpc: {
        Args: {
          input_school_id: string;
          input_class_name: string;
          input_student_name?: string;
        };
        Returns: Json;
      };
      validate_school_data_rpc: {
        Args: { input_school_id: string; input_school_name: string };
        Returns: Json;
      };
      validate_school_udise_code: {
        Args: { input_school_udise_code: string };
        Returns: Json;
      };
      validate_program_name: {
        Args: { input_program_name: string };
        Returns: Json;
      };
      validate_user_contacts_rpc: {
        Args: {
          program_manager_contact: string;
          field_coordinator_contact?: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      login_type: "student_id" | "parent_phone_number";
      program_model: "hybrid" | "at_home" | "at_school";
      program_type: "govt" | "private" | "learning_centers";
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
        | "field_coordinator";
      special_roles: "super_admin" | "operational_director" | "program_manager" | "field_coordinator";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      login_type: ["student_id", "parent_phone_number"],
      program_model: ["hybrid", "at_home", "at_school"],
      program_type: ["govt", "private", "learning_centers"],
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
      ],
    },
  },
} as const;
