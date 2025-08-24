'use client'

import { useState, useRef } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Send, Bot, Clock, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'

export default function NewTicketPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const [subject, setSubject] = useState('')
  const [query, setQuery] = useState('')
  const [priority, setPriority] = useState('medium')
  const [category, setCategory] = useState('general')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // ✅ CRITICAL: Prevent multiple submissions
  const submitTimeoutRef = useRef<NodeJS.Timeout>()
  const abortControllerRef = useRef<AbortController>()
  const lastSubmissionRef = useRef<string>('')

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // ✅ CRITICAL: Prevent duplicate submissions
    const currentSubmission = `${subject}_${query}`
    if (isLoading) {
      console.log('Already submitting, ignoring duplicate request')
      return
    }
    
    // Check if same content was submitted recently
    if (lastSubmissionRef.current === currentSubmission) {
      console.log('Duplicate content detected, ignoring request')
      setError('This request was already submitted. Please check your tickets.')
      return
    }
    
    // Clear any pending timeout
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current)
    }
    
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()
    lastSubmissionRef.current = currentSubmission

    try {
      console.log('🚀 Creating ticket...', {
        customer_email: user?.emailAddresses[0]?.emailAddress,
        subject: subject.substring(0, 50) + '...',
        query_length: query.length
      })

      // ✅ CRITICAL FIX: Corrected URL (removed double /api/v1)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://portia-ai-hackthon-project-github-student-organization.appwrite.network'
      const response = await Promise.race([
        fetch(`${API_BASE_URL}/tickets/process-query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Remove Authorization header for now as it's causing issues
          },
          body: JSON.stringify({
            customer_email: user?.emailAddresses[0]?.emailAddress || '',
            subject,
            query,
            source: 'web_form',
            metadata: {
              priority,
              category,
              user_id: user?.id,
              created_from: 'dashboard'
            }
          }),
          signal: abortControllerRef.current.signal
        }),
        // ✅ Timeout promise (60 seconds)
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout after 60 seconds')), 60000)
        )
      ])

      if (!response.ok) {
        const errorText = await response.text()
        let errorData: any = {}
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { message: errorText }
        }
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      console.log('✅ Ticket created successfully:', {
        ticket_id: result.ticket_id,
        request_id: result.request_id,
        processing_time: result.processing_time_ms ? result.processing_time_ms + 'ms' : 'N/A'
      })

      setSuccess(`✅ Ticket created successfully! ${result.ai_response ? 'AI has processed your request.' : 'Our team will review your request.'}`)
      
      // ✅ Reset form after successful submission
      setSubject('')
      setQuery('')
      setPriority('medium')
      setCategory('general')
      
      // ✅ Redirect after delay
      submitTimeoutRef.current = setTimeout(() => {
        router.push(`/dashboard/tickets/${result.ticket_id}`)
      }, 3000)

    } catch (err: any) {
      console.error('❌ Failed to create ticket:', err)
      
      if (err.name === 'AbortError') {
        setError('Request was cancelled.')
      } else if (err.message.includes('timeout')) {
        setError('⏱️ Request timed out. Your ticket may still be processing. Please check your tickets in a moment.')
      } else if (err.message.includes('duplicate')) {
        setError('This ticket was already created. Please check your tickets.')
      } else if (err.message.includes('404')) {
        setError('❌ API endpoint not found. Please check if the backend server is running on the correct port.')
      } else if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        setError('Authentication error. Please sign out and back in.')
      } else if (err.message.includes('400')) {
        setError('Invalid request. Please check your input and try again.')
      } else if (err.message.includes('500')) {
        setError('Server error. Our team has been notified. Please try again in a few minutes.')
      } else {
        setError(`Failed to create ticket: ${err.message}`)
      }
      
      // Clear the last submission to allow retry
      lastSubmissionRef.current = ''
      
    } finally {
      // ✅ Re-enable form after delay to prevent rapid clicking
      submitTimeoutRef.current = setTimeout(() => {
        setIsLoading(false)
      }, 2000)
    }
  }

  // ✅ Cleanup on unmount
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current)
    }
    setIsLoading(false)
    router.push('/dashboard')
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
              <Button 
                variant="ghost" 
                size="sm" 
                className="hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl cursor-pointer"
                onClick={handleCancel}
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl shadow-lg">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  Create New Ticket
                </h1>
              </div>
            </div>
            <div className="cursor-pointer">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white flex items-center">
                  Submit Support Request
                  {isLoading && (
                    <div className="ml-3 flex items-center text-purple-600 dark:text-purple-400">
                      <Clock className="w-4 h-4 mr-1 animate-spin" />
                      <span className="text-sm">Processing...</span>
                    </div>
                  )}
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Describe your issue and our AI will help route it to the right team for quick resolution.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <Alert variant="destructive" className="backdrop-blur-sm bg-red-50/80 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="backdrop-blur-sm bg-green-50/80 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 rounded-xl">
                      <CheckCircle2 className="w-4 h-4" />
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-medium">Your Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.emailAddresses[0]?.emailAddress || ''}
                      disabled
                      className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                    />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      We'll use this email to send you updates about your ticket.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-slate-700 dark:text-slate-300 font-medium">Category</Label>
                      <Select value={category} onValueChange={setCategory} disabled={isLoading}>
                        <SelectTrigger className="rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-purple-500 cursor-pointer">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border border-white/20 dark:border-slate-800/20 rounded-xl shadow-xl">
                          <SelectItem value="general" className="cursor-pointer">General Inquiry</SelectItem>
                          <SelectItem value="technical" className="cursor-pointer">Technical Support</SelectItem>
                          <SelectItem value="billing" className="cursor-pointer">Billing & Payment</SelectItem>
                          <SelectItem value="feature_request" className="cursor-pointer">Feature Request</SelectItem>
                          <SelectItem value="bug_report" className="cursor-pointer">Bug Report</SelectItem>
                          <SelectItem value="account" className="cursor-pointer">Account Management</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority" className="text-slate-700 dark:text-slate-300 font-medium">Priority</Label>
                      <Select value={priority} onValueChange={setPriority} disabled={isLoading}>
                        <SelectTrigger className="rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-purple-500 cursor-pointer">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent className="backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border border-white/20 dark:border-slate-800/20 rounded-xl shadow-xl">
                          <SelectItem value="low" className="cursor-pointer">Low</SelectItem>
                          <SelectItem value="medium" className="cursor-pointer">Medium</SelectItem>
                          <SelectItem value="high" className="cursor-pointer">High</SelectItem>
                          <SelectItem value="urgent" className="cursor-pointer">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-slate-700 dark:text-slate-300 font-medium">Subject *</Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Brief description of your issue"
                      required
                      disabled={isLoading}
                      className="rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-purple-500 bg-white/50 dark:bg-slate-800/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="query" className="text-slate-700 dark:text-slate-300 font-medium">Description *</Label>
                    <Textarea
                      id="query"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Please provide detailed information about your issue. Include any error messages, steps to reproduce, or relevant context..."
                      rows={8}
                      required
                      disabled={isLoading}
                      className="rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-purple-500 bg-white/50 dark:bg-slate-800/50"
                    />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      The more details you provide, the better our AI can assist you.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
                    <Button 
                      variant="outline" 
                      type="button" 
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading || !subject.trim() || !query.trim()} 
                      className={`bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg rounded-xl cursor-pointer ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isLoading ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Creating Ticket...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Create Ticket
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Assistant Info */}
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-900 dark:text-white">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl mr-3">
                    <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  AI Assistant
                  {isLoading && (
                    <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <p className="text-slate-600 dark:text-slate-300">
                    Our AI assistant will automatically:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-slate-600 dark:text-slate-300">Categorize your issue</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-slate-600 dark:text-slate-300">Route to the right team</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-slate-600 dark:text-slate-300">Provide instant responses when possible</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-slate-600 dark:text-slate-300">Escalate to humans when needed</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Response Time */}
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Expected Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between p-2 bg-white/30 dark:bg-slate-800/30 rounded-xl">
                    <span className="text-slate-600 dark:text-slate-300">AI Response:</span>
                    <span className="font-medium text-slate-900 dark:text-white">Instant</span>
                  </div>
                  <div className="flex justify-between p-2 hover:bg-white/30 dark:hover:bg-slate-800/30 rounded-xl transition-colors">
                    <span className="text-slate-600 dark:text-slate-300">Low Priority:</span>
                    <span className="text-slate-700 dark:text-slate-200">2-3 business days</span>
                  </div>
                  <div className="flex justify-between p-2 hover:bg-white/30 dark:hover:bg-slate-800/30 rounded-xl transition-colors">
                    <span className="text-slate-600 dark:text-slate-300">Medium Priority:</span>
                    <span className="text-slate-700 dark:text-slate-200">1-2 business days</span>
                  </div>
                  <div className="flex justify-between p-2 hover:bg-white/30 dark:hover:bg-slate-800/30 rounded-xl transition-colors">
                    <span className="text-slate-600 dark:text-slate-300">High Priority:</span>
                    <span className="text-slate-700 dark:text-slate-200">4-8 hours</span>
                  </div>
                  <div className="flex justify-between p-2 bg-red-50/50 dark:bg-red-900/20 rounded-xl">
                    <span className="text-slate-600 dark:text-slate-300">Urgent:</span>
                    <span className="text-red-600 dark:text-red-400 font-medium">1-2 hours</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Tips for Better Support</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-start space-x-2 p-2 rounded-xl hover:bg-white/30 dark:hover:bg-slate-800/30 transition-colors">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>Include error messages or screenshots</span>
                  </div>
                  <div className="flex items-start space-x-2 p-2 rounded-xl hover:bg-white/30 dark:hover:bg-slate-800/30 transition-colors">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>Describe steps to reproduce the issue</span>
                  </div>
                  <div className="flex items-start space-x-2 p-2 rounded-xl hover:bg-white/30 dark:hover:bg-slate-800/30 transition-colors">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>Mention your browser and operating system</span>
                  </div>
                  <div className="flex items-start space-x-2 p-2 rounded-xl hover:bg-white/30 dark:hover:bg-slate-800/30 transition-colors">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>Be as specific as possible</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}