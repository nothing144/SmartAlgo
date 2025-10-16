'use client'

import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ThemeToggle } from './ThemeToggle'
import { 
  User, 
  LogOut, 
  BookOpen, 
  Users, 
  FileText, 
  Plus, 
  ChevronDown,
  Code2
} from 'lucide-react'

export const AuthNavigation = ({ currentView, setCurrentView }) => {
  const { user, signOut } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setCurrentView('home')
  }

  if (!user) {
    return (
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div 
              className="flex items-center cursor-pointer" 
              onClick={() => setCurrentView('home')}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-[#090f4f] to-[#02050e] rounded-lg flex items-center justify-center mr-3">
                <span className="text-sm font-bold text-white">SE</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Smart Evaluator
              </span>
            </div>

            {/* Desktop Right Side - Theme Toggle + Auth Links */}
            <div className="hidden sm:flex items-center space-x-4">
              <button
                onClick={() => setCurrentView('public-view')}
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-[#090f4f] dark:hover:text-[#5a6fd8] px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <Code2 className="w-4 h-4 mr-2" />
                Public Codes
              </button>
              <ThemeToggle />
              <a 
                href="/auth/sign-in"
                className="text-gray-600 dark:text-gray-300 hover:text-[#090f4f] dark:hover:text-[#5a6fd8] px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign In
              </a>
              <a 
                href="/auth/sign-up"
                className="bg-gradient-to-r from-[#090f4f] to-[#02050e] hover:from-[#0a1058] hover:to-[#030714] text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
              >
                Sign Up
              </a>
            </div>

            {/* Mobile Right Side - Theme Toggle + Menu Button */}
            <div className="flex items-center space-x-2 sm:hidden">
              <ThemeToggle />
              <button 
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showMobileMenu ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu for Logged Out Users */}
          {showMobileMenu && (
            <div className="sm:hidden border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg relative z-50">
              <div className="px-4 py-3 space-y-3">
                <a 
                  href="/auth/sign-in"
                  className="block w-full text-center px-4 py-3 text-gray-600 dark:text-gray-300 hover:text-[#4a1d96] dark:hover:text-[#a78bfa] hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg text-sm font-medium transition-all"
                >
                  Sign In
                </a>
                <a 
                  href="/auth/sign-up"
                  className="block w-full text-center bg-gradient-to-r from-[#4a1d96] to-[#2d1055] hover:from-[#5a2da6] hover:to-[#3d1865] text-white px-4 py-3 rounded-lg text-sm font-medium transition-all"
                >
                  Sign Up
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Close dropdown when clicking outside */}
        {showMobileMenu && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMobileMenu(false)}
          />
        )}
      </nav>
    )
  }

  return (
    <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer" 
            onClick={() => setCurrentView('home')}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-[#4a1d96] to-[#2d1055] rounded-lg flex items-center justify-center mr-3">
              <span className="text-sm font-bold text-white">SE</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Smart Evaluator
            </span>
          </div>

          {/* Main Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setCurrentView('home')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentView === 'home'
                  ? 'bg-[#4a1d96]/10 dark:bg-[#4a1d96]/30 text-[#4a1d96] dark:text-[#a78bfa]'
                  : 'text-gray-600 dark:text-gray-300 hover:text-[#4a1d96] dark:hover:text-[#a78bfa] hover:bg-gray-100 dark:hover:bg-gray-800/50'
              }`}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Dashboard
            </button>

            <button
              onClick={() => setCurrentView('submit')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentView === 'submit'
                  ? 'bg-[#4a1d96]/10 dark:bg-[#4a1d96]/30 text-[#4a1d96] dark:text-[#a78bfa]'
                  : 'text-gray-600 dark:text-gray-300 hover:text-[#4a1d96] dark:hover:text-[#a78bfa] hover:bg-gray-100 dark:hover:bg-gray-800/50'
              }`}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Submission
            </button>

            <button
              onClick={() => setCurrentView('my-submissions')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentView === 'my-submissions'
                  ? 'bg-[#4a1d96]/10 dark:bg-[#4a1d96]/30 text-[#4a1d96] dark:text-[#a78bfa]'
                  : 'text-gray-600 dark:text-gray-300 hover:text-[#4a1d96] dark:hover:text-[#a78bfa] hover:bg-gray-100 dark:hover:bg-gray-800/50'
              }`}
            >
              <FileText className="w-4 h-4 mr-2" />
              My Submissions
            </button>

            <button
              onClick={() => setCurrentView('all-submissions')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentView === 'all-submissions'
                  ? 'bg-[#4a1d96]/10 dark:bg-[#4a1d96]/30 text-[#4a1d96] dark:text-[#a78bfa]'
                  : 'text-gray-600 dark:text-gray-300 hover:text-[#4a1d96] dark:hover:text-[#a78bfa] hover:bg-gray-100 dark:hover:bg-gray-800/50'
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              All Submissions
            </button>
          </div>

          {/* Right Side - Theme Toggle + User Menu + Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            
            {/* Desktop User Menu */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-[#4a1d96] dark:hover:text-[#a78bfa] hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-[#4a1d96] to-[#2d1055] rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium">
                  {user.user_metadata?.name || user.email}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Desktop Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.user_metadata?.name || 'User'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden text-gray-600 dark:text-gray-300 hover:text-[#4a1d96] dark:hover:text-[#a78bfa] p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showMobileMenu ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg relative z-50">
          <div className="px-4 py-3 space-y-2">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setCurrentView('home')
                setShowMobileMenu(false)
              }}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all touch-manipulation ${
                currentView === 'home'
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
              }`}
            >
              <BookOpen className="w-4 h-4 mr-3" />
              Dashboard
            </button>

            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setCurrentView('submit')
                setShowMobileMenu(false)
              }}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all touch-manipulation ${
                currentView === 'submit'
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
              }`}
            >
              <Plus className="w-4 h-4 mr-3" />
              New Submission
            </button>

            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setCurrentView('my-submissions')
                setShowMobileMenu(false)
              }}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all touch-manipulation ${
                currentView === 'my-submissions'
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
              }`}
            >
              <FileText className="w-4 h-4 mr-3" />
              My Submissions
            </button>

            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setCurrentView('all-submissions')
                setShowMobileMenu(false)
              }}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all touch-manipulation ${
                currentView === 'all-submissions'
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
              }`}
            >
              <Users className="w-4 h-4 mr-3" />
              All Submissions
            </button>

            {/* Mobile User Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
              <div className="px-4 py-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.user_metadata?.name || 'User'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleSignOut()
                  setShowMobileMenu(false)
                }}
                className="w-full flex items-center px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors touch-manipulation"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {(showUserMenu || showMobileMenu) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowUserMenu(false)
            setShowMobileMenu(false)
          }}
        />
      )}
    </nav>
  )
}