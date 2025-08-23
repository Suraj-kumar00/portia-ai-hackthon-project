export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  avatar?: string
  role: 'admin' | 'agent' | 'customer'
  created_at: string
  updated_at: string
}

export interface Ticket {
  id: string
  subject: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: 'general' | 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'account'
  customer_email: string
  customer_name?: string
  assigned_agent?: string
  tags: string[]
  created_at: string
  updated_at: string
  resolved_at?: string
}

export interface TicketResponse {
  id: string
  ticket_id: string
  author: string
  author_type: 'customer' | 'agent' | 'system'
  content: string
  is_ai_generated: boolean
  is_internal: boolean
  attachments?: Attachment[]
  created_at: string
}

export interface Attachment {
  id: string
  filename: string
  size: number
  mime_type: string
  url: string
  uploaded_at: string
}

export interface AnalyticsData {
  overview: {
    total_tickets: number
    open_tickets: number
    resolved_tickets: number
    avg_response_time: number
    customer_satisfaction: number
    ai_resolution_rate: number
    escalation_rate: number
  }
  ticket_trends: Array<{
    date: string
    created: number
    resolved: number
    ai_resolved: number
  }>
  category_distribution: Array<{
    name: string
    value: number
    count: number
    color: string
  }>
  priority_distribution: Array<{
    name: string
    value: number
    count: number
  }>
  response_time_data: Array<{
    time_range: string
    tickets: number
    percentage: number
  }>
  satisfaction_trend: Array<{
    date: string
    score: number
  }>
}

export interface UserSettings {
  notifications: {
    email: boolean
    browser: boolean
    new_tickets: boolean
    mentions: boolean
    updates: boolean
  }
  ai: {
    auto_response: boolean
    escalation_threshold: number
    response_delay: number
    languages: string[]
  }
  profile: {
    display_name: string
    bio: string
    timezone: string
    language: string
  }
  appearance: {
    theme: 'light' | 'dark' | 'system'
  }
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  total?: number
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number
  page: number
  limit: number
  pages: number
}

export interface FilterOptions {
  status?: 'all' | 'open' | 'in_progress' | 'resolved' | 'closed'
  priority?: 'all' | 'low' | 'medium' | 'high' | 'urgent'
  category?: 'all' | 'general' | 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'account'
  search?: string
  limit?: number
  page?: number
}

export interface SortOptions {
  field: string
  direction: 'asc' | 'desc'
}

// Clerk user type extensions
export interface ClerkUser {
  id: string
  firstName?: string
  lastName?: string
  emailAddresses: Array<{
    emailAddress: string
    verification?: {
      status: string
    }
  }>
  imageUrl?: string
  createdAt: Date
  updatedAt: Date
}

// Component prop types
export interface TicketCardProps {
  ticket: Ticket
  onClick?: (ticket: Ticket) => void
  showCustomer?: boolean
  compact?: boolean
}

export interface StatusBadgeProps {
  status: Ticket['status']
  size?: 'sm' | 'md' | 'lg'
}

export interface PriorityBadgeProps {
  priority: Ticket['priority']
  size?: 'sm' | 'md' | 'lg'
}

// Form types
export interface CreateTicketFormData {
  customer_email: string
  subject: string
  query: string
  category?: Ticket['category']
  priority?: Ticket['priority']
}

export interface UpdateTicketFormData {
  subject?: string
  description?: string
  status?: Ticket['status']
  priority?: Ticket['priority']
  category?: Ticket['category']
}

export interface TicketResponseFormData {
  content: string
  is_internal?: boolean
}

// Error types
export interface ApiError extends Error {
  status?: number
  code?: string
  details?: any
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network request failed') {
    super(message)
    this.name = 'NetworkError'
  }
}

// Utility types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export type ThemeMode = 'light' | 'dark' | 'system'

// Constants
export const TICKET_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const
export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
export const TICKET_CATEGORIES = [
  'general',
  'technical',
  'billing',
  'feature_request',
  'bug_report',
  'account'
] as const

export const USER_ROLES = ['admin', 'agent', 'customer'] as const
export const TIME_RANGES = ['24h', '7d', '30d', '90d'] as const