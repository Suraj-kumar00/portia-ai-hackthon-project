'use client'

import { useEffect, useState } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  MessageSquare, Users, Clock, CheckCircle, AlertCircle, Plus, Bot, TrendingUp, BarChart3,
} from 'lucide-react'
import Link from 'next/link'
import { api, type Ticket, type TicketsResponse } from '@/lib/api'

type DashboardMetrics = {
  total_tickets: number
  open_tickets: number
  tickets_today: number
  ai_resolved_tickets: number
  avg_response_time_minutes: number
  customer_satisfaction: number  // expected 1..5 scale; converted to %
  ai_automation_rate: number     // %
}

export default function DashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isSignedIn) return
    ;(async () => {
      setIsLoading(true)
      // Fetch real tickets and analytics
      const [ticketsResult, metricsResult] = await Promise.all([
        api.getTickets({ limit: 10 }),
        api.getAnalytics(),
      ])

      if (ticketsResult.success && ticketsResult.data) {
        const data = Array.isArray(ticketsResult.data)
          ? (ticketsResult.data as unknown as Ticket[])
          : ((ticketsResult.data as TicketsResponse).tickets || [])
        setTickets(data)
      } else {
        setTickets([])
      }

      setMetrics(metricsResult.success ? metricsResult.data : null)
      setIsLoading(false)
    })()
  }, [isSignedIn])

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  const totalTickets = metrics?.total_tickets ?? 0
  const openTickets = metrics?.open_tickets ?? 0
  const ticketsToday = metrics?.tickets_today ?? 0
  const avgResponseTimeStr = `${metrics?.avg_response_time_minutes ?? 0}m`
  const satisfactionPct = Math.round(((metrics?.customer_satisfaction ?? 0) / 5) * 100)

  // Simple real chart from metrics (no mocks)
  const totalsChart = [
    { name: 'Total', value: totalTickets },
    { name: 'Open', value: openTickets },
    { name: 'Today', value: ticketsToday },
    { name: 'AI Resolved', value: metrics?.ai_resolved_tickets ?? 0 },
  ]

  const getStatusColor = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'open': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch ((priority || '').toLowerCase()) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
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
              <div className="p-2 bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl shadow-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">Dashboard</h1>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Welcome back, {user.firstName || user.emailAddresses[0].emailAddress}!
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/tickets/new" className="cursor-pointer">
                <Button className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg rounded-xl cursor-pointer">
                  <Plus className="w-4 h-4 mr-2" />
                  New Ticket
                </Button>
              </Link>
              <Link href="/dashboard/analytics" className="cursor-pointer">
                <Button variant="outline" className="border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20 rounded-xl cursor-pointer">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
              </Link>
              <div className="cursor-pointer">
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Left Sidebar - Quick Actions */}
        <aside className="w-80 min-h-screen p-6 space-y-6">
          <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white">Quick Actions</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300">Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="/dashboard/tickets/new" className="cursor-pointer">
                  <Button variant="outline" className="w-full h-16 flex items-center justify-start space-x-3 border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20 rounded-xl transition-all duration-300 hover:shadow-lg cursor-pointer">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                      <Plus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Create New Ticket</span>
                  </Button>
                </Link>
                <Link href="/dashboard/analytics" className="cursor-pointer">
                  <Button variant="outline" className="w-full h-16 flex items-center justify-start space-x-3 border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20 rounded-xl transition-all duration-300 hover:shadow-lg cursor-pointer">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                      <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">View Analytics</span>
                  </Button>
                </Link>
                <Link href="/dashboard/settings" className="cursor-pointer">
                  <Button variant="outline" className="w-full h-16 flex items-center justify-start space-x-3 border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20 rounded-xl transition-all duration-300 hover:shadow-lg cursor-pointer">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                      <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">User Settings</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Tickets</CardTitle>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {isLoading ? '...' : totalTickets}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">All time</p>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">Open Tickets</CardTitle>
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {isLoading ? '...' : openTickets}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Needs attention</p>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">Resolved Today</CardTitle>
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {isLoading ? '...' : ticketsToday}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Great work!</p>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">Avg Response</CardTitle>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {isLoading ? '...' : avgResponseTimeStr}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">This week</p>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">Satisfaction</CardTitle>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {isLoading ? '...' : `${satisfactionPct}%`}
                </div>
                <Progress value={satisfactionPct} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Charts and Recent Tickets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Real Metrics Chart */}
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Ticket Metrics</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">Live counts from your backend</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={totalsChart}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8b5cf6" name="Count" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Tickets */}
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Recent Tickets</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">Latest customer support requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    tickets.slice(0, 5).map((ticket: Ticket | any) => {
                      const customerEmail =
                        ticket.customer_email ||
                        ticket.customer?.email ||
                        ''
                      return (
                        <div key={ticket.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors backdrop-blur-sm cursor-pointer">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-slate-900 dark:text-white">{ticket.id}</span>
                              <Badge className={getStatusColor(ticket.status)}>
                                {(ticket.status || '').replace('_', ' ')}
                              </Badge>
                              <Badge className={getPriorityColor(ticket.priority)}>
                                {ticket.priority || '-'}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 truncate">
                              {ticket.subject || '-'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {customerEmail || '-'}
                            </p>
                          </div>
                          <Link href={`/dashboard/tickets/${ticket.id}`} className="cursor-pointer">
                            <Button variant="ghost" size="sm" className="hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl cursor-pointer">View</Button>
                          </Link>
                        </div>
                      )
                    })
                  )}
                </div>
                <div className="mt-4 text-center">
                  <Link href="/dashboard/tickets" className="cursor-pointer">
                    <Button variant="outline" className="border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20 rounded-xl cursor-pointer">View All Tickets</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}