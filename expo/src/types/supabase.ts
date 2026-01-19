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
            profiles: {
                Row: {
                    id: string
                    email: string | null
                    credits: number
                    avatar_url: string | null
                    created_at: string
                }
                Insert: {
                    id: string
                    email?: string | null
                    credits?: number
                    avatar_url?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    email?: string | null
                    credits?: number
                    avatar_url?: string | null
                    created_at?: string
                }
            }
            bet_history: {
                Row: {
                    id: string
                    user_id: string
                    bet_details: Json | null
                    amount: number
                    outcome: number
                    timestamp: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    bet_details?: Json | null
                    amount: number
                    outcome: number
                    timestamp?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    bet_details?: Json | null
                    amount?: number
                    outcome?: number
                    timestamp?: string
                }
            }
        }
    }
}
