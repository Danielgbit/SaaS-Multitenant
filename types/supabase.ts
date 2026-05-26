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
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      appointment_confirmations: {
        Row: {
          adjusted_price: number | null
          appointment_id: string | null
          client_name: string | null
          client_phone: string | null
          confirmation_status: string | null
          confirmation_type: string | null
          created_at: string | null
          deleted_employee_name: string | null
          employee_confirmed_at: string | null
          employee_id: string
          id: string
          notes: string | null
          organization_id: string
          payment_method: string | null
          reception_confirmed_at: string | null
          reception_notes: string | null
          services: Json | null
          status: string | null
          total_amount: number | null
        }
        Insert: {
          adjusted_price?: number | null
          appointment_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          confirmation_status?: string | null
          confirmation_type?: string | null
          created_at?: string | null
          deleted_employee_name?: string | null
          employee_confirmed_at?: string | null
          employee_id: string
          id?: string
          notes?: string | null
          organization_id: string
          payment_method?: string | null
          reception_confirmed_at?: string | null
          reception_notes?: string | null
          services?: Json | null
          status?: string | null
          total_amount?: number | null
        }
        Update: {
          adjusted_price?: number | null
          appointment_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          confirmation_status?: string | null
          confirmation_type?: string | null
          created_at?: string | null
          deleted_employee_name?: string | null
          employee_confirmed_at?: string | null
          employee_id?: string
          id?: string
          notes?: string | null
          organization_id?: string
          payment_method?: string | null
          reception_confirmed_at?: string | null
          reception_notes?: string | null
          services?: Json | null
          status?: string | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_confirmations_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_confirmations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_confirmations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_services: {
        Row: {
          appointment_id: string
          id: string
          service_id: string
        }
        Insert: {
          appointment_id: string
          id?: string
          service_id: string
        }
        Update: {
          appointment_id?: string
          id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_services_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          client_id: string
          completed_at: string | null
          completed_by: string | null
          confirmation_status: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          deleted_employee_name: string | null
          employee_id: string | null
          end_time: string
          id: string
          invoice_id: string | null
          is_commissionable: boolean | null
          notes: string | null
          organization_id: string
          payment_method: string | null
          price_adjustment: number | null
          start_time: string
          status: string
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          completed_by?: string | null
          confirmation_status?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          deleted_employee_name?: string | null
          employee_id?: string | null
          end_time: string
          id?: string
          invoice_id?: string | null
          is_commissionable?: boolean | null
          notes?: string | null
          organization_id: string
          payment_method?: string | null
          price_adjustment?: number | null
          start_time: string
          status?: string
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          completed_by?: string | null
          confirmation_status?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          deleted_employee_name?: string | null
          employee_id?: string | null
          end_time?: string
          id?: string
          invoice_id?: string | null
          is_commissionable?: boolean | null
          notes?: string | null
          organization_id?: string
          payment_method?: string | null
          price_adjustment?: number | null
          start_time?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          channel: string
          conditions: Json | null
          created_at: string | null
          delay_minutes: number | null
          id: string
          is_enabled: boolean | null
          organization_id: string
          template_id: string | null
          trigger_event: string
        }
        Insert: {
          channel: string
          conditions?: Json | null
          created_at?: string | null
          delay_minutes?: number | null
          id?: string
          is_enabled?: boolean | null
          organization_id: string
          template_id?: string | null
          trigger_event: string
        }
        Update: {
          channel?: string
          conditions?: Json | null
          created_at?: string | null
          delay_minutes?: number | null
          id?: string
          is_enabled?: boolean | null
          organization_id?: string
          template_id?: string | null
          trigger_event?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_rules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_settings: {
        Row: {
          auto_purge_enabled: boolean | null
          auto_retention_days: number | null
          buffer_minutes: number
          max_days_ahead: number
          min_notice_hours: number
          online_booking_enabled: boolean
          organization_id: string
          slot_interval: number
          spa_closing_time: string | null
          spa_opening_time: string | null
          timezone: string
          use_notification_v2: boolean
        }
        Insert: {
          auto_purge_enabled?: boolean | null
          auto_retention_days?: number | null
          buffer_minutes?: number
          max_days_ahead?: number
          min_notice_hours?: number
          online_booking_enabled?: boolean
          organization_id: string
          slot_interval?: number
          spa_closing_time?: string | null
          spa_opening_time?: string | null
          timezone?: string
          use_notification_v2?: boolean
        }
        Update: {
          auto_purge_enabled?: boolean | null
          auto_retention_days?: number | null
          buffer_minutes?: number
          max_days_ahead?: number
          min_notice_hours?: number
          online_booking_enabled?: boolean
          organization_id?: string
          slot_interval?: number
          spa_closing_time?: string | null
          spa_opening_time?: string | null
          timezone?: string
          use_notification_v2?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "booking_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_account_transactions: {
        Row: {
          account_id: string
          amount: number
          balance_after: number
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          organization_id: string
          payment_method: string | null
          payment_reference: string | null
          related_transaction_id: string | null
          transaction_type: string
        }
        Insert: {
          account_id: string
          amount: number
          balance_after: number
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          payment_method?: string | null
          payment_reference?: string | null
          related_transaction_id?: string | null
          transaction_type: string
        }
        Update: {
          account_id?: string
          amount?: number
          balance_after?: number
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          payment_method?: string | null
          payment_reference?: string | null
          related_transaction_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_account_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "client_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_account_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_account_transactions_related_transaction_id_fkey"
            columns: ["related_transaction_id"]
            isOneToOne: false
            referencedRelation: "client_account_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      client_accounts: {
        Row: {
          balance: number
          client_id: string
          created_at: string
          credit_limit: number
          id: string
          is_at_warning_threshold: boolean
          is_over_limit: boolean
          last_transaction_at: string | null
          organization_id: string
          total_paid: number
          total_purchased: number
          updated_at: string
        }
        Insert: {
          balance?: number
          client_id: string
          created_at?: string
          credit_limit?: number
          id?: string
          is_at_warning_threshold?: boolean
          is_over_limit?: boolean
          last_transaction_at?: string | null
          organization_id: string
          total_paid?: number
          total_purchased?: number
          updated_at?: string
        }
        Update: {
          balance?: number
          client_id?: string
          created_at?: string
          credit_limit?: number
          id?: string
          is_at_warning_threshold?: boolean
          is_over_limit?: boolean
          last_transaction_at?: string | null
          organization_id?: string
          total_paid?: number
          total_purchased?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_payment_methods: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          organization_id: string
          sort_order: number | null
          type: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          sort_order?: number | null
          type: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          sort_order?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_payment_methods_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_product_discounts: {
        Row: {
          client_id: string
          created_at: string
          discount_percent: number
          id: string
          inventory_item_id: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          discount_percent: number
          id?: string
          inventory_item_id: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          discount_percent?: number
          id?: string
          inventory_item_id?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_product_discounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_product_discounts_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      client_product_sales: {
        Row: {
          created_at: string
          discount_percent: number | null
          id: string
          inventory_item_id: string | null
          product_name: string
          quantity: number
          total_price: number
          transaction_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          discount_percent?: number | null
          id?: string
          inventory_item_id?: string | null
          product_name: string
          quantity?: number
          total_price: number
          transaction_id: string
          unit_price: number
        }
        Update: {
          created_at?: string
          discount_percent?: number | null
          id?: string
          inventory_item_id?: string | null
          product_name?: string
          quantity?: number
          total_price?: number
          transaction_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_product_sales_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_product_sales_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "client_account_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          confirmation_method:
            | Database["public"]["Enums"]["confirmation_method"]
            | null
          confirmations_enabled: boolean | null
          created_at: string
          credit_limit: number | null
          credit_warning_threshold: number | null
          default_payment_method: string | null
          email: string | null
          has_credit_account: boolean | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          preferred_contact:
            | Database["public"]["Enums"]["preferred_contact"]
            | null
        }
        Insert: {
          confirmation_method?:
            | Database["public"]["Enums"]["confirmation_method"]
            | null
          confirmations_enabled?: boolean | null
          created_at?: string
          credit_limit?: number | null
          credit_warning_threshold?: number | null
          default_payment_method?: string | null
          email?: string | null
          has_credit_account?: boolean | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          preferred_contact?:
            | Database["public"]["Enums"]["preferred_contact"]
            | null
        }
        Update: {
          confirmation_method?:
            | Database["public"]["Enums"]["confirmation_method"]
            | null
          confirmations_enabled?: boolean | null
          created_at?: string
          credit_limit?: number | null
          credit_warning_threshold?: number | null
          default_payment_method?: string | null
          email?: string | null
          has_credit_account?: boolean | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          preferred_contact?:
            | Database["public"]["Enums"]["preferred_contact"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      confirmation_logs: {
        Row: {
          action: string
          appointment_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          notes: string | null
          organization_id: string
          payment_method: string | null
          performed_by: string | null
          performed_by_role: string
          price_after: number | null
          price_before: number | null
        }
        Insert: {
          action: string
          appointment_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          organization_id: string
          payment_method?: string | null
          performed_by?: string | null
          performed_by_role: string
          price_after?: number | null
          price_before?: number | null
        }
        Update: {
          action?: string
          appointment_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          organization_id?: string
          payment_method?: string | null
          performed_by?: string | null
          performed_by_role?: string
          price_after?: number | null
          price_before?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "confirmation_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confirmation_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      confirmation_tokens: {
        Row: {
          action: string
          appointment_id: string
          created_at: string | null
          expires_at: string
          id: string
          invalidated_at: string | null
          invalidated_reason: string | null
          organization_id: string
          token: string
          used_at: string | null
        }
        Insert: {
          action: string
          appointment_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          invalidated_at?: string | null
          invalidated_reason?: string | null
          organization_id: string
          token: string
          used_at?: string | null
        }
        Update: {
          action?: string
          appointment_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          invalidated_at?: string | null
          invalidated_reason?: string | null
          organization_id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "confirmation_tokens_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confirmation_tokens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_analytics: {
        Row: {
          appointments_canceled: number | null
          appointments_completed: number | null
          appointments_count: number | null
          appointments_no_show: number | null
          created_at: string | null
          date: string
          id: string
          new_clients: number | null
          organization_id: string
          revenue_cents: number | null
          updated_at: string | null
        }
        Insert: {
          appointments_canceled?: number | null
          appointments_completed?: number | null
          appointments_count?: number | null
          appointments_no_show?: number | null
          created_at?: string | null
          date: string
          id?: string
          new_clients?: number | null
          organization_id: string
          revenue_cents?: number | null
          updated_at?: string | null
        }
        Update: {
          appointments_canceled?: number | null
          appointments_completed?: number | null
          appointments_count?: number | null
          appointments_no_show?: number | null
          created_at?: string | null
          date?: string
          id?: string
          new_clients?: number | null
          organization_id?: string
          revenue_cents?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dead_letter_notifications: {
        Row: {
          attempts: number
          channel: string
          correlation_id: string | null
          error_code: string | null
          id: string
          last_error: string | null
          metadata: Json | null
          moved_at: string
          organization_id: string
          original_queue_id: string
          rendered_body: string | null
          replay_status: string | null
          replayed_at: string | null
          subject: string | null
          to_address: string | null
          trace_id: string | null
          variables: Json | null
        }
        Insert: {
          attempts?: number
          channel: string
          correlation_id?: string | null
          error_code?: string | null
          id?: string
          last_error?: string | null
          metadata?: Json | null
          moved_at?: string
          organization_id: string
          original_queue_id: string
          rendered_body?: string | null
          replay_status?: string | null
          replayed_at?: string | null
          subject?: string | null
          to_address?: string | null
          trace_id?: string | null
          variables?: Json | null
        }
        Update: {
          attempts?: number
          channel?: string
          correlation_id?: string | null
          error_code?: string | null
          id?: string
          last_error?: string | null
          metadata?: Json | null
          moved_at?: string
          organization_id?: string
          original_queue_id?: string
          rendered_body?: string | null
          replay_status?: string | null
          replayed_at?: string | null
          subject?: string | null
          to_address?: string | null
          trace_id?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "dead_letter_notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          appointment_id: string | null
          client_id: string | null
          created_at: string | null
          email_type: string
          error_message: string | null
          id: string
          organization_id: string
          sent_at: string | null
          status: string
          subject: string
          to_email: string
        }
        Insert: {
          appointment_id?: string | null
          client_id?: string | null
          created_at?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          organization_id: string
          sent_at?: string | null
          status?: string
          subject: string
          to_email: string
        }
        Update: {
          appointment_id?: string | null
          client_id?: string | null
          created_at?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          organization_id?: string
          sent_at?: string | null
          status?: string
          subject?: string
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_settings: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          organization_id: string
          reminder_hours_before: number | null
          send_confirmation: boolean | null
          send_post_appointment: boolean | null
          send_reminders: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          organization_id: string
          reminder_hours_before?: number | null
          send_confirmation?: boolean | null
          send_post_appointment?: boolean | null
          send_reminders?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          organization_id?: string
          reminder_hours_before?: number | null
          send_confirmation?: boolean | null
          send_post_appointment?: boolean | null
          send_reminders?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_availability: {
        Row: {
          break_end: string | null
          break_reason: string | null
          break_start: string | null
          day_of_week: number
          employee_id: string
          end_time: string
          id: string
          start_time: string
        }
        Insert: {
          break_end?: string | null
          break_reason?: string | null
          break_start?: string | null
          day_of_week: number
          employee_id: string
          end_time: string
          id?: string
          start_time: string
        }
        Update: {
          break_end?: string | null
          break_reason?: string | null
          break_start?: string | null
          day_of_week?: number
          employee_id?: string
          end_time?: string
          id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_availability_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_availability_overrides: {
        Row: {
          break_end: string | null
          break_start: string | null
          created_at: string | null
          created_by: string | null
          date: string
          employee_id: string
          end_time: string | null
          id: string
          is_day_off: boolean | null
          reason: string | null
          start_time: string | null
          updated_at: string | null
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          created_at?: string | null
          created_by?: string | null
          date: string
          employee_id: string
          end_time?: string | null
          id?: string
          is_day_off?: boolean | null
          reason?: string | null
          start_time?: string | null
          updated_at?: string | null
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          employee_id?: string
          end_time?: string | null
          id?: string
          is_day_off?: boolean | null
          reason?: string | null
          start_time?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_availability_overrides_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          created_by: string | null
          email: string | null
          employee_id: string
          expires_at: string
          id: string
          last_resend_at: string | null
          organization_id: string
          resend_count: number
          role: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          employee_id: string
          expires_at: string
          id?: string
          last_resend_at?: string | null
          organization_id: string
          resend_count?: number
          role?: string
          status?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          employee_id?: string
          expires_at?: string
          id?: string
          last_resend_at?: string | null
          organization_id?: string
          resend_count?: number
          role?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_invitations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_loans: {
        Row: {
          amount: number
          concept: string
          created_at: string
          due_date: string | null
          employee_id: string
          id: string
          interest_rate: number | null
          notes: string | null
          organization_id: string
          remaining_amount: number
          status: string
        }
        Insert: {
          amount: number
          concept: string
          created_at?: string
          due_date?: string | null
          employee_id: string
          id?: string
          interest_rate?: number | null
          notes?: string | null
          organization_id: string
          remaining_amount: number
          status?: string
        }
        Update: {
          amount?: number
          concept?: string
          created_at?: string
          due_date?: string | null
          employee_id?: string
          id?: string
          interest_rate?: number | null
          notes?: string | null
          organization_id?: string
          remaining_amount?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_loans_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_loans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_services: {
        Row: {
          commission_rate: number | null
          duration_override: number | null
          employee_id: string
          id: string
          price_override: number | null
          service_id: string
        }
        Insert: {
          commission_rate?: number | null
          duration_override?: number | null
          employee_id: string
          id?: string
          price_override?: number | null
          service_id: string
        }
        Update: {
          commission_rate?: number | null
          duration_override?: number | null
          employee_id?: string
          id?: string
          price_override?: number | null
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_services_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          active: boolean
          base_salary: number | null
          contract_type: string | null
          created_at: string
          debt_warning_threshold: number | null
          employment_type: string | null
          force_transport_subsidy: boolean | null
          has_transport_subsidy: boolean | null
          id: string
          max_debt_limit: number | null
          name: string
          organization_id: string
          part_time_percentage: number | null
          payment_type: string | null
          percentage: number | null
          phone: string | null
          salary_frequency: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean
          base_salary?: number | null
          contract_type?: string | null
          created_at?: string
          debt_warning_threshold?: number | null
          employment_type?: string | null
          force_transport_subsidy?: boolean | null
          has_transport_subsidy?: boolean | null
          id?: string
          max_debt_limit?: number | null
          name: string
          organization_id: string
          part_time_percentage?: number | null
          payment_type?: string | null
          percentage?: number | null
          phone?: string | null
          salary_frequency?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean
          base_salary?: number | null
          contract_type?: string | null
          created_at?: string
          debt_warning_threshold?: number | null
          employment_type?: string | null
          force_transport_subsidy?: boolean | null
          has_transport_subsidy?: boolean | null
          id?: string
          max_debt_limit?: number | null
          name?: string
          organization_id?: string
          part_time_percentage?: number | null
          payment_type?: string | null
          percentage?: number | null
          phone?: string | null
          salary_frequency?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          config: Json | null
          created_at: string
          id: string
          organization_id: string
          status: string
          type: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          id?: string
          organization_id: string
          status?: string
          type: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          id?: string
          organization_id?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          active: boolean | null
          category: string | null
          cost_price: number | null
          created_at: string | null
          description: string | null
          id: string
          min_quantity: number | null
          name: string
          organization_id: string
          price: number | null
          quantity: number
          sku: string | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          min_quantity?: number | null
          name: string
          organization_id: string
          price?: number | null
          quantity?: number
          sku?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          min_quantity?: number | null
          name?: string
          organization_id?: string
          price?: number | null
          quantity?: number
          sku?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          invoice_number: string | null
          invoice_pdf_url: string | null
          organization_id: string
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          status: string
          stripe_invoice_id: string | null
          subscription_id: string | null
          subtotal_cents: number
          tax_amount_cents: number | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          id?: string
          invoice_number?: string | null
          invoice_pdf_url?: string | null
          organization_id: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
          stripe_invoice_id?: string | null
          subscription_id?: string | null
          subtotal_cents: number
          tax_amount_cents?: number | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          invoice_number?: string | null
          invoice_pdf_url?: string | null
          organization_id?: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
          stripe_invoice_id?: string | null
          subscription_id?: string | null
          subtotal_cents?: number
          tax_amount_cents?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          body: string
          channel: string
          created_at: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          organization_id: string | null
          subject: string | null
          type: string
          updated_at: string | null
          variables: Json | null
          version: number | null
        }
        Insert: {
          body: string
          channel: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          organization_id?: string | null
          subject?: string | null
          type: string
          updated_at?: string | null
          variables?: Json | null
          version?: number | null
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          organization_id?: string | null
          subject?: string | null
          type?: string
          updated_at?: string | null
          variables?: Json | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_alert_events: {
        Row: {
          code: string
          created_at: string
          id: string
          level: string
          message: string
          resolved: boolean
          resolved_at: string | null
          worker_name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          level: string
          message: string
          resolved?: boolean
          resolved_at?: string | null
          worker_name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          level?: string
          message?: string
          resolved?: boolean
          resolved_at?: string | null
          worker_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_alert_events_worker_name_fkey"
            columns: ["worker_name"]
            isOneToOne: false
            referencedRelation: "notification_worker_heartbeats"
            referencedColumns: ["worker_name"]
          },
        ]
      }
      notification_conversations: {
        Row: {
          appointment_id: string | null
          channel: string
          client_phone: string
          created_at: string
          id: string
          last_message_id: string | null
          metadata: Json | null
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          channel?: string
          client_phone: string
          created_at?: string
          id?: string
          last_message_id?: string | null
          metadata?: Json | null
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          channel?: string
          client_phone?: string
          created_at?: string
          id?: string
          last_message_id?: string | null
          metadata?: Json | null
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_conversations_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_events: {
        Row: {
          conversation_id: string | null
          correlation_id: string | null
          created_at: string
          event_type: string
          id: string
          latency_ms: number | null
          message_id: string | null
          metadata: Json | null
          organization_id: string | null
          provider_message_id: string | null
          queue_item_id: string | null
          trace_id: string | null
          worker_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          correlation_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          latency_ms?: number | null
          message_id?: string | null
          metadata?: Json | null
          organization_id?: string | null
          provider_message_id?: string | null
          queue_item_id?: string | null
          trace_id?: string | null
          worker_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          correlation_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          latency_ms?: number | null
          message_id?: string | null
          metadata?: Json | null
          organization_id?: string | null
          provider_message_id?: string | null
          queue_item_id?: string | null
          trace_id?: string | null
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_events_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "notification_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_events_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "notification_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_events_queue_item_id_fkey"
            columns: ["queue_item_id"]
            isOneToOne: false
            referencedRelation: "notification_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_inbound_events: {
        Row: {
          channel: string
          correlation_id: string | null
          created_at: string
          error_message: string | null
          from_phone: string | null
          id: string
          normalized_payload: Json | null
          organization_id: string | null
          parsed_action: string | null
          processed: boolean
          processed_at: string | null
          processing_time_ms: number | null
          provider: string
          provider_headers: Json | null
          provider_message_id: string
          raw_payload: Json
          trace_id: string | null
        }
        Insert: {
          channel?: string
          correlation_id?: string | null
          created_at?: string
          error_message?: string | null
          from_phone?: string | null
          id?: string
          normalized_payload?: Json | null
          organization_id?: string | null
          parsed_action?: string | null
          processed?: boolean
          processed_at?: string | null
          processing_time_ms?: number | null
          provider: string
          provider_headers?: Json | null
          provider_message_id: string
          raw_payload: Json
          trace_id?: string | null
        }
        Update: {
          channel?: string
          correlation_id?: string | null
          created_at?: string
          error_message?: string | null
          from_phone?: string | null
          id?: string
          normalized_payload?: Json | null
          organization_id?: string | null
          parsed_action?: string | null
          processed?: boolean
          processed_at?: string | null
          processing_time_ms?: number | null
          provider?: string
          provider_headers?: Json | null
          provider_message_id?: string
          raw_payload?: Json
          trace_id?: string | null
        }
        Relationships: []
      }
      notification_messages: {
        Row: {
          attempt_number: number | null
          channel: string
          conversation_id: string | null
          correlation_id: string | null
          created_at: string
          direction: string
          error_code: string | null
          error_message: string | null
          error_type: string | null
          id: string
          normalized_payload: Json | null
          organization_id: string
          payload: Json | null
          processing_time_ms: number | null
          provider_message_id: string | null
          provider_name: string | null
          queue_item_id: string | null
          request_payload: Json | null
          response_headers: Json | null
          response_payload: Json | null
          response_status: number | null
          retry_count: number | null
          status: string
          trace_id: string | null
        }
        Insert: {
          attempt_number?: number | null
          channel?: string
          conversation_id?: string | null
          correlation_id?: string | null
          created_at?: string
          direction: string
          error_code?: string | null
          error_message?: string | null
          error_type?: string | null
          id?: string
          normalized_payload?: Json | null
          organization_id: string
          payload?: Json | null
          processing_time_ms?: number | null
          provider_message_id?: string | null
          provider_name?: string | null
          queue_item_id?: string | null
          request_payload?: Json | null
          response_headers?: Json | null
          response_payload?: Json | null
          response_status?: number | null
          retry_count?: number | null
          status?: string
          trace_id?: string | null
        }
        Update: {
          attempt_number?: number | null
          channel?: string
          conversation_id?: string | null
          correlation_id?: string | null
          created_at?: string
          direction?: string
          error_code?: string | null
          error_message?: string | null
          error_type?: string | null
          id?: string
          normalized_payload?: Json | null
          organization_id?: string
          payload?: Json | null
          processing_time_ms?: number | null
          provider_message_id?: string | null
          provider_name?: string | null
          queue_item_id?: string | null
          request_payload?: Json | null
          response_headers?: Json | null
          response_payload?: Json | null
          response_status?: number | null
          retry_count?: number | null
          status?: string
          trace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "notification_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_messages_queue_item_id_fkey"
            columns: ["queue_item_id"]
            isOneToOne: false
            referencedRelation: "notification_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_providers: {
        Row: {
          channel: string
          config: Json | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          organization_id: string
          provider: string
          rate_limit_per_day: number | null
          rate_limit_per_min: number | null
          updated_at: string | null
        }
        Insert: {
          channel: string
          config?: Json | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          organization_id: string
          provider: string
          rate_limit_per_day?: number | null
          rate_limit_per_min?: number | null
          updated_at?: string | null
        }
        Update: {
          channel?: string
          config?: Json | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          organization_id?: string
          provider?: string
          rate_limit_per_day?: number | null
          rate_limit_per_min?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_providers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_queue: {
        Row: {
          appointment_id: string | null
          attempts: number | null
          channel: string
          claimed_at: string | null
          claimed_by: string | null
          completed_at: string | null
          correlation_id: string | null
          created_at: string | null
          delivered_at: string | null
          id: string
          idempotency_key: string
          last_claimed_at: string | null
          last_error: string | null
          manual_replay: boolean | null
          max_attempts: number | null
          next_retry_at: string | null
          organization_id: string
          processing_started_at: string | null
          processing_timeout_at: string | null
          provider_message_id: string | null
          provider_response: Json | null
          provider_snapshot: Json | null
          read_at: string | null
          rendered_body: string | null
          replay_reason: string | null
          replayed_at: string | null
          replayed_by_user_id: string | null
          replayed_from_queue_item_id: string | null
          scheduled_at: string
          sent_at: string | null
          status: string
          subject: string | null
          template_id: string | null
          to_address: string
          trace_id: string | null
          updated_at: string | null
          variables: Json | null
          worker_version: string | null
        }
        Insert: {
          appointment_id?: string | null
          attempts?: number | null
          channel: string
          claimed_at?: string | null
          claimed_by?: string | null
          completed_at?: string | null
          correlation_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          idempotency_key: string
          last_claimed_at?: string | null
          last_error?: string | null
          manual_replay?: boolean | null
          max_attempts?: number | null
          next_retry_at?: string | null
          organization_id: string
          processing_started_at?: string | null
          processing_timeout_at?: string | null
          provider_message_id?: string | null
          provider_response?: Json | null
          provider_snapshot?: Json | null
          read_at?: string | null
          rendered_body?: string | null
          replay_reason?: string | null
          replayed_at?: string | null
          replayed_by_user_id?: string | null
          replayed_from_queue_item_id?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          to_address: string
          trace_id?: string | null
          updated_at?: string | null
          variables?: Json | null
          worker_version?: string | null
        }
        Update: {
          appointment_id?: string | null
          attempts?: number | null
          channel?: string
          claimed_at?: string | null
          claimed_by?: string | null
          completed_at?: string | null
          correlation_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          idempotency_key?: string
          last_claimed_at?: string | null
          last_error?: string | null
          manual_replay?: boolean | null
          max_attempts?: number | null
          next_retry_at?: string | null
          organization_id?: string
          processing_started_at?: string | null
          processing_timeout_at?: string | null
          provider_message_id?: string | null
          provider_response?: Json | null
          provider_snapshot?: Json | null
          read_at?: string | null
          rendered_body?: string | null
          replay_reason?: string | null
          replayed_at?: string | null
          replayed_by_user_id?: string | null
          replayed_from_queue_item_id?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          to_address?: string
          trace_id?: string | null
          updated_at?: string | null
          variables?: Json | null
          worker_version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_queue_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_queue_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_worker_heartbeats: {
        Row: {
          created_at: string
          dlq_depth: number
          error_count: number
          last_error: string | null
          last_error_at: string | null
          last_latency_ms: number | null
          last_seen_at: string
          last_success_at: string | null
          metadata: Json
          processed_count: number
          queue_depth: number
          queue_depth_updated_at: string | null
          status: string
          success_count: number
          updated_at: string
          worker_name: string
        }
        Insert: {
          created_at?: string
          dlq_depth?: number
          error_count?: number
          last_error?: string | null
          last_error_at?: string | null
          last_latency_ms?: number | null
          last_seen_at?: string
          last_success_at?: string | null
          metadata?: Json
          processed_count?: number
          queue_depth?: number
          queue_depth_updated_at?: string | null
          status?: string
          success_count?: number
          updated_at?: string
          worker_name: string
        }
        Update: {
          created_at?: string
          dlq_depth?: number
          error_count?: number
          last_error?: string | null
          last_error_at?: string | null
          last_latency_ms?: number | null
          last_seen_at?: string
          last_success_at?: string | null
          metadata?: Json
          processed_count?: number
          queue_depth?: number
          queue_depth_updated_at?: string | null
          status?: string
          success_count?: number
          updated_at?: string
          worker_name?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          metadata: Json | null
          organization_id: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          organization_id: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          organization_id?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_payroll_settings: {
        Row: {
          allow_advance_payments: boolean | null
          created_at: string
          cut_off_day: number | null
          id: string
          month_day: number | null
          organization_id: string
          payroll_type: string
          updated_at: string
          week_starts_on: number | null
        }
        Insert: {
          allow_advance_payments?: boolean | null
          created_at?: string
          cut_off_day?: number | null
          id?: string
          month_day?: number | null
          organization_id: string
          payroll_type?: string
          updated_at?: string
          week_starts_on?: number | null
        }
        Update: {
          allow_advance_payments?: boolean | null
          created_at?: string
          cut_off_day?: number | null
          id?: string
          month_day?: number | null
          organization_id?: string
          payroll_type?: string
          updated_at?: string
          week_starts_on?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_payroll_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          brand: string | null
          created_at: string
          exp_month: number | null
          exp_year: number | null
          id: string
          is_default: boolean | null
          last4: string | null
          organization_id: string
          stripe_payment_method_id: string
          type: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          exp_month?: number | null
          exp_year?: number | null
          id?: string
          is_default?: boolean | null
          last4?: string | null
          organization_id: string
          stripe_payment_method_id: string
          type?: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          exp_month?: number | null
          exp_year?: number | null
          id?: string
          is_default?: boolean | null
          last4?: string | null
          organization_id?: string
          stripe_payment_method_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          failure_reason: string | null
          id: string
          invoice_id: string | null
          organization_id: string
          status: string
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          failure_reason?: string | null
          id?: string
          invoice_id?: string | null
          organization_id: string
          status?: string
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          failure_reason?: string | null
          id?: string
          invoice_id?: string | null
          organization_id?: string
          status?: string
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_config: {
        Row: {
          created_at: string
          health_rate: number | null
          id: string
          pension_rate: number | null
          smmlv: number
          transport_subsidy: number
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          health_rate?: number | null
          id?: string
          pension_rate?: number | null
          smmlv: number
          transport_subsidy: number
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          health_rate?: number | null
          id?: string
          pension_rate?: number | null
          smmlv?: number
          transport_subsidy?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      payroll_item_loans: {
        Row: {
          amount_deducted: number
          created_at: string
          id: string
          loan_id: string
          payroll_item_id: string
        }
        Insert: {
          amount_deducted: number
          created_at?: string
          id?: string
          loan_id: string
          payroll_item_id: string
        }
        Update: {
          amount_deducted?: number
          created_at?: string
          id?: string
          loan_id?: string
          payroll_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_item_loans_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "employee_loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_item_loans_payroll_item_id_fkey"
            columns: ["payroll_item_id"]
            isOneToOne: false
            referencedRelation: "payroll_items"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_items: {
        Row: {
          base_salary: number | null
          contract_type: string
          created_at: string
          employee_id: string
          gross_commission: number | null
          gross_pay: number | null
          has_transport_subsidy: boolean | null
          health_deduction: number | null
          id: string
          loans_deducted: number | null
          net_pay: number | null
          notes: string | null
          payment_type: string
          payroll_period_id: string
          pension_deduction: number | null
          salary_frequency: string | null
          total_deductions: number | null
          total_services: number | null
          transport_subsidy_amount: number | null
          updated_at: string
        }
        Insert: {
          base_salary?: number | null
          contract_type: string
          created_at?: string
          employee_id: string
          gross_commission?: number | null
          gross_pay?: number | null
          has_transport_subsidy?: boolean | null
          health_deduction?: number | null
          id?: string
          loans_deducted?: number | null
          net_pay?: number | null
          notes?: string | null
          payment_type: string
          payroll_period_id: string
          pension_deduction?: number | null
          salary_frequency?: string | null
          total_deductions?: number | null
          total_services?: number | null
          transport_subsidy_amount?: number | null
          updated_at?: string
        }
        Update: {
          base_salary?: number | null
          contract_type?: string
          created_at?: string
          employee_id?: string
          gross_commission?: number | null
          gross_pay?: number | null
          has_transport_subsidy?: boolean | null
          health_deduction?: number | null
          id?: string
          loans_deducted?: number | null
          net_pay?: number | null
          notes?: string | null
          payment_type?: string
          payroll_period_id?: string
          pension_deduction?: number | null
          salary_frequency?: string | null
          total_deductions?: number | null
          total_services?: number | null
          transport_subsidy_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_items_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_items_payroll_period_id_fkey"
            columns: ["payroll_period_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_periods: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          period: string
          status: string
          total_deductions: number | null
          total_employees: number | null
          total_gross_pay: number | null
          total_net_pay: number | null
          total_transport_subsidy: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          period: string
          status?: string
          total_deductions?: number | null
          total_employees?: number | null
          total_gross_pay?: number | null
          total_net_pay?: number | null
          total_transport_subsidy?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          period?: string
          status?: string
          total_deductions?: number | null
          total_employees?: number | null
          total_gross_pay?: number | null
          total_net_pay?: number | null
          total_transport_subsidy?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_periods_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_receipt_loans: {
        Row: {
          amount_deducted: number
          created_at: string
          id: string
          loan_id: string
          receipt_id: string
        }
        Insert: {
          amount_deducted: number
          created_at?: string
          id?: string
          loan_id: string
          receipt_id: string
        }
        Update: {
          amount_deducted?: number
          created_at?: string
          id?: string
          loan_id?: string
          receipt_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_receipt_loans_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "employee_loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_receipt_loans_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "payroll_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_receipt_services: {
        Row: {
          appointment_id: string
          commission_amount: number
          commission_rate_applied: number
          created_at: string
          id: string
          receipt_id: string
          service_name: string
          service_price: number
        }
        Insert: {
          appointment_id: string
          commission_amount: number
          commission_rate_applied: number
          created_at?: string
          id?: string
          receipt_id: string
          service_name: string
          service_price: number
        }
        Update: {
          appointment_id?: string
          commission_amount?: number
          commission_rate_applied?: number
          created_at?: string
          id?: string
          receipt_id?: string
          service_name?: string
          service_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_receipt_services_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_receipt_services_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "payroll_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_receipts: {
        Row: {
          commission_amount: number
          created_at: string
          employee_id: string
          fixed_salary_amount: number
          gross_services_value: number
          id: string
          is_salary_separate: boolean | null
          loans_deducted: number
          net_amount: number
          notes: string | null
          organization_id: string
          paid_at: string | null
          payment_date: string
          payment_method: string | null
          payment_reference: string | null
          period_end: string
          period_start: string
          period_type: string
          status: string
          updated_at: string
        }
        Insert: {
          commission_amount?: number
          created_at?: string
          employee_id: string
          fixed_salary_amount?: number
          gross_services_value?: number
          id?: string
          is_salary_separate?: boolean | null
          loans_deducted?: number
          net_amount?: number
          notes?: string | null
          organization_id: string
          paid_at?: string | null
          payment_date: string
          payment_method?: string | null
          payment_reference?: string | null
          period_end: string
          period_start: string
          period_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          commission_amount?: number
          created_at?: string
          employee_id?: string
          fixed_salary_amount?: number
          gross_services_value?: number
          id?: string
          is_salary_separate?: boolean | null
          loans_deducted?: number
          net_amount?: number
          notes?: string | null
          organization_id?: string
          paid_at?: string | null
          payment_date?: string
          payment_method?: string | null
          payment_reference?: string | null
          period_end?: string
          period_start?: string
          period_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_receipts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_receipts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      period_commissions: {
        Row: {
          appointment_id: string
          appointment_service_id: string | null
          commission_amount: number
          created_at: string
          id: string
          notes: string | null
          payroll_item_id: string
          percentage_applied: number
          service_date: string
          service_id: string | null
          service_name: string
          service_value: number
        }
        Insert: {
          appointment_id: string
          appointment_service_id?: string | null
          commission_amount: number
          created_at?: string
          id?: string
          notes?: string | null
          payroll_item_id: string
          percentage_applied: number
          service_date: string
          service_id?: string | null
          service_name: string
          service_value: number
        }
        Update: {
          appointment_id?: string
          appointment_service_id?: string | null
          commission_amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payroll_item_id?: string
          percentage_applied?: number
          service_date?: string
          service_id?: string | null
          service_name?: string
          service_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "period_commissions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "period_commissions_payroll_item_id_fkey"
            columns: ["payroll_item_id"]
            isOneToOne: false
            referencedRelation: "payroll_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "period_commissions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          currency: string | null
          description: string | null
          features: Json | null
          id: string
          max_credit_clients: number
          max_employees: number
          max_inventory_items: number
          max_services: number
          name: string
          price: number
          stripe_price_id: string | null
          whatsapp_enabled: boolean
        }
        Insert: {
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          max_credit_clients?: number
          max_employees: number
          max_inventory_items?: number
          max_services: number
          name: string
          price: number
          stripe_price_id?: string | null
          whatsapp_enabled?: boolean
        }
        Update: {
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          max_credit_clients?: number
          max_employees?: number
          max_inventory_items?: number
          max_services?: number
          name?: string
          price?: number
          stripe_price_id?: string | null
          whatsapp_enabled?: boolean
        }
        Relationships: []
      }
      promo_code_uses: {
        Row: {
          id: string
          organization_id: string | null
          promo_code_id: string | null
          used_at: string | null
        }
        Insert: {
          id?: string
          organization_id?: string | null
          promo_code_id?: string | null
          used_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string | null
          promo_code_id?: string | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_uses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_uses_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          name: string | null
          type: string
          used_count: number | null
          valid_until: string | null
          value: number
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          name?: string | null
          type: string
          used_count?: number | null
          valid_until?: string | null
          value: number
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          name?: string | null
          type?: string
          used_count?: number | null
          valid_until?: string | null
          value?: number
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean
          created_at: string
          duration: number
          has_commission: boolean | null
          id: string
          name: string
          organization_id: string
          price: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          duration: number
          has_commission?: boolean | null
          id?: string
          name: string
          organization_id: string
          price: number
        }
        Update: {
          active?: boolean
          created_at?: string
          duration?: number
          has_commission?: boolean | null
          id?: string
          name?: string
          organization_id?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      shadow_notification_logs: {
        Row: {
          appointment_id: string
          comparison_detail: Json
          comparison_version: string
          created_at: string
          drift_score: number
          drift_types: string[]
          id: string
          organization_id: string
          seed_id: string
          severity: string
          snapshot_version: string
          v1_normalized: Json
          v2_normalized: Json
        }
        Insert: {
          appointment_id: string
          comparison_detail: Json
          comparison_version: string
          created_at?: string
          drift_score?: number
          drift_types?: string[]
          id?: string
          organization_id: string
          seed_id: string
          severity?: string
          snapshot_version: string
          v1_normalized: Json
          v2_normalized: Json
        }
        Update: {
          appointment_id?: string
          comparison_detail?: Json
          comparison_version?: string
          created_at?: string
          drift_score?: number
          drift_types?: string[]
          id?: string
          organization_id?: string
          seed_id?: string
          severity?: string
          snapshot_version?: string
          v1_normalized?: Json
          v2_normalized?: Json
        }
        Relationships: [
          {
            foreignKeyName: "shadow_notification_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shadow_notification_logs_seed_id_fkey"
            columns: ["seed_id"]
            isOneToOne: false
            referencedRelation: "shadow_notification_seeds"
            referencedColumns: ["id"]
          },
        ]
      }
      shadow_notification_seeds: {
        Row: {
          appointment_id: string
          attempts: number
          claimed_at: string | null
          correlation_id: string
          created_at: string
          id: string
          last_error: string | null
          max_attempts: number
          organization_id: string
          snapshot_version: string
          status: string
          v1_snapshot: Json
        }
        Insert: {
          appointment_id: string
          attempts?: number
          claimed_at?: string | null
          correlation_id: string
          created_at?: string
          id?: string
          last_error?: string | null
          max_attempts?: number
          organization_id: string
          snapshot_version: string
          status?: string
          v1_snapshot: Json
        }
        Update: {
          appointment_id?: string
          attempts?: number
          claimed_at?: string | null
          correlation_id?: string
          created_at?: string
          id?: string
          last_error?: string | null
          max_attempts?: number
          organization_id?: string
          snapshot_version?: string
          status?: string
          v1_snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "shadow_notification_seeds_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      shadow_validation_logs: {
        Row: {
          actor_id: string
          actor_role: string
          appointment_id: string | null
          captured_at: string
          classification: string | null
          command: string
          correlation_id: string
          created_at: string
          drift_detail: Json | null
          drift_detected: boolean
          id: string
          legacy_result: Json
          orchestrator_result: Json
          organization_id: string
          shadow_mode: string
          snapshot_changed: boolean
          source_path: string | null
          state_after: Json
          state_before: Json | null
          validation_version: string
        }
        Insert: {
          actor_id: string
          actor_role: string
          appointment_id?: string | null
          captured_at: string
          classification?: string | null
          command: string
          correlation_id: string
          created_at?: string
          drift_detail?: Json | null
          drift_detected?: boolean
          id?: string
          legacy_result: Json
          orchestrator_result: Json
          organization_id: string
          shadow_mode?: string
          snapshot_changed?: boolean
          source_path?: string | null
          state_after: Json
          state_before?: Json | null
          validation_version: string
        }
        Update: {
          actor_id?: string
          actor_role?: string
          appointment_id?: string | null
          captured_at?: string
          classification?: string | null
          command?: string
          correlation_id?: string
          created_at?: string
          drift_detail?: Json | null
          drift_detected?: boolean
          id?: string
          legacy_result?: Json
          orchestrator_result?: Json
          organization_id?: string
          shadow_mode?: string
          snapshot_changed?: boolean
          source_path?: string | null
          state_after?: Json
          state_before?: Json | null
          validation_version?: string
        }
        Relationships: [
          {
            foreignKeyName: "shadow_validation_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      spa_availability_overrides: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          end_time: string | null
          id: string
          is_day_off: boolean
          organization_id: string
          reason: string | null
          start_time: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          end_time?: string | null
          id?: string
          is_day_off?: boolean
          organization_id: string
          reason?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          end_time?: string | null
          id?: string
          is_day_off?: boolean
          organization_id?: string
          reason?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spa_availability_overrides_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          organization_id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          trial_started_at: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          organization_id: string
          plan_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          organization_id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      system_logs: {
        Row: {
          created_at: string
          id: string
          level: string
          message: string
          organization_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          level?: string
          message: string
          organization_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          message?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_activation_requests: {
        Row: {
          business_phone: string
          contact_name: string
          id: string
          organization_id: string
          processed_at: string | null
          processed_by: string | null
          requested_at: string
          status: string
        }
        Insert: {
          business_phone: string
          contact_name: string
          id?: string
          organization_id: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: string
        }
        Update: {
          business_phone?: string
          contact_name?: string
          id?: string
          organization_id?: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_activation_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_logs: {
        Row: {
          appointment_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          message_type: string
          n8n_response: Json | null
          organization_id: string
          phone_number: string
          sent_at: string | null
          status: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          message_type?: string
          n8n_response?: Json | null
          organization_id: string
          phone_number: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          message_type?: string
          n8n_response?: Json | null
          organization_id?: string
          phone_number?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          appointment_id: string | null
          attempts: number
          created_at: string
          id: string
          integration_id: string | null
          organization_id: string
          payload: Json | null
          phone: string
          scheduled_at: string
          sent_at: string | null
          status: string
          template: string
        }
        Insert: {
          appointment_id?: string | null
          attempts?: number
          created_at?: string
          id?: string
          integration_id?: string | null
          organization_id: string
          payload?: Json | null
          phone: string
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          template: string
        }
        Update: {
          appointment_id?: string | null
          attempts?: number
          created_at?: string
          id?: string
          integration_id?: string | null
          organization_id?: string
          payload?: Json | null
          phone?: string
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          template?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_settings: {
        Row: {
          api_key: string | null
          created_at: string | null
          enabled: boolean | null
          id: string
          organization_id: string
          reminder_hours_before: number | null
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          api_key?: string | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          organization_id: string
          reminder_hours_before?: number | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          api_key?: string | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          organization_id?: string
          reminder_hours_before?: number | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_employee_invitation: {
        Args: { p_organization_id: string; p_role: string; p_user_id: string }
        Returns: undefined
      }
      calculate_daily_analytics: {
        Args: { p_date: string; p_organization_id: string }
        Returns: undefined
      }
      can_resend_invitation: {
        Args: { p_invitation_id: string }
        Returns: boolean
      }
      claim_notification_batch: {
        Args: { batch_size?: number; worker_id?: string; worker_ver?: string }
        Returns: {
          appointment_id: string | null
          attempts: number | null
          channel: string
          claimed_at: string | null
          claimed_by: string | null
          completed_at: string | null
          correlation_id: string | null
          created_at: string | null
          delivered_at: string | null
          id: string
          idempotency_key: string
          last_claimed_at: string | null
          last_error: string | null
          manual_replay: boolean | null
          max_attempts: number | null
          next_retry_at: string | null
          organization_id: string
          processing_started_at: string | null
          processing_timeout_at: string | null
          provider_message_id: string | null
          provider_response: Json | null
          provider_snapshot: Json | null
          read_at: string | null
          rendered_body: string | null
          replay_reason: string | null
          replayed_at: string | null
          replayed_by_user_id: string | null
          replayed_from_queue_item_id: string | null
          scheduled_at: string
          sent_at: string | null
          status: string
          subject: string | null
          template_id: string | null
          to_address: string
          trace_id: string | null
          updated_at: string | null
          variables: Json | null
          worker_version: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "notification_queue"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      evaluate_worker_alerts: {
        Args: never
        Returns: {
          alert_code: string
          alert_level: string
          alert_message: string
          worker_name: string
        }[]
      }
      get_user_organization_ids: {
        Args: { p_user_id: string }
        Returns: {
          organization_id: string
        }[]
      }
      upsert_worker_heartbeat: {
        Args: {
          p_dlq_depth?: number
          p_error_count?: number
          p_last_error?: string
          p_last_latency_ms?: number
          p_metadata?: Json
          p_processed_count?: number
          p_queue_depth?: number
          p_status?: string
          p_success_count?: number
          p_worker_name: string
        }
        Returns: undefined
      }
    }
    Enums: {
      appointment_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "canceled"
        | "no_show"
      confirmation_method: "whatsapp" | "phone_call" | "in_person" | "none"
      integration_status: "disabled" | "pending" | "active" | "suspended"
      log_level: "info" | "warn" | "error" | "critical"
      message_status: "pending" | "processing" | "sent" | "failed"
      preferred_contact: "whatsapp" | "phone" | "email"
      role_type: "owner" | "admin" | "staff"
      subscription_status:
        | "trial"
        | "active"
        | "past_due"
        | "canceled"
        | "unpaid"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      appointment_status: [
        "pending",
        "confirmed",
        "completed",
        "canceled",
        "no_show",
      ],
      confirmation_method: ["whatsapp", "phone_call", "in_person", "none"],
      integration_status: ["disabled", "pending", "active", "suspended"],
      log_level: ["info", "warn", "error", "critical"],
      message_status: ["pending", "processing", "sent", "failed"],
      preferred_contact: ["whatsapp", "phone", "email"],
      role_type: ["owner", "admin", "staff"],
      subscription_status: [
        "trial",
        "active",
        "past_due",
        "canceled",
        "unpaid",
      ],
    },
  },
} as const
