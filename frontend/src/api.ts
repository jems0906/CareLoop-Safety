const API_URL = import.meta.env.VITE_API_URL || ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init)
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const detail = Array.isArray(body?.detail)
      ? body.detail.map((item: { msg?: string }) => item.msg).filter(Boolean).join("; ")
      : body?.detail
    throw new Error(typeof detail === "string" ? detail : `Request failed (${response.status})`)
  }
  return response.json() as Promise<T>
}

export type EventRecord = {
  id: string
  setting: string
  event_type: string
  occurred_on: string
  reported_on: string
  status: string
  summary: string
  communication_preference: string
  access_barrier: string
  investigation: {
    established_facts: string[]
    hypotheses: string[]
    open_questions: string[]
    five_whys: string[]
    cause_categories: Record<string, string[]>
    findings: string[]
    reviewer_signed_by: string | null
  }
}

export type ActionRecord = {
  id: string
  event_id: string | null
  project_id: string | null
  title: string
  action_type: string
  owner: string
  due_date: string
  state: string
  implementation_evidence: string | null
  effectiveness_due: string | null
}

export type PDSACycle = {
  id: string
  cycle_number: number
  prediction: string
  test_scope: string
  observed_result: string
  learning: string
  decision: string
}

export type ProjectRecord = {
  id: string
  title: string
  aim: string
  scope: string
  baseline: number
  target: number
  intervention: string
  status: string
  measures: { name: string; kind: string; definition: string; unit: string }[]
  milestones: string[]
  risks: string[]
  raci: { role: string; raci: string; commitment: string }[]
  decisions: { decision: string; status: string; owner: string; note: string }[]
  sustainment_owner: string
  monitoring_cadence: string
  reopen_trigger: string
  pdsa_cycles: PDSACycle[]
}

export type MetricPoint = {
  week_start: string
  eligible: number
  timely: number
  process_rate: number | null
  reviewed: number
  unresolved: number
  outcome_rate: number | null
  documentation_minutes: number
  duplicate_tasks: number
  workflow_burden_score: number
}

export type EquityGroup = {
  access_barrier: string
  eligible: number | null
  timely: number | null
  missing: number | null
  completion_rate: number | null
  missingness_rate: number | null
  suppressed: boolean
}

export type EquitySetting = EquityGroup & {
  setting: string
  barriers: EquityGroup[]
}

export const api = {
  events: () => request<EventRecord[]>('/api/events'),
  createEvent: (payload: Record<string, string>, key: string) => request('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key }, body: JSON.stringify(payload) }),
  actions: () => request<ActionRecord[]>('/api/actions'),
  createAction: (payload: Record<string, string>, key: string) => request('/api/actions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key }, body: JSON.stringify(payload) }),
  projects: () => request<ProjectRecord[]>('/api/projects'),
  metrics: (setting: string) => request<MetricPoint[]>(`/api/measurement${setting === 'all' ? '' : `?setting=${encodeURIComponent(setting)}`}`),
  equity: () => request<EquitySetting[]>('/api/measurement/equity'),
  updateInvestigation: (eventId: string, payload: Partial<EventRecord['investigation']>, key: string) => request(`/api/investigations/${eventId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key }, body: JSON.stringify(payload) }),
  signoffInvestigation: (eventId: string, reviewer: string, key: string) => request(`/api/investigations/${eventId}/signoff`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key }, body: JSON.stringify({ reviewer }) }),
  transitionAction: (id: string, payload: Record<string, string>, key: string) => request(`/api/actions/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key }, body: JSON.stringify(payload) }),
  updateProject: (id: string, status: string, key: string) => request(`/api/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key }, body: JSON.stringify({ status }) }),
  addPDSA: (projectId: string, payload: Record<string, string | number>, key: string) => request(`/api/projects/${projectId}/pdsa`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key }, body: JSON.stringify(payload) }),
  updatePDSA: (projectId: string, cycleId: string, payload: Record<string, string>, key: string) => request(`/api/projects/${projectId}/pdsa/${cycleId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key }, body: JSON.stringify(payload) }),
}