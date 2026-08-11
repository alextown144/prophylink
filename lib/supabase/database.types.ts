export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      account_roles: Table<
        {
          id: string;
          user_id: string;
          kind: Database["public"]["Enums"]["account_kind"];
          onboarding_completed_at: string | null;
          created_at: string;
        },
        {
          id?: string;
          user_id: string;
          kind: Database["public"]["Enums"]["account_kind"];
          onboarding_completed_at?: string | null;
          created_at?: string;
        }
      >;
      availability_rules: Table<
        {
          id: string;
          professional_profile_id: string;
          kind: Database["public"]["Enums"]["availability_kind"];
          starts_at: string | null;
          ends_at: string | null;
          all_day: boolean;
          recurrence_rule: string | null;
          recurrence_starts_on: string | null;
          recurrence_ends_on: string | null;
          timezone: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          professional_profile_id: string;
          kind?: Database["public"]["Enums"]["availability_kind"];
          starts_at?: string | null;
          ends_at?: string | null;
          all_day?: boolean;
          recurrence_rule?: string | null;
          recurrence_starts_on?: string | null;
          recurrence_ends_on?: string | null;
          timezone?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          professional_profile_id?: string;
          kind?: Database["public"]["Enums"]["availability_kind"];
          starts_at?: string | null;
          ends_at?: string | null;
          all_day?: boolean;
          recurrence_rule?: string | null;
          recurrence_starts_on?: string | null;
          recurrence_ends_on?: string | null;
          timezone?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      booking_events: Table<
        {
          id: string;
          booking_id: string;
          actor_user_id: string | null;
          event_type: string;
          metadata: Json;
          created_at: string;
        },
        {
          id?: string;
          booking_id: string;
          actor_user_id?: string | null;
          event_type: string;
          metadata?: Json;
          created_at?: string;
        }
      >;
      bookings: Table<
        {
          id: string;
          shift_id: string | null;
          organization_id: string;
          office_location_id: string;
          professional_profile_id: string;
          status: Database["public"]["Enums"]["booking_status"];
          agreed_hourly_rate_cents: number | null;
          agreed_starts_at: string;
          agreed_ends_at: string;
          cancelled_reason: string | null;
          confirmed_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          shift_id?: string | null;
          organization_id: string;
          office_location_id: string;
          professional_profile_id: string;
          status?: Database["public"]["Enums"]["booking_status"];
          agreed_hourly_rate_cents?: number | null;
          agreed_starts_at: string;
          agreed_ends_at: string;
          cancelled_reason?: string | null;
          confirmed_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          shift_id?: string | null;
          organization_id?: string;
          office_location_id?: string;
          professional_profile_id?: string;
          status?: Database["public"]["Enums"]["booking_status"];
          agreed_hourly_rate_cents?: number | null;
          agreed_starts_at?: string;
          agreed_ends_at?: string;
          cancelled_reason?: string | null;
          confirmed_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      office_locations: Table<
        {
          id: string;
          organization_id: string;
          name: string | null;
          address_line1: string;
          city: string;
          state: string;
          postal_code: string;
          phone: string | null;
          contact_name: string | null;
          contact_email: string | null;
          software_used: string[];
        },
        {
          id?: string;
          organization_id: string;
          name?: string | null;
          address_line1: string;
          city: string;
          state: string;
          postal_code: string;
          phone?: string | null;
          contact_name?: string | null;
          contact_email?: string | null;
          software_used?: string[];
        }
      >;
      organization_members: Table<
        {
          id: string;
          organization_id: string;
          user_id: string;
          role: string;
          created_at: string;
        },
        {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: string;
          created_at?: string;
        }
      >;
      organizations: Table<
        {
          id: string;
          name: string;
          primary_email: string | null;
          primary_phone: string | null;
          website: string | null;
        },
        {
          id?: string;
          name: string;
          primary_email?: string | null;
          primary_phone?: string | null;
          website?: string | null;
        }
      >;
      professional_profiles: Table<
        {
          id: string;
          user_id: string;
          professional_role_id: string;
          short_bio: string | null;
          years_experience: number | null;
          hourly_rate_cents: number | null;
          preferred_radius_miles: number | null;
        },
        {
          id?: string;
          user_id: string;
          professional_role_id: string;
          short_bio?: string | null;
          years_experience?: number | null;
          hourly_rate_cents?: number | null;
          preferred_radius_miles?: number | null;
        }
      >;
      professional_roles: Table<{
        id: string;
        slug: string;
        name: string;
        enabled: boolean;
      }>;
      shifts: Table<
        {
          id: string;
          organization_id: string;
          office_location_id: string;
          professional_role_id: string;
          created_by: string | null;
          status: Database["public"]["Enums"]["shift_status"];
          starts_at: string;
          ends_at: string;
          timezone: string;
          hourly_rate_cents: number | null;
          unpaid_lunch_minutes: number | null;
          description: string | null;
          required_notes: string | null;
          dress_requirements: string | null;
          parking_instructions: string | null;
          arrival_instructions: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          organization_id: string;
          office_location_id: string;
          professional_role_id: string;
          created_by?: string | null;
          status?: Database["public"]["Enums"]["shift_status"];
          starts_at: string;
          ends_at: string;
          timezone?: string;
          hourly_rate_cents?: number | null;
          unpaid_lunch_minutes?: number | null;
          description?: string | null;
          required_notes?: string | null;
          dress_requirements?: string | null;
          parking_instructions?: string | null;
          arrival_instructions?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          organization_id?: string;
          office_location_id?: string;
          professional_role_id?: string;
          created_by?: string | null;
          status?: Database["public"]["Enums"]["shift_status"];
          starts_at?: string;
          ends_at?: string;
          timezone?: string;
          hourly_rate_cents?: number | null;
          unpaid_lunch_minutes?: number | null;
          description?: string | null;
          required_notes?: string | null;
          dress_requirements?: string | null;
          parking_instructions?: string | null;
          arrival_instructions?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      signup_invitations: Table<
        {
          id: string;
          email: string;
          account_kind: Database["public"]["Enums"]["account_kind"];
          token_hash: string;
          status: Database["public"]["Enums"]["signup_invitation_status"];
          invited_by: string | null;
          accepted_by: string | null;
          accepted_at: string | null;
          expires_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          email: string;
          account_kind: Database["public"]["Enums"]["account_kind"];
          token_hash: string;
          status?: Database["public"]["Enums"]["signup_invitation_status"];
          invited_by?: string | null;
          accepted_by?: string | null;
          accepted_at?: string | null;
          expires_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      user_profiles: Table<
        {
          id: string;
          signup_invitation_id: string | null;
          first_name: string | null;
          last_name: string | null;
          display_name: string | null;
          email: string;
          city: string | null;
          state: string | null;
          postal_code: string | null;
        },
        {
          id: string;
          signup_invitation_id?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          display_name?: string | null;
          email: string;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      account_kind: "professional" | "office" | "admin";
      signup_invitation_status: "active" | "accepted" | "revoked" | "expired";
      credential_status: "pending" | "verified" | "rejected" | "expired";
      availability_kind: "available" | "unavailable";
      shift_status: "draft" | "open" | "pending" | "filled" | "completed" | "cancelled";
      booking_status:
        | "invited"
        | "interested"
        | "requested"
        | "pending_office_approval"
        | "accepted"
        | "confirmed"
        | "declined"
        | "cancelled"
        | "completed";
      coverage_status:
        | "draft"
        | "open"
        | "candidate_selected"
        | "pending_office_approval"
        | "confirmed"
        | "cancelled"
        | "completed";
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "cancelled"
        | "unpaid"
        | "incomplete"
        | "none";
    };
    CompositeTypes: Record<string, never>;
  };
};
