'use client'

import { useState } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, Save, Bell, Shield, Bot, Settings, User, 
  Mail, Globe, Palette, Moon, Sun, Monitor 
} from 'lucide-react'
import Link from 'next/link'
import { useTheme } from 'next-themes'

export default function SettingsPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { theme, setTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      browser: true,
      newTickets: true,
      mentions: true,
      updates: false
    },
    ai: {
      autoResponse: true,
      escalationThreshold: 3,
      responseDelay: 30,
      languages: ['en', 'es']
    },
    profile: {
      displayName: user?.firstName + ' ' + user?.lastName || '',
      bio: '',
      timezone: 'UTC',
      language: 'en'
    }
  })

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  const handleSaveSettings = async () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      // Show success message
    }, 1000)
  }

  const updateSettings = (section: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value
      }
    }))
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
                <Settings className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Settings</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={handleSaveSettings} disabled={isLoading}>
                {isLoading ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="ai">AI Settings</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your profile information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-10 h-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium">{user.firstName} {user.lastName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {user.emailAddresses[0].emailAddress}
                    </p>
                    <Badge variant="secondary">
                      <Shield className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={settings.profile.displayName}
                      onChange={(e) => updateSettings('profile', 'displayName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select 
                      value={settings.profile.timezone} 
                      onValueChange={(value) => updateSettings('profile', 'timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="EST">Eastern Time</SelectItem>
                        <SelectItem value="PST">Pacific Time</SelectItem>
                        <SelectItem value="GMT">Greenwich Mean Time</SelectItem>
                        <SelectItem value="IST">India Standard Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us a bit about yourself..."
                    value={settings.profile.bio}
                    onChange={(e) => updateSettings('profile', 'bio', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Preferred Language</Label>
                  <Select 
                    value={settings.profile.language} 
                    onValueChange={(value) => updateSettings('profile', 'language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how you want to be notified about updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Notification Channels</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="flex items-center">
                          <Mail className="w-4 h-4 mr-2" />
                          Email Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via email
                        </p>
                      </div>
                      <Switch 
                        checked={settings.notifications.email}
                        onCheckedChange={(checked) => updateSettings('notifications', 'email', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="flex items-center">
                          <Globe className="w-4 h-4 mr-2" />
                          Browser Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Show browser push notifications
                        </p>
                      </div>
                      <Switch 
                        checked={settings.notifications.browser}
                        onCheckedChange={(checked) => updateSettings('notifications', 'browser', checked)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Notification Types</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>New Tickets</Label>
                        <p className="text-sm text-muted-foreground">
                          Notify when new tickets are created
                        </p>
                      </div>
                      <Switch 
                        checked={settings.notifications.newTickets}
                        onCheckedChange={(checked) => updateSettings('notifications', 'newTickets', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Mentions & Assignments</Label>
                        <p className="text-sm text-muted-foreground">
                          Notify when you're mentioned or assigned
                        </p>
                      </div>
                      <Switch 
                        checked={settings.notifications.mentions}
                        onCheckedChange={(checked) => updateSettings('notifications', 'mentions', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Status Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Notify about ticket status changes
                        </p>
                      </div>
                      <Switch 
                        checked={settings.notifications.updates}
                        onCheckedChange={(checked) => updateSettings('notifications', 'updates', checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="w-5 h-5 mr-2" />
                  AI Assistant Settings
                </CardTitle>
                <CardDescription>
                  Configure how the AI assistant behaves
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-Response</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow AI to automatically respond to simple queries
                    </p>
                  </div>
                  <Switch 
                    checked={settings.ai.autoResponse}
                    onCheckedChange={(checked) => updateSettings('ai', 'autoResponse', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="escalationThreshold">Escalation Threshold</Label>
                  <Select 
                    value={settings.ai.escalationThreshold.toString()} 
                    onValueChange={(value) => updateSettings('ai', 'escalationThreshold', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">After 1 failed attempt</SelectItem>
                      <SelectItem value="2">After 2 failed attempts</SelectItem>
                      <SelectItem value="3">After 3 failed attempts</SelectItem>
                      <SelectItem value="5">After 5 failed attempts</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    When to escalate to human agents
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responseDelay">Response Delay (seconds)</Label>
                  <Input
                    id="responseDelay"
                    type="number"
                    min="0"
                    max="300"
                    value={settings.ai.responseDelay}
                    onChange={(e) => updateSettings('ai', 'responseDelay', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Delay before AI responds to make it feel more natural
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Supported Languages</Label>
                  <div className="flex flex-wrap gap-2">
                    {['en', 'es', 'fr', 'de', 'zh', 'ja'].map((lang) => (
                      <Badge 
                        key={lang}
                        variant={settings.ai.languages.includes(lang) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const currentLangs = settings.ai.languages
                          const newLangs = currentLangs.includes(lang) 
                            ? currentLangs.filter(l => l !== lang)
                            : [...currentLangs, lang]
                          updateSettings('ai', 'languages', newLangs)
                        }}
                      >
                        {lang.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Appearance Settings
                </CardTitle>
                <CardDescription>
                  Customize how the application looks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Theme Preference</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      onClick={() => setTheme('light')}
                      className="h-20 flex-col"
                    >
                      <Sun className="w-6 h-6 mb-2" />
                      Light
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      onClick={() => setTheme('dark')}
                      className="h-20 flex-col"
                    >
                      <Moon className="w-6 h-6 mb-2" />
                      Dark
                    </Button>
                    <Button
                      variant={theme === 'system' ? 'default' : 'outline'}
                      onClick={() => setTheme('system')}
                      className="h-20 flex-col"
                    >
                      <Monitor className="w-6 h-6 mb-2" />
                      System
                    </Button>
                  </div>
                </div>

                <Alert>
                  <Palette className="h-4 w-4" />
                  <AlertDescription>
                    The theme preference will be applied across all your devices when signed in.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security and privacy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Badge variant="secondary">Managed by Clerk</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Login History</Label>
                      <p className="text-sm text-muted-foreground">
                        View your recent login activity
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      View History
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Active Sessions</Label>
                      <p className="text-sm text-muted-foreground">
                        Manage devices signed into your account
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Manage Sessions
                    </Button>
                  </div>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Account security is managed through Clerk's secure authentication system.
                    Visit your Clerk user profile to manage advanced security settings.
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