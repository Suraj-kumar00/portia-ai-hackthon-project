'use client'

import { useEffect, useState } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import {
  ArrowLeft, TrendingUp, Users, Clock, MessageSquare,
  CheckCircle, AlertCircle, Bot, Target, Download,
} from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'

type DashboardMetrics = {
  total_tickets: number
  tickets_today: number
  open_tickets: number
  pending_approvals?: number
  ai_resolved_tickets: number
  avg_response_time_minutes: number
  customer_satisfaction: number
  ai_automation_rate: number
}

type AiPerformanceMetrics = {
  ai_conversations: number
  successful_automations: number
  failed_automations: number
  automation_success_rate: number
  avg_confidence_score: number
  most_common_actions?: { action: string; count: number }[]
}

export default function AnalyticsPage() {
  const { isLoaded, isSignedIn } = useUser()
  const [timeRange, setTimeRange] = useState('7d')
  const [isLoading, setIsLoading] = useState(true)
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [aiMetrics, setAiMetrics] = useState<AiPerformanceMetrics | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    ;(async () => {
      setIsLoading(true)
      setError(null)
      const [m, a] = await Promise.all([api.getAnalytics(), api.getAiPerformance()])
      if (!m.success) setError(m.error || 'Failed to load analytics')
      if (!a.success) setError(a.error || 'Failed to load AI performance')
      setMetrics(m.success ? m.data : null)
      setAiMetrics(a.success ? a.data : null)
      setIsLoading(false)
    })()
  }, [isLoaded, isSignedIn, timeRange])

  const handleExport = () => {
    // Optional: generate & download a CSV/JSON. Keeping it simple here.
    console.log('Export analytics snapshot', { metrics, aiMetrics })
  }

  // Derived chart data using real metrics
  const totalsChart = metrics
    ? [
        { name: 'Total', value: metrics.total_tickets },
        { name: 'Open', value: metrics.open_tickets },
        { name: 'Today', value: metrics.tickets_today },
        { name: 'AI Resolved', value: metrics.ai_resolved_tickets },
      ]
    : []

  const automationPie = metrics
    ? [
        { name: 'Automated', value: Math.max(0, Math.min(100, metrics.ai_automation_rate)) },
        { name: 'Manual', value: Math.max(0, 100 - Math.max(0, Math.min(100, metrics.ai_automation_rate))) },
      ]
    : []

  const successFailBar = aiMetrics
    ? [
        { name: 'Success', value: aiMetrics.successful_automations },
        { name: 'Failed', value: aiMetrics.failed_automations },
      ]
    : []

  const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981']

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    )
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
        {/* Error */}
        {error && (
          <Card className="backdrop-blur-xl bg-red-50/60 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <CardContent className="py-4 text-red-800 dark:text-red-200">
              {error}
            </CardContent>
          </Card>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Tickets</CardTitle>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {isLoading ? '...' : metrics?.total_tickets ?? 0}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">All time</p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">Open</CardTitle>
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {isLoading ? '...' : metrics?.open_tickets ?? 0}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Needs attention</p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">Today</CardTitle>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {isLoading ? '...' : metrics?.tickets_today ?? 0}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Created today</p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">Avg Response</CardTitle>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {isLoading ? '...' : `${metrics?.avg_response_time_minutes ?? 0}m`}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Last interval</p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">Satisfaction</CardTitle>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {isLoading ? '...' : `${Math.round(((metrics?.customer_satisfaction ?? 0) / 5) * 100)}%`}
              </div>
              <Progress value={Math.round(((metrics?.customer_satisfaction ?? 0) / 5) * 100)} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">Automation</CardTitle>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {isLoading ? '...' : `${metrics?.ai_automation_rate ?? 0}%`}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Resolved by AI</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border border-white/20 dark:border-slate-800/20 rounded-xl p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg cursor-pointer">Overview</TabsTrigger>
            <TabsTrigger value="automation" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg cursor-pointer">Automation</TabsTrigger>
            <TabsTrigger value="actions" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg cursor-pointer">Top Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white">Volume & Resolution</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-300">Key ticket counts</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={totalsChart}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white">Automation Rate</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-300">AI vs Manual handling</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={automationPie} dataKey="value" nameKey="name" outerRadius={120} label>
                        {automationPie.map((_, i) => (
                          <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="automation" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white">Automation Success</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-300">
                    {isLoading ? '...' : `Success Rate: ${aiMetrics?.automation_success_rate ?? 0}% | Avg Confidence: ${(aiMetrics?.avg_confidence_score ?? 0).toFixed(2)}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={successFailBar}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white">AI Conversations</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-300">
                    {isLoading ? '...' : `Total AI Conversations: ${aiMetrics?.ai_conversations ?? 0}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                      <Bot className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">
                      AI handled a significant portion of recent conversations with high confidence.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Top Actions</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">Most common automation actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(aiMetrics?.most_common_actions ?? []).length === 0 && (
                    <p className="text-slate-600 dark:text-slate-300">No action data available yet.</p>
                  )}
                  {(aiMetrics?.most_common_actions ?? []).map((a, idx) => (
                    <div key={`${a.action}-${idx}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                          <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-slate-900 dark:text-white font-medium">{a.action}</span>
                      </div>
                      <Badge className="bg-purple-600 hover:bg-purple-700">{a.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}