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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      case_actions: {
        Row: {
          action_type: Database["public"]["Enums"]["action_type"]
          case_id: string
          created_at: string
          id: string
          metadata: Json | null
        }
        Insert: {
          action_type: Database["public"]["Enums"]["action_type"]
          case_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          action_type?: Database["public"]["Enums"]["action_type"]
          case_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "case_actions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_messages: {
        Row: {
          body: string
          case_id: string
          created_at: string
          created_by: string
          dispatch_channel: Database["public"]["Enums"]["dispatch_channel"] | null
          dispatch_metadata: Json | null
          id: string
          is_admin_only: boolean
          letter_number: number | null
          message_type: Database["public"]["Enums"]["message_type"]
          title: string
        }
        Insert: {
          body: string
          case_id: string
          created_at?: string
          created_by: string
          dispatch_channel?: Database["public"]["Enums"]["dispatch_channel"] | null
          dispatch_metadata?: Json | null
          id?: string
          is_admin_only?: boolean
          letter_number?: number | null
          message_type: Database["public"]["Enums"]["message_type"]
          title: string
        }
        Update: {
          body?: string
          case_id?: string
          created_at?: string
          created_by?: string
          dispatch_channel?: Database["public"]["Enums"]["dispatch_channel"] | null
          dispatch_metadata?: Json | null
          id?: string
          is_admin_only?: boolean
          letter_number?: number | null
          message_type?: Database["public"]["Enums"]["message_type"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_messages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          amount_withheld_cents: number
          contingency_agreed_at: string | null
          contingency_pct: number
          created_at: string
          current_letter_number: number
          decline_message: string | null
          decline_reason: string | null
          declined_at: string | null
          deposit_amount_cents: number
          deposit_returned_cents: number
          forwarding_address: string | null
          id: string
          itemized_deductions_received: boolean
          landlord_address: string | null
          landlord_email: string | null
          landlord_name: string
          landlord_phone: string | null
          lease_end_date: string
          lease_start_date: string
          move_out_date: string
          property_address: string
          situation_description: string
          status: Database["public"]["Enums"]["case_status"]
          statutory_deadline: string
          tenant_id: string
          unit_number: string | null
          updated_at: string
          withholding_reason: string | null
        }
        Insert: {
          amount_withheld_cents?: number
          contingency_agreed_at?: string | null
          contingency_pct?: number
          created_at?: string
          current_letter_number?: number
          decline_message?: string | null
          decline_reason?: string | null
          declined_at?: string | null
          deposit_amount_cents: number
          deposit_returned_cents?: number
          forwarding_address?: string | null
          id?: string
          itemized_deductions_received?: boolean
          landlord_address?: string | null
          landlord_email?: string | null
          landlord_name: string
          landlord_phone?: string | null
          lease_end_date: string
          lease_start_date: string
          move_out_date: string
          property_address: string
          situation_description: string
          status?: Database["public"]["Enums"]["case_status"]
          statutory_deadline: string
          tenant_id: string
          unit_number?: string | null
          updated_at?: string
          withholding_reason?: string | null
        }
        Update: {
          amount_withheld_cents?: number
          contingency_agreed_at?: string | null
          contingency_pct?: number
          created_at?: string
          current_letter_number?: number
          decline_message?: string | null
          decline_reason?: string | null
          declined_at?: string | null
          deposit_amount_cents?: number
          deposit_returned_cents?: number
          forwarding_address?: string | null
          id?: string
          itemized_deductions_received?: boolean
          landlord_address?: string | null
          landlord_email?: string | null
          landlord_name?: string
          landlord_phone?: string | null
          lease_end_date?: string
          lease_start_date?: string
          move_out_date?: string
          property_address?: string
          situation_description?: string
          status?: Database["public"]["Enums"]["case_status"]
          statutory_deadline?: string
          tenant_id?: string
          unit_number?: string | null
          updated_at?: string
          withholding_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_admin: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          is_admin?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_admin?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      action_type: "letter_sent" | "letter_dispatched" | "resolution_reported" | "payment_received"
      case_status:
        | "intake_submitted"
        | "under_review"
        | "correspondence_ready"
        | "letter_sent"
        | "awaiting_landlord"
        | "landlord_responded"
        | "resolved"
        | "closed"
        | "declined"
      dispatch_channel: "email" | "sms" | "mail"
      message_type:
        | "tribune_letter"
        | "tribune_update"
        | "landlord_reply"
        | "tenant_response"
        | "tenant_landlord_reply"
        | "system"
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
      action_type: ["letter_sent", "letter_dispatched", "resolution_reported", "payment_received"],
      case_status: [
        "intake_submitted",
        "under_review",
        "correspondence_ready",
        "letter_sent",
        "awaiting_landlord",
        "landlord_responded",
        "resolved",
        "closed",
        "declined",
      ],
      dispatch_channel: ["email", "sms", "mail"],
      message_type: [
        "tribune_letter",
        "tribune_update",
        "landlord_reply",
        "tenant_response",
        "tenant_landlord_reply",
        "system",
      ],
    },
  },
} as const
