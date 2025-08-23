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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-blue-50 dark:from-slate-950 dark:via-purple-950/10 dark:to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-white/20 dark:border-slate-800/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/tickets" className="cursor-pointer">
                <Button variant="ghost" size="sm" className="hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl cursor-pointer">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Tickets
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">{ticket.id}</h1>
                <p className="text-sm text-slate-600 dark:text-slate-300">{ticket.subject}</p>
              </div>
            </div>
            <div className="cursor-pointer">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Details */}
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-900 dark:text-white">Ticket Details</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(ticketStatus)}>
                      {ticketStatus.replace('_', ' ')}
                    </Badge>
                    <Badge className={getPriorityColor(ticketPriority)}>
                      {ticketPriority}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Created by {ticket.customer.name} on {formatDate(ticket.created)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 text-slate-900 dark:text-white">Description</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {ticket.description}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {ticket.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conversation */}
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-900 dark:text-white">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl mr-3">
                    <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  Conversation ({responses.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {responses.map((response) => (
                    <div key={response.id} className="flex space-x-4">
                      <div className="flex-shrink-0">
                        {response.isAI ? (
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 flex items-center justify-center shadow-lg">
                            <Bot className="w-5 h-5 text-white" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-slate-400 to-slate-500 flex items-center justify-center shadow-lg">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-sm text-slate-900 dark:text-white">{response.author}</span>
                          {response.isAI && (
                            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              AI Assistant
                            </Badge>
                          )}
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {formatRelativeTime(response.timestamp)}
                          </span>
                        </div>
                        <div className="text-sm leading-relaxed backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 p-4 rounded-xl border border-white/20 dark:border-slate-700/20">
                          {response.content}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Response Form */}
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Add Response</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Type your response..."
                    value={newResponse}
                    onChange={(e) => setNewResponse(e.target.value)}
                    rows={4}
                    className="rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-purple-500 bg-white/50 dark:bg-slate-800/50"
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSubmitResponse} 
                      disabled={isSubmitting || !newResponse.trim()}
                      className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg rounded-xl cursor-pointer"
                    >
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
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-center shadow-lg">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <span className="font-medium text-slate-900 dark:text-white block">{ticket.customer.name}</span>
                      <span className="text-sm text-slate-600 dark:text-slate-300">{ticket.customer.email}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ticket Management */}
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Ticket Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block text-slate-700 dark:text-slate-300">Status</label>
                  <Select value={ticketStatus} onValueChange={handleStatusUpdate}>
                    <SelectTrigger className="rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-purple-500 cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border border-white/20 dark:border-slate-800/20 rounded-xl shadow-xl">
                      <SelectItem value="open" className="cursor-pointer">Open</SelectItem>
                      <SelectItem value="in_progress" className="cursor-pointer">In Progress</SelectItem>
                      <SelectItem value="resolved" className="cursor-pointer">Resolved</SelectItem>
                      <SelectItem value="closed" className="cursor-pointer">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block text-slate-700 dark:text-slate-300">Priority</label>
                  <Select value={ticketPriority} onValueChange={handlePriorityUpdate}>
                    <SelectTrigger className="rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-purple-500 cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border border-white/20 dark:border-slate-800/20 rounded-xl shadow-xl">
                      <SelectItem value="low" className="cursor-pointer">Low</SelectItem>
                      <SelectItem value="medium" className="cursor-pointer">Medium</SelectItem>
                      <SelectItem value="high" className="cursor-pointer">High</SelectItem>
                      <SelectItem value="urgent" className="cursor-pointer">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator className="bg-slate-200 dark:bg-slate-700" />

                <div className="space-y-3 text-sm">
                  {[
                    { label: 'Created:', value: formatDate(ticket.created) },
                    { label: 'Updated:', value: formatDate(ticket.updated) },
                    { label: 'Category:', value: ticket.category },
                    { label: 'Assigned to:', value: ticket.assignedTo }
                  ].map((item, index) => (
                    <div key={index} className="flex justify-between p-2 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
                      <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
                      <span className="text-slate-900 dark:text-white font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}