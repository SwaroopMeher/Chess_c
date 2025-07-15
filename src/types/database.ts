export interface Database {
  public: {
    Tables: {
      players: {
        Row: {
          id: string
          name: string
          lichess_username?: string
          email?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          lichess_username?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          lichess_username?: string
          email?: string
          updated_at?: string
        }
      }
      tournament_state: {
        Row: {
          id: string
          is_active: boolean
          registration_closed: boolean
          tournament_format: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          registration_closed?: boolean
          tournament_format?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          is_active?: boolean
          registration_closed?: boolean
          tournament_format?: string
          updated_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          white_player_id: string
          black_player_id: string
          white_player_name: string
          black_player_name: string
          round: number
          result?: string
          scheduled_at?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          white_player_id: string
          black_player_id: string
          white_player_name: string
          black_player_name: string
          round: number
          result?: string
          scheduled_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          result?: string
          scheduled_at?: string
          updated_at?: string
        }
      }
      results: {
        Row: {
          id: string
          match_id: string
          white_player_id: string
          black_player_id: string
          result: string
          submitted_at: string
          submitted_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          match_id: string
          white_player_id: string
          black_player_id: string
          result: string
          submitted_at?: string
          submitted_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          result?: string
          submitted_by?: string
          updated_at?: string
        }
      }
      leaderboard: {
        Row: {
          id: string
          player_id: string
          player_name: string
          player_email: string
          played: number
          wins: number
          draws: number
          losses: number
          total_points: number
          updated_at: string
        }
        Insert: {
          id?: string
          player_id: string
          player_name: string
          player_email: string
          played?: number
          wins?: number
          draws?: number
          losses?: number
          total_points?: number
          updated_at?: string
        }
        Update: {
          id?: string
          player_name?: string
          player_email?: string
          played?: number
          wins?: number
          draws?: number
          losses?: number
          total_points?: number
          updated_at?: string
        }
      }
      match_results: {
        Row: {
          id: string
          match_id: string
          reporter_id: string
          opponent_id: string
          result: string
          status: string
          admin_reported?: boolean
          notes?: string
          reported_at: string
          responded_at?: string
        }
        Insert: {
          id?: string
          match_id: string
          reporter_id: string
          opponent_id: string
          result: string
          status?: string
          admin_reported?: boolean
          notes?: string
          reported_at?: string
          responded_at?: string
        }
        Update: {
          id?: string
          status?: string
          admin_reported?: boolean
          notes?: string
          responded_at?: string
        }
      }
    }
  }
} 