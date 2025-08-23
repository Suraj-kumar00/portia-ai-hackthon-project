import { auth } from '@clerk/nextjs'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      if (typeof window !== 'undefined') {
        // Client-side: get token from Clerk
        const { getToken } = await import('@clerk/nextjs')
        return await getToken()
      } else {
        // Server-side: get token from auth()
        const { getToken } = auth()
        return await getToken()
      }
    } catch (error) {
      console.warn('Failed to get Clerk token:', error)
      return null
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    const token = await this.getAuthToken()
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`)
      }

      return data
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error)
      throw error
    }
  }

  // Ticket endpoints
  async getTickets(params?: {
    status?: string
    priority?: string
    limit?: number
  }): Promise<ApiResponse> {
    const searchParams = new URLSearchParams()
    
    if (params?.status) searchParams.append('status', params.status)
    if (params?.priority) searchParams.append('priority', params.priority)
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    
    const queryString = searchParams.toString()
    const endpoint = `/tickets${queryString ? `?${queryString}` : ''}`
    
    return this.request(endpoint)
  }

  async getTicket(id: string): Promise<ApiResponse> {
    return this.request(`/tickets/${id}`)
  }

  async createTicket(data: {
    customer_email: string
    subject: string
    query: string
  }): Promise<ApiResponse> {
    return this.request('/tickets/process-query', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateTicket(id: string, data: any): Promise<ApiResponse> {
    return this.request(`/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async deleteTicket(id: string): Promise<ApiResponse> {
    return this.request(`/tickets/${id}`, {
      method: 'DELETE'
    })
  }

  // Analytics endpoints
  async getAnalytics(timeRange?: string): Promise<ApiResponse> {
    const endpoint = `/analytics/dashboard${timeRange ? `?range=${timeRange}` : ''}`
    return this.request(endpoint)
  }

  async getTicketTrends(timeRange?: string): Promise<ApiResponse> {
    const endpoint = `/analytics/trends${timeRange ? `?range=${timeRange}` : ''}`
    return this.request(endpoint)
  }

  // User endpoints
  async getUserProfile(): Promise<ApiResponse> {
    return this.request('/user/profile')
  }

  async updateUserProfile(data: any): Promise<ApiResponse> {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.request('/health')
  }
}

export const api = new ApiClient(API_BASE_URL)

// Utility functions for API calls
export async function withErrorHandling<T>(
  apiCall: () => Promise<T>,
  errorMessage: string = 'An error occurred'
): Promise<T | null> {
  try {
    return await apiCall()
  } catch (error) {
    console.error(errorMessage, error)
    return null
  }
}

export function isApiError(error: unknown): error is Error {
  return error instanceof Error
}