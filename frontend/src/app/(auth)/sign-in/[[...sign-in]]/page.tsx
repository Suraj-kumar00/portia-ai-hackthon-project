'use client'

import { SignIn } from '@clerk/nextjs'
import { Bot, Sparkles, Shield } from 'lucide-react'
import Link from 'next/link'

export default function SignInPage() {
  return (
    <div className="min-h-screen overflow-hidden relative">
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

      <div className="min-h-screen flex">
        {/* Left Side - Branding with Subtle Glass Effect */}
        <div className="hidden lg:flex lg:w-1/2 relative">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-purple-50 to-blue-50 dark:from-purple-900/30 dark:via-purple-800/20 dark:to-slate-900" />
          
          <div className="relative z-10 flex flex-col justify-center px-12">
            {/* Glass Container for Content */}
            <div className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/50 rounded-3xl p-8 border border-white/40 dark:border-slate-600/50 shadow-2xl">
              {/* Logo */}
              <div className="flex items-center space-x-3 mb-8">
                <div className="p-3 bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl shadow-lg">
                  <Bot className="h-8 w-8 text-white" />
                </div>
                <span className="text-2xl font-bold text-slate-800 dark:text-white">Customer Support AI</span>
              </div>

              {/* Hero Content */}
              <div className="mb-8">
                <h1 className="text-4xl font-bold mb-6 leading-tight text-slate-800 dark:text-white">
                  Analyze & improve customer
                  <br />
                  engagement and upselling
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
                  Transform your customer support with intelligent AI that understands, routes, and resolves tickets automatically.
                </p>
              </div>

              {/* Features List */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <span className="text-slate-600 dark:text-slate-300">AI-powered ticket routing</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <span className="text-slate-600 dark:text-slate-300">Real-time analytics dashboard</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <span className="text-slate-600 dark:text-slate-300">24/7 automated responses</span>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                <Shield className="w-4 h-4 text-purple-500" />
                <span className="text-sm">Enterprise-grade security with Clerk</span>
                <Sparkles className="w-4 h-4 ml-2 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Sign In Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center space-x-3 mb-8">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl shadow-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Customer Support AI
              </span>
            </div>

            {/* FIXED Clerk Container - Better visibility in dark mode */}
            <div className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/60 rounded-3xl p-6 border border-white/40 dark:border-slate-600/60 shadow-2xl">
              <SignIn 
                path="/sign-in" 
                routing="path" 
                signUpUrl="/sign-up"
                afterSignInUrl="/dashboard"
                appearance={{
                  elements: {
                    formButtonPrimary: 
                      "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-sm normal-case shadow-lg transition-all duration-300 transform hover:scale-105 rounded-xl",
                    card: "shadow-none bg-transparent border-0",
                    headerTitle: "text-2xl font-bold text-slate-800 dark:text-white",
                    headerSubtitle: "text-slate-600 dark:text-slate-300",
                    socialButtonsBlockButton: "border-2 border-white/50 dark:border-slate-500 hover:bg-white/30 dark:hover:bg-slate-600/30 rounded-xl transition-all duration-300 backdrop-blur-sm text-slate-700 dark:text-slate-200",
                    formFieldInput: "rounded-xl border-2 border-white/50 dark:border-slate-500 focus:border-purple-500 transition-all duration-300 bg-white/40 dark:bg-slate-600/40 backdrop-blur-sm text-slate-800 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400",
                    footerActionLink: "text-purple-600 hover:text-purple-500",
                    dividerLine: "bg-white/50 dark:bg-slate-500",
                    dividerText: "text-slate-600 dark:text-slate-300",
                    formFieldLabel: "text-slate-700 dark:text-slate-200 font-medium",
                    identityPreviewEditButton: "text-purple-600 hover:text-purple-500",
                    formButtonReset: "text-purple-600 hover:text-purple-500",
                  },
                  variables: {
                    colorPrimary: "#8b5cf6",
                    colorText: "rgb(51 65 85)",
                    colorTextSecondary: "rgb(100 116 139)",
                    colorBackground: "transparent",
                    colorInputBackground: "rgba(255, 255, 255, 0.1)",
                    colorInputText: "rgb(51 65 85)",
                    borderRadius: "0.75rem",
                  }
                }}
              />
            </div>

            {/* Back to Home */}
            <div className="text-center mt-6">
              <Link href="/" className="text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-sm">
                ← Back to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}