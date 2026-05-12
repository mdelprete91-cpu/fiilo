// ─── Enums ───────────────────────────────────────────────────────────────────

export type TenantPlan = 'starter' | 'professional' | 'enterprise'
export type TenantRole = 'platform_owner' | 'tenant_admin' | 'tenant_staff' | 'customer'
export type GarmentType = 'suit_2pc' | 'suit_3pc' | 'jacket' | 'trousers' | 'waistcoat' | 'coat' | 'tuxedo' | 'shirt'
export type GarmentStatus = 'draft' | 'confirmed' | 'in_production' | 'ready' | 'delivered' | 'cancelled'
export type PaymentMode = 'deposit' | 'full' | 'on_delivery'
export type PaymentStatus = 'pending' | 'partial' | 'paid'
export type FabricPattern = 'solid' | 'striped' | 'checked' | 'herringbone' | 'houndstooth' | 'plaid' | 'windowpane' | 'paisley' | 'other'
export type FabricSeason = 'spring_summer' | 'autumn_winter' | 'all_season'
export type ButtonMaterial = 'horn' | 'corozo' | 'mother_of_pearl' | 'plastic' | 'metal'
export type AttachmentType = 'photo' | 'inspiration' | 'sketch' | 'leaflet'
export type EmailCampaignStatus = 'draft' | 'scheduled' | 'sent' | 'cancelled'
export type EmailEventType = 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed'
export type WhatsappCategory = 'misura' | 'ispirazione' | 'riferimento_dettaglio' | 'richiesta' | 'approvazione' | 'altro'
export type WhatsappMsgType = 'text' | 'image' | 'audio' | 'document' | 'video' | 'sticker'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ─── Database schema ─────────────────────────────────────────────────────────

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          slug: string
          logo_url: string | null
          brand_color: string | null
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          country: string
          plan: TenantPlan
          is_active: boolean
          whatsapp_phone_number_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          slug: string
          logo_url?: string | null
          brand_color?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          country?: string
          plan?: TenantPlan
          is_active?: boolean
          whatsapp_phone_number_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          slug?: string
          logo_url?: string | null
          brand_color?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          country?: string
          plan?: TenantPlan
          is_active?: boolean
          whatsapp_phone_number_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          full_name: string | null
          avatar_url: string | null
          preferred_language: string
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          avatar_url?: string | null
          preferred_language?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          avatar_url?: string | null
          preferred_language?: string
        }
        Relationships: []
      }
      user_tenant_roles: {
        Row: {
          id: string
          created_at: string
          user_id: string
          tenant_id: string | null
          role: TenantRole
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          tenant_id?: string | null
          role: TenantRole
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          tenant_id?: string | null
          role?: TenantRole
        }
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          tenant_id: string
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          date_of_birth: string | null
          address: string | null
          city: string | null
          country: string | null
          notes: string | null
          photo_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          tenant_id: string
          first_name: string
          last_name: string
          email?: string | null
          phone?: string | null
          date_of_birth?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          notes?: string | null
          photo_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          tenant_id?: string
          first_name?: string
          last_name?: string
          email?: string | null
          phone?: string | null
          date_of_birth?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          notes?: string | null
          photo_url?: string | null
        }
        Relationships: []
      }
      client_measurements: {
        Row: {
          id: string
          created_at: string
          tenant_id: string
          client_id: string
          taken_at: string
          taken_by: string
          chest: number | null
          waist: number | null
          hips: number | null
          shoulders: number | null
          sleeve_length: number | null
          back_length: number | null
          neck: number | null
          wrist: number | null
          crotch: number | null
          inseam: number | null
          outseam: number | null
          thigh: number | null
          knee: number | null
          calf: number | null
          ankle: number | null
          weight: number | null
          height: number | null
          posture_notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          tenant_id: string
          client_id: string
          taken_at?: string
          taken_by: string
          chest?: number | null
          waist?: number | null
          hips?: number | null
          shoulders?: number | null
          sleeve_length?: number | null
          back_length?: number | null
          neck?: number | null
          wrist?: number | null
          crotch?: number | null
          inseam?: number | null
          outseam?: number | null
          thigh?: number | null
          knee?: number | null
          calf?: number | null
          ankle?: number | null
          weight?: number | null
          height?: number | null
          posture_notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          tenant_id?: string
          client_id?: string
          taken_at?: string
          taken_by?: string
          chest?: number | null
          waist?: number | null
          hips?: number | null
          shoulders?: number | null
          sleeve_length?: number | null
          back_length?: number | null
          neck?: number | null
          wrist?: number | null
          crotch?: number | null
          inseam?: number | null
          outseam?: number | null
          thigh?: number | null
          knee?: number | null
          calf?: number | null
          ankle?: number | null
          weight?: number | null
          height?: number | null
          posture_notes?: string | null
        }
        Relationships: []
      }
      fabrics: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          tenant_id: string
          name: string
          mill: string | null
          code: string | null
          composition: string | null
          weight_grams: number | null
          color: string | null
          pattern: FabricPattern | null
          image_url: string | null
          price_per_meter: number | null
          currency: string
          is_available: boolean
          season: FabricSeason | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          tenant_id: string
          name: string
          mill?: string | null
          code?: string | null
          composition?: string | null
          weight_grams?: number | null
          color?: string | null
          pattern?: FabricPattern | null
          image_url?: string | null
          price_per_meter?: number | null
          currency?: string
          is_available?: boolean
          season?: FabricSeason | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          tenant_id?: string
          name?: string
          mill?: string | null
          code?: string | null
          composition?: string | null
          weight_grams?: number | null
          color?: string | null
          pattern?: FabricPattern | null
          image_url?: string | null
          price_per_meter?: number | null
          currency?: string
          is_available?: boolean
          season?: FabricSeason | null
        }
        Relationships: []
      }
      linings: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          tenant_id: string
          name: string
          color: string | null
          material: string | null
          image_url: string | null
          is_available: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          tenant_id: string
          name: string
          color?: string | null
          material?: string | null
          image_url?: string | null
          is_available?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          tenant_id?: string
          name?: string
          color?: string | null
          material?: string | null
          image_url?: string | null
          is_available?: boolean
        }
        Relationships: []
      }
      buttons: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          tenant_id: string
          name: string
          material: ButtonMaterial
          color: string | null
          finish: string | null
          image_url: string | null
          is_available: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          tenant_id: string
          name: string
          material?: ButtonMaterial
          color?: string | null
          finish?: string | null
          image_url?: string | null
          is_available?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          tenant_id?: string
          name?: string
          material?: ButtonMaterial
          color?: string | null
          finish?: string | null
          image_url?: string | null
          is_available?: boolean
        }
        Relationships: []
      }
      thread_colors: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          tenant_id: string
          name: string
          hex_color: string
          is_available: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          tenant_id: string
          name: string
          hex_color: string
          is_available?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          tenant_id?: string
          name?: string
          hex_color?: string
          is_available?: boolean
        }
        Relationships: []
      }
      garments: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          tenant_id: string
          client_id: string
          type: GarmentType
          name: string | null
          status: GarmentStatus
          confirmed_measurement_id: string | null
          total_price: number | null
          currency: string
          delivery_eta: string | null
          internal_notes: string | null
          configuration: Record<string, unknown>
          current_step: string
          payment_mode: PaymentMode | null
          deposit_amount: number | null
          payment_status: PaymentStatus
          assigned_to: string | null
          needs_materials: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          tenant_id: string
          client_id: string
          type: GarmentType
          name?: string | null
          status?: GarmentStatus
          confirmed_measurement_id?: string | null
          total_price?: number | null
          currency?: string
          delivery_eta?: string | null
          internal_notes?: string | null
          configuration?: Record<string, unknown>
          current_step?: string
          payment_mode?: PaymentMode | null
          deposit_amount?: number | null
          payment_status?: PaymentStatus
          assigned_to?: string | null
          needs_materials?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          tenant_id?: string
          client_id?: string
          type?: GarmentType
          name?: string | null
          status?: GarmentStatus
          confirmed_measurement_id?: string | null
          total_price?: number | null
          currency?: string
          delivery_eta?: string | null
          internal_notes?: string | null
          configuration?: Record<string, unknown>
          current_step?: string
          payment_mode?: PaymentMode | null
          deposit_amount?: number | null
          payment_status?: PaymentStatus
          assigned_to?: string | null
          needs_materials?: boolean
        }
        Relationships: []
      }
      garment_configurations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          tenant_id: string
          garment_id: string
          configuration: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          tenant_id: string
          garment_id: string
          configuration?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          tenant_id?: string
          garment_id?: string
          configuration?: Json
        }
        Relationships: []
      }
      garment_attachments: {
        Row: {
          id: string
          created_at: string
          tenant_id: string
          garment_id: string
          url: string
          label: string | null
          type: AttachmentType
        }
        Insert: {
          id?: string
          created_at?: string
          tenant_id: string
          garment_id: string
          url: string
          label?: string | null
          type?: AttachmentType
        }
        Update: {
          id?: string
          created_at?: string
          tenant_id?: string
          garment_id?: string
          url?: string
          label?: string | null
          type?: AttachmentType
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          tenant_id: string
          subject: string
          body_html: string | null
          audience_filter: Json | null
          scheduled_at: string | null
          status: EmailCampaignStatus
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          tenant_id: string
          subject: string
          body_html?: string | null
          audience_filter?: Json | null
          scheduled_at?: string | null
          status?: EmailCampaignStatus
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          tenant_id?: string
          subject?: string
          body_html?: string | null
          audience_filter?: Json | null
          scheduled_at?: string | null
          status?: EmailCampaignStatus
        }
        Relationships: []
      }
      email_events: {
        Row: {
          id: string
          created_at: string
          campaign_id: string
          client_id: string | null
          event_type: EmailEventType
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          campaign_id: string
          client_id?: string | null
          event_type: EmailEventType
          metadata?: Json | null
        }
        Update: never
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          created_at: string
          tenant_id: string | null
          user_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          metadata: Json | null
          ip_address: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          tenant_id?: string | null
          user_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          metadata?: Json | null
          ip_address?: string | null
        }
        Update: never
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          id: string
          created_at: string
          tenant_id: string
          client_id: string | null
          wa_message_id: string
          wa_phone_number_id: string
          from_phone: string
          from_name: string | null
          message_type: WhatsappMsgType
          body: string | null
          media_url: string | null
          media_mime_type: string | null
          category: WhatsappCategory
          category_summary: string | null
          detected_language: string | null
          transcript_confidence: number | null
          ai_processed: boolean
          is_read: boolean
          sent_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          tenant_id: string
          client_id?: string | null
          wa_message_id: string
          wa_phone_number_id: string
          from_phone: string
          from_name?: string | null
          message_type?: WhatsappMsgType
          body?: string | null
          media_url?: string | null
          media_mime_type?: string | null
          category?: WhatsappCategory
          category_summary?: string | null
          detected_language?: string | null
          transcript_confidence?: number | null
          ai_processed?: boolean
          is_read?: boolean
          sent_at: string
        }
        Update: {
          id?: string
          created_at?: string
          tenant_id?: string
          client_id?: string | null
          wa_message_id?: string
          wa_phone_number_id?: string
          from_phone?: string
          from_name?: string | null
          message_type?: WhatsappMsgType
          body?: string | null
          media_url?: string | null
          media_mime_type?: string | null
          category?: WhatsappCategory
          category_summary?: string | null
          detected_language?: string | null
          transcript_confidence?: number | null
          ai_processed?: boolean
          is_read?: boolean
          sent_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      tenant_plan: TenantPlan
      tenant_role: TenantRole
      garment_type: GarmentType
      garment_status: GarmentStatus
      fabric_pattern: FabricPattern
      fabric_season: FabricSeason
      button_material: ButtonMaterial
      attachment_type: AttachmentType
      email_campaign_status: EmailCampaignStatus
      email_event_type: EmailEventType
      whatsapp_category: WhatsappCategory
      whatsapp_msg_type: WhatsappMsgType
    }
  }
}

// ─── Tipi estratti ────────────────────────────────────────────────────────────

export type Tenant = Database['public']['Tables']['tenants']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type UserTenantRole = Database['public']['Tables']['user_tenant_roles']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type ClientMeasurement = Database['public']['Tables']['client_measurements']['Row']
export type Fabric = Database['public']['Tables']['fabrics']['Row']
export type Lining = Database['public']['Tables']['linings']['Row']
export type Button = Database['public']['Tables']['buttons']['Row']
export type ThreadColor = Database['public']['Tables']['thread_colors']['Row']
export type Garment = Database['public']['Tables']['garments']['Row']
export type GarmentConfiguration = Database['public']['Tables']['garment_configurations']['Row']
export type GarmentAttachment = Database['public']['Tables']['garment_attachments']['Row']
export type WhatsappMessage = Database['public']['Tables']['whatsapp_messages']['Row']
