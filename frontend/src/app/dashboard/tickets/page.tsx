'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft, Plus, Search, Filter, RefreshCw, Bot,
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { api, type Ticket, type TicketsResponse } from '@/lib/api'

export default function TicketsPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getStatusColor = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'open':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'waiting_approval':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch ((priority || '').toLowerCase()) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const fetchTickets = useCallback(
    async (initial = false) => {
      if (initial) setIsInitialLoading(true)
      else setIsLoading(true)
      setError(null)

      try {
        const result = await api.getTickets({
          limit: 100,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        })

        if (result.success && result.data) {
          // Handle either raw array or normalized object
          const ticketData = Array.isArray(result.data)
            ? (result.data as unknown as Ticket[])
            : ((result.data as TicketsResponse).tickets || [])

          setTickets(ticketData)
        } else {
          setError(result.error || 'Failed to load tickets')
          setTickets([])
        }
      } catch (err) {
        setError('Failed to load tickets. Please try again.')
        setTickets([])
        // eslint-disable-next-line no-console
        console.error('Load tickets error:', err)
      } finally {
        if (initial) setIsInitialLoading(false)
        else setIsLoading(false)
      }
    },
    [statusFilter, priorityFilter]
  )

  // Initial load
  useEffect(() => {
    if (isSignedIn) {
      fetchTickets(true)
    }
  }, [isSignedIn, fetchTickets])

  // Apply client-side filters
  useEffect(() => {
    const search = (searchQuery || '').toLowerCase()

    const filtered = (tickets || []).filter((t: Ticket | any) => {
      const subject = (t.subject || '').toLowerCase()
      const id = (t.id || '').toLowerCase()

      // Backends may return nested customer object instead of customer_email
      const customerEmail =
        (t.customer_email as string) ||
        (t.customer?.email as string) ||
        ''

      const customer = (customerEmail || '').toLowerCase()

      if (!search) return true
      return (
        subject.includes(search) ||
        customer.includes(search) ||
        id.includes(search)
      )
    })

    setFilteredTickets(filtered)
  }, [tickets, searchQuery])

  const handleSearch = (query: string) => setSearchQuery(query)

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    // Reload from backend with new filter
    if (isSignedIn) fetchTickets(true)
  }

  const handlePriorityFilter = (priority: string) => {
    setPriorityFilter(priority)
    // Reload from backend with new filter
    if (isSignedIn) fetchTickets(true)
  }

  const refreshTickets = async () => {
    await fetchTickets(false)
  }

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500" />
      </div>
    )
  }

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">
            Loading your tickets...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-blue-50 dark:from-slate-950 dark:via-purple-950/10 dark:to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '1s' }}
        />
      </div>

      {/* Header */}
      <header className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-white/20 dark:border-slate-800/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="cursor-pointer">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl shadow-lg">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  Support Tickets
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={refreshTickets}
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20 rounded-xl cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link href="/dashboard/tickets/new" className="cursor-pointer">
                <Button className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg rounded-xl cursor-pointer">
                  <Plus className="w-4 h-4 mr-2" />
                  New Ticket
                </Button>
              </Link>
              <div className="cursor-pointer">
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Error Banner */}
        {error && (
          <Card className="backdrop-blur-xl bg-red-50/60 dark:bg-red-900/20 border-red-200 dark:border-red-800 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <div className="text-red-600 dark:text-red-400">⚠️</div>
                <p className="text-red-800 dark:text-red-200">{error}</p>
                <Button onClick={() => fetchTickets(true)} variant="outline" size="sm" className="ml-auto">
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-slate-900 dark:text-white">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl mr-3">
                <Filter className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              Filter Tickets
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300">
              Search and filter your support tickets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Search className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <Input
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-purple-500 bg-white/50 dark:bg-slate-800/50"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-full md:w-40 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-purple-500 cursor-pointer">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border border-white/20 dark:border-slate-800/20 rounded-xl shadow-xl">
                  <SelectItem value="all" className="cursor-pointer">All Status</SelectItem>
                  <SelectItem value="open" className="cursor-pointer">Open</SelectItem>
                  <SelectItem value="in_progress" className="cursor-pointer">In Progress</SelectItem>
                  <SelectItem value="waiting_approval" className="cursor-pointer">Waiting Approval</SelectItem>
                  <SelectItem value="resolved" className="cursor-pointer">Resolved</SelectItem>
                  <SelectItem value="closed" className="cursor-pointer">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={handlePriorityFilter}>
                <SelectTrigger className="w-full md:w-40 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-purple-500 cursor-pointer">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border border-white/20 dark:border-slate-800/20 rounded-xl shadow-xl">
                  <SelectItem value="all" className="cursor-pointer">All Priority</SelectItem>
                  <SelectItem value="urgent" className="cursor-pointer">Urgent</SelectItem>
                  <SelectItem value="high" className="cursor-pointer">High</SelectItem>
                  <SelectItem value="medium" className="cursor-pointer">Medium</SelectItem>
                  <SelectItem value="low" className="cursor-pointer">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Table */}
        <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">
              Tickets ({filteredTickets.length})
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300">
              Manage your customer support tickets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden backdrop-blur-sm bg-white/30 dark:bg-slate-800/30">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 dark:border-slate-700 hover:bg-white/50 dark:hover:bg-slate-800/50">
                    <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Ticket ID</TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Subject</TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Customer</TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Status</TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Priority</TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Category</TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Created</TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket: Ticket | any) => {
                    const customerEmail =
                      ticket.customer_email ||
                      ticket.customer?.email ||
                      ''
                    const created = ticket.created_at
                      ? formatDate(ticket.created_at)
                      : '-'
                    return (
                      <TableRow
                        key={ticket.id}
                        className="border-slate-200 dark:border-slate-700 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                      >
                        <TableCell className="font-medium text-slate-900 dark:text-white">
                          {ticket.id}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-slate-700 dark:text-slate-300">
                          {ticket.subject || '-'}
                        </TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300">
                          {customerEmail || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(ticket.status)}>
                            {(ticket.status || '').replace('_', ' ') || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300">
                          {ticket.category || 'General'}
                        </TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300">
                          {created}
                        </TableCell>
                        <TableCell>
                          <Link href={`/dashboard/tickets/${ticket.id}`} className="cursor-pointer">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl cursor-pointer"
                            >
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {filteredTickets.length === 0 && !isInitialLoading && !error && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-lg font-medium">
                  No tickets found matching your criteria
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                  Try adjusting your search filters or create a new ticket
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}