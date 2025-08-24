import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId, getToken } = await auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get Clerk token for backend authentication
    const token = await getToken()

    // Get query parameters from frontend
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const limit = searchParams.get('limit')

    // Build query string for FastAPI backend
    const backendParams = new URLSearchParams()
    if (status) backendParams.append('status', status)
    if (priority) backendParams.append('priority', priority)
    if (limit) backendParams.append('limit', limit)

    const queryString = backendParams.toString()
    const backendUrl = `${FASTAPI_BASE_URL}/api/v1/tickets${queryString ? `?${queryString}` : ''}`

    // Call your FastAPI backend
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`FastAPI backend error: ${response.status}`)
    }

    const data = await response.json()
    
    // Return the data from your FastAPI backend
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error fetching tickets from backend:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tickets from backend' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId, getToken } = await auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get Clerk token for backend authentication
    const token = await getToken()

    // Get request body from frontend
    const body = await request.json()

    // Forward the request to your FastAPI backend
    const backendUrl = `${FASTAPI_BASE_URL}/api/v1/tickets/process-query`
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      throw new Error(`FastAPI backend error: ${response.status}`)
    }

    const data = await response.json()
    
    // Return the data from your FastAPI backend
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error creating ticket in backend:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create ticket in backend' },
      { status: 500 }
    )
  }
}