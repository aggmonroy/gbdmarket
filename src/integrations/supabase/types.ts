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
    PostgrestVersion: "14.15"
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
          duracion_segundos: number | null
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
          duracion_segundos?: number | null
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
          duracion_segundos?: number | null
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
      cotizacion_solicitudes: {
        Row: {
          atendida_por: string | null
          cliente: Json
          cotizacion_id: string | null
          created_at: string
          estado: string
          id: string
          items: Json
          notas: string | null
          numero: string
          resultado: Json | null
          tarea_id: string | null
          tipo_cliente: string
          updated_at: string
        }
        Insert: {
          atendida_por?: string | null
          cliente?: Json
          cotizacion_id?: string | null
          created_at?: string
          estado?: string
          id?: string
          items?: Json
          notas?: string | null
          numero: string
          resultado?: Json | null
          tarea_id?: string | null
          tipo_cliente?: string
          updated_at?: string
        }
        Update: {
          atendida_por?: string | null
          cliente?: Json
          cotizacion_id?: string | null
          created_at?: string
          estado?: string
          id?: string
          items?: Json
          notas?: string | null
          numero?: string
          resultado?: Json | null
          tarea_id?: string | null
          tipo_cliente?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cotizacion_solicitudes_atendida_por_fkey"
            columns: ["atendida_por"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizacion_solicitudes_tarea_id_fkey"
            columns: ["tarea_id"]
            isOneToOne: false
            referencedRelation: "tareas"
            referencedColumns: ["id"]
          },
        ]
      }
      cotizaciones: {
        Row: {
          capacidad: Json | null
          cliente: Json | null
          creado_en: string
          id: string
          modo: string
          productos: Json
          tipo_cliente: string
        }
        Insert: {
          capacidad?: Json | null
          cliente?: Json | null
          creado_en?: string
          id?: string
          modo: string
          productos: Json
          tipo_cliente: string
        }
        Update: {
          capacidad?: Json | null
          cliente?: Json | null
          creado_en?: string
          id?: string
          modo?: string
          productos?: Json
          tipo_cliente?: string
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
          policy_accepted: boolean
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
          policy_accepted?: boolean
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
          policy_accepted?: boolean
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
      home_gallery_pool: {
        Row: {
          created_at: string
          cta_url: string
          id: string
          image_url: string
          is_active: boolean
          position: number
          subtitle: string | null
          title: string
        }
        Insert: {
          created_at?: string
          cta_url?: string
          id?: string
          image_url: string
          is_active?: boolean
          position?: number
          subtitle?: string | null
          title: string
        }
        Update: {
          created_at?: string
          cta_url?: string
          id?: string
          image_url?: string
          is_active?: boolean
          position?: number
          subtitle?: string | null
          title?: string
        }
        Relationships: []
      }
      informe_alertas: {
        Row: {
          clave: string
          cliente: string | null
          created_at: string
          detalle: string | null
          estado: string
          id: string
          meses_arrastre: number
          monto: number
          nota: string | null
          periodo: string
          primer_periodo: string
          resuelto_en: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          clave: string
          cliente?: string | null
          created_at?: string
          detalle?: string | null
          estado?: string
          id?: string
          meses_arrastre?: number
          monto?: number
          nota?: string | null
          periodo: string
          primer_periodo: string
          resuelto_en?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          clave?: string
          cliente?: string | null
          created_at?: string
          detalle?: string | null
          estado?: string
          id?: string
          meses_arrastre?: number
          monto?: number
          nota?: string | null
          periodo?: string
          primer_periodo?: string
          resuelto_en?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      informe_archivos: {
        Row: {
          created_at: string
          filename: string | null
          id: string
          periodo: string
          reporte: string
          resumen: Json
        }
        Insert: {
          created_at?: string
          filename?: string | null
          id?: string
          periodo: string
          reporte: string
          resumen?: Json
        }
        Update: {
          created_at?: string
          filename?: string | null
          id?: string
          periodo?: string
          reporte?: string
          resumen?: Json
        }
        Relationships: []
      }
      informe_historicos: {
        Row: {
          created_at: string
          id: string
          metricas: Json
          periodo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metricas?: Json
          periodo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metricas?: Json
          periodo?: string
          updated_at?: string
        }
        Relationships: []
      }
      informe_series: {
        Row: {
          created_at: string
          datos: Json
          id: string
          periodo: string
          serie: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          datos?: Json
          id?: string
          periodo: string
          serie: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          datos?: Json
          id?: string
          periodo?: string
          serie?: string
          updated_at?: string
        }
        Relationships: []
      }
      informes_mensuales: {
        Row: {
          aprobado_en: string | null
          aprobado_por: string | null
          created_at: string
          datos: Json
          estado: string
          explicaciones: Json
          generado_en: string | null
          gestion: Json
          id: string
          layout: Json
          narrativa: Json
          periodo: string
          updated_at: string
          visible_gerente: boolean
        }
        Insert: {
          aprobado_en?: string | null
          aprobado_por?: string | null
          created_at?: string
          datos?: Json
          estado?: string
          explicaciones?: Json
          generado_en?: string | null
          gestion?: Json
          id?: string
          layout?: Json
          narrativa?: Json
          periodo: string
          updated_at?: string
          visible_gerente?: boolean
        }
        Update: {
          aprobado_en?: string | null
          aprobado_por?: string | null
          created_at?: string
          datos?: Json
          estado?: string
          explicaciones?: Json
          generado_en?: string | null
          gestion?: Json
          id?: string
          layout?: Json
          narrativa?: Json
          periodo?: string
          updated_at?: string
          visible_gerente?: boolean
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
          disponibilidad: string
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
          disponibilidad?: string
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
          disponibilidad?: string
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
      promociones_mes: {
        Row: {
          created_at: string
          definido_por: string | null
          id: string
          periodo: string
          product_ids: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          definido_por?: string | null
          id?: string
          periodo: string
          product_ids?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          definido_por?: string | null
          id?: string
          periodo?: string
          product_ids?: string[]
          updated_at?: string
        }
        Relationships: []
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
      tarea_seguimientos: {
        Row: {
          creado_por: string | null
          created_at: string
          fecha: string
          id: string
          tarea_id: string
          texto: string
          via: string
          via_detalle: string | null
        }
        Insert: {
          creado_por?: string | null
          created_at?: string
          fecha?: string
          id?: string
          tarea_id: string
          texto: string
          via: string
          via_detalle?: string | null
        }
        Update: {
          creado_por?: string | null
          created_at?: string
          fecha?: string
          id?: string
          tarea_id?: string
          texto?: string
          via?: string
          via_detalle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tarea_seguimientos_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarea_seguimientos_tarea_id_fkey"
            columns: ["tarea_id"]
            isOneToOne: false
            referencedRelation: "tareas"
            referencedColumns: ["id"]
          },
        ]
      }
      tareas: {
        Row: {
          aceptada_en: string | null
          apoyo_a: string | null
          asignado_a: string | null
          bitacora_id: string | null
          cerrada_en: string | null
          completada_en: string | null
          completada_por: string | null
          creado_por: string | null
          created_at: string
          descripcion: string | null
          documento_url: string | null
          embroidery_request_id: string | null
          estado: string
          fecha: string
          fecha_vencimiento: string | null
          finalizada_apoyo_en: string | null
          finalizada_responsable_en: string | null
          garantia_id: string | null
          id: string
          listo_entrega_en: string | null
          nota_cierre: string | null
          numero_orden: string | null
          origen: string | null
          resultado_cierre: string | null
          tipo: string
          titulo: string
          updated_at: string
          whatsapp_lead_id: string | null
        }
        Insert: {
          aceptada_en?: string | null
          apoyo_a?: string | null
          asignado_a?: string | null
          bitacora_id?: string | null
          cerrada_en?: string | null
          completada_en?: string | null
          completada_por?: string | null
          creado_por?: string | null
          created_at?: string
          descripcion?: string | null
          documento_url?: string | null
          embroidery_request_id?: string | null
          estado?: string
          fecha?: string
          fecha_vencimiento?: string | null
          finalizada_apoyo_en?: string | null
          finalizada_responsable_en?: string | null
          garantia_id?: string | null
          id?: string
          listo_entrega_en?: string | null
          nota_cierre?: string | null
          numero_orden?: string | null
          origen?: string | null
          resultado_cierre?: string | null
          tipo?: string
          titulo: string
          updated_at?: string
          whatsapp_lead_id?: string | null
        }
        Update: {
          aceptada_en?: string | null
          apoyo_a?: string | null
          asignado_a?: string | null
          bitacora_id?: string | null
          cerrada_en?: string | null
          completada_en?: string | null
          completada_por?: string | null
          creado_por?: string | null
          created_at?: string
          descripcion?: string | null
          documento_url?: string | null
          embroidery_request_id?: string | null
          estado?: string
          fecha?: string
          fecha_vencimiento?: string | null
          finalizada_apoyo_en?: string | null
          finalizada_responsable_en?: string | null
          garantia_id?: string | null
          id?: string
          listo_entrega_en?: string | null
          nota_cierre?: string | null
          numero_orden?: string | null
          origen?: string | null
          resultado_cierre?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
          whatsapp_lead_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tareas_apoyo_a_fkey"
            columns: ["apoyo_a"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_asignado_a_fkey"
            columns: ["asignado_a"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_bitacora_id_fkey"
            columns: ["bitacora_id"]
            isOneToOne: false
            referencedRelation: "bitacora"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_completada_por_fkey"
            columns: ["completada_por"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_embroidery_request_id_fkey"
            columns: ["embroidery_request_id"]
            isOneToOne: false
            referencedRelation: "embroidery_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_garantia_id_fkey"
            columns: ["garantia_id"]
            isOneToOne: false
            referencedRelation: "garantias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_whatsapp_lead_id_fkey"
            columns: ["whatsapp_lead_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_leads"
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
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          notes: string | null
          product_id: string | null
          product_name: string | null
          term_months: number | null
          total_price: number | null
        }
        Insert: {
          channel: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          product_name?: string | null
          term_months?: number | null
          total_price?: number | null
        }
        Update: {
          channel?: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          notes?: string | null
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
      crear_tarea_promociones_mes: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      limpiar_cotizaciones_vencidas: { Args: never; Returns: undefined }
      next_numero_cotizacion: { Args: { _fecha: string }; Returns: string }
      next_numero_garantia: { Args: { _fecha: string }; Returns: string }
      next_numero_pedido: { Args: { _fecha: string }; Returns: string }
      next_numero_tarea: {
        Args: { _fecha: string; _prefijo?: string }
        Returns: string
      }
      rotar_galeria_inicio: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user" | "editor" | "viewer"
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
      garantia_via:
        | "Llamada"
        | "WhatsApp"
        | "Correo electrónico"
        | "Personalmente"
        | "A domicilio"
        | "Otro"
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
      app_role: ["admin", "user", "editor", "viewer"],
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
      garantia_via: [
        "Llamada",
        "WhatsApp",
        "Correo electrónico",
        "Personalmente",
        "A domicilio",
        "Otro",
      ],
    },
  },
} as const
