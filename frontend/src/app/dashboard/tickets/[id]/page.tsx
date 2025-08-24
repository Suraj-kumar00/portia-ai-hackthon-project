'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useUser, UserButton } from '@clerk/nextjs'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { api, type Ticket } from '@/lib/api'
import { ArrowLeft, User as UserIcon, Bot, CheckCircle2 } from 'lucide-react'

type Conversation = {
  id: string
  ticket_id: string
  customer_id?: string | null
  content: string
  role: 'CUSTOMER' | 'AI_AGENT' | 'HUMAN_AGENT'
  metadata?: any
  created_at: string
}

type Approval = {
  id: string
  ticket_id: string
  action_type: string
  ai_suggestion: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  approved_by?: string | null
  reason?: string | null
  created_at?: string
  decided_at?: string | null
}

type TicketDetail = Ticket & {
  customer?: {
    id: string
    email: string
    name?: string | null
    phone?: string | null
    company?: string | null
    segment?: string | null
    created_at?: string
    updated_at?: string
  } | null
  conversations?: Conversation[] | null
  approvals?: Approval[] | null
}

export default function TicketDetailPage() {
  const params = useParams()
  const id = String(params?.id ?? '')
  const { isLoaded, isSignedIn } = useUser()
  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSignedIn || !id) return
    ;(async () => {
      setIsLoading(true)
      setError(null)
      const res = await api.getTicket(id)
      if (res.success && res.data) {
        setTicket(res.data as TicketDetail)
      } else {
        setError(res.error || 'Failed to load ticket')
      }
      setIsLoading(false)
    })()
  }, [isSignedIn, id])

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500" />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">Loading ticket...</p>
        </div>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-blue-50 dark:from-slate-950 dark:via-purple-950/10 dark:to-slate-900">
        <header className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-white/20 dark:border-slate-800/20">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/dashboard/tickets" className="cursor-pointer">
              <Button variant="ghost" size="sm" className="hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl cursor-pointer">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tickets
              </Button>
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <Card className="backdrop-blur-xl bg-red-50/60 dark:bg-red-900/20 border-red-200 dark:border-red-800 shadow-xl">
            <CardContent className="py-6 text-red-800 dark:text-red-200">
              {error || 'Ticket not found'}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const customerEmail = ticket.customer?.email || ticket.customer_email || ''
  const statusLabel = (ticket.status || '').replace('_', ' ')
  const priority = (ticket.priority || '').toUpperCase()

  const getStatusBadge = (s: string) => {
    const v = (s || '').toLowerCase()
    if (v === 'open') return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    if (v === 'in_progress') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    if (v === 'resolved') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    if (v === 'closed') return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }

  const getPriorityBadge = (p: string) => {
    const v = (p || '').toLowerCase()
    if (v === 'urgent') return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    if (v === 'high') return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    if (v === 'medium') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    if (v === 'low') return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-blue-50 dark:from-slate-950 dark:via-purple-950/10 dark:to-slate-900">
      {/* Header */}
      <header className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-white/20 dark:border-slate-800/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/tickets" className="cursor-pointer">
              <Button variant="ghost" size="sm" className="hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl cursor-pointer">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tickets
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{ticket.id}</h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">{ticket.subject || 'Ticket'}</p>
            </div>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: details + conversations */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-slate-900 dark:text-white">Ticket Details</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Created at {new Date(ticket.created_at).toLocaleString()}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusBadge(ticket.status)}>{statusLabel}</Badge>
                <Badge className={getPriorityBadge(ticket.priority)}>{priority}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {(ticket as any).description || ticket.query || 'No description provided.'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white">Conversation ({ticket.conversations?.length ?? 0})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(ticket.conversations ?? []).map((c) => (
                <div key={c.id} className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`p-2 rounded-xl ${c.role === 'AI_AGENT' ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                      {c.role === 'AI_AGENT' ? <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" /> : <UserIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                    </div>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {new Date(c.created_at).toLocaleString()}
                    </span>
                    {c.role === 'AI_AGENT' && c.metadata?.plan_id && (
                      <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        plan: {String(c.metadata.plan_id).slice(0, 8)}…
                      </Badge>
                    )}
                  </div>
                  <div className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{c.content}</div>
                </div>
              ))}

              {(ticket.conversations ?? []).length === 0 && (
                <div className="text-slate-600 dark:text-slate-300">No conversation yet.</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: customer + management */}
        <div className="space-y-6">
          <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <UserIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-slate-900 dark:text-white font-medium">
                    {ticket.customer?.name || customerEmail.split('@')[0]}
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">{customerEmail}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white">Ticket Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Status</div>
                <Select value={ticket.status} disabled>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Priority</div>
                <Select value={ticket.priority} disabled>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Created: {new Date(ticket.created_at).toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Updated: {new Date(ticket.updated_at).toLocaleString()}
              </div>

              {(ticket.approvals ?? []).length > 0 && (
                <div className="pt-2">
                  <div className="text-sm font-medium text-slate-900 dark:text-white mb-2">Approvals</div>
                  <div className="space-y-2">
                    {ticket.approvals!.map(a => (
                      <div key={a.id} className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className={`w-4 h-4 ${a.status === 'APPROVED' ? 'text-green-600' : a.status === 'REJECTED' ? 'text-red-600' : 'text-yellow-600'}`} />
                          <span className="text-sm text-slate-700 dark:text-slate-300">{a.action_type}</span>
                          <Badge variant="secondary" className="ml-2">
                            {a.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {a.ai_suggestion}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}