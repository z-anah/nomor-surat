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

export interface SkNumberTemp {
  id: number
  sk_type_id: number
  last_number: number
  year: number | null
  sk_type_name?: string
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

export interface NomorSurat {
  id: number
  user_id: string
  title: string
  generated_nomor_surat: string
  fungsi_type_id: number
  sk_type_id: number
  created_at: string
  fungsi_name?: string
  sk_type_name?: string
  user_name?: string
  file_url?: string
}