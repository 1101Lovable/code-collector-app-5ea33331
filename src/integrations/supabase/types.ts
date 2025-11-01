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
      cultural_events: {
        Row: {
          created_at: string
          detail_url: string | null
          district: string | null
          end_date: string | null
          event_time: string | null
          event_type: string | null
          fee: string | null
          id: string
          is_free: boolean | null
          latitude: number | null
          longitude: number | null
          main_image: string | null
          organization: string | null
          performers: string | null
          place: string | null
          program_description: string | null
          start_date: string | null
          target_audience: string | null
          theme: string | null
          title: string
        }
        Insert: {
          created_at?: string
          detail_url?: string | null
          district?: string | null
          end_date?: string | null
          event_time?: string | null
          event_type?: string | null
          fee?: string | null
          id?: string
          is_free?: boolean | null
          latitude?: number | null
          longitude?: number | null
          main_image?: string | null
          organization?: string | null
          performers?: string | null
          place?: string | null
          program_description?: string | null
          start_date?: string | null
          target_audience?: string | null
          theme?: string | null
          title: string
        }
        Update: {
          created_at?: string
          detail_url?: string | null
          district?: string | null
          end_date?: string | null
          event_time?: string | null
          event_type?: string | null
          fee?: string | null
          id?: string
          is_free?: boolean | null
          latitude?: number | null
          longitude?: number | null
          main_image?: string | null
          organization?: string | null
          performers?: string | null
          place?: string | null
          program_description?: string | null
          start_date?: string | null
          target_audience?: string | null
          theme?: string | null
          title?: string
        }
        Relationships: []
      }
      cultural_spaces: {
        Row: {
          address: string | null
          category: string | null
          closed_days: string | null
          created_at: string
          description: string | null
          district: string | null
          entrance_fee: string | null
          homepage: string | null
          id: string
          is_free: boolean | null
          latitude: number | null
          longitude: number | null
          main_image: string | null
          name: string
          open_hours: string | null
          phone: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          closed_days?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          entrance_fee?: string | null
          homepage?: string | null
          id?: string
          is_free?: boolean | null
          latitude?: number | null
          longitude?: number | null
          main_image?: string | null
          name: string
          open_hours?: string | null
          phone?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          closed_days?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          entrance_fee?: string | null
          homepage?: string | null
          id?: string
          is_free?: boolean | null
          latitude?: number | null
          longitude?: number | null
          main_image?: string | null
          name?: string
          open_hours?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      family_groups: {
        Row: {
          created_at: string
          created_by: string
          id: string
          invite_code: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          invite_code: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          invite_code?: string
          name?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          family_group_id: string
          id: string
          is_head: boolean | null
          joined_at: string
          user_id: string
        }
        Insert: {
          family_group_id: string
          id?: string
          is_head?: boolean | null
          joined_at?: string
          user_id: string
        }
        Update: {
          family_group_id?: string
          id?: string
          is_head?: boolean | null
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_group_id_fkey"
            columns: ["family_group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      health_records: {
        Row: {
          id: string
          notes: string | null
          record_type: string
          recorded_at: string
          user_id: string
          value: string
        }
        Insert: {
          id?: string
          notes?: string | null
          record_type: string
          recorded_at?: string
          user_id: string
          value: string
        }
        Update: {
          id?: string
          notes?: string | null
          record_type?: string
          recorded_at?: string
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      mood_records: {
        Row: {
          id: string
          mood: string
          recorded_at: string
          user_id: string
        }
        Insert: {
          id?: string
          mood: string
          recorded_at?: string
          user_id: string
        }
        Update: {
          id?: string
          mood?: string
          recorded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          location_city: string | null
          location_district: string | null
          location_dong: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id?: string
          location_city?: string | null
          location_district?: string | null
          location_dong?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          location_city?: string | null
          location_district?: string | null
          location_dong?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      schedules: {
        Row: {
          created_at: string
          description: string | null
          family_group_id: string | null
          id: string
          schedule_date: string
          schedule_time: string | null
          shared_with_family: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          family_group_id?: string | null
          id?: string
          schedule_date: string
          schedule_time?: string | null
          shared_with_family?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          family_group_id?: string | null
          id?: string
          schedule_date?: string
          schedule_time?: string | null
          shared_with_family?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_family_group_id_fkey"
            columns: ["family_group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invite_code: { Args: never; Returns: string }
      user_family_groups: {
        Args: { _user_id: string }
        Returns: {
          family_group_id: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
