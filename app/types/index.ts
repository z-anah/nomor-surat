export interface UserType {
  id: number
  name: string
}

export interface FungsiType {
  id: number
  fungsi_name: string
  fungsi_code: string
}

export interface SkType {
  id: number
  name: string
}

export interface UserStatus {
  id: number
  name: string
}

export interface UserProfile {
  id: string // uuid
  full_name: string
  username: string
  email?: string | null
  user_type_id: number | null
  user_status_id: number | null
  created_at: string
  user_type_name?: string | null
  user_status_name?: string | null
}