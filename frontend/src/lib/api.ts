'use client'

/**
 * Frontend API client for FastAPI backend
 * - Uses trailing slash on list endpoints to avoid 307 redirects
 * - Uses "offset" (not "skip") to match backend
 * - Forces no-store caching for fresh data
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T | null
  message?: string
  error?: string
}

export interface Ticket {
  id: string
  subject: string
  customer_email: string
  query?: string
  status: string
  priority: string
  category?: string | null
  assigned_to?: string | null
  created_at: string
  updated_at: string
}

export interface TicketsResponse {
  tickets: Ticket[]
  total?: number
}

export interface CreateTicketResponse {
  request_id: string
  ticket_id: string
  plan_id?: string | null
  status?: string
  ai_response?: string
  requires_human_approval?: boolean
  approval_id?: string | null
  suggested_actions?: Array<Record<string, any>>
  processing_time_ms?: number
}

class ApiClient {
  constructor(private baseURL: string) {}

  private async getAuthToken(): Promise<string | null> {
    try {
      // Only on client
      if (typeof window !== 'undefined') {
        const { useAuth } = await import('@clerk/nextjs')
        const { getToken } = useAuth()
        return await getToken()
      }
    } catch {
      // no-op
    }
    return null
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    const token = await this.getAuthToken()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }
    if (token) headers['Authorization'] = `Bearer ${token}`

    try {
      const res = await fetch(url, {
        ...options,
        headers,
        cache: 'no-store', // always fresh
        redirect: 'follow',
      })

      const ct = res.headers.get('content-type') || ''
      const data = ct.includes('application/json') ? await res.json() : null

      if (!res.ok) {
        const msg = data?.message || res.statusText || `HTTP ${res.status}`
        throw new Error(msg)
      }

      // Normalize list shape if backend returns raw array
      if (Array.isArray(data)) {
        return {
          success: true,
          data: { tickets: data, total: data.length } as T,
        }
      }

      return { success: true, data, message: data?.message }
    } catch (e) {
      return {
        success: false,
        data: null,
        error: e instanceof Error ? e.message : String(e),
      }
    }
  }

  async getTickets(params?: {
    status?: string
    priority?: string
    limit?: number
    offset?: number // backend expects "offset"
  }): Promise<ApiResponse<TicketsResponse>> {
    const sp = new URLSearchParams()
    if (params?.status && params.status !== 'all') sp.append('status', params.status)
    if (params?.priority && params.priority !== 'all')
      sp.append('priority', params.priority)
    if (params?.limit) sp.append('limit', String(params.limit))
    if (typeof params?.offset === 'number')
      sp.append('offset', String(params.offset))

    const qs = sp.toString()
    // IMPORTANT: trailing slash avoids any 307 redirect
    const endpoint = `/tickets/${qs ? `?${qs}` : ''}`
    return this.request<TicketsResponse>(endpoint)
  }

  async getTicket(id: string): Promise<ApiResponse<Ticket>> {
    return this.request(`/tickets/${id}`)
  }

  async createTicket(data: {
    customer_email: string
    subject: string
    query: string
    source?: string
    metadata?: Record<string, any>
  }): Promise<ApiResponse<CreateTicketResponse>> {
    return this.request('/tickets/process-query', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getAnalytics(): Promise<ApiResponse<any>> {
    return this.request('/analytics/dashboard')
  }

  async getAiPerformance(): Promise<ApiResponse<any>> {
    return this.request('/analytics/ai-performance')
  }

  async healthCheck(): Promise<ApiResponse<any>> {
    return this.request('/health')
  }
}

export const api = new ApiClient(API_BASE_URL)