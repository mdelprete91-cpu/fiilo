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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      buttons: {
        Row: {
          color: string | null
          created_at: string
          finish: string | null
          id: string
          image_url: string | null
          is_available: boolean
          material: Database["public"]["Enums"]["button_material"]
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          finish?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          material?: Database["public"]["Enums"]["button_material"]
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          finish?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          material?: Database["public"]["Enums"]["button_material"]
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buttons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      client_measurements: {
        Row: {
          ankle: number | null
          back_length: number | null
          calf: number | null
          chest: number | null
          client_id: string
          created_at: string
          crotch: number | null
          height: number | null
          hips: number | null
          id: string
          inseam: number | null
          knee: number | null
          neck: number | null
          outseam: number | null
          posture_notes: string | null
          shoulders: number | null
          sleeve_length: number | null
          taken_at: string
          taken_by: string
          tenant_id: string
          thigh: number | null
          waist: number | null
          weight: number | null
          wrist: number | null
        }
        Insert: {
          ankle?: number | null
          back_length?: number | null
          calf?: number | null
          chest?: number | null
          client_id: string
          created_at?: string
          crotch?: number | null
          height?: number | null
          hips?: number | null
          id?: string
          inseam?: number | null
          knee?: number | null
          neck?: number | null
          outseam?: number | null
          posture_notes?: string | null
          shoulders?: number | null
          sleeve_length?: number | null
          taken_at?: string
          taken_by: string
          tenant_id: string
          thigh?: number | null
          waist?: number | null
          weight?: number | null
          wrist?: number | null
        }
        Update: {
          ankle?: number | null
          back_length?: number | null
          calf?: number | null
          chest?: number | null
          client_id?: string
          created_at?: string
          crotch?: number | null
          height?: number | null
          hips?: number | null
          id?: string
          inseam?: number | null
          knee?: number | null
          neck?: number | null
          outseam?: number | null
          posture_notes?: string | null
          shoulders?: number | null
          sleeve_length?: number | null
          taken_at?: string
          taken_by?: string
          tenant_id?: string
          thigh?: number | null
          waist?: number | null
          weight?: number | null
          wrist?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "client_measurements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_measurements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      client_summaries: {
        Row: {
          client_id: string
          cost_cents: number | null
          generated_at: string
          generated_by: string | null
          id: string
          last_message_sent_at: string | null
          model: string
          source_message_count: number
          summary_json: Json
          summary_text: string | null
          tenant_id: string
          tokens_in: number | null
          tokens_out: number | null
        }
        Insert: {
          client_id: string
          cost_cents?: number | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          last_message_sent_at?: string | null
          model: string
          source_message_count?: number
          summary_json: Json
          summary_text?: string | null
          tenant_id: string
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Update: {
          client_id?: string
          cost_cents?: number | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          last_message_sent_at?: string | null
          model?: string
          source_message_count?: number
          summary_json?: Json
          summary_text?: string | null
          tenant_id?: string
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "client_summaries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_summaries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          first_name: string
          id: string
          language: string | null
          last_marketing_sent_at: string | null
          last_name: string
          marketing_optout: boolean | null
          marketing_optout_at: string | null
          notes: string | null
          phone: string | null
          photo_url: string | null
          seed_batch: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          id?: string
          language?: string | null
          last_marketing_sent_at?: string | null
          last_name: string
          marketing_optout?: boolean | null
          marketing_optout_at?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          seed_batch?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          id?: string
          language?: string | null
          last_marketing_sent_at?: string | null
          last_name?: string
          marketing_optout?: boolean | null
          marketing_optout_at?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          seed_batch?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          audience_filter: Json | null
          body_html: string | null
          created_at: string
          id: string
          scheduled_at: string | null
          status: Database["public"]["Enums"]["email_campaign_status"]
          subject: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          audience_filter?: Json | null
          body_html?: string | null
          created_at?: string
          id?: string
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["email_campaign_status"]
          subject: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          audience_filter?: Json | null
          body_html?: string | null
          created_at?: string
          id?: string
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["email_campaign_status"]
          subject?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_events: {
        Row: {
          campaign_id: string
          client_id: string | null
          created_at: string
          event_type: Database["public"]["Enums"]["email_event_type"]
          id: string
          metadata: Json | null
        }
        Insert: {
          campaign_id: string
          client_id?: string | null
          created_at?: string
          event_type: Database["public"]["Enums"]["email_event_type"]
          id?: string
          metadata?: Json | null
        }
        Update: {
          campaign_id?: string
          client_id?: string | null
          created_at?: string
          event_type?: Database["public"]["Enums"]["email_event_type"]
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "email_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      fabric_announcements: {
        Row: {
          client_id: string
          created_at: string
          error: string | null
          fabric_id: string
          id: string
          match_reason: string | null
          match_score: number | null
          message_body: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["announcement_status"]
          tenant_id: string
          wa_message_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          error?: string | null
          fabric_id: string
          id?: string
          match_reason?: string | null
          match_score?: number | null
          message_body?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["announcement_status"]
          tenant_id: string
          wa_message_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          error?: string | null
          fabric_id?: string
          id?: string
          match_reason?: string | null
          match_score?: number | null
          message_body?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["announcement_status"]
          tenant_id?: string
          wa_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fabric_announcements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fabric_announcements_fabric_id_fkey"
            columns: ["fabric_id"]
            isOneToOne: false
            referencedRelation: "fabrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fabric_announcements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fabrics: {
        Row: {
          code: string | null
          color: string | null
          composition: string | null
          created_at: string
          currency: string
          external_url: string | null
          id: string
          image_url: string | null
          is_available: boolean
          mill: string | null
          name: string
          pattern: Database["public"]["Enums"]["fabric_pattern"] | null
          price_per_meter: number | null
          season: Database["public"]["Enums"]["fabric_season"] | null
          tenant_id: string
          updated_at: string
          weight_grams: number | null
        }
        Insert: {
          code?: string | null
          color?: string | null
          composition?: string | null
          created_at?: string
          currency?: string
          external_url?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          mill?: string | null
          name: string
          pattern?: Database["public"]["Enums"]["fabric_pattern"] | null
          price_per_meter?: number | null
          season?: Database["public"]["Enums"]["fabric_season"] | null
          tenant_id: string
          updated_at?: string
          weight_grams?: number | null
        }
        Update: {
          code?: string | null
          color?: string | null
          composition?: string | null
          created_at?: string
          currency?: string
          external_url?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          mill?: string | null
          name?: string
          pattern?: Database["public"]["Enums"]["fabric_pattern"] | null
          price_per_meter?: number | null
          season?: Database["public"]["Enums"]["fabric_season"] | null
          tenant_id?: string
          updated_at?: string
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fabrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      garment_attachments: {
        Row: {
          created_at: string
          garment_id: string
          id: string
          label: string | null
          tenant_id: string
          type: Database["public"]["Enums"]["attachment_type"]
          url: string
        }
        Insert: {
          created_at?: string
          garment_id: string
          id?: string
          label?: string | null
          tenant_id: string
          type?: Database["public"]["Enums"]["attachment_type"]
          url: string
        }
        Update: {
          created_at?: string
          garment_id?: string
          id?: string
          label?: string | null
          tenant_id?: string
          type?: Database["public"]["Enums"]["attachment_type"]
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "garment_attachments_garment_id_fkey"
            columns: ["garment_id"]
            isOneToOne: false
            referencedRelation: "garments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garment_attachments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      garment_configurations: {
        Row: {
          configuration: Json
          created_at: string
          garment_id: string
          id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          configuration?: Json
          created_at?: string
          garment_id: string
          id?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          configuration?: Json
          created_at?: string
          garment_id?: string
          id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "garment_configurations_garment_id_fkey"
            columns: ["garment_id"]
            isOneToOne: true
            referencedRelation: "garments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garment_configurations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      garments: {
        Row: {
          assigned_to: string | null
          client_id: string
          configuration: Json
          confirmed_measurement_id: string | null
          created_at: string
          currency: string
          current_step: string
          delivery_eta: string | null
          deposit_amount: number | null
          id: string
          internal_notes: string | null
          name: string | null
          needs_materials: boolean
          payment_mode: string | null
          payment_status: string
          seed_batch: string | null
          status: Database["public"]["Enums"]["garment_status"]
          tenant_id: string
          total_price: number | null
          type: Database["public"]["Enums"]["garment_type"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          client_id: string
          configuration?: Json
          confirmed_measurement_id?: string | null
          created_at?: string
          currency?: string
          current_step?: string
          delivery_eta?: string | null
          deposit_amount?: number | null
          id?: string
          internal_notes?: string | null
          name?: string | null
          needs_materials?: boolean
          payment_mode?: string | null
          payment_status?: string
          seed_batch?: string | null
          status?: Database["public"]["Enums"]["garment_status"]
          tenant_id: string
          total_price?: number | null
          type: Database["public"]["Enums"]["garment_type"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          client_id?: string
          configuration?: Json
          confirmed_measurement_id?: string | null
          created_at?: string
          currency?: string
          current_step?: string
          delivery_eta?: string | null
          deposit_amount?: number | null
          id?: string
          internal_notes?: string | null
          name?: string | null
          needs_materials?: boolean
          payment_mode?: string | null
          payment_status?: string
          seed_batch?: string | null
          status?: Database["public"]["Enums"]["garment_status"]
          tenant_id?: string
          total_price?: number | null
          type?: Database["public"]["Enums"]["garment_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "garments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garments_confirmed_measurement_id_fkey"
            columns: ["confirmed_measurement_id"]
            isOneToOne: false
            referencedRelation: "client_measurements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      linings: {
        Row: {
          color: string | null
          created_at: string
          id: string
          image_url: string | null
          is_available: boolean
          material: string | null
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_available?: boolean
          material?: string | null
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_available?: boolean
          material?: string | null
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "linings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_campaigns: {
        Row: {
          ai_cost_cents: number
          ai_model: string | null
          ai_system_prompt: string | null
          created_at: string
          created_by: string | null
          featured_fabric_id: string | null
          id: string
          occasion: Database["public"]["Enums"]["newsletter_occasion"]
          recipients_count: number
          scheduled_at: string | null
          sent_at: string | null
          sent_count: number
          status: Database["public"]["Enums"]["newsletter_status"]
          template_body_md: string | null
          template_id: string | null
          template_subject: string | null
          tenant_id: string
          title: string
          use_ai: boolean
        }
        Insert: {
          ai_cost_cents?: number
          ai_model?: string | null
          ai_system_prompt?: string | null
          created_at?: string
          created_by?: string | null
          featured_fabric_id?: string | null
          id?: string
          occasion: Database["public"]["Enums"]["newsletter_occasion"]
          recipients_count?: number
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number
          status?: Database["public"]["Enums"]["newsletter_status"]
          template_body_md?: string | null
          template_id?: string | null
          template_subject?: string | null
          tenant_id: string
          title: string
          use_ai?: boolean
        }
        Update: {
          ai_cost_cents?: number
          ai_model?: string | null
          ai_system_prompt?: string | null
          created_at?: string
          created_by?: string | null
          featured_fabric_id?: string | null
          id?: string
          occasion?: Database["public"]["Enums"]["newsletter_occasion"]
          recipients_count?: number
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number
          status?: Database["public"]["Enums"]["newsletter_status"]
          template_body_md?: string | null
          template_id?: string | null
          template_subject?: string | null
          tenant_id?: string
          title?: string
          use_ai?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_campaigns_featured_fabric_id_fkey"
            columns: ["featured_fabric_id"]
            isOneToOne: false
            referencedRelation: "fabrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "newsletter_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_preferences: {
        Row: {
          client_id: string
          created_at: string
          email_opted_in: boolean
          last_sent_at: string | null
          tenant_id: string
          unsubscribe_token: string
          unsubscribed_at: string | null
          whatsapp_opted_in: boolean
        }
        Insert: {
          client_id: string
          created_at?: string
          email_opted_in?: boolean
          last_sent_at?: string | null
          tenant_id: string
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          whatsapp_opted_in?: boolean
        }
        Update: {
          client_id?: string
          created_at?: string
          email_opted_in?: boolean
          last_sent_at?: string | null
          tenant_id?: string
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          whatsapp_opted_in?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_preferences_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_preferences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_recipients: {
        Row: {
          campaign_id: string
          channel: string
          client_id: string
          error_message: string | null
          id: string
          personalization_json: Json | null
          rendered_body: string | null
          rendered_subject: string | null
          resend_message_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["recipient_status"]
          tenant_id: string
          wa_message_id: string | null
        }
        Insert: {
          campaign_id: string
          channel: string
          client_id: string
          error_message?: string | null
          id?: string
          personalization_json?: Json | null
          rendered_body?: string | null
          rendered_subject?: string | null
          resend_message_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["recipient_status"]
          tenant_id: string
          wa_message_id?: string | null
        }
        Update: {
          campaign_id?: string
          channel?: string
          client_id?: string
          error_message?: string | null
          id?: string
          personalization_json?: Json | null
          rendered_body?: string | null
          rendered_subject?: string | null
          resend_message_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["recipient_status"]
          tenant_id?: string
          wa_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "newsletter_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_recipients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_recipients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_templates: {
        Row: {
          chiusura_template: string
          created_at: string
          cta_label: string | null
          cta_url_template: string | null
          description: string | null
          gancio_template: string
          id: string
          incipit_template: string
          is_system: boolean
          name: string
          occasion: Database["public"]["Enums"]["newsletter_occasion"]
          slug: string
          sort_order: number
          subject_template: string
          tenant_id: string | null
        }
        Insert: {
          chiusura_template: string
          created_at?: string
          cta_label?: string | null
          cta_url_template?: string | null
          description?: string | null
          gancio_template: string
          id?: string
          incipit_template: string
          is_system?: boolean
          name: string
          occasion: Database["public"]["Enums"]["newsletter_occasion"]
          slug: string
          sort_order?: number
          subject_template: string
          tenant_id?: string | null
        }
        Update: {
          chiusura_template?: string
          created_at?: string
          cta_label?: string | null
          cta_url_template?: string | null
          description?: string | null
          gancio_template?: string
          id?: string
          incipit_template?: string
          is_system?: boolean
          name?: string
          occasion?: Database["public"]["Enums"]["newsletter_occasion"]
          slug?: string
          sort_order?: number
          subject_template?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          preferred_language: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          preferred_language?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          preferred_language?: string
          updated_at?: string
        }
        Relationships: []
      }
      tenant_marketing_settings: {
        Row: {
          cap_reset_at: string
          created_at: string
          current_month_sent: number
          marketing_enabled: boolean
          monthly_cap: number
          tenant_id: string
        }
        Insert: {
          cap_reset_at?: string
          created_at?: string
          current_month_sent?: number
          marketing_enabled?: boolean
          monthly_cap?: number
          tenant_id: string
        }
        Update: {
          cap_reset_at?: string
          created_at?: string
          current_month_sent?: number
          marketing_enabled?: boolean
          monthly_cap?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_marketing_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: string | null
          brand_color: string | null
          city: string | null
          country: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          last_active_at: string | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          phone: string | null
          plan: Database["public"]["Enums"]["tenant_plan"]
          seed_batch: string | null
          slug: string
          updated_at: string
          whatsapp_phone_number_id: string | null
          website_url: string | null
        }
        Insert: {
          address?: string | null
          brand_color?: string | null
          city?: string | null
          country?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          last_active_at?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["tenant_plan"]
          seed_batch?: string | null
          slug: string
          updated_at?: string
          whatsapp_phone_number_id?: string | null
          website_url?: string | null
        }
        Update: {
          address?: string | null
          brand_color?: string | null
          city?: string | null
          country?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          last_active_at?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["tenant_plan"]
          seed_batch?: string | null
          slug?: string
          updated_at?: string
          whatsapp_phone_number_id?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      thread_colors: {
        Row: {
          created_at: string
          hex_color: string
          id: string
          is_available: boolean
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hex_color: string
          id?: string
          is_available?: boolean
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hex_color?: string
          id?: string
          is_available?: boolean
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_colors_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tenant_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["tenant_role"]
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tenant_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_integrations: {
        Row: {
          access_token_encrypted: string
          business_id: string | null
          connected_at: string | null
          connected_by_user_id: string | null
          created_at: string
          display_phone_number: string | null
          id: string
          last_error: string | null
          phone_number_id: string
          status: string
          tenant_id: string
          token_expires_at: string | null
          token_type: string | null
          updated_at: string
          verified_name: string | null
          waba_id: string
        }
        Insert: {
          access_token_encrypted: string
          business_id?: string | null
          connected_at?: string | null
          connected_by_user_id?: string | null
          created_at?: string
          display_phone_number?: string | null
          id?: string
          last_error?: string | null
          phone_number_id: string
          status?: string
          tenant_id: string
          token_expires_at?: string | null
          token_type?: string | null
          updated_at?: string
          verified_name?: string | null
          waba_id: string
        }
        Update: {
          access_token_encrypted?: string
          business_id?: string | null
          connected_at?: string | null
          connected_by_user_id?: string | null
          created_at?: string
          display_phone_number?: string | null
          id?: string
          last_error?: string | null
          phone_number_id?: string
          status?: string
          tenant_id?: string
          token_expires_at?: string | null
          token_type?: string | null
          updated_at?: string
          verified_name?: string | null
          waba_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_integrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_message_templates: {
        Row: {
          approved_at: string | null
          body_text: string
          category: string
          created_at: string
          header_type: string | null
          id: string
          language: string
          meta_template_id: string | null
          name: string
          status: string
          tenant_id: string
          variable_count: number
        }
        Insert: {
          approved_at?: string | null
          body_text: string
          category: string
          created_at?: string
          header_type?: string | null
          id?: string
          language: string
          meta_template_id?: string | null
          name: string
          status?: string
          tenant_id: string
          variable_count?: number
        }
        Update: {
          approved_at?: string | null
          body_text?: string
          category?: string
          created_at?: string
          header_type?: string | null
          id?: string
          language?: string
          meta_template_id?: string | null
          name?: string
          status?: string
          tenant_id?: string
          variable_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_message_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          ai_processed: boolean
          body: string | null
          category: Database["public"]["Enums"]["whatsapp_category"]
          category_summary: string | null
          client_id: string | null
          created_at: string
          detected_language: string | null
          from_name: string | null
          from_phone: string
          id: string
          is_read: boolean
          media_mime_type: string | null
          media_url: string | null
          message_type: Database["public"]["Enums"]["whatsapp_msg_type"]
          photo_analysis: Json | null
          seed_batch: string | null
          sent_at: string
          tenant_id: string
          transcript_confidence: number | null
          wa_message_id: string
          wa_phone_number_id: string
        }
        Insert: {
          ai_processed?: boolean
          body?: string | null
          category?: Database["public"]["Enums"]["whatsapp_category"]
          category_summary?: string | null
          client_id?: string | null
          created_at?: string
          detected_language?: string | null
          from_name?: string | null
          from_phone: string
          id?: string
          is_read?: boolean
          media_mime_type?: string | null
          media_url?: string | null
          message_type?: Database["public"]["Enums"]["whatsapp_msg_type"]
          photo_analysis?: Json | null
          seed_batch?: string | null
          sent_at: string
          tenant_id: string
          transcript_confidence?: number | null
          wa_message_id: string
          wa_phone_number_id: string
        }
        Update: {
          ai_processed?: boolean
          body?: string | null
          category?: Database["public"]["Enums"]["whatsapp_category"]
          category_summary?: string | null
          client_id?: string | null
          created_at?: string
          detected_language?: string | null
          from_name?: string | null
          from_phone?: string
          id?: string
          is_read?: boolean
          media_mime_type?: string | null
          media_url?: string | null
          message_type?: Database["public"]["Enums"]["whatsapp_msg_type"]
          photo_analysis?: Json | null
          seed_batch?: string | null
          sent_at?: string
          tenant_id?: string
          transcript_confidence?: number | null
          wa_message_id?: string
          wa_phone_number_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_wa_token: {
        Args: { p_integration_id: string; p_key: string }
        Returns: string
      }
      is_platform_owner: { Args: never; Returns: boolean }
      is_tenant_admin: { Args: { p_tenant_id: string }; Returns: boolean }
      is_tenant_member: { Args: { p_tenant_id: string }; Returns: boolean }
      my_tenant_id: { Args: never; Returns: string }
      set_wa_token: {
        Args: { p_integration_id: string; p_key: string; p_plaintext: string }
        Returns: undefined
      }
    }
    Enums: {
      announcement_status:
        | "pending_review"
        | "approved"
        | "sent"
        | "failed"
        | "skipped"
      attachment_type: "photo" | "inspiration" | "sketch" | "leaflet"
      button_material:
        | "horn"
        | "corozo"
        | "mother_of_pearl"
        | "plastic"
        | "metal"
      email_campaign_status: "draft" | "scheduled" | "sent" | "cancelled"
      email_event_type:
        | "sent"
        | "delivered"
        | "opened"
        | "clicked"
        | "bounced"
        | "unsubscribed"
      fabric_pattern:
        | "solid"
        | "striped"
        | "checked"
        | "herringbone"
        | "houndstooth"
        | "plaid"
        | "windowpane"
        | "paisley"
        | "other"
      fabric_season: "spring_summer" | "autumn_winter" | "all_season"
      garment_status:
        | "draft"
        | "confirmed"
        | "in_production"
        | "ready"
        | "delivered"
        | "cancelled"
      garment_type:
        | "suit_2pc"
        | "suit_3pc"
        | "jacket"
        | "trousers"
        | "waistcoat"
        | "coat"
        | "tuxedo"
        | "shirt"
      newsletter_occasion: "new_fabric" | "seasonal" | "event" | "custom"
      newsletter_status: "draft" | "approved" | "sending" | "sent" | "cancelled"
      recipient_status:
        | "pending"
        | "sent"
        | "delivered"
        | "opened"
        | "clicked"
        | "failed"
        | "unsubscribed"
      tenant_plan: "starter" | "professional" | "enterprise"
      tenant_role:
        | "platform_owner"
        | "tenant_admin"
        | "tenant_staff"
        | "customer"
      whatsapp_category:
        | "misura"
        | "ispirazione"
        | "riferimento_dettaglio"
        | "richiesta"
        | "approvazione"
        | "altro"
      whatsapp_msg_type:
        | "text"
        | "image"
        | "audio"
        | "document"
        | "video"
        | "sticker"
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
      announcement_status: [
        "pending_review",
        "approved",
        "sent",
        "failed",
        "skipped",
      ],
      attachment_type: ["photo", "inspiration", "sketch", "leaflet"],
      button_material: [
        "horn",
        "corozo",
        "mother_of_pearl",
        "plastic",
        "metal",
      ],
      email_campaign_status: ["draft", "scheduled", "sent", "cancelled"],
      email_event_type: [
        "sent",
        "delivered",
        "opened",
        "clicked",
        "bounced",
        "unsubscribed",
      ],
      fabric_pattern: [
        "solid",
        "striped",
        "checked",
        "herringbone",
        "houndstooth",
        "plaid",
        "windowpane",
        "paisley",
        "other",
      ],
      fabric_season: ["spring_summer", "autumn_winter", "all_season"],
      garment_status: [
        "draft",
        "confirmed",
        "in_production",
        "ready",
        "delivered",
        "cancelled",
      ],
      garment_type: [
        "suit_2pc",
        "suit_3pc",
        "jacket",
        "trousers",
        "waistcoat",
        "coat",
        "tuxedo",
        "shirt",
      ],
      newsletter_occasion: ["new_fabric", "seasonal", "event", "custom"],
      newsletter_status: ["draft", "approved", "sending", "sent", "cancelled"],
      recipient_status: [
        "pending",
        "sent",
        "delivered",
        "opened",
        "clicked",
        "failed",
        "unsubscribed",
      ],
      tenant_plan: ["starter", "professional", "enterprise"],
      tenant_role: [
        "platform_owner",
        "tenant_admin",
        "tenant_staff",
        "customer",
      ],
      whatsapp_category: [
        "misura",
        "ispirazione",
        "riferimento_dettaglio",
        "richiesta",
        "approvazione",
        "altro",
      ],
      whatsapp_msg_type: [
        "text",
        "image",
        "audio",
        "document",
        "video",
        "sticker",
      ],
    },
  },
} as const

// ── Row alias di convenienza usati nel codebase ──────────────
export type Tenant = Database['public']['Tables']['tenants']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type ClientMeasurement = Database['public']['Tables']['client_measurements']['Row']
export type Garment = Database['public']['Tables']['garments']['Row']
export type Fabric = Database['public']['Tables']['fabrics']['Row']
export type Lining = Database['public']['Tables']['linings']['Row']
export type Button = Database['public']['Tables']['buttons']['Row']
export type ThreadColor = Database['public']['Tables']['thread_colors']['Row']
export type WhatsappMessage = Database['public']['Tables']['whatsapp_messages']['Row']
export type UserTenantRole = Database['public']['Tables']['user_tenant_roles']['Row']

// Enum alias
export type TenantRole = Database['public']['Enums']['tenant_role']
export type GarmentStatus = Database['public']['Enums']['garment_status']
export type GarmentType = Database['public']['Enums']['garment_type']
export type FabricSeason = Database['public']['Enums']['fabric_season']
export type WhatsappCategory = Database['public']['Enums']['whatsapp_category']
export type WhatsappMsgType = Database['public']['Enums']['whatsapp_msg_type']
