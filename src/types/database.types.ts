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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      _tickets_status_backup: {
        Row: {
          id: string | null
          status_backup: string | null
        }
        Insert: {
          id?: string | null
          status_backup?: string | null
        }
        Update: {
          id?: string | null
          status_backup?: string | null
        }
        Relationships: []
      }
      activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type_t"] | null
          created_at: string | null
          created_by: string | null
          id: string
          planned_end: string | null
          planned_start: string | null
          report_content: string | null
          status: Database["public"]["Enums"]["activity_status_t"] | null
          team_id: string | null
          title: string
          updated_at: string | null
          validated_by_manager: boolean | null
        }
        Insert: {
          activity_type?: Database["public"]["Enums"]["activity_type_t"] | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          planned_end?: string | null
          planned_start?: string | null
          report_content?: string | null
          status?: Database["public"]["Enums"]["activity_status_t"] | null
          team_id?: string | null
          title: string
          updated_at?: string | null
          validated_by_manager?: boolean | null
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type_t"] | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          planned_end?: string | null
          planned_start?: string | null
          report_content?: string | null
          status?: Database["public"]["Enums"]["activity_status_t"] | null
          team_id?: string | null
          title?: string
          updated_at?: string | null
          validated_by_manager?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_participants: {
        Row: {
          activity_id: string
          is_invited_external: boolean | null
          role: string | null
          user_id: string
        }
        Insert: {
          activity_id: string
          is_invited_external?: boolean | null
          role?: string | null
          user_id: string
        }
        Update: {
          activity_id?: string
          is_invited_external?: boolean | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_participants_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_report_attachments: {
        Row: {
          activity_id: string
          file_path: string | null
          id: string
          mime_type: string | null
          size_kb: number | null
          stored_at: string | null
        }
        Insert: {
          activity_id: string
          file_path?: string | null
          id?: string
          mime_type?: string | null
          size_kb?: number | null
          stored_at?: string | null
        }
        Update: {
          activity_id?: string
          file_path?: string | null
          id?: string
          mime_type?: string | null
          size_kb?: number | null
          stored_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_report_attachments_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_report_history: {
        Row: {
          activity_id: string
          author_id: string | null
          content_snapshot: string | null
          id: string
          timestamp: string | null
        }
        Insert: {
          activity_id: string
          author_id?: string | null
          content_snapshot?: string | null
          id?: string
          timestamp?: string | null
        }
        Update: {
          activity_id?: string
          author_id?: string | null
          content_snapshot?: string | null
          id?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_report_history_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_report_history_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_task_link: {
        Row: {
          activity_id: string
          task_id: string
        }
        Insert: {
          activity_id: string
          task_id: string
        }
        Update: {
          activity_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_task_link_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_task_link_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_attachments: {
        Row: {
          comment_id: string
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          size_kb: number | null
          stored_at: string | null
        }
        Insert: {
          comment_id: string
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          size_kb?: number | null
          stored_at?: string | null
        }
        Update: {
          comment_id?: string
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          size_kb?: number | null
          stored_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comment_attachments_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "ticket_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          object_id: string
          object_type: string
          origin: Database["public"]["Enums"]["comment_origin_t"] | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          object_id: string
          object_type: string
          origin?: Database["public"]["Enums"]["comment_origin_t"] | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          object_id?: string
          object_type?: string
          origin?: Database["public"]["Enums"]["comment_origin_t"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          country_id: string | null
          created_at: string | null
          focal_user_id: string | null
          id: string
          jira_company_id: number | null
          name: string
        }
        Insert: {
          country_id?: string | null
          created_at?: string | null
          focal_user_id?: string | null
          id?: string
          jira_company_id?: number | null
          name: string
        }
        Update: {
          country_id?: string | null
          created_at?: string | null
          focal_user_id?: string | null
          id?: string
          jira_company_id?: number | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_focal_user_id_fkey"
            columns: ["focal_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_sector_link: {
        Row: {
          company_id: string
          created_at: string | null
          sector_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          sector_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          sector_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_sector_link_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_sector_link_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      company_sectors: {
        Row: {
          company_id: string
          created_at: string
          id: string
          sector_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          sector_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          sector_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_company_sectors_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_company_sectors_sector"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          created_at: string | null
          id: string
          iso_code: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          iso_code?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          iso_code?: string | null
          name?: string
        }
        Relationships: []
      }
      dashboard_configurations: {
        Row: {
          created_at: string
          id: string
          role: string
          sections: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          sections?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          sections?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_configurations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_role_widgets: {
        Row: {
          created_at: string | null
          enabled: boolean
          id: string
          role: string
          updated_at: string | null
          updated_by: string | null
          widget_id: Database["public"]["Enums"]["dashboardwidget"]
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean
          id?: string
          role: string
          updated_at?: string | null
          updated_by?: string | null
          widget_id: Database["public"]["Enums"]["dashboardwidget"]
        }
        Update: {
          created_at?: string | null
          enabled?: boolean
          id?: string
          role?: string
          updated_at?: string | null
          updated_by?: string | null
          widget_id?: Database["public"]["Enums"]["dashboardwidget"]
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_role_widgets_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_user_preferences: {
        Row: {
          id: string
          profile_id: string
          updated_at: string | null
          visible: boolean
          widget_id: Database["public"]["Enums"]["dashboardwidget"]
        }
        Insert: {
          id?: string
          profile_id: string
          updated_at?: string | null
          visible?: boolean
          widget_id: Database["public"]["Enums"]["dashboardwidget"]
        }
        Update: {
          id?: string
          profile_id?: string
          updated_at?: string | null
          visible?: boolean
          widget_id?: Database["public"]["Enums"]["dashboardwidget"]
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_user_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      features: {
        Row: {
          created_at: string | null
          id: string
          jira_feature_id: number | null
          name: string
          submodule_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          jira_feature_id?: number | null
          name: string
          submodule_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          jira_feature_id?: number | null
          name?: string
          submodule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "features_submodule_id_fkey"
            columns: ["submodule_id"]
            isOneToOne: false
            referencedRelation: "submodules"
            referencedColumns: ["id"]
          },
        ]
      }
      jira_feature_mapping: {
        Row: {
          created_at: string | null
          feature_id: string | null
          id: string
          jira_custom_field_id: string
          jira_feature_id: string | null
          jira_feature_value: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          feature_id?: string | null
          id?: string
          jira_custom_field_id?: string
          jira_feature_id?: string | null
          jira_feature_value: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          feature_id?: string | null
          id?: string
          jira_custom_field_id?: string
          jira_feature_id?: string | null
          jira_feature_value?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jira_feature_mapping_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
        ]
      }
      jira_priority_mapping: {
        Row: {
          created_at: string | null
          id: string
          jira_priority_name: string
          supabase_priority: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          jira_priority_name: string
          supabase_priority: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          jira_priority_name?: string
          supabase_priority?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      jira_status_mapping: {
        Row: {
          created_at: string | null
          id: string
          jira_status_name: string
          supabase_status: string
          ticket_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          jira_status_name: string
          supabase_status: string
          ticket_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          jira_status_name?: string
          supabase_status?: string
          ticket_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      jira_sync: {
        Row: {
          customfield_supabase_ticket_id: string | null
          jira_assignee_account_id: string | null
          jira_fix_version: string | null
          jira_issue_key: string | null
          jira_issue_type: string | null
          jira_priority: string | null
          jira_related_ticket_key: string | null
          jira_reporter_account_id: string | null
          jira_resolution: string | null
          jira_resolved_at: string | null
          jira_sprint_id: string | null
          jira_status: string | null
          jira_target_date: string | null
          jira_test_status: string | null
          jira_workflow_status: string | null
          last_priority_sync: string | null
          last_status_sync: string | null
          last_synced_at: string | null
          origin: Database["public"]["Enums"]["origin_t"] | null
          sync_error: string | null
          sync_metadata: Json | null
          ticket_id: string
        }
        Insert: {
          customfield_supabase_ticket_id?: string | null
          jira_assignee_account_id?: string | null
          jira_fix_version?: string | null
          jira_issue_key?: string | null
          jira_issue_type?: string | null
          jira_priority?: string | null
          jira_related_ticket_key?: string | null
          jira_reporter_account_id?: string | null
          jira_resolution?: string | null
          jira_resolved_at?: string | null
          jira_sprint_id?: string | null
          jira_status?: string | null
          jira_target_date?: string | null
          jira_test_status?: string | null
          jira_workflow_status?: string | null
          last_priority_sync?: string | null
          last_status_sync?: string | null
          last_synced_at?: string | null
          origin?: Database["public"]["Enums"]["origin_t"] | null
          sync_error?: string | null
          sync_metadata?: Json | null
          ticket_id: string
        }
        Update: {
          customfield_supabase_ticket_id?: string | null
          jira_assignee_account_id?: string | null
          jira_fix_version?: string | null
          jira_issue_key?: string | null
          jira_issue_type?: string | null
          jira_priority?: string | null
          jira_related_ticket_key?: string | null
          jira_reporter_account_id?: string | null
          jira_resolution?: string | null
          jira_resolved_at?: string | null
          jira_sprint_id?: string | null
          jira_status?: string | null
          jira_target_date?: string | null
          jira_test_status?: string | null
          jira_workflow_status?: string | null
          last_priority_sync?: string | null
          last_status_sync?: string | null
          last_synced_at?: string | null
          origin?: Database["public"]["Enums"]["origin_t"] | null
          sync_error?: string | null
          sync_metadata?: Json | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jira_sync_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string | null
          id: string
          id_module_jira: number | null
          name: string
          product_id: string
          Statut: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          id_module_jira?: number | null
          name: string
          product_id: string
          Statut?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          id_module_jira?: number | null
          name?: string
          product_id?: string
          Statut?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      od_obcs_mapping: {
        Row: {
          created_at: string | null
          id: string
          obcs_issue_key: string
          od_issue_key: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          obcs_issue_key: string
          od_issue_key: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          obcs_issue_key?: string
          od_issue_key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      product_department_link: {
        Row: {
          created_at: string | null
          department_id: string
          id: string
          product_id: string
        }
        Insert: {
          created_at?: string | null
          department_id: string
          id?: string
          product_id: string
        }
        Update: {
          created_at?: string | null
          department_id?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_department_link_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_department_link_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          accent_color: string | null
          created_at: string | null
          description: string | null
          id: string
          jira_product_id: number | null
          name: string
        }
        Insert: {
          accent_color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          jira_product_id?: number | null
          name: string
        }
        Update: {
          accent_color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          jira_product_id?: number | null
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account: string | null
          auth_uid: string | null
          company_id: string | null
          created_at: string | null
          department: Database["public"]["Enums"]["department_t"] | null
          department_id: string | null
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          jira_user_id: string | null
          job_title: string | null
          role: Database["public"]["Enums"]["user_role_t"]
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          account?: string | null
          auth_uid?: string | null
          company_id?: string | null
          created_at?: string | null
          department?: Database["public"]["Enums"]["department_t"] | null
          department_id?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          jira_user_id?: string | null
          job_title?: string | null
          role?: Database["public"]["Enums"]["user_role_t"]
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account?: string | null
          auth_uid?: string | null
          company_id?: string | null
          created_at?: string | null
          department?: Database["public"]["Enums"]["department_t"] | null
          department_id?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          jira_user_id?: string | null
          job_title?: string | null
          role?: Database["public"]["Enums"]["user_role_t"]
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          description: string | null
          id: number
          name: string
        }
        Insert: {
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      sectors: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      submodules: {
        Row: {
          created_at: string | null
          id: string
          id_module_jira: number | null
          module_id: string
          name: string | null
          Statut: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          id_module_jira?: number | null
          module_id: string
          name?: string | null
          Statut?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          id_module_jira?: number | null
          module_id?: string
          name?: string | null
          Statut?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submodules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      task_attachments: {
        Row: {
          file_path: string | null
          id: string
          mime_type: string | null
          size_kb: number | null
          stored_at: string | null
          task_id: string
        }
        Insert: {
          file_path?: string | null
          id?: string
          mime_type?: string | null
          size_kb?: number | null
          stored_at?: string | null
          task_id: string
        }
        Update: {
          file_path?: string | null
          id?: string
          mime_type?: string | null
          size_kb?: number | null
          stored_at?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_history: {
        Row: {
          author_id: string | null
          content_snapshot: string | null
          id: string
          task_id: string
          timestamp: string | null
        }
        Insert: {
          author_id?: string | null
          content_snapshot?: string | null
          id?: string
          task_id: string
          timestamp?: string | null
        }
        Update: {
          author_id?: string | null
          content_snapshot?: string | null
          id?: string
          task_id?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_history_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_history_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          is_planned: boolean | null
          report_content: string | null
          status: Database["public"]["Enums"]["task_status_t"] | null
          team_id: string | null
          title: string
          updated_at: string | null
          validated_by_manager: boolean | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_planned?: boolean | null
          report_content?: string | null
          status?: Database["public"]["Enums"]["task_status_t"] | null
          team_id?: string | null
          title: string
          updated_at?: string | null
          validated_by_manager?: boolean | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_planned?: boolean | null
          report_content?: string | null
          status?: Database["public"]["Enums"]["task_status_t"] | null
          team_id?: string | null
          title?: string
          updated_at?: string | null
          validated_by_manager?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      ticket_activity_link: {
        Row: {
          activity_id: string
          ticket_id: string
        }
        Insert: {
          activity_id: string
          ticket_id: string
        }
        Update: {
          activity_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_activity_link_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_activity_link_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_attachments: {
        Row: {
          created_at: string | null
          file_path: string
          id: string
          mime_type: string | null
          size_kb: number | null
          ticket_id: string
        }
        Insert: {
          created_at?: string | null
          file_path: string
          id?: string
          mime_type?: string | null
          size_kb?: number | null
          ticket_id: string
        }
        Update: {
          created_at?: string | null
          file_path?: string
          id?: string
          mime_type?: string | null
          size_kb?: number | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_attachments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          jira_comment_id: string | null
          origin: Database["public"]["Enums"]["comment_origin_t"] | null
          ticket_id: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          jira_comment_id?: string | null
          origin?: Database["public"]["Enums"]["comment_origin_t"] | null
          ticket_id: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          jira_comment_id?: string | null
          origin?: Database["public"]["Enums"]["comment_origin_t"] | null
          ticket_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_company_link: {
        Row: {
          company_id: string
          created_at: string | null
          is_primary: boolean | null
          role: string | null
          ticket_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          is_primary?: boolean | null
          role?: string | null
          ticket_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          is_primary?: boolean | null
          role?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_company_link_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_company_link_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_department_link: {
        Row: {
          created_at: string | null
          department_id: string
          is_primary: boolean | null
          ticket_id: string
        }
        Insert: {
          created_at?: string | null
          department_id: string
          is_primary?: boolean | null
          ticket_id: string
        }
        Update: {
          created_at?: string | null
          department_id?: string
          is_primary?: boolean | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_department_link_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_department_link_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_status_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          id: string
          source: Database["public"]["Enums"]["origin_t"]
          status_from: Database["public"]["Enums"]["ticket_status_t"] | null
          status_to: Database["public"]["Enums"]["ticket_status_t"] | null
          ticket_id: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          source?: Database["public"]["Enums"]["origin_t"]
          status_from?: Database["public"]["Enums"]["ticket_status_t"] | null
          status_to?: Database["public"]["Enums"]["ticket_status_t"] | null
          ticket_id: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          source?: Database["public"]["Enums"]["origin_t"]
          status_from?: Database["public"]["Enums"]["ticket_status_t"] | null
          status_to?: Database["public"]["Enums"]["ticket_status_t"] | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_status_history_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_task_link: {
        Row: {
          task_id: string
          ticket_id: string
        }
        Insert: {
          task_id: string
          ticket_id: string
        }
        Update: {
          task_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_task_link_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_task_link_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          affects_all_companies: boolean | null
          assigned_to: string | null
          bug_type: Database["public"]["Enums"]["bug_type_enum"] | null
          canal: Database["public"]["Enums"]["canal_t"] | null
          company_id: string | null
          contact_user_id: string | null
          created_at: string | null
          created_by: string | null
          custom_fields: Json | null
          customer_context: string | null
          description: string | null
          duration_minutes: number | null
          feature_id: string | null
          fix_version: string | null
          id: string
          issue_type: string | null
          jira_issue_id: string | null
          jira_issue_key: string | null
          jira_metadata: Json | null
          last_update_source: string | null
          module_id: string | null
          origin: Database["public"]["Enums"]["origin_t"] | null
          priority: Database["public"]["Enums"]["priority_t"] | null
          product_id: string | null
          related_ticket_id: string | null
          related_ticket_key: string | null
          resolution: string | null
          resolved_at: string | null
          sprint_id: string | null
          status: string
          submodule_id: string | null
          target_date: string | null
          team_id: string | null
          test_status: string | null
          ticket_type: Database["public"]["Enums"]["ticket_type_t"]
          title: string
          updated_at: string | null
          validated_by_manager: boolean | null
          workflow_status: string | null
        }
        Insert: {
          affects_all_companies?: boolean | null
          assigned_to?: string | null
          bug_type?: Database["public"]["Enums"]["bug_type_enum"] | null
          canal?: Database["public"]["Enums"]["canal_t"] | null
          company_id?: string | null
          contact_user_id?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          customer_context?: string | null
          description?: string | null
          duration_minutes?: number | null
          feature_id?: string | null
          fix_version?: string | null
          id?: string
          issue_type?: string | null
          jira_issue_id?: string | null
          jira_issue_key?: string | null
          jira_metadata?: Json | null
          last_update_source?: string | null
          module_id?: string | null
          origin?: Database["public"]["Enums"]["origin_t"] | null
          priority?: Database["public"]["Enums"]["priority_t"] | null
          product_id?: string | null
          related_ticket_id?: string | null
          related_ticket_key?: string | null
          resolution?: string | null
          resolved_at?: string | null
          sprint_id?: string | null
          status?: string
          submodule_id?: string | null
          target_date?: string | null
          team_id?: string | null
          test_status?: string | null
          ticket_type: Database["public"]["Enums"]["ticket_type_t"]
          title: string
          updated_at?: string | null
          validated_by_manager?: boolean | null
          workflow_status?: string | null
        }
        Update: {
          affects_all_companies?: boolean | null
          assigned_to?: string | null
          bug_type?: Database["public"]["Enums"]["bug_type_enum"] | null
          canal?: Database["public"]["Enums"]["canal_t"] | null
          company_id?: string | null
          contact_user_id?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          customer_context?: string | null
          description?: string | null
          duration_minutes?: number | null
          feature_id?: string | null
          fix_version?: string | null
          id?: string
          issue_type?: string | null
          jira_issue_id?: string | null
          jira_issue_key?: string | null
          jira_metadata?: Json | null
          last_update_source?: string | null
          module_id?: string | null
          origin?: Database["public"]["Enums"]["origin_t"] | null
          priority?: Database["public"]["Enums"]["priority_t"] | null
          product_id?: string | null
          related_ticket_id?: string | null
          related_ticket_key?: string | null
          resolution?: string | null
          resolved_at?: string | null
          sprint_id?: string | null
          status?: string
          submodule_id?: string | null
          target_date?: string | null
          team_id?: string | null
          test_status?: string | null
          ticket_type?: Database["public"]["Enums"]["ticket_type_t"]
          title?: string
          updated_at?: string | null
          validated_by_manager?: boolean | null
          workflow_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_contact_user_id_fkey"
            columns: ["contact_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_related_ticket_id_fkey"
            columns: ["related_ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_submodule_id_fkey"
            columns: ["submodule_id"]
            isOneToOne: false
            referencedRelation: "submodules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_module_assignments: {
        Row: {
          assigned_at: string | null
          module_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          module_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          module_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_module_assignments_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_module_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      count_tickets_by_type: {
        Args: { agent_ids?: string[]; end_date: string; start_date: string }
        Returns: {
          count: number
          ticket_type: string
        }[]
      }
      count_tickets_with_client: {
        Args: {
          p_search_term?: string
          p_status?: string
          p_ticket_type?: string
        }
        Returns: number
      }
      get_feature_id_from_jira: {
        Args: { p_jira_custom_field_id?: string; p_jira_feature_value: string }
        Returns: string
      }
      get_submodule_id_from_feature_id: {
        Args: { p_feature_id: string }
        Returns: string
      }
      get_supabase_channel_from_jira: {
        Args: { p_jira_channel: string }
        Returns: string
      }
      get_supabase_priority_from_jira: {
        Args: { p_jira_priority: string }
        Returns: string
      }
      get_supabase_status_from_jira: {
        Args: { p_jira_status: string; p_ticket_type: string }
        Returns: string
      }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      search_tickets_with_client: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_search_term?: string
          p_status?: string
          p_ticket_type?: string
        }
        Returns: {
          assigned_to: string
          assigned_user: Json
          canal: string
          contact_company: Json
          contact_user: Json
          created_at: string
          description: string
          id: string
          jira_issue_key: string
          module: Json
          origin: string
          priority: string
          product: Json
          status: string
          ticket_type: string
          title: string
        }[]
      }
      user_can_access_product: {
        Args: {
          target_assigned_to?: string
          target_created_by?: string
          target_department_id: string
          target_product_id: string
        }
        Returns: boolean
      }
      user_can_access_product_via_department: {
        Args: { target_product_id: string; user_department_id: string }
        Returns: boolean
      }
    }
    Enums: {
      activity_status_t:
        | "Brouillon"
        | "Planifie"
        | "En_cours"
        | "Termine"
        | "Annule"
      activity_type_t:
        | "Revue"
        | "Brainstorm"
        | "Atelier"
        | "Presentation"
        | "Demo"
        | "Autre"
      bug_type_enum:
        | "Autres"
        | "Mauvais déversement des données"
        | "Dysfonctionnement sur le Calcul des salaires"
        | "Duplication anormale"
        | "Enregistrement impossible"
        | "Page d'erreur"
        | "Historique vide/non exhaustif"
        | "Non affichage de pages/données"
        | "Lenteur Système"
        | "Import de fichiers impossible"
        | "Suppression impossible"
        | "Récupération de données impossible"
        | "Edition impossible"
        | "Dysfonctionnement des filtres"
        | "Error 503"
        | "Impression impossible"
        | "Erreur de calcul/Erreur sur Dashboard"
        | "Dysfonctionnement Workflow"
        | "Erreur serveur"
        | "Dysfonctionnement des liens d'accès"
        | "Formulaire indisponible"
        | "Erreur Ajax"
        | "Export de données impossible"
        | "Connexion impossible"
      canal_t:
        | "Whatsapp"
        | "Email"
        | "Appel"
        | "Autre"
        | "Appel Téléphonique"
        | "Appel WhatsApp"
        | "Chat SMS"
        | "Chat WhatsApp"
        | "Constat Interne"
        | "E-mail"
        | "En présentiel"
        | "Non enregistré"
        | "Online (Google Meet, Teams...)"
        | "En prsentiel"
      comment_origin_t: "app" | "jira_comment"
      dashboardwidget: "mttr" | "flux" | "workload" | "health" | "alerts"
      department_t: "Support" | "IT" | "Marketing"
      origin_t: "supabase" | "jira"
      priority_t: "Low" | "Medium" | "High" | "Critical"
      task_status_t: "A_faire" | "En_cours" | "Termine" | "Annule" | "Bloque"
      ticket_status_t:
        | "Nouveau"
        | "En_cours"
        | "Transfere"
        | "Resolue"
        | "To_Do"
        | "In_Progress"
        | "Done"
        | "Closed"
      ticket_type_t: "BUG" | "REQ" | "ASSISTANCE"
      user_role_t: "agent" | "manager" | "admin" | "director" | "client"
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
      activity_status_t: [
        "Brouillon",
        "Planifie",
        "En_cours",
        "Termine",
        "Annule",
      ],
      activity_type_t: [
        "Revue",
        "Brainstorm",
        "Atelier",
        "Presentation",
        "Demo",
        "Autre",
      ],
      bug_type_enum: [
        "Autres",
        "Mauvais déversement des données",
        "Dysfonctionnement sur le Calcul des salaires",
        "Duplication anormale",
        "Enregistrement impossible",
        "Page d'erreur",
        "Historique vide/non exhaustif",
        "Non affichage de pages/données",
        "Lenteur Système",
        "Import de fichiers impossible",
        "Suppression impossible",
        "Récupération de données impossible",
        "Edition impossible",
        "Dysfonctionnement des filtres",
        "Error 503",
        "Impression impossible",
        "Erreur de calcul/Erreur sur Dashboard",
        "Dysfonctionnement Workflow",
        "Erreur serveur",
        "Dysfonctionnement des liens d'accès",
        "Formulaire indisponible",
        "Erreur Ajax",
        "Export de données impossible",
        "Connexion impossible",
      ],
      canal_t: [
        "Whatsapp",
        "Email",
        "Appel",
        "Autre",
        "Appel Téléphonique",
        "Appel WhatsApp",
        "Chat SMS",
        "Chat WhatsApp",
        "Constat Interne",
        "E-mail",
        "En présentiel",
        "Non enregistré",
        "Online (Google Meet, Teams...)",
        "En prsentiel",
      ],
      comment_origin_t: ["app", "jira_comment"],
      dashboardwidget: ["mttr", "flux", "workload", "health", "alerts"],
      department_t: ["Support", "IT", "Marketing"],
      origin_t: ["supabase", "jira"],
      priority_t: ["Low", "Medium", "High", "Critical"],
      task_status_t: ["A_faire", "En_cours", "Termine", "Annule", "Bloque"],
      ticket_status_t: [
        "Nouveau",
        "En_cours",
        "Transfere",
        "Resolue",
        "To_Do",
        "In_Progress",
        "Done",
        "Closed",
      ],
      ticket_type_t: ["BUG", "REQ", "ASSISTANCE"],
      user_role_t: ["agent", "manager", "admin", "director", "client"],
    },
  },
} as const
