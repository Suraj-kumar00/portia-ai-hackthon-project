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
    { name: 'Technical', value: 35, count: 437, color: '#8b5cf6' },
    { name: 'Billing', value: 25, count: 312, color: '#06b6d4' },
    { name: 'General', value: 20, count: 249, color: '#f59e0b' },
    { name: 'Feature Request', value: 12, count: 150, color: '#ef4444' },
    { name: 'Bug Report', value: 8, count: 99, color: '#10b981' }
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  const handleExport = () => {
    // In real app, generate and download analytics report
    console.log('Exporting analytics report...')
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
              <Link href="/dashboard" className="cursor-pointer">
                <Button variant="ghost" size="sm" className="hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl cursor-pointer">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">Analytics</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32 rounded-xl border-purple-200 focus:border-purple-500 cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border border-white/20 dark:border-slate-800/20 rounded-xl shadow-xl">
                  <SelectItem value="24h" className="cursor-pointer">Last 24h</SelectItem>
                  <SelectItem value="7d" className="cursor-pointer">Last 7 days</SelectItem>
                  <SelectItem value="30d" className="cursor-pointer">Last 30 days</SelectItem>
                  <SelectItem value="90d" className="cursor-pointer">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleExport} variant="outline" className="border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20 rounded-xl cursor-pointer">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <div className="cursor-pointer">
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Tickets</CardTitle>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{mockAnalytics.overview.totalTickets}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <TrendingUp className="w-3 h-3 inline mr-1 text-green-500" />
                +12% from last period
              </p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">Resolved</CardTitle>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{mockAnalytics.overview.resolvedTickets}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {Math.round((mockAnalytics.overview.resolvedTickets / mockAnalytics.overview.totalTickets) * 100)}% resolution rate
              </p>
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
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{mockAnalytics.overview.avgResponseTime}h</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <TrendingDown className="w-3 h-3 inline mr-1 text-green-500" />
                -15% improvement
              </p>
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
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{mockAnalytics.overview.customerSatisfaction}%</div>
              <Progress value={mockAnalytics.overview.customerSatisfaction} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">AI Resolution</CardTitle>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{mockAnalytics.overview.aiResolutionRate}%</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <TrendingUp className="w-3 h-3 inline mr-1 text-green-500" />
                +8% this month
              </p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">Escalation</CardTitle>
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{mockAnalytics.overview.escalationRate}%</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <TrendingDown className="w-3 h-3 inline mr-1 text-green-500" />
                -3% from last week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="trends" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border border-white/20 dark:border-slate-800/20 rounded-xl p-1">
            <TabsTrigger value="trends" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg cursor-pointer">Trends</TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg cursor-pointer">Categories</TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg cursor-pointer">Performance</TabsTrigger>
            <TabsTrigger value="satisfaction" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg cursor-pointer">Satisfaction</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white">Ticket Volume Trends</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-300">Daily ticket creation and resolution</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={mockAnalytics.ticketTrends}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        className="text-xs"
                      />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="created" 
                        stackId="1"
                        stroke="#8b5cf6" 
                        fill="#8b5cf6" 
                        fillOpacity={0.6}
                        name="Created"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="resolved" 
                        stackId="2"
                        stroke="#06b6d4" 
                        fill="#06b6d4" 
                        fillOpacity={0.6}
                        name="Resolved"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white">AI vs Human Resolution</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-300">Breakdown of resolution by type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mockAnalytics.ticketTrends}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        className="text-xs"
                      />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <Bar dataKey="aiResolved" fill="#8b5cf6" name="AI Resolved" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="resolved" fill="#06b6d4" name="Total Resolved" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white">Ticket Categories</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-300">Distribution of tickets by category</CardDescription>
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

              <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white">Category Breakdown</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-300">Detailed view of ticket categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockAnalytics.categoryDistribution.map((category) => (
                      <div key={category.name} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          ></div>
                          <span className="font-medium text-slate-900 dark:text-white">{category.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-slate-600 dark:text-slate-300">{category.count}</span>
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">{category.value}%</Badge>
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
              <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white">Response Time Distribution</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-300">How quickly tickets are being resolved</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockAnalytics.responseTimeData.map((item) => (
                      <div key={item.timeRange} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-700 dark:text-slate-300">{item.timeRange}</span>
                          <span className="text-slate-600 dark:text-slate-400">{item.tickets} tickets ({item.percentage}%)</span>
                        </div>
                        <Progress value={item.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white">Priority Distribution</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-300">Tickets by priority level</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mockAnalytics.priorityDistribution} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis dataKey="name" type="category" width={80} className="text-xs" />
                      <Tooltip formatter={(value) => [`${value} tickets`, 'Count']} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="satisfaction" className="space-y-4">
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Customer Satisfaction Trend</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">Daily customer satisfaction scores</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={mockAnalytics.satisfactionTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      className="text-xs"
                    />
                    <YAxis domain={[80, 100]} className="text-xs" />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value) => [`${value}%`, 'Satisfaction Score']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#8b5cf6" 
                      strokeWidth={3}
                      dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
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