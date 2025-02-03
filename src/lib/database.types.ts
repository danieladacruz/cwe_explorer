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
      cwe: {
        Row: {
          id: string
          name: string
          description: string
        }
        Insert: {
          id: string
          name: string
          description: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
        }
      }
      cwe_relations: {
        Row: {
          id: number
          cwe_id: string
          related_cwe: string
          relation_type: string
        }
        Insert: {
          id?: number
          cwe_id: string
          related_cwe: string
          relation_type: string
        }
        Update: {
          id?: number
          cwe_id?: string
          related_cwe?: string
          relation_type?: string
        }
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
  }
}