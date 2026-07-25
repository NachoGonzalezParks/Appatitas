// Generado manualmente a partir del esquema en supabase/migrations/
// Actualizar si se agregan o modifican tablas.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type UserRole = 'tutor' | 'provider' | 'admin'
export type ProviderStatus = 'pending_approval' | 'active'
export type PetSpecies = 'perro' | 'gato' | 'otro'
export type HealthRecordType = 'vaccination' | 'deworming' | 'clinical_visit'
export type DewormingType = 'interna' | 'externa' | 'ambas'
export type LostReportType = 'lost' | 'found'
export type LostReportStatus = 'lost' | 'found' | 'closed'

export interface Database {
  public: {
    Tables: {
      locations: {
        Row: {
          id: string
          coordinates: unknown // GEOGRAPHY(POINT, 4326) — usar postgis helpers si hace falta
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
          coordinates?: unknown
          address?: string | null
          neighborhood?: string | null
          city?: string | null
        }
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
          email?: string
          email_verified?: boolean
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          location_id?: string | null
          updated_at?: string
        }
      }

      user_roles: {
        Row: {
          user_id: string
          role: UserRole
          created_at: string
        }
        Insert: {
          user_id: string
          role: UserRole
          created_at?: string
        }
        Update: never
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
          status: ProviderStatus
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
          status?: ProviderStatus
          onboarding_status?: string | null
          billing_email?: string | null
          payout_method?: string | null
          rating_avg?: number | null
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          business_name?: string
          description?: string | null
          categories?: string[]
          cuit_dni?: string | null
          radius_km?: number | null
          location_id?: string | null
          status?: ProviderStatus
          onboarding_status?: string | null
          billing_email?: string | null
          payout_method?: string | null
          rating_avg?: number | null
          verified?: boolean
          updated_at?: string
        }
      }

      pets: {
        Row: {
          id: string
          user_id: string
          name: string
          species: PetSpecies
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
          species: PetSpecies
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
          name?: string
          species?: PetSpecies
          breed?: string
          birth_date?: string | null
          sex?: string | null
          weight_kg?: number | null
          color_marks?: string | null
          microchip_id?: string | null
          photo_url?: string | null
          deleted_at?: string | null
          updated_at?: string
        }
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
          is_closed?: boolean
          blocks?: Json
          updated_at?: string
        }
      }

      service_areas: {
        Row: {
          id: string
          provider_id: string
          area: unknown // GEOGRAPHY(POLYGON, 4326)
          created_at: string
        }
        Insert: {
          id?: string
          provider_id: string
          area: unknown
          created_at?: string
        }
        Update: never
      }

      health_records: {
        Row: {
          id: string
          pet_id: string
          type: HealthRecordType
          applied_date: string
          next_due_date: string | null
          frequency_days: 15 | 30 | 60 | 90 | 180 | null
          vaccine_type: string | null
          deworming_type: DewormingType | null
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
          type: HealthRecordType
          applied_date: string
          next_due_date?: string | null
          frequency_days?: 15 | 30 | 60 | 90 | 180 | null
          vaccine_type?: string | null
          deworming_type?: DewormingType | null
          vet_name?: string | null
          batch_number?: string | null
          visit_reason?: string | null
          diagnosis?: string | null
          treatment?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          applied_date?: string
          next_due_date?: string | null
          frequency_days?: 15 | 30 | 60 | 90 | 180 | null
          vaccine_type?: string | null
          deworming_type?: DewormingType | null
          vet_name?: string | null
          batch_number?: string | null
          visit_reason?: string | null
          diagnosis?: string | null
          treatment?: string | null
          updated_at?: string
        }
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
        Update: never
      }

      lost_reports: {
        Row: {
          id: string
          user_id: string | null
          pet_id: string | null
          type: LostReportType
          status: LostReportStatus
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
          type: LostReportType
          status?: LostReportStatus
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
          status?: LostReportStatus
          photo_url?: string | null
          name?: string
          breed?: string | null
          color?: string | null
          behavior?: string | null
          contact_phone?: string
          reward_ars?: number | null
          updated_at?: string
        }
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
          status?: string
          scheduled_at?: string
          updated_at?: string
        }
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
        Update: never
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
        Update: never
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
        Update: never
      }
    }

    Functions: {
      has_role: {
        Args: { uid: string; r: string }
        Returns: boolean
      }
    }
  }
}
