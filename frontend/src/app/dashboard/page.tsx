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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Bot className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {user.firstName || user.emailAddresses[0].emailAddress}!
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/tickets/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Ticket
                </Button>
              </Link>
              <Link href="/dashboard/analytics">
                <Button variant="outline">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.totalTickets}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.openTickets}</div>
              <p className="text-xs text-muted-foreground">Needs attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.resolvedToday}</div>
              <p className="text-xs text-muted-foreground">Great work!</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.avgResponseTime}</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.satisfactionScore}%</div>
              <Progress value={mockStats.satisfactionScore} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Charts and Recent Tickets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Trends</CardTitle>
              <CardDescription>Daily ticket volume and resolution rate</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="tickets" fill="hsl(var(--primary))" name="New Tickets" />
                  <Bar dataKey="resolved" fill="hsl(var(--muted-foreground))" name="Resolved" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Tickets */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Tickets</CardTitle>
              <CardDescription>Latest customer support requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tickets.slice(0, 5).map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">{ticket.id}</span>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {ticket.subject}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ticket.customer}
                      </p>
                    </div>
                    <Link href={`/dashboard/tickets/${ticket.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Link href="/dashboard/tickets">
                  <Button variant="outline">View All Tickets</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/dashboard/tickets/new">
                <Button variant="outline" className="w-full h-20 flex-col">
                  <Plus className="w-6 h-6 mb-2" />
                  Create New Ticket
                </Button>
              </Link>
              <Link href="/dashboard/analytics">
                <Button variant="outline" className="w-full h-20 flex-col">
                  <BarChart3 className="w-6 h-6 mb-2" />
                  View Analytics
                </Button>
              </Link>
              <Link href="/dashboard/settings">
                <Button variant="outline" className="w-full h-20 flex-col">
                  <Users className="w-6 h-6 mb-2" />
                  User Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}