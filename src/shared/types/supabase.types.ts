// Generado manualmente en formato conforme a supabase-js / createClient<Database>()
// Equivalente a: supabase gen types typescript --project-id <ref>
// Actualizar si se agregan o modifican tablas.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      locations: {
        Row: {
          id: string
          coordinates: unknown
          address: string | null
          neighborhood: string | null
          city: string | null
          created_at: string
        }
        Insert: {
          id?: string
          coordinates: unknown
          address?: string | null
          neighborhood?: string | null
          city?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          coordinates?: unknown
          address?: string | null
          neighborhood?: string | null
          city?: string | null
          created_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string
          email_verified: boolean
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          location_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          email_verified?: boolean
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          location_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          email_verified?: boolean
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          location_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          }
        ]
      }
      user_roles: {
        Row: {
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          user_id: string
          role: string
          created_at?: string
        }
        Update: {
          user_id?: string
          role?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      providers: {
        Row: {
          id: string
          user_id: string
          business_name: string
          description: string | null
          categories: string[]
          cuit_dni: string | null
          radius_km: number | null
          location_id: string | null
          status: string
          onboarding_status: string | null
          billing_email: string | null
          payout_method: string | null
          rating_avg: number | null
          verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_name: string
          description?: string | null
          categories?: string[]
          cuit_dni?: string | null
          radius_km?: number | null
          location_id?: string | null
          status?: string
          onboarding_status?: string | null
          billing_email?: string | null
          payout_method?: string | null
          rating_avg?: number | null
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_name?: string
          description?: string | null
          categories?: string[]
          cuit_dni?: string | null
          radius_km?: number | null
          location_id?: string | null
          status?: string
          onboarding_status?: string | null
          billing_email?: string | null
          payout_method?: string | null
          rating_avg?: number | null
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "providers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "providers_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          }
        ]
      }
      pets: {
        Row: {
          id: string
          user_id: string
          name: string
          species: string
          breed: string
          birth_date: string | null
          sex: string | null
          weight_kg: number | null
          color_marks: string | null
          microchip_id: string | null
          photo_url: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          species: string
          breed: string
          birth_date?: string | null
          sex?: string | null
          weight_kg?: number | null
          color_marks?: string | null
          microchip_id?: string | null
          photo_url?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          species?: string
          breed?: string
          birth_date?: string | null
          sex?: string | null
          weight_kg?: number | null
          color_marks?: string | null
          microchip_id?: string | null
          photo_url?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      schedules: {
        Row: {
          id: string
          provider_id: string
          day_of_week: number
          is_closed: boolean
          blocks: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          provider_id: string
          day_of_week: number
          is_closed?: boolean
          blocks?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          provider_id?: string
          day_of_week?: number
          is_closed?: boolean
          blocks?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          }
        ]
      }
      service_areas: {
        Row: {
          id: string
          provider_id: string
          area: unknown
          created_at: string
        }
        Insert: {
          id?: string
          provider_id: string
          area: unknown
          created_at?: string
        }
        Update: {
          id?: string
          provider_id?: string
          area?: unknown
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_areas_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          }
        ]
      }
      health_records: {
        Row: {
          id: string
          pet_id: string
          type: string
          applied_date: string
          next_due_date: string | null
          frequency_days: number | null
          vaccine_type: string | null
          deworming_type: string | null
          vet_name: string | null
          batch_number: string | null
          visit_reason: string | null
          diagnosis: string | null
          treatment: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pet_id: string
          type: string
          applied_date: string
          next_due_date?: string | null
          frequency_days?: number | null
          vaccine_type?: string | null
          deworming_type?: string | null
          vet_name?: string | null
          batch_number?: string | null
          visit_reason?: string | null
          diagnosis?: string | null
          treatment?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pet_id?: string
          type?: string
          applied_date?: string
          next_due_date?: string | null
          frequency_days?: number | null
          vaccine_type?: string | null
          deworming_type?: string | null
          vet_name?: string | null
          batch_number?: string | null
          visit_reason?: string | null
          diagnosis?: string | null
          treatment?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_records_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          }
        ]
      }
      passport_shares: {
        Row: {
          id: string
          pet_id: string
          hash: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          pet_id: string
          hash: string
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          pet_id?: string
          hash?: string
          expires_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "passport_shares_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          }
        ]
      }
      lost_reports: {
        Row: {
          id: string
          user_id: string | null
          pet_id: string | null
          type: string
          status: string
          photo_url: string | null
          name: string
          species: string
          breed: string | null
          color: string | null
          sex: string | null
          incident_date: string
          location_id: string | null
          behavior: string | null
          contact_phone: string
          reward_ars: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          pet_id?: string | null
          type: string
          status?: string
          photo_url?: string | null
          name: string
          species: string
          breed?: string | null
          color?: string | null
          sex?: string | null
          incident_date: string
          location_id?: string | null
          behavior?: string | null
          contact_phone: string
          reward_ars?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          pet_id?: string | null
          type?: string
          status?: string
          photo_url?: string | null
          name?: string
          species?: string
          breed?: string | null
          color?: string | null
          sex?: string | null
          incident_date?: string
          location_id?: string | null
          behavior?: string | null
          contact_phone?: string
          reward_ars?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lost_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_reports_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_reports_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          }
        ]
      }
      bookings: {
        Row: {
          id: string
          tutor_id: string
          provider_id: string
          pet_id: string
          status: string
          scheduled_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tutor_id: string
          provider_id: string
          pet_id: string
          status?: string
          scheduled_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tutor_id?: string
          provider_id?: string
          pet_id?: string
          status?: string
          scheduled_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          }
        ]
      }
      booking_status_events: {
        Row: {
          id: string
          booking_id: string
          from_status: string | null
          to_status: string
          changed_by: string
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          from_status?: string | null
          to_status: string
          changed_by: string
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          from_status?: string | null
          to_status?: string
          changed_by?: string
          reason?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_status_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_status_events_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          user_agent?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      admin_audit_log: {
        Row: {
          id: string
          admin_id: string
          action: string
          target_table: string
          target_id: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          action: string
          target_table: string
          target_id: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          action?: string
          target_table?: string
          target_id?: string
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: { uid: string; r: string }
        Returns: boolean
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

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Tipos de conveniencia por tabla
export type Location = Tables<'locations'>
export type User = Tables<'users'>
export type UserRole = Tables<'user_roles'>
export type Provider = Tables<'providers'>
export type Pet = Tables<'pets'>
export type Schedule = Tables<'schedules'>
export type ServiceArea = Tables<'service_areas'>
export type HealthRecord = Tables<'health_records'>
export type PassportShare = Tables<'passport_shares'>
export type LostReport = Tables<'lost_reports'>
export type Booking = Tables<'bookings'>
export type BookingStatusEvent = Tables<'booking_status_events'>
export type PushSubscription = Tables<'push_subscriptions'>
export type AdminAuditLog = Tables<'admin_audit_log'>
