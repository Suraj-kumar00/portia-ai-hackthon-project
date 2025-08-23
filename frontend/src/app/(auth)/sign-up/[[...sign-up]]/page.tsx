'use client'

import { SignUp } from '@clerk/nextjs'
import { Bot, Sparkles, Shield, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function SignUpPage() {
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
        {/* Left Side - Sign Up Form */}
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

            {/* SINGLE Clerk Container */}
            <div className="backdrop-blur-xl bg-white/20 dark:bg-slate-900/20 rounded-3xl p-6 border border-white/30 dark:border-slate-700/30 shadow-2xl">
              <SignUp 
                path="/sign-up" 
                routing="path" 
                signInUrl="/sign-in"
                afterSignUpUrl="/dashboard"
                appearance={{
                  elements: {
                    formButtonPrimary: 
                      "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-sm normal-case shadow-lg transition-all duration-300 transform hover:scale-105 rounded-xl",
                    card: "shadow-none bg-transparent border-0",
                    headerTitle: "text-2xl font-bold text-slate-800 dark:text-white",
                    headerSubtitle: "text-slate-600 dark:text-slate-300",
                    socialButtonsBlockButton: "border-2 border-white/40 dark:border-slate-600 hover:bg-white/20 dark:hover:bg-slate-700/20 rounded-xl transition-all duration-300 backdrop-blur-sm",
                    formFieldInput: "rounded-xl border-2 border-white/40 dark:border-slate-600 focus:border-purple-500 transition-all duration-300 bg-white/30 dark:bg-slate-700/30 backdrop-blur-sm",
                    footerActionLink: "text-purple-600 hover:text-purple-500",
                    dividerLine: "bg-white/40 dark:bg-slate-600",
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

        {/* Right Side - Branding with Subtle Glass Effect */}
        <div className="hidden lg:flex lg:w-1/2 relative">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-purple-50 to-blue-50 dark:from-purple-900/30 dark:via-purple-800/20 dark:to-slate-900" />
          
          <div className="relative z-10 flex flex-col justify-center px-12">
            {/* Glass Container for Content */}
            <div className="backdrop-blur-xl bg-white/30 dark:bg-slate-900/30 rounded-3xl p-8 border border-white/40 dark:border-slate-700/40 shadow-2xl">
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
                  Welcome to your new
                  <br />
                  customer management
                  <br />
                  platform
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
                  To get the best experience, we recommend connecting to one CRM tool. This is necessary for us to have a source to generate reports for you.
                </p>
              </div>

              {/* Benefits List */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-slate-600 dark:text-slate-300">Connect your CRM tool</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-slate-600 dark:text-slate-300">HubSpot integration ready</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-slate-600 dark:text-slate-300">Salesforce sync available</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-slate-600 dark:text-slate-300">Zoho CRM support</span>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                <Shield className="w-4 h-4 text-purple-500" />
                <span className="text-sm">All your data is protected and used only for the purpose of Customer Support AI</span>
                <Sparkles className="w-4 h-4 ml-2 text-purple-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}