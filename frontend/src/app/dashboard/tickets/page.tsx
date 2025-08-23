'use client'

import { useState, useEffect } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Plus, Search, Filter, RefreshCw, Bot } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

const mockTickets = [
  {
    id: 'TKT-001',
    subject: 'Login issues after password reset',
    customer: 'john@example.com',
    status: 'open',
    priority: 'high',
    created: '2025-08-23T09:15:00Z',
    category: 'technical',
    assignedTo: 'AI Assistant'
  },
  {
    id: 'TKT-002',
    subject: 'Billing inquiry for premium plan',
    customer: 'sarah@example.com',
    status: 'in_progress',
    priority: 'medium',
    created: '2025-08-23T08:30:00Z',
    category: 'billing',
    assignedTo: 'Support Team'
  },
  {
    id: 'TKT-003',
    subject: 'Feature request: Dark mode',
    customer: 'mike@example.com',
    status: 'resolved',
    priority: 'low',
    created: '2025-08-22T16:45:00Z',
    category: 'feature_request',
    assignedTo: 'Product Team'
  },
  {
    id: 'TKT-004',
    subject: 'Unable to export data from dashboard',
    customer: 'alice@example.com',
    status: 'open',
    priority: 'medium',
    created: '2025-08-22T14:20:00Z',
    category: 'technical',
    assignedTo: 'AI Assistant'
  },
  {
    id: 'TKT-005',
    subject: 'Request for API rate limit increase',
    customer: 'developer@example.com',
    status: 'in_progress',
    priority: 'high',
    created: '2025-08-22T11:30:00Z',
    category: 'api',
    assignedTo: 'Engineering Team'
  }
]

export default function TicketsPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const [tickets, setTickets] = useState(mockTickets)
  const [filteredTickets, setFilteredTickets] = useState(mockTickets)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(false)

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

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    filterTickets(query, statusFilter, priorityFilter)
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    filterTickets(searchQuery, status, priorityFilter)
  }

  const handlePriorityFilter = (priority: string) => {
    setPriorityFilter(priority)
    filterTickets(searchQuery, statusFilter, priority)
  }

  const filterTickets = (search: string, status: string, priority: string) => {
    let filtered = tickets

    if (search) {
      filtered = filtered.filter(ticket => 
        ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
        ticket.customer.toLowerCase().includes(search.toLowerCase()) ||
        ticket.id.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (status !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === status)
    }

    if (priority !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priority)
    }

    setFilteredTickets(filtered)
  }

  const refreshTickets = async () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      // In real app, fetch from API
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Bot className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Support Tickets</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={refreshTickets} variant="outline" size="sm" disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link href="/dashboard/tickets/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Ticket
                </Button>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Tickets</CardTitle>
            <CardDescription>Search and filter your support tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-full md:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={handlePriorityFilter}>
                <SelectTrigger className="w-full md:w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Table */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets ({filteredTickets.length})</CardTitle>
            <CardDescription>Manage your customer support tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{ticket.id}</TableCell>
                      <TableCell className="max-w-xs truncate">{ticket.subject}</TableCell>
                      <TableCell>{ticket.customer}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{ticket.assignedTo}</TableCell>
                      <TableCell>{formatDate(ticket.created)}</TableCell>
                      <TableCell>
                        <Link href={`/dashboard/tickets/${ticket.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {filteredTickets.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No tickets found matching your criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}