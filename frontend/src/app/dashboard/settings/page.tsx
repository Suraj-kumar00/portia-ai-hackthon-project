'use client'

import { useEffect, useState } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft, Save, Bell, Shield, Bot, Settings, User,
  Mail, Globe, Palette, Moon, Sun, Monitor,
} from 'lucide-react'
import Link from 'next/link'
import { useTheme } from 'next-themes'

type SettingsState = {
  notifications: {
    email: boolean
    browser: boolean
    newTickets: boolean
    mentions: boolean
    updates: boolean
  }
  ai: {
    autoResponse: boolean
    escalationThreshold: number
    responseDelay: number
    languages: string[]
  }
  profile: {
    displayName: string
    bio: string
    timezone: string
    language: string
  }
}

const defaultState: SettingsState = {
  notifications: {
    email: true,
    browser: true,
    newTickets: true,
    mentions: true,
    updates: false,
  },
  ai: {
    autoResponse: true,
    escalationThreshold: 3,
    responseDelay: 30,
    languages: ['en', 'es'],
  },
  profile: {
    displayName: '',
    bio: '',
    timezone: 'UTC',
    language: 'en',
  },
}

export default function SettingsPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { theme, setTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<SettingsState>(defaultState)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [errMsg, setErrMsg] = useState<string | null>(null)

  // Load from Clerk unsafeMetadata.cs_settings
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return
    const meta = (user.unsafeMetadata as any) || {}
    const saved = meta.cs_settings || {}

    setSettings({
      notifications: {
        email: saved.notifications?.email ?? defaultState.notifications.email,
        browser: saved.notifications?.browser ?? defaultState.notifications.browser,
        newTickets: saved.notifications?.newTickets ?? defaultState.notifications.newTickets,
        mentions: saved.notifications?.mentions ?? defaultState.notifications.mentions,
        updates: saved.notifications?.updates ?? defaultState.notifications.updates,
      },
      ai: {
        autoResponse: saved.ai?.autoResponse ?? defaultState.ai.autoResponse,
        escalationThreshold: saved.ai?.escalationThreshold ?? defaultState.ai.escalationThreshold,
        responseDelay: saved.ai?.responseDelay ?? defaultState.ai.responseDelay,
        languages: Array.isArray(saved.ai?.languages) ? saved.ai.languages : defaultState.ai.languages,
      },
      profile: {
        displayName:
          saved.profile?.displayName ??
          `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
        bio: saved.profile?.bio ?? defaultState.profile.bio,
        timezone: saved.profile?.timezone ?? defaultState.profile.timezone,
        language: saved.profile?.language ?? defaultState.profile.language,
      },
    })
  }, [isLoaded, isSignedIn, user])

  const updateSettings = (
    section: keyof SettingsState,
    key: string,
    value: any
  ) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [key]: value,
      },
    }))
  }

  const handleSaveSettings = async () => {
    if (!user) return
    setIsLoading(true)
    setSaveMsg(null)
    setErrMsg(null)

    try {
      // 1) Persist app settings in unsafeMetadata.cs_settings (client-writable)
      const nextUnsafe = {
        ...(user.unsafeMetadata || {}),
        cs_settings: settings,
      }
      await user.update({ unsafeMetadata: nextUnsafe as any })

      // 2) Optionally reflect displayName to Clerk name fields
      const [first, ...rest] = (settings.profile.displayName || '').trim().split(' ')
      await user.update({
        firstName: first || user.firstName || '',
        lastName: rest.join(' ') || user.lastName || '',
      })

      setSaveMsg('Settings saved successfully')
    } catch (e: any) {
      console.error('Failed to save settings', e)
      setErrMsg(e?.message || 'Failed to save settings')
    } finally {
      setIsLoading(false)
      setTimeout(() => setSaveMsg(null), 3000)
    }
  }

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
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  Settings
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={handleSaveSettings} disabled={isLoading} className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg rounded-xl cursor-pointer">
                {isLoading ? 'Saving...' : (<><Save className="w-4 h-4 mr-2" /> Save Changes</>)}
              </Button>
              <div className="cursor-pointer">
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-4">
        {saveMsg && (
          <Alert className="backdrop-blur-sm bg-green-50/80 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <AlertDescription className="text-green-800 dark:text-green-200">
              {saveMsg}
            </AlertDescription>
          </Alert>
        )}
        {errMsg && (
          <Alert className="backdrop-blur-sm bg-red-50/80 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <AlertDescription className="text-red-800 dark:text-red-200">
              {errMsg}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border border-white/20 dark:border-slate-800/20 rounded-xl p-1">
            <TabsTrigger value="profile" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg cursor-pointer">Profile</TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg cursor-pointer">Notifications</TabsTrigger>
            <TabsTrigger value="ai" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg cursor-pointer">AI Settings</TabsTrigger>
            <TabsTrigger value="appearance" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg cursor-pointer">Appearance</TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg cursor-pointer">Security</TabsTrigger>
          </TabsList>

          {/* Profile */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-900 dark:text-white">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl mr-3">
                    <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  Profile Information
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Update your profile information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-purple-500 flex items-center justify-center shadow-lg">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium text-slate-900 dark:text-white">{settings.profile.displayName || 'Your Name'}</h3>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <Shield className="w-3 h-3 mr-1" />
                      Verified by Clerk
                    </Badge>
                  </div>
                </div>

                <Separator className="bg-slate-200 dark:bg-slate-700" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="text-slate-700 dark:text-slate-300 font-medium">Display Name</Label>
                    <Input
                      id="displayName"
                      value={settings.profile.displayName}
                      onChange={(e) => updateSettings('profile', 'displayName', e.target.value)}
                      className="rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-purple-500 bg-white/50 dark:bg-slate-800/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone" className="text-slate-700 dark:text-slate-300 font-medium">Timezone</Label>
                    <Select
                      value={settings.profile.timezone}
                      onValueChange={(value) => updateSettings('profile', 'timezone', value)}
                    >
                      <SelectTrigger className="rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-purple-500 cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border border-white/20 dark:border-slate-800/20 rounded-xl shadow-xl">
                        <SelectItem value="UTC" className="cursor-pointer">UTC</SelectItem>
                        <SelectItem value="EST" className="cursor-pointer">Eastern Time</SelectItem>
                        <SelectItem value="PST" className="cursor-pointer">Pacific Time</SelectItem>
                        <SelectItem value="GMT" className="cursor-pointer">Greenwich Mean Time</SelectItem>
                        <SelectItem value="IST" className="cursor-pointer">India Standard Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-slate-700 dark:text-slate-300 font-medium">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us a bit about yourself..."
                    value={settings.profile.bio}
                    onChange={(e) => updateSettings('profile', 'bio', e.target.value)}
                    rows={3}
                    className="rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-purple-500 bg-white/50 dark:bg-slate-800/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language" className="text-slate-700 dark:text-slate-300 font-medium">Preferred Language</Label>
                  <Select
                    value={settings.profile.language}
                    onValueChange={(value) => updateSettings('profile', 'language', value)}
                  >
                    <SelectTrigger className="rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-purple-500 cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border border-white/20 dark:border-slate-800/20 rounded-xl shadow-xl">
                      <SelectItem value="en" className="cursor-pointer">English</SelectItem>
                      <SelectItem value="es" className="cursor-pointer">Spanish</SelectItem>
                      <SelectItem value="fr" className="cursor-pointer">French</SelectItem>
                      <SelectItem value="de" className="cursor-pointer">German</SelectItem>
                      <SelectItem value="zh" className="cursor-pointer">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-900 dark:text-white">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl mr-3">
                    <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  Notification Preferences
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Choose how you want to be notified about updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-900 dark:text-white">Notification Channels</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="space-y-0.5">
                        <Label className="flex items-center text-slate-700 dark:text-slate-300">
                          <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-2">
                            <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          Email Notifications
                        </Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400 ml-7">Receive notifications via email</p>
                      </div>
                      <Switch
                        checked={settings.notifications.email}
                        onCheckedChange={(checked) => updateSettings('notifications', 'email', checked)}
                        className="data-[state=checked]:bg-purple-600"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="space-y-0.5">
                        <Label className="flex items-center text-slate-700 dark:text-slate-300">
                          <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-lg mr-2">
                            <Globe className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </div>
                          Browser Notifications
                        </Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400 ml-7">Show browser push notifications</p>
                      </div>
                      <Switch
                        checked={settings.notifications.browser}
                        onCheckedChange={(checked) => updateSettings('notifications', 'browser', checked)}
                        className="data-[state=checked]:bg-purple-600"
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-200 dark:bg-slate-700" />

                <div className="space-y-4">
                  <h4 className="font-medium text-slate-900 dark:text-white">Notification Types</h4>
                  <div className="space-y-4">
                    {[
                      { key: 'newTickets', label: 'New Tickets', description: 'Notify when new tickets are created' },
                      { key: 'mentions', label: 'Mentions & Assignments', description: "Notify when you're mentioned or assigned" },
                      { key: 'updates', label: 'Status Updates', description: 'Notify about ticket status changes' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="space-y-0.5">
                          <Label className="text-slate-700 dark:text-slate-300">{item.label}</Label>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
                        </div>
                        <Switch
                          checked={(settings.notifications as any)[item.key]}
                          onCheckedChange={(checked) => updateSettings('notifications', item.key, checked)}
                          className="data-[state=checked]:bg-purple-600"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Settings */}
          <TabsContent value="ai" className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-900 dark:text-white">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl mr-3">
                    <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  AI Assistant Settings
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Configure how the AI assistant behaves
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="space-y-0.5">
                    <Label className="text-slate-700 dark:text-slate-300">Auto-Response</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Allow AI to automatically respond to simple queries</p>
                  </div>
                  <Switch
                    checked={settings.ai.autoResponse}
                    onCheckedChange={(checked) => updateSettings('ai', 'autoResponse', checked)}
                    className="data-[state=checked]:bg-purple-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="escalationThreshold" className="text-slate-700 dark:text-slate-300 font-medium">Escalation Threshold</Label>
                  <Select
                    value={String(settings.ai.escalationThreshold)}
                    onValueChange={(value) => updateSettings('ai', 'escalationThreshold', parseInt(value))}
                  >
                    <SelectTrigger className="rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-purple-500 cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border border-white/20 dark:border-slate-800/20 rounded-xl shadow-xl">
                      <SelectItem value="1" className="cursor-pointer">After 1 failed attempt</SelectItem>
                      <SelectItem value="2" className="cursor-pointer">After 2 failed attempts</SelectItem>
                      <SelectItem value="3" className="cursor-pointer">After 3 failed attempts</SelectItem>
                      <SelectItem value="5" className="cursor-pointer">After 5 failed attempts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responseDelay" className="text-slate-700 dark:text-slate-300 font-medium">Response Delay (seconds)</Label>
                  <Input
                    id="responseDelay"
                    type="number"
                    min={0}
                    max={300}
                    value={settings.ai.responseDelay}
                    onChange={(e) => updateSettings('ai', 'responseDelay', parseInt(e.target.value || '0'))}
                    className="rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-purple-500 bg-white/50 dark:bg-slate-800/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 font-medium">Supported Languages</Label>
                  <div className="flex flex-wrap gap-2">
                    {['en', 'es', 'fr', 'de', 'zh', 'ja'].map((lang) => {
                      const active = settings.ai.languages.includes(lang)
                      return (
                        <Badge
                          key={lang}
                          variant={active ? 'default' : 'outline'}
                          className={`cursor-pointer transition-all duration-200 ${
                            active
                              ? 'bg-purple-600 text-white hover:bg-purple-700'
                              : 'border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/20'
                          }`}
                          onClick={() => {
                            const cur = settings.ai.languages
                            const next = cur.includes(lang) ? cur.filter(l => l !== lang) : [...cur, lang]
                            updateSettings('ai', 'languages', next)
                          }}
                        >
                          {lang.toUpperCase()}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance */}
          <TabsContent value="appearance" className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-900 dark:text-white">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl mr-3">
                    <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  Appearance Settings
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Customize how the application looks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    onClick={() => setTheme('light')}
                    className={`h-20 flex-col cursor-pointer ${
                      theme === 'light'
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20'
                    }`}
                  >
                    <div className="p-2 bg-yellow-100 rounded-xl mb-2">
                      <Sun className="w-6 h-6 text-yellow-600" />
                    </div>
                    Light
                  </Button>

                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    onClick={() => setTheme('dark')}
                    className={`h-20 flex-col cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20'
                    }`}
                  >
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl mb-2">
                      <Moon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    Dark
                  </Button>

                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    onClick={() => setTheme('system')}
                    className={`h-20 flex-col cursor-pointer ${
                      theme === 'system'
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20'
                    }`}
                  >
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl mb-2">
                      <Monitor className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    </div>
                    System
                  </Button>
                </div>

                <Alert className="backdrop-blur-sm bg-purple-50/80 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
                  <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Palette className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <AlertDescription className="text-purple-800 dark:text-purple-200">
                    The theme preference will be applied across all your devices when signed in.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-900 dark:text-white">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl mr-3">
                    <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  Security Settings
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Manage your account security and privacy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {[
                    {
                      title: 'Two-Factor Authentication',
                      description: 'Add an extra layer of security to your account',
                      action: <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">Managed by Clerk</Badge>,
                    },
                    {
                      title: 'Login History',
                      description: 'View your recent login activity',
                      action: <Button variant="outline" size="sm" className="border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20 rounded-xl cursor-pointer">View History</Button>,
                    },
                    {
                      title: 'Active Sessions',
                      description: 'Manage devices signed into your account',
                      action: <Button variant="outline" size="sm" className="border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20 rounded-xl cursor-pointer">Manage Sessions</Button>,
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="space-y-0.5">
                        <Label className="text-slate-700 dark:text-slate-300">{item.title}</Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
                      </div>
                      {item.action}
                    </div>
                  ))}
                </div>

                <Alert className="backdrop-blur-sm bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    Account security is managed through Clerk's secure authentication system.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}