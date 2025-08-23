'use client'

import { useState, useEffect } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts'
import { 
  ArrowLeft, TrendingUp, TrendingDown, Users, Clock, MessageSquare, 
  CheckCircle, AlertCircle, Bot, Target, Calendar, Download 
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

// Mock analytics data
const mockAnalytics = {
  overview: {
    totalTickets: 1247,
    resolvedTickets: 1158,
    avgResponseTime: 2.4,
    customerSatisfaction: 94,
    aiResolutionRate: 68,
    escalationRate: 12
  },
  ticketTrends: [
    { date: '2025-08-16', created: 45, resolved: 42, aiResolved: 28 },
    { date: '2025-08-17', created: 52, resolved: 48, aiResolved: 32 },
    { date: '2025-08-18', created: 38, resolved: 41, aiResolved: 26 },
    { date: '2025-08-19', created: 61, resolved: 55, aiResolved: 38 },
    { date: '2025-08-20', created: 49, resolved: 52, aiResolved: 34 },
    { date: '2025-08-21', created: 43, resolved: 46, aiResolved: 29 },
    { date: '2025-08-22', created: 56, resolved: 53, aiResolved: 35 },
    { date: '2025-08-23', created: 34, resolved: 31, aiResolved: 22 }
  ],
  categoryDistribution: [
    { name: 'Technical', value: 35, count: 437, color: '#8884d8' },
    { name: 'Billing', value: 25, count: 312, color: '#82ca9d' },
    { name: 'General', value: 20, count: 249, color: '#ffc658' },
    { name: 'Feature Request', value: 12, count: 150, color: '#ff7300' },
    { name: 'Bug Report', value: 8, count: 99, color: '#8dd1e1' }
  ],
  priorityDistribution: [
    { name: 'Low', value: 45, count: 561 },
    { name: 'Medium', value: 35, count: 437 },
    { name: 'High', value: 15, count: 187 },
    { name: 'Urgent', value: 5, count: 62 }
  ],
  responseTimeData: [
    { timeRange: '< 1 hour', tickets: 425, percentage: 34 },
    { timeRange: '1-4 hours', tickets: 498, percentage: 40 },
    { timeRange: '4-24 hours', tickets: 249, percentage: 20 },
    { timeRange: '> 24 hours', tickets: 75, percentage: 6 }
  ],
  satisfactionTrend: [
    { date: '2025-08-16', score: 92 },
    { date: '2025-08-17', score: 94 },
    { date: '2025-08-18', score: 91 },
    { date: '2025-08-19', score: 95 },
    { date: '2025-08-20', score: 93 },
    { date: '2025-08-21', score: 96 },
    { date: '2025-08-22', score: 94 },
    { date: '2025-08-23', score: 94 }
  ]
}

export default function AnalyticsPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const [timeRange, setTimeRange] = useState('7d')
  const [isLoading, setIsLoading] = useState(false)

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  const handleExport = () => {
    // In real app, generate and download analytics report
    console.log('Exporting analytics report...')
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
                <TrendingUp className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Analytics</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleExport} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockAnalytics.overview.totalTickets}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                +12% from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockAnalytics.overview.resolvedTickets}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((mockAnalytics.overview.resolvedTickets / mockAnalytics.overview.totalTickets) * 100)}% resolution rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockAnalytics.overview.avgResponseTime}h</div>
              <p className="text-xs text-muted-foreground">
                <TrendingDown className="w-3 h-3 inline mr-1 text-green-500" />
                -15% improvement
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockAnalytics.overview.customerSatisfaction}%</div>
              <Progress value={mockAnalytics.overview.customerSatisfaction} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Resolution</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockAnalytics.overview.aiResolutionRate}%</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3 inline mr-1 text-green-500" />
                +8% this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Escalation</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockAnalytics.overview.escalationRate}%</div>
              <p className="text-xs text-muted-foreground">
                <TrendingDown className="w-3 h-3 inline mr-1 text-green-500" />
                -3% from last week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="trends" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="satisfaction">Satisfaction</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ticket Volume Trends</CardTitle>
                  <CardDescription>Daily ticket creation and resolution</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={mockAnalytics.ticketTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="created" 
                        stackId="1"
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))" 
                        fillOpacity={0.6}
                        name="Created"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="resolved" 
                        stackId="2"
                        stroke="hsl(var(--muted-foreground))" 
                        fill="hsl(var(--muted-foreground))" 
                        fillOpacity={0.6}
                        name="Resolved"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI vs Human Resolution</CardTitle>
                  <CardDescription>Breakdown of resolution by type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mockAnalytics.ticketTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <Bar dataKey="aiResolved" fill="hsl(var(--primary))" name="AI Resolved" />
                      <Bar dataKey="resolved" fill="hsl(var(--muted-foreground))" name="Total Resolved" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ticket Categories</CardTitle>
                  <CardDescription>Distribution of tickets by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={mockAnalytics.categoryDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {mockAnalytics.categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name, entry) => [
                          `${entry.payload.count} tickets (${value}%)`,
                          entry.payload.name
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Category Breakdown</CardTitle>
                  <CardDescription>Detailed view of ticket categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockAnalytics.categoryDistribution.map((category) => (
                      <div key={category.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          ></div>
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">{category.count}</span>
                          <Badge variant="secondary">{category.value}%</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Response Time Distribution</CardTitle>
                  <CardDescription>How quickly tickets are being resolved</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockAnalytics.responseTimeData.map((item) => (
                      <div key={item.timeRange} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{item.timeRange}</span>
                          <span>{item.tickets} tickets ({item.percentage}%)</span>
                        </div>
                        <Progress value={item.percentage} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Priority Distribution</CardTitle>
                  <CardDescription>Tickets by priority level</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mockAnalytics.priorityDistribution} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip formatter={(value) => [`${value} tickets`, 'Count']} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="satisfaction" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer Satisfaction Trend</CardTitle>
                <CardDescription>Daily customer satisfaction scores</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={mockAnalytics.satisfactionTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis domain={[80, 100]} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value) => [`${value}%`, 'Satisfaction Score']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}