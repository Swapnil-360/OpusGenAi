export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          credits?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          credits?: number;
          updated_at?: string;
        };
      };
      generations: {
        Row: {
          id: string;
          user_id: string;
          tool_id: string;
          status: "pending" | "processing" | "completed" | "failed";
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
          status?: "pending" | "processing" | "completed" | "failed";
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
          status?: "pending" | "processing" | "completed" | "failed";
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
          type: "signup_bonus" | "generation" | "purchase" | "refund";
          description: string | null;
          generation_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          type: "signup_bonus" | "generation" | "purchase" | "refund";
          description?: string | null;
          generation_id?: string | null;
          created_at?: string;
        };
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Generation = Database["public"]["Tables"]["generations"]["Row"];
export type CreditTransaction = Database["public"]["Tables"]["credit_transactions"]["Row"];
