'use client'

import { useState, useEffect } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { MessageSquare, Users, Clock, CheckCircle, AlertCircle, Plus, Bot, TrendingUp, BarChart3 } from 'lucide-react'
import Link from 'next/link'

// Mock data - replace with real API calls
const mockStats = {
  totalTickets: 1247,
  openTickets: 89,
  resolvedToday: 23,
  avgResponseTime: '2.4h',
  satisfactionScore: 94
}

const mockTickets = [
  {
    id: 'TKT-001',
    subject: 'Login issues after password reset',
    customer: 'john@example.com',
    status: 'open',
    priority: 'high',
    created: '2025-08-23T09:15:00Z',
    category: 'technical'
  },
  {
    id: 'TKT-002',
    subject: 'Billing inquiry for premium plan',
    customer: 'sarah@example.com',
    status: 'in_progress',
    priority: 'medium',
    created: '2025-08-23T08:30:00Z',
    category: 'billing'
  },
  {
    id: 'TKT-003',
    subject: 'Feature request: Dark mode',
    customer: 'mike@example.com',
    status: 'resolved',
    priority: 'low',
    created: '2025-08-22T16:45:00Z',
    category: 'feature_request'
  }
]

const chartData = [
  { name: 'Mon', tickets: 12, resolved: 10 },
  { name: 'Tue', tickets: 19, resolved: 15 },
  { name: 'Wed', tickets: 15, resolved: 18 },
  { name: 'Thu', tickets: 22, resolved: 20 },
  { name: 'Fri', tickets: 18, resolved: 16 },
  { name: 'Sat', tickets: 8, resolved: 9 },
  { name: 'Sun', tickets: 5, resolved: 6 }
]

export default function DashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const [tickets, setTickets] = useState(mockTickets)
  
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
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
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
          {/* Quick Actions */}
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
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{mockStats.totalTickets}</div>
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
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{mockStats.openTickets}</div>
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
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{mockStats.resolvedToday}</div>
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
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{mockStats.avgResponseTime}</div>
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
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{mockStats.satisfactionScore}%</div>
                <Progress value={mockStats.satisfactionScore} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Charts and Recent Tickets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart */}
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Ticket Trends</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">Daily ticket volume and resolution rate</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="tickets" fill="#8b5cf6" name="New Tickets" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="resolved" fill="#06b6d4" name="Resolved" radius={[4, 4, 0, 0]} />
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
                  {tickets.slice(0, 5).map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors backdrop-blur-sm cursor-pointer">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-slate-900 dark:text-white">{ticket.id}</span>
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 truncate">
                          {ticket.subject}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {ticket.customer}
                        </p>
                      </div>
                      <Link href={`/dashboard/tickets/${ticket.id}`} className="cursor-pointer">
                        <Button variant="ghost" size="sm" className="hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl cursor-pointer">View</Button>
                      </Link>
                    </div>
                  ))}
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