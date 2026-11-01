const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

export type HealthResponse = {
  status: 'ok' | 'error'
  database: 'ok' | 'error'
  timestamp: string
}

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_URL}/health`)
  if (!response.ok) {
    throw new Error(`API health check failed with status ${response.status}`)
  }
  return response.json()
}
