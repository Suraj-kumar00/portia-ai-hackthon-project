import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'

// Mock tickets data - in real app, this would come from database
const mockTickets = [
  {
    id: 'TKT-001',
    subject: 'Login issues after password reset',
    description: 'User cannot login after resetting password',
    customer_email: 'john@example.com',
    status: 'open',
    priority: 'high',
    category: 'technical',
    created_at: '2025-08-23T09:15:00Z',
    updated_at: '2025-08-23T10:30:00Z'
  },
  {
    id: 'TKT-002',
    subject: 'Billing inquiry for premium plan',
    description: 'Customer wants to upgrade to premium plan',
    customer_email: 'sarah@example.com',
    status: 'in_progress',
    priority: 'medium',
    category: 'billing',
    created_at: '2025-08-23T08:30:00Z',
    updated_at: '2025-08-23T09:45:00Z'
  }
]

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Filter tickets based on query params
    let filteredTickets = mockTickets

    if (status && status !== 'all') {
      filteredTickets = filteredTickets.filter(ticket => ticket.status === status)
    }

    if (priority && priority !== 'all') {
      filteredTickets = filteredTickets.filter(ticket => ticket.priority === priority)
    }

    // Limit results
    const limitedTickets = filteredTickets.slice(0, limit)

    return NextResponse.json({
      success: true,
      data: limitedTickets,
      total: filteredTickets.length,
      page: 1,
      limit
    })
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { customer_email, subject, query } = body

    // Validate required fields
    if (!customer_email || !subject || !query) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // In real app, you would:
    // 1. Save ticket to database
    // 2. Call your backend API to process with Portia AI
    // 3. Send notifications

    // Mock ticket creation
    const newTicket = {
      id: `TKT-${Date.now()}`,
      subject,
      description: query,
      customer_email,
      status: 'open',
      priority: 'medium',
      category: 'general',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Simulate AI processing
    const aiResponse = {
      ticket_id: newTicket.id,
      response: "Thank you for contacting us. I've analyzed your request and will provide assistance shortly.",
      classification: {
        category: "general_inquiry",
        urgency: "medium",
        sentiment: "neutral"
      },
      requires_human_approval: false,
      ai_confidence: 0.85
    }

    return NextResponse.json({
      success: true,
      data: {
        ticket: newTicket,
        ai_response: aiResponse
      },
      message: 'Ticket created successfully'
    })
  } catch (error) {
    console.error('Error creating ticket:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}