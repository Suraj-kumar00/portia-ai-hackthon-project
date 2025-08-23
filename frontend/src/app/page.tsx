"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Bot, MessageSquare, BarChart3, Shield, CheckCircle, Sparkles, Zap, Globe, Clock, Moon, Sun, Menu, X } from 'lucide-react'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { useState } from 'react'

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-900" />
        
        {/* Pattern Background */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%238b5cf6' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
        
        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-3/4 left-1/3 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 backdrop-blur-custom bg-white/90 dark:bg-slate-900/90 border-b border-white/20 dark:border-slate-800/50">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            {/* Logo - Clickable to Homepage */}
            <Link href="/" className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl shadow-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Customer Support AI
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-8">
              <Link href="/about" className="text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium cursor-pointer">
                About
              </Link>
              <Link href="/features" className="text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium cursor-pointer">
                Features
              </Link>
              <Link href="/pricing" className="text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium cursor-pointer">
                Pricing
              </Link>
              <Link href="/contact" className="text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium cursor-pointer">
                Contact
              </Link>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              {/* Dark Mode Toggle */}
              <button
                className="w-9 h-9 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors cursor-pointer flex items-center justify-center"
                onClick={() => {
                  // Add your dark mode toggle logic here
                  document.documentElement.classList.toggle('dark')
                }}
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </button>

              {/* Desktop Auth Buttons */}
              <div className="hidden md:flex items-center space-x-3">
                <SignedOut>
                  <Link href="/sign-in">
                    <Button variant="ghost" className="rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button className="rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg cursor-pointer">
                      Get Started
                    </Button>
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard">
                    <Button variant="outline" className="rounded-xl border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20 cursor-pointer">
                      Dashboard
                    </Button>
                  </Link>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </div>

              {/* Mobile Menu Button */}
              <button
                className="w-9 h-9 rounded-xl lg:hidden hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors cursor-pointer flex items-center justify-center"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </button>
            </div>
          </nav>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex flex-col space-y-4 pt-4">
                {/* Mobile Navigation Links */}
                <Link 
                  href="/about" 
                  className="text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium cursor-pointer px-2 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  About
                </Link>
                <Link 
                  href="/features" 
                  className="text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium cursor-pointer px-2 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Features
                </Link>
                <Link 
                  href="/pricing" 
                  className="text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium cursor-pointer px-2 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link 
                  href="/contact" 
                  className="text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium cursor-pointer px-2 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contact
                </Link>
                
                {/* Mobile Auth Buttons */}
                <div className="flex flex-col space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <SignedOut>
                    <Link href="/sign-in" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" className="w-full rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/sign-up" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg cursor-pointer">
                        Get Started
                      </Button>
                    </Link>
                  </SignedOut>
                  <SignedIn>
                    <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full rounded-xl border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20 cursor-pointer">
                        Dashboard
                      </Button>
                    </Link>
                  </SignedIn>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-4 py-16">
        <div className="text-center space-y-8 max-w-5xl mx-auto animate-fadeIn">
          <Badge variant="secondary" className="mb-6 px-4 py-2 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-0">
            <Shield className="w-4 h-4 mr-2" />
            Powered by Portia AI
            <Sparkles className="w-4 h-4 ml-2" />
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              AI-Powered Customer Support
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-600 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Made Simple & Secure
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Transform your customer support with intelligent AI that understands, routes, and resolves tickets automatically while keeping humans in the loop.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 animate-slideUp">
            <SignedOut>
              <Link href="/sign-up">
                <Button size="lg" className="px-8 py-4 text-lg rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300 cursor-pointer">
                  Watch Demo
                </Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button size="lg" className="px-8 py-4 text-lg rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </SignedIn>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-20 animate-slideUp" style={{ animationDelay: '0.3s' }}>
          <div className="relative max-w-6xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 blur-3xl rounded-3xl" />
            <div className="relative backdrop-blur-custom bg-white/10 dark:bg-slate-900/10 rounded-3xl p-8 border border-white/20 dark:border-slate-800/20 shadow-2xl">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Customer Support Dashboard</h3>
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div className="text-2xl font-bold text-purple-600">2,847</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Total Tickets</div>
                    <div className="text-xs text-green-500 mt-1">+12.5%</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div className="text-2xl font-bold text-purple-600">89.3%</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Resolution Rate</div>
                    <div className="text-xs text-green-500 mt-1">+5.2%</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div className="text-2xl font-bold text-purple-600">2.3h</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Avg Response Time</div>
                    <div className="text-xs text-red-500 mt-1">-15.8%</div>
                  </div>
                </div>
                
                <div className="h-32 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl flex items-end justify-center p-4">
                  <div className="text-xs text-slate-600 dark:text-slate-400">Real-time Analytics & Insights</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 animate-slideUp" style={{ animationDelay: '0.6s' }}>
          <Card className="group transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2 border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-custom">
            <CardHeader className="pb-4">
              <div className="p-3 bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl">Intelligent Routing</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300">
                AI automatically categorizes and routes tickets to the right team with precision
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center text-slate-600 dark:text-slate-300">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3" />
                  Smart categorization
                </li>
                <li className="flex items-center text-slate-600 dark:text-slate-300">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3" />
                  Priority detection
                </li>
                <li className="flex items-center text-slate-600 dark:text-slate-300">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3" />
                  Auto-escalation
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="group transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2 border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-custom">
            <CardHeader className="pb-4">
              <div className="p-3 bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl">AI-Powered Responses</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300">
                Generate professional responses using advanced Portia AI and Gemini models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center text-slate-600 dark:text-slate-300">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3" />
                  Natural language processing
                </li>
                <li className="flex items-center text-slate-600 dark:text-slate-300">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3" />
                  Context-aware replies
                </li>
                <li className="flex items-center text-slate-600 dark:text-slate-300">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3" />
                  Multi-language support
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="group transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2 border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-custom">
            <CardHeader className="pb-4">
              <div className="p-3 bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl">Analytics & Insights</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300">
                Track performance and gain deep insights into customer satisfaction patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center text-slate-600 dark:text-slate-300">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3" />
                  Real-time dashboards
                </li>
                <li className="flex items-center text-slate-600 dark:text-slate-300">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3" />
                  Performance metrics
                </li>
                <li className="flex items-center text-slate-600 dark:text-slate-300">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3" />
                  Customer sentiment analysis
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="mt-20 text-center space-y-12 animate-slideUp" style={{ animationDelay: '0.9s' }}>
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              Trusted by Teams Worldwide
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Join thousands of businesses that have transformed their customer support operations
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="group">
              <div className="p-8 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-custom border border-white/20 dark:border-slate-800/20 transition-all duration-300 hover:bg-white/80 dark:hover:bg-slate-900/80 hover:shadow-xl">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent mb-2">99.9%</div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-300">Uptime Guarantee</div>
              </div>
            </div>
            <div className="group">
              <div className="p-8 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-custom border border-white/20 dark:border-slate-800/20 transition-all duration-300 hover:bg-white/80 dark:hover:bg-slate-900/80 hover:shadow-xl">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent mb-2">85%</div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-300">Faster Resolution</div>
              </div>
            </div>
            <div className="group">
              <div className="p-8 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-custom border border-white/20 dark:border-slate-800/20 transition-all duration-300 hover:bg-white/80 dark:hover:bg-slate-900/80 hover:shadow-xl">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent mb-2">24/7</div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-300">AI Availability</div>
              </div>
            </div>
            <div className="group">
              <div className="p-8 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-custom border border-white/20 dark:border-slate-800/20 transition-all duration-300 hover:bg-white/80 dark:hover:bg-slate-900/80 hover:shadow-xl">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent mb-2">10K+</div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-300">Tickets Processed</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Simple Footer (inspired by your image) */}
      <footer className="relative z-10 mt-24 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-custom">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo and Description */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Customer Support AI
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 max-w-md leading-relaxed">
                Transform your customer support with intelligent AI that understands, routes, and resolves tickets automatically while keeping humans in the loop.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Quick Links</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/features" className="text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer">
                    Support
                  </Link>
                </li>
              </ul>
            </div>

            {/* Newsletter Signup */}
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Stay Updated</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Get the latest updates and news about our AI platform.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <Button size="sm" className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 cursor-pointer">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              © 2025 Customer Support AI. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 text-sm">
              <Link href="/privacy" className="text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}