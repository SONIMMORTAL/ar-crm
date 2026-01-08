export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      attendance: {
        Row: {
          checked_in_at: string | null
          checked_in_by: string | null
          contact_id: string
          event_id: string
          id: string
          metadata: Json | null
          qr_code_data: string | null
          registered_at: string
          status: "registered" | "checked_in" | "cancelled"
        }
        Insert: {
          checked_in_at?: string | null
          checked_in_by?: string | null
          contact_id: string
          event_id: string
          id?: string
          metadata?: Json | null
          qr_code_data?: string | null
          registered_at?: string
          status: "registered" | "checked_in" | "cancelled"
        }
        Update: {
          checked_in_at?: string | null
          checked_in_by?: string | null
          contact_id?: string
          event_id?: string
          id?: string
          metadata?: Json | null
          qr_code_data?: string | null
          registered_at?: string
          status?: "registered" | "checked_in" | "cancelled"
        }
        Relationships: [
          {
            foreignKeyName: "attendance_contact_id_fkey"
            columns: ["contact_id"]
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_event_id_fkey"
            columns: ["event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          }
        ]
      }
      contacts: {
        Row: {
          created_at: string
          email: string
          engagement_score: number | null
          first_name: string | null
          id: string
          last_name: string | null
          mailchimp_id: string | null
          metadata: Json | null
          nationbuilder_id: string | null
          phone: string | null
          tags: string[] | null
          unsubscribed: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          engagement_score?: number | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          mailchimp_id?: string | null
          metadata?: Json | null
          nationbuilder_id?: string | null
          phone?: string | null
          tags?: string[] | null
          unsubscribed?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          engagement_score?: number | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          mailchimp_id?: string | null
          metadata?: Json | null
          nationbuilder_id?: string | null
          phone?: string | null
          tags?: string[] | null
          unsubscribed?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          body_html: string
          body_text: string | null
          created_at: string
          deliverability_test_results: Json | null
          from_email: string | null
          from_name: string | null
          id: string
          name: string
          sent_at: string | null
          status: "draft" | "testing" | "sent"
          subject: string
          total_bounces: number | null
          total_clicks: number | null
          total_complaints: number | null
          total_opens: number | null
          total_sent: number | null
          unique_clicks: number | null
          unique_opens: number | null
          updated_at: string
        }
        Insert: {
          body_html: string
          body_text?: string | null
          created_at?: string
          deliverability_test_results?: Json | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          name: string
          sent_at?: string | null
          status?: "draft" | "testing" | "sent"
          subject: string
          total_bounces?: number | null
          total_clicks?: number | null
          total_complaints?: number | null
          total_opens?: number | null
          total_sent?: number | null
          unique_clicks?: number | null
          unique_opens?: number | null
          updated_at?: string
        }
        Update: {
          body_html?: string
          body_text?: string | null
          created_at?: string
          deliverability_test_results?: Json | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          name?: string
          sent_at?: string | null
          status?: "draft" | "testing" | "sent"
          subject?: string
          total_bounces?: number | null
          total_clicks?: number | null
          total_complaints?: number | null
          total_opens?: number | null
          total_sent?: number | null
          unique_clicks?: number | null
          unique_opens?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      email_events: {
        Row: {
          campaign_id: string
          contact_id: string
          event_data: Json | null
          event_type: "sent" | "delivered" | "opened" | "clicked" | "bounced" | "complained"
          id: string
          timestamp: string
        }
        Insert: {
          campaign_id: string
          contact_id: string
          event_data?: Json | null
          event_type: "sent" | "delivered" | "opened" | "clicked" | "bounced" | "complained"
          id?: string
          timestamp?: string
        }
        Update: {
          campaign_id?: string
          contact_id?: string
          event_data?: Json | null
          event_type?: "sent" | "delivered" | "opened" | "clicked" | "bounced" | "complained"
          id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_events_campaign_id_fkey"
            columns: ["campaign_id"]
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_events_contact_id_fkey"
            columns: ["contact_id"]
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          }
        ]
      }
      events: {
        Row: {
          capacity: number | null
          created_at: string
          description: string | null
          event_date: string
          id: string
          location: string | null
          metadata: Json | null
          name: string
          registration_open: boolean | null
          slug: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          event_date: string
          id?: string
          location?: string | null
          metadata?: Json | null
          name: string
          registration_open?: boolean | null
          slug: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          event_date?: string
          id?: string
          location?: string | null
          metadata?: Json | null
          name?: string
          registration_open?: boolean | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_link_clicks: {
        Row: {
          id: string
          campaign_id: string
          contact_id: string
          link_url: string
          clicked_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          contact_id: string
          link_url: string
          clicked_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          contact_id?: string
          link_url?: string
          clicked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_link_clicks_campaign_id_fkey"
            columns: ["campaign_id"]
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_link_clicks_contact_id_fkey"
            columns: ["contact_id"]
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          }
        ]
      }
      sync_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          operation: string
          records_affected: number | null
          service: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          operation: string
          records_affected?: number | null
          service: string
          status: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          operation?: string
          records_affected?: number | null
          service?: string
          status?: string
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
