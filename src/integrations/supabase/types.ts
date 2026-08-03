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
      bitacora: {
        Row: {
          categoria: string | null
          cliente_email: string | null
          cliente_nombre: string
          cliente_telefono: string | null
          consent_accepted_at: string
          created_at: string
          descripcion: string | null
          estado: Database["public"]["Enums"]["bitacora_estado"]
          fecha_entrega: string | null
          id: string
          meta: Json
          numero_pedido: string | null
          observaciones: string | null
          origen: Database["public"]["Enums"]["bitacora_origen"]
          producto_servicio: string | null
          updated_at: string
        }
        Insert: {
          categoria?: string | null
          cliente_email?: string | null
          cliente_nombre: string
          cliente_telefono?: string | null
          consent_accepted_at?: string
          created_at?: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["bitacora_estado"]
          fecha_entrega?: string | null
          id?: string
          meta?: Json
          numero_pedido?: string | null
          observaciones?: string | null
          origen: Database["public"]["Enums"]["bitacora_origen"]
          producto_servicio?: string | null
          updated_at?: string
        }
        Update: {
          categoria?: string | null
          cliente_email?: string | null
          cliente_nombre?: string
          cliente_telefono?: string | null
          consent_accepted_at?: string
          created_at?: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["bitacora_estado"]
          fecha_entrega?: string | null
          id?: string
          meta?: Json
          numero_pedido?: string | null
          observaciones?: string | null
          origen?: Database["public"]["Enums"]["bitacora_origen"]
          producto_servicio?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bitacora_historial: {
        Row: {
          bitacora_id: string
          created_at: string
          estado_anterior: Database["public"]["Enums"]["bitacora_estado"] | null
          estado_nuevo: Database["public"]["Enums"]["bitacora_estado"]
          id: string
          nota: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          bitacora_id: string
          created_at?: string
          estado_anterior?:
            | Database["public"]["Enums"]["bitacora_estado"]
            | null
          estado_nuevo: Database["public"]["Enums"]["bitacora_estado"]
          id?: string
          nota?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          bitacora_id?: string
          created_at?: string
          estado_anterior?:
            | Database["public"]["Enums"]["bitacora_estado"]
            | null
          estado_nuevo?: Database["public"]["Enums"]["bitacora_estado"]
          id?: string
          nota?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bitacora_historial_bitacora_id_fkey"
            columns: ["bitacora_id"]
            isOneToOne: false
            referencedRelation: "bitacora"
            referencedColumns: ["id"]
          },
        ]
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
      colaborador_pin_solicitudes: {
        Row: {
          colaborador_id: string
          estado: string
          id: string
          nuevo_pin_hash: string
          nuevo_pin_salt: string
          resuelto_en: string | null
          resuelto_por: string | null
          solicitado_en: string
        }
        Insert: {
          colaborador_id: string
          estado?: string
          id?: string
          nuevo_pin_hash: string
          nuevo_pin_salt: string
          resuelto_en?: string | null
          resuelto_por?: string | null
          solicitado_en?: string
        }
        Update: {
          colaborador_id?: string
          estado?: string
          id?: string
          nuevo_pin_hash?: string
          nuevo_pin_salt?: string
          resuelto_en?: string | null
          resuelto_por?: string | null
          solicitado_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "colaborador_pin_solicitudes_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      colaboradores: {
        Row: {
          activo: boolean
          cedula: string | null
          created_at: string
          deleted_at: string | null
          id: string
          nombre: string
          pin_bloqueado: boolean
          pin_hash: string | null
          pin_salt: string | null
          rol: Database["public"]["Enums"]["colaborador_rol"]
          updated_at: string
        }
        Insert: {
          activo?: boolean
          cedula?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          nombre: string
          pin_bloqueado?: boolean
          pin_hash?: string | null
          pin_salt?: string | null
          rol?: Database["public"]["Enums"]["colaborador_rol"]
          updated_at?: string
        }
        Update: {
          activo?: boolean
          cedula?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          nombre?: string
          pin_bloqueado?: boolean
          pin_hash?: string | null
          pin_salt?: string | null
          rol?: Database["public"]["Enums"]["colaborador_rol"]
          updated_at?: string
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
      embroidery_services: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      garantia_cierre_solicitud: {
        Row: {
          estado: string
          garantia_id: string
          id: string
          nota_final: string | null
          numero_documento_subsanacion: string | null
          resuelto_en: string | null
          resuelto_por: string | null
          solicitado_en: string
          solicitado_por: string | null
          tipo_propuesto: Database["public"]["Enums"]["garantia_estado"]
        }
        Insert: {
          estado?: string
          garantia_id: string
          id?: string
          nota_final?: string | null
          numero_documento_subsanacion?: string | null
          resuelto_en?: string | null
          resuelto_por?: string | null
          solicitado_en?: string
          solicitado_por?: string | null
          tipo_propuesto: Database["public"]["Enums"]["garantia_estado"]
        }
        Update: {
          estado?: string
          garantia_id?: string
          id?: string
          nota_final?: string | null
          numero_documento_subsanacion?: string | null
          resuelto_en?: string | null
          resuelto_por?: string | null
          solicitado_en?: string
          solicitado_por?: string | null
          tipo_propuesto?: Database["public"]["Enums"]["garantia_estado"]
        }
        Relationships: [
          {
            foreignKeyName: "garantia_cierre_solicitud_garantia_id_fkey"
            columns: ["garantia_id"]
            isOneToOne: false
            referencedRelation: "garantias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garantia_cierre_solicitud_resuelto_por_fkey"
            columns: ["resuelto_por"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garantia_cierre_solicitud_solicitado_por_fkey"
            columns: ["solicitado_por"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      garantia_evidencias: {
        Row: {
          garantia_id: string
          id: string
          subido_en: string
          subido_por: string | null
          url_imagen: string
        }
        Insert: {
          garantia_id: string
          id?: string
          subido_en?: string
          subido_por?: string | null
          url_imagen: string
        }
        Update: {
          garantia_id?: string
          id?: string
          subido_en?: string
          subido_por?: string | null
          url_imagen?: string
        }
        Relationships: [
          {
            foreignKeyName: "garantia_evidencias_garantia_id_fkey"
            columns: ["garantia_id"]
            isOneToOne: false
            referencedRelation: "garantias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garantia_evidencias_subido_por_fkey"
            columns: ["subido_por"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      garantia_seguimientos: {
        Row: {
          creado_en: string
          creado_por: string | null
          fecha: string
          garantia_id: string
          id: string
          texto: string
          via: Database["public"]["Enums"]["garantia_via"]
        }
        Insert: {
          creado_en?: string
          creado_por?: string | null
          fecha?: string
          garantia_id: string
          id?: string
          texto: string
          via: Database["public"]["Enums"]["garantia_via"]
        }
        Update: {
          creado_en?: string
          creado_por?: string | null
          fecha?: string
          garantia_id?: string
          id?: string
          texto?: string
          via?: Database["public"]["Enums"]["garantia_via"]
        }
        Relationships: [
          {
            foreignKeyName: "garantia_seguimientos_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garantia_seguimientos_garantia_id_fkey"
            columns: ["garantia_id"]
            isOneToOne: false
            referencedRelation: "garantias"
            referencedColumns: ["id"]
          },
        ]
      }
      garantias: {
        Row: {
          accion_realizada: string | null
          cedula_cliente: string | null
          cliente: string
          creado_en: string
          dentro_15_dias: boolean
          descripcion_articulo: string | null
          direccion_cliente: string | null
          estado: Database["public"]["Enums"]["garantia_estado"]
          fecha: string
          fecha_cierre: string | null
          fecha_facturacion: string | null
          id: string
          modelo_codigo: string | null
          no_mal_uso: boolean
          numero_factura: string | null
          numero_garantia: string
          tarea_vinculada_id: string | null
          telefono_cliente: string | null
          tramitado_por: string
          updated_at: string
        }
        Insert: {
          accion_realizada?: string | null
          cedula_cliente?: string | null
          cliente: string
          creado_en?: string
          dentro_15_dias?: boolean
          descripcion_articulo?: string | null
          direccion_cliente?: string | null
          estado?: Database["public"]["Enums"]["garantia_estado"]
          fecha?: string
          fecha_cierre?: string | null
          fecha_facturacion?: string | null
          id?: string
          modelo_codigo?: string | null
          no_mal_uso?: boolean
          numero_factura?: string | null
          numero_garantia: string
          tarea_vinculada_id?: string | null
          telefono_cliente?: string | null
          tramitado_por: string
          updated_at?: string
        }
        Update: {
          accion_realizada?: string | null
          cedula_cliente?: string | null
          cliente?: string
          creado_en?: string
          dentro_15_dias?: boolean
          descripcion_articulo?: string | null
          direccion_cliente?: string | null
          estado?: Database["public"]["Enums"]["garantia_estado"]
          fecha?: string
          fecha_cierre?: string | null
          fecha_facturacion?: string | null
          id?: string
          modelo_codigo?: string | null
          no_mal_uso?: boolean
          numero_factura?: string | null
          numero_garantia?: string
          tarea_vinculada_id?: string | null
          telefono_cliente?: string | null
          tramitado_por?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "garantias_tarea_fk"
            columns: ["tarea_vinculada_id"]
            isOneToOne: false
            referencedRelation: "tareas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garantias_tramitado_por_fkey"
            columns: ["tramitado_por"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
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
      security_scans: {
        Row: {
          created_at: string
          critical_count: number
          findings: Json
          high_count: number
          id: string
          scanned_at: string
          source: string
          total_packages: number
        }
        Insert: {
          created_at?: string
          critical_count?: number
          findings?: Json
          high_count?: number
          id?: string
          scanned_at?: string
          source?: string
          total_packages?: number
        }
        Update: {
          created_at?: string
          critical_count?: number
          findings?: Json
          high_count?: number
          id?: string
          scanned_at?: string
          source?: string
          total_packages?: number
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
      tareas: {
        Row: {
          asignado_a: string | null
          completada_en: string | null
          created_at: string
          descripcion: string | null
          estado: string
          fecha_vencimiento: string | null
          garantia_id: string | null
          id: string
          titulo: string
        }
        Insert: {
          asignado_a?: string | null
          completada_en?: string | null
          created_at?: string
          descripcion?: string | null
          estado?: string
          fecha_vencimiento?: string | null
          garantia_id?: string | null
          id?: string
          titulo: string
        }
        Update: {
          asignado_a?: string | null
          completada_en?: string | null
          created_at?: string
          descripcion?: string | null
          estado?: string
          fecha_vencimiento?: string | null
          garantia_id?: string | null
          id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "tareas_asignado_a_fkey"
            columns: ["asignado_a"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_garantia_id_fkey"
            columns: ["garantia_id"]
            isOneToOne: false
            referencedRelation: "garantias"
            referencedColumns: ["id"]
          },
        ]
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
      next_numero_garantia: { Args: { _fecha: string }; Returns: string }
      next_numero_pedido: { Args: { _fecha: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "user"
      bitacora_estado:
        | "pendiente"
        | "cotizado"
        | "en_proceso"
        | "produccion"
        | "listo"
        | "entregado"
        | "garantia"
        | "cancelado"
        | "pre_orden"
        | "notificado"
        | "cerrado"
      bitacora_origen:
        | "catalogo"
        | "financiamiento"
        | "garantia"
        | "contacto"
        | "bordados"
        | "whatsapp"
      colaborador_rol: "colaborador" | "admin" | "gerente"
      garantia_estado:
        | "proceso"
        | "revision"
        | "cerrada_cliente_credito"
        | "cerrada_proveedor_cliente"
      garantia_via: "Llamada" | "WhatsApp" | "Correo electrónico"
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
      bitacora_estado: [
        "pendiente",
        "cotizado",
        "en_proceso",
        "produccion",
        "listo",
        "entregado",
        "garantia",
        "cancelado",
        "pre_orden",
        "notificado",
        "cerrado",
      ],
      bitacora_origen: [
        "catalogo",
        "financiamiento",
        "garantia",
        "contacto",
        "bordados",
        "whatsapp",
      ],
      colaborador_rol: ["colaborador", "admin", "gerente"],
      garantia_estado: [
        "proceso",
        "revision",
        "cerrada_cliente_credito",
        "cerrada_proveedor_cliente",
      ],
      garantia_via: ["Llamada", "WhatsApp", "Correo electrónico"],
    },
  },
} as const
