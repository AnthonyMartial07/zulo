export type Member = {
  id: string
  name: string
  email: string
  color: string
  rotation_order: number
  active: boolean
  is_admin: boolean
  country: string
  club: string
  position: string
  overall: number
  stat_suc: number
  stat_rui: number
  stat_bor: number
  stat_cue: number
  stat_cry: number
  stat_deg: number
  photo_url: string | null
}

export type Task = {
  id: string
  name: string
  kind: 'weekly' | 'common'
  rotation_order: number
  active: boolean
}

export type TaskLog = {
  id: string
  task_id: string
  member_id: string
  week_start: string | null
  created_at: string
}

export type FineType = {
  id: string
  name: string
  amount: number
}

export type Fine = {
  id: string
  member_id: string
  fine_type_id: string | null
  amount: number
  reason: string | null
  issued_by: string | null
  paid: boolean
  created_at: string
}
