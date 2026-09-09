export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export type Plan = "free" | "basic" | "pro";
export type SubscriptionStatus =
  | "none"
  | "active"
  | "past_due"
  | "canceled"
  | "trialing"
  | "unpaid"
  | "incomplete";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          credits: number;
          plan: Plan;
          plan_renews_at: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: SubscriptionStatus;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          notification_prefs: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          credits?: number;
          plan?: Plan;
          plan_renews_at?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: SubscriptionStatus;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          notification_prefs?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          credits?: number;
          plan?: Plan;
          plan_renews_at?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: SubscriptionStatus;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          notification_prefs?: Json | null;
          updated_at?: string;
        };
      };
      generations: {
        Row: {
          id: string;
          user_id: string;
          tool_id: string;
          status:
            | "pending"
            | "processing"
            | "completed"
            | "failed"
            | "cancelled";
          prompt: string | null;
          input_image_url: string | null;
          output_image_url: string | null;
          credit_cost: number;
          metadata: Json;
          error_message: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          tool_id: string;
          status?:
            | "pending"
            | "processing"
            | "completed"
            | "failed"
            | "cancelled";
          prompt?: string | null;
          input_image_url?: string | null;
          output_image_url?: string | null;
          credit_cost?: number;
          metadata?: Json;
          error_message?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          status?:
            | "pending"
            | "processing"
            | "completed"
            | "failed"
            | "cancelled";
          output_image_url?: string | null;
          error_message?: string | null;
          completed_at?: string | null;
          metadata?: Json;
        };
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          type:
            | "signup_bonus"
            | "generation"
            | "purchase"
            | "refund"
            | "subscription_renewal"
            | "admin_adjustment";
          description: string | null;
          generation_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          type:
            | "signup_bonus"
            | "generation"
            | "purchase"
            | "refund"
            | "subscription_renewal"
            | "admin_adjustment";
          description?: string | null;
          generation_id?: string | null;
          created_at?: string;
        };
        Update: never;
      };
      templates: {
        Row: {
          id: string;
          name: string;
          template_type: "production" | "universal" | "campaign" | "video";
          category: string;
          description: string | null;
          tags: string[];
          prompt: string;
          image_slot_labels: string[] | null;
          image_slots_optional: boolean | null;
          cover_image_url: string | null;
          preview_video_url: string | null;
          accent_color: string | null;
          is_pro: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          template_type?: "production" | "universal" | "campaign" | "video";
          category?: string;
          description?: string | null;
          tags?: string[];
          prompt: string;
          image_slot_labels?: string[] | null;
          image_slots_optional?: boolean | null;
          cover_image_url?: string | null;
          preview_video_url?: string | null;
          accent_color?: string | null;
          is_pro?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          template_type?: "production" | "universal" | "campaign" | "video";
          category?: string;
          description?: string | null;
          tags?: string[];
          prompt?: string;
          image_slot_labels?: string[] | null;
          image_slots_optional?: boolean | null;
          cover_image_url?: string | null;
          preview_video_url?: string | null;
          accent_color?: string | null;
          is_pro?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
      };
      gallery_items: {
        Row: {
          id: string;
          generation_id: string | null;
          media_type: "image" | "video";
          media_url: string;
          cover_image_url: string | null;
          caption: string | null;
          submitted_by: string | null;
          source: "user_submitted" | "admin_added";
          status: "pending" | "approved" | "rejected";
          reviewed_by: string | null;
          sort_order: number;
          created_at: string;
          approved_at: string | null;
        };
        Insert: {
          id?: string;
          generation_id?: string | null;
          media_type: "image" | "video";
          media_url: string;
          cover_image_url?: string | null;
          caption?: string | null;
          submitted_by?: string | null;
          source?: "user_submitted" | "admin_added";
          status?: "pending" | "approved" | "rejected";
          reviewed_by?: string | null;
          sort_order?: number;
          created_at?: string;
          approved_at?: string | null;
        };
        Update: {
          caption?: string | null;
          cover_image_url?: string | null;
          status?: "pending" | "approved" | "rejected";
          reviewed_by?: string | null;
          sort_order?: number;
          approved_at?: string | null;
        };
      };
      webhook_events: {
        Row: {
          id: string;
          event_id: string;
          gateway: string;
          event_type: string;
          payload: Json | null;
          status: "processing" | "processed" | "failed";
          error_message: string | null;
          processed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          gateway?: string;
          event_type: string;
          payload?: Json | null;
          status?: "processing" | "processed" | "failed";
          error_message?: string | null;
          processed_at?: string;
          created_at?: string;
        };
        Update: {
          status?: "processing" | "processed" | "failed";
          error_message?: string | null;
          processed_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      charge_credits: {
        Args: { uid: string; amount: number };
        Returns: number | null;
      };
      refund_credits: {
        Args: { uid: string; amount: number };
        Returns: number | null;
      };
    };
    Enums: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Generation = Database["public"]["Tables"]["generations"]["Row"];
export type CreditTransaction =
  Database["public"]["Tables"]["credit_transactions"]["Row"];
export type Template = Database["public"]["Tables"]["templates"]["Row"];
export type GalleryItem = Database["public"]["Tables"]["gallery_items"]["Row"];
export type WebhookEvent =
  Database["public"]["Tables"]["webhook_events"]["Row"];
