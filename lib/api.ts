export type User = { id: string; name: string; role?: string; avatarUrl?: string }
export type Site = { id: string; name: string; status?: string; latitude?: number; longitude?: number }
export type SurveyLine = { id: string; name?: string; depth?: number; status?: string; coordinates: [number, number][] }

const baseUrl = process.env.NEXT_PUBLIC_MINING_API_URL?.replace(/\/$/, "")
const headers = (): HeadersInit => process.env.NEXT_PUBLIC_MINING_API_TOKEN ? { Authorization: `Bearer ${process.env.NEXT_PUBLIC_MINING_API_TOKEN}` } : {}

async function request<T>(path: string): Promise<T> {
  if (!baseUrl) throw new Error("Mining API is not configured")
  const response = await fetch(`${baseUrl}${path}`, { headers: headers(), next: { revalidate: 30 } })
  if (!response.ok) throw new Error(`Mining API returned ${response.status}`)
  return response.json()
}

export async function getUsers() { return request<User[]>("/users") }
export async function getSites() { return request<Site[]>("/sites") }
export async function getSurveyLines() { return request<SurveyLine[]>("/survey-lines") }
