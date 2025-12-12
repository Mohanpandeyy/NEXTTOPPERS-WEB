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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ad_access: {
        Row: {
          expires_at: string
          granted_at: string
          id: string
          user_id: string
        }
        Insert: {
          expires_at?: string
          granted_at?: string
          id?: string
          user_id: string
        }
        Update: {
          expires_at?: string
          granted_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          app_name: string
          id: string
          logo_url: string | null
          primary_color: string
          updated_at: string
        }
        Insert: {
          app_name?: string
          id?: string
          logo_url?: string | null
          primary_color?: string
          updated_at?: string
        }
        Update: {
          app_name?: string
          id?: string
          logo_url?: string | null
          primary_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      batch_access_passwords: {
        Row: {
          batch_id: string
          created_at: string
          current_uses: number
          expires_at: string
          id: string
          is_active: boolean
          max_uses: number
          password: string
          valid_hours: number
        }
        Insert: {
          batch_id: string
          created_at?: string
          current_uses?: number
          expires_at: string
          id?: string
          is_active?: boolean
          max_uses?: number
          password: string
          valid_hours?: number
        }
        Update: {
          batch_id?: string
          created_at?: string
          current_uses?: number
          expires_at?: string
          id?: string
          is_active?: boolean
          max_uses?: number
          password?: string
          valid_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "batch_access_passwords_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      batches: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          start_date: string | null
          status: Database["public"]["Enums"]["batch_status"]
          tags: string[] | null
          target_exam: Database["public"]["Enums"]["exam_type"]
          thumbnail_url: string | null
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["batch_status"]
          tags?: string[] | null
          target_exam?: Database["public"]["Enums"]["exam_type"]
          thumbnail_url?: string | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["batch_status"]
          tags?: string[] | null
          target_exam?: Database["public"]["Enums"]["exam_type"]
          thumbnail_url?: string | null
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      custom_section_items: {
        Row: {
          created_at: string
          description: string | null
          file_url: string | null
          id: string
          section_id: string
          sort_order: number | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          section_id: string
          sort_order?: number | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          section_id?: string
          sort_order?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_section_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "custom_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_sections: {
        Row: {
          batch_id: string
          content_type: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          batch_id: string
          content_type?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          batch_id?: string
          content_type?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_sections_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          batch_id: string
          enrolled_at: string
          enrolled_via_password_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          batch_id: string
          enrolled_at?: string
          enrolled_via_password_id?: string | null
          id?: string
          user_id: string
        }
        Update: {
          batch_id?: string
          enrolled_at?: string
          enrolled_via_password_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_enrolled_via_password_id_fkey"
            columns: ["enrolled_via_password_id"]
            isOneToOne: false
            referencedRelation: "batch_access_passwords"
            referencedColumns: ["id"]
          },
        ]
      }
      lectures: {
        Row: {
          batch_id: string
          created_at: string
          date_time: string | null
          dpp_url: string | null
          duration_minutes: number
          id: string
          is_basic: boolean
          is_locked: boolean
          notes_url: string | null
          special_module_url: string | null
          subject: string
          teacher_name: string
          thumbnail_url: string | null
          title: string
          topic_tags: string[] | null
          updated_at: string
          video_type: Database["public"]["Enums"]["video_type"]
          video_url: string | null
        }
        Insert: {
          batch_id: string
          created_at?: string
          date_time?: string | null
          dpp_url?: string | null
          duration_minutes?: number
          id?: string
          is_basic?: boolean
          is_locked?: boolean
          notes_url?: string | null
          special_module_url?: string | null
          subject: string
          teacher_name: string
          thumbnail_url?: string | null
          title: string
          topic_tags?: string[] | null
          updated_at?: string
          video_type?: Database["public"]["Enums"]["video_type"]
          video_url?: string | null
        }
        Update: {
          batch_id?: string
          created_at?: string
          date_time?: string | null
          dpp_url?: string | null
          duration_minutes?: number
          id?: string
          is_basic?: boolean
          is_locked?: boolean
          notes_url?: string | null
          special_module_url?: string | null
          subject?: string
          teacher_name?: string
          thumbnail_url?: string | null
          title?: string
          topic_tags?: string[] | null
          updated_at?: string
          video_type?: Database["public"]["Enums"]["video_type"]
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lectures_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      live_classes: {
        Row: {
          batch_id: string
          created_at: string
          description: string | null
          end_time: string | null
          id: string
          live_url: string
          scheduled_time: string
          status: string
          subject: string | null
          teacher_name: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: string
          live_url: string
          scheduled_time: string
          status?: string
          subject?: string | null
          teacher_name?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: string
          live_url?: string
          scheduled_time?: string
          status?: string
          subject?: string | null
          teacher_name?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_classes_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          created_at: string
          id: string
          name: string
          type: string
          uploaded_by: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          type?: string
          uploaded_by?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          type?: string
          uploaded_by?: string | null
          url?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          batch_id: string | null
          created_at: string
          id: string
          is_read: boolean
          lecture_id: string | null
          live_class_id: string | null
          message: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          lecture_id?: string | null
          live_class_id?: string | null
          message: string
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          lecture_id?: string | null
          live_class_id?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_lecture_id_fkey"
            columns: ["lecture_id"]
            isOneToOne: false
            referencedRelation: "lectures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_live_class_id_fkey"
            columns: ["live_class_id"]
            isOneToOne: false
            referencedRelation: "live_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      protected_admins: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      timetable_entries: {
        Row: {
          created_at: string
          day: string
          id: string
          image_url: string | null
          lecture_id: string | null
          subject: string
          teacher: string | null
          time: string
          timetable_id: string
          topic: string | null
        }
        Insert: {
          created_at?: string
          day: string
          id?: string
          image_url?: string | null
          lecture_id?: string | null
          subject: string
          teacher?: string | null
          time: string
          timetable_id: string
          topic?: string | null
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          image_url?: string | null
          lecture_id?: string | null
          subject?: string
          teacher?: string | null
          time?: string
          timetable_id?: string
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timetable_entries_lecture_id_fkey"
            columns: ["lecture_id"]
            isOneToOne: false
            referencedRelation: "lectures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_timetable_id_fkey"
            columns: ["timetable_id"]
            isOneToOne: false
            referencedRelation: "timetables"
            referencedColumns: ["id"]
          },
        ]
      }
      timetables: {
        Row: {
          batch_id: string
          created_at: string
          id: string
          updated_at: string
          week_range: string | null
        }
        Insert: {
          batch_id: string
          created_at?: string
          id?: string
          updated_at?: string
          week_range?: string | null
        }
        Update: {
          batch_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          week_range?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timetables_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: true
            referencedRelation: "batches"
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
      verification_tokens: {
        Row: {
          code: string | null
          code_expires_at: string | null
          created_at: string
          expires_at: string
          id: string
          token: string
          used: boolean
          user_id: string
        }
        Insert: {
          code?: string | null
          code_expires_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          token: string
          used?: boolean
          user_id: string
        }
        Update: {
          code?: string | null
          code_expires_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean
          user_id?: string
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
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "student"
      batch_status: "ongoing" | "upcoming" | "completed"
      exam_type: "JEE" | "NEET" | "Boards" | "Foundation" | "9-10" | "11-12"
      video_type: "live" | "recorded"
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
      batch_status: ["ongoing", "upcoming", "completed"],
      exam_type: ["JEE", "NEET", "Boards", "Foundation", "9-10", "11-12"],
      video_type: ["live", "recorded"],
    },
  },
} as const
