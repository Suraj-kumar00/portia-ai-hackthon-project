import { z } from 'zod'

// Ticket validation schemas
export const createTicketSchema = z.object({
  customer_email: z.string().email('Please enter a valid email address'),
  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must be less than 200 characters'),
  query: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  category: z
    .enum(['general', 'technical', 'billing', 'feature_request', 'bug_report', 'account'])
    .optional()
    .default('general'),
  priority: z
    .enum(['low', 'medium', 'high', 'urgent'])
    .optional()
    .default('medium')
})

export const updateTicketSchema = z.object({
  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must be less than 200 characters')
    .optional(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters')
    .optional(),
  status: z
    .enum(['open', 'in_progress', 'resolved', 'closed'])
    .optional(),
  priority: z
    .enum(['low', 'medium', 'high', 'urgent'])
    .optional(),
  category: z
    .enum(['general', 'technical', 'billing', 'feature_request', 'bug_report', 'account'])
    .optional()
})

export const ticketResponseSchema = z.object({
  content: z
    .string()
    .min(1, 'Response cannot be empty')
    .max(2000, 'Response must be less than 2000 characters'),
  is_internal: z.boolean().optional().default(false)
})

// User profile validation schemas
export const updateProfileSchema = z.object({
  first_name: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .optional(),
  last_name: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .optional(),
  bio: z
    .string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
  timezone: z.string().optional(),
  language: z.string().optional()
})

// Settings validation schemas
export const notificationSettingsSchema = z.object({
  email_notifications: z.boolean().default(true),
  browser_notifications: z.boolean().default(true),
  new_ticket_notifications: z.boolean().default(true),
  mention_notifications: z.boolean().default(true),
  update_notifications: z.boolean().default(false)
})

export const aiSettingsSchema = z.object({
  auto_response: z.boolean().default(true),
  escalation_threshold: z.number().min(1).max(10).default(3),
  response_delay: z.number().min(0).max(300).default(30),
  supported_languages: z.array(z.string()).default(['en'])
})

// Search and filter schemas
export const ticketFilterSchema = z.object({
  status: z
    .enum(['all', 'open', 'in_progress', 'resolved', 'closed'])
    .optional()
    .default('all'),
  priority: z
    .enum(['all', 'low', 'medium', 'high', 'urgent'])
    .optional()
    .default('all'),
  category: z
    .enum(['all', 'general', 'technical', 'billing', 'feature_request', 'bug_report', 'account'])
    .optional()
    .default('all'),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).optional().default(10),
  page: z.number().min(1).optional().default(1)
})

export const analyticsFilterSchema = z.object({
  time_range: z
    .enum(['24h', '7d', '30d', '90d'])
    .optional()
    .default('7d'),
  category: z.string().optional(),
  agent: z.string().optional()
})

// Type exports
export type CreateTicketInput = z.infer<typeof createTicketSchema>
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>
export type TicketResponseInput = z.infer<typeof ticketResponseSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type NotificationSettingsInput = z.infer<typeof notificationSettingsSchema>
export type AiSettingsInput = z.infer<typeof aiSettingsSchema>
export type TicketFilterInput = z.infer<typeof ticketFilterSchema>
export type AnalyticsFilterInput = z.infer<typeof analyticsFilterSchema>

// Validation helper functions
export function validateEmail(email: string): boolean {
  return z.string().email().safeParse(email).success
}

export function validateRequired(value: any, fieldName: string = 'Field'): boolean {
  if (value === null || value === undefined || value === '') {
    throw new Error(`${fieldName} is required`)
  }
  return true
}

export function validateLength(
  value: string,
  min: number,
  max: number,
  fieldName: string = 'Field'
): boolean {
  if (value.length < min) {
    throw new Error(`${fieldName} must be at least ${min} characters`)
  }
  if (value.length > max) {
    throw new Error(`${fieldName} must be less than ${max} characters`)
  }
  return true
}

export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - in production, use a proper library like DOMPurify
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+="/gi, 'data-')
}