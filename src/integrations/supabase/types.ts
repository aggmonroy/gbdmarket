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
      audit_log: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          summary: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          summary?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          summary?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      content_blocks: {
        Row: {
          body: string | null
          created_at: string
          cta_label: string | null
          cta_url: string | null
          display_order: number
          draft_data: Json | null
          has_draft: boolean
          id: string
          image_url: string | null
          is_active: boolean
          key: string
          section: string
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          display_order?: number
          draft_data?: Json | null
          has_draft?: boolean
          id?: string
          image_url?: string | null
          is_active?: boolean
          key: string
          section?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          display_order?: number
          draft_data?: Json | null
          has_draft?: boolean
          id?: string
          image_url?: string | null
          is_active?: boolean
          key?: string
          section?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      embroidery_requests: {
        Row: {
          colors: string | null
          created_at: string
          design_url: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string
          placement: string | null
          quantity: number
          service_type: string
          status: string
        }
        Insert: {
          colors?: string | null
          created_at?: string
          design_url?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone: string
          placement?: string | null
          quantity?: number
          service_type: string
          status?: string
        }
        Update: {
          colors?: string | null
          created_at?: string
          design_url?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          placement?: string | null
          quantity?: number
          service_type?: string
          status?: string
        }
        Relationships: []
      }
      page_events: {
        Row: {
          category_slug: string | null
          created_at: string
          event_type: string
          id: string
          meta: Json | null
          path: string | null
          product_id: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          category_slug?: string | null
          created_at?: string
          event_type: string
          id?: string
          meta?: Json | null
          path?: string | null
          product_id?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          category_slug?: string | null
          created_at?: string
          event_type?: string
          id?: string
          meta?: Json | null
          path?: string | null
          product_id?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          brand: string | null
          category_id: string | null
          code: string | null
          created_at: string
          datasheet_url: string | null
          description: string | null
          draft_data: Json | null
          features: string[] | null
          has_draft: boolean
          id: string
          images: string[]
          is_featured: boolean
          is_published: boolean
          manual_url: string | null
          model: string | null
          name: string
          price_cash: number
          price_financed: number | null
          quote_count: number
          stock: number
          updated_at: string
          views_count: number
        }
        Insert: {
          brand?: string | null
          category_id?: string | null
          code?: string | null
          created_at?: string
          datasheet_url?: string | null
          description?: string | null
          draft_data?: Json | null
          features?: string[] | null
          has_draft?: boolean
          id?: string
          images?: string[]
          is_featured?: boolean
          is_published?: boolean
          manual_url?: string | null
          model?: string | null
          name: string
          price_cash?: number
          price_financed?: number | null
          quote_count?: number
          stock?: number
          updated_at?: string
          views_count?: number
        }
        Update: {
          brand?: string | null
          category_id?: string | null
          code?: string | null
          created_at?: string
          datasheet_url?: string | null
          description?: string | null
          draft_data?: Json | null
          features?: string[] | null
          has_draft?: boolean
          id?: string
          images?: string[]
          is_featured?: boolean
          is_published?: boolean
          manual_url?: string | null
          model?: string | null
          name?: string
          price_cash?: number
          price_financed?: number | null
          quote_count?: number
          stock?: number
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          created_at: string
          description: string | null
          discount_pct: number
          draft_data: Json | null
          ends_at: string | null
          has_draft: boolean
          id: string
          image_url: string | null
          is_active: boolean
          product_ids: string[]
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_pct?: number
          draft_data?: Json | null
          ends_at?: string | null
          has_draft?: boolean
          id?: string
          image_url?: string | null
          is_active?: boolean
          product_ids?: string[]
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_pct?: number
          draft_data?: Json | null
          ends_at?: string | null
          has_draft?: boolean
          id?: string
          image_url?: string | null
          is_active?: boolean
          product_ids?: string[]
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          draft_value: Json | null
          has_draft: boolean
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          draft_value?: Json | null
          has_draft?: boolean
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          draft_value?: Json | null
          has_draft?: boolean
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_leads: {
        Row: {
          channel: string
          created_at: string
          customer_name: string | null
          id: string
          product_id: string | null
          product_name: string | null
          term_months: number | null
          total_price: number | null
        }
        Insert: {
          channel: string
          created_at?: string
          customer_name?: string | null
          id?: string
          product_id?: string | null
          product_name?: string | null
          term_months?: number | null
          total_price?: number | null
        }
        Update: {
          channel?: string
          created_at?: string
          customer_name?: string | null
          id?: string
          product_id?: string | null
          product_name?: string | null
          term_months?: number | null
          total_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_leads_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
