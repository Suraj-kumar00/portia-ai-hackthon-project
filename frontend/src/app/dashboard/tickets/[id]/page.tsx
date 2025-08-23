'use client'

import { useState, useEffect } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Send, Bot, User, Clock, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatRelativeTime } from '@/lib/utils'

// Mock ticket data
const mockTicket = {
  id: 'TKT-001',
  subject: 'Login issues after password reset',
  description: 'I reset my password yesterday but I\'m still unable to login to my account. I\'ve tried clearing my browser cache and using different browsers, but the issue persists. The error message says "Invalid credentials" even though I\'m using the new password.',
  customer: {
    name: 'John Doe',
    email: 'john@example.com',
    avatar: null
  },
  status: 'open',
  priority: 'high',
  category: 'technical',
  created: '2025-08-23T09:15:00Z',
  updated: '2025-08-23T10:30:00Z',
  assignedTo: 'AI Assistant',
  tags: ['password', 'login', 'authentication']
}

const mockResponses = [
  {
    id: '1',
    author: 'John Doe',
    authorType: 'customer',
    content: 'I reset my password yesterday but I\'m still unable to login to my account. I\'ve tried clearing my browser cache and using different browsers, but the issue persists.',
    timestamp: '2025-08-23T09:15:00Z',
    isAI: false
  },
  {
    id: '2',
    author: 'AI Assistant',
    authorType: 'agent',
    content: 'Thank you for contacting us, John. I understand you\'re experiencing login issues after resetting your password. Let me help you resolve this. First, could you please confirm that you\'re using the exact password that was sent to your email? Also, please try logging in using an incognito/private browsing window to rule out any browser-related issues.',
    timestamp: '2025-08-23T09:25:00Z',
    isAI: true
  },
  {
    id: '3',
    author: 'John Doe',
    authorType: 'customer',
    content: 'Yes, I\'m using the exact password from the email. I also tried incognito mode but still get the same error.',
    timestamp: '2025-08-23T09:45:00Z',
    isAI: false
  }
]

export default function TicketDetailPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const params = useParams()
  const [ticket, setTicket] = useState(mockTicket)
  const [responses, setResponses] = useState(mockResponses)
  const [newResponse, setNewResponse] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ticketStatus, setTicketStatus] = useState(mockTicket.status)
  const [ticketPriority, setTicketPriority] = useState(mockTicket.priority)

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const handleSubmitResponse = async () => {
    if (!newResponse.trim()) return

    setIsSubmitting(true)
    
    // Simulate API call
    const response = {
      id: Date.now().toString(),
      author: user.firstName + ' ' + user.lastName || user.emailAddresses[0].emailAddress,
      authorType: 'agent' as const,
      content: newResponse,
      timestamp: new Date().toISOString(),
      isAI: false
    }
    
    setResponses([...responses, response])
    setNewResponse('')
    setIsSubmitting(false)
  }

  const handleStatusUpdate = (newStatus: string) => {
    setTicketStatus(newStatus)
    // In real app, make API call to update status
  }

  const handlePriorityUpdate = (newPriority: string) => {
    setTicketPriority(newPriority)
    // In real app, make API call to update priority
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/tickets">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Tickets
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">{ticket.id}</h1>
                <p className="text-sm text-muted-foreground">{ticket.subject}</p>
              </div>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Ticket Details</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(ticketStatus)}>
                      {ticketStatus.replace('_', ' ')}
                    </Badge>
                    <Badge className={getPriorityColor(ticketPriority)}>
                      {ticketPriority}
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  Created by {ticket.customer.name} on {formatDate(ticket.created)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {ticket.description}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {ticket.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conversation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Conversation ({responses.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {responses.map((response) => (
                    <div key={response.id} className="flex space-x-3">
                      <div className="flex-shrink-0">
                        {response.isAI ? (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <Bot className="w-4 h-4 text-primary-foreground" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{response.author}</span>
                          {response.isAI && (
                            <Badge variant="secondary" className="text-xs">
                              AI Assistant
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(response.timestamp)}
                          </span>
                        </div>
                        <div className="text-sm leading-relaxed bg-muted p-3 rounded-lg">
                          {response.content}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Response Form */}
            <Card>
              <CardHeader>
                <CardTitle>Add Response</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Type your response..."
                    value={newResponse}
                    onChange={(e) => setNewResponse(e.target.value)}
                    rows={4}
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleSubmitResponse} disabled={isSubmitting || !newResponse.trim()}>
                      {isSubmitting ? (
                        <>Sending...</>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Response
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{ticket.customer.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {ticket.customer.email}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ticket Management */}
            <Card>
              <CardHeader>
                <CardTitle>Ticket Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select value={ticketStatus} onValueChange={handleStatusUpdate}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Priority</label>
                  <Select value={ticketPriority} onValueChange={handlePriorityUpdate}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{formatDate(ticket.created)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Updated:</span>
                    <span>{formatDate(ticket.updated)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span>{ticket.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assigned to:</span>
                    <span>{ticket.assignedTo}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}