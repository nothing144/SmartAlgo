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
  Code2,
  ImageIcon,
  Menu,
  X
} from 'lucide-react'

export const AuthNavigation = ({ currentView, setCurrentView }) => {
  const { user, signOut } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setCurrentView('home')
  }

  const NavLink = ({ view, views, icon: Icon, children, onClick }) => {
    const isActive = views ? views.includes(currentView) : currentView === view
    return (
      <button
        onClick={() => {
          if (onClick) onClick()
          else setCurrentView(view)
          setShowMobileMenu(false)
        }}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
        }`}
      >
        {Icon && <Icon className="w-4 h-4" />}
        {children}
      </button>
    )
  }

  // ─── Logged-out navbar ───
  if (!user) {
    return (
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Logo */}
            <div 
              className="flex items-center gap-2.5 cursor-pointer" 
              onClick={() => setCurrentView('home')}
            >
              <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
                <span className="text-[11px] font-bold text-primary-foreground">SE</span>
              </div>
              <span className="text-sm font-semibold text-foreground">
                Smart Evaluator
              </span>
            </div>

            {/* Desktop nav */}
            <div className="hidden sm:flex items-center gap-1">
              <NavLink view="public-view" icon={Code2}>Codes</NavLink>
              <NavLink view="public-output-view" icon={ImageIcon}>Outputs</NavLink>
              <div className="w-px h-5 bg-border mx-2" />
              <ThemeToggle />
              <a 
                href="/auth/sign-in"
                className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 transition-colors"
              >
                Sign in
              </a>
              <a 
                href="/auth/sign-up"
                className="text-sm font-semibold text-primary-foreground bg-primary px-3.5 py-1.5 rounded-md hover:opacity-90 transition-opacity"
              >
                Sign up
              </a>
            </div>

            {/* Mobile */}
            <div className="flex items-center gap-2 sm:hidden">
              <ThemeToggle />
              <button 
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="text-muted-foreground hover:text-foreground p-1.5"
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile dropdown */}
          {showMobileMenu && (
            <div className="sm:hidden border-t border-border py-3 space-y-1">
              <NavLink view="public-view" icon={Code2}>Public Codes</NavLink>
              <NavLink view="public-output-view" icon={ImageIcon}>Public Outputs</NavLink>
              <div className="border-t border-border my-2" />
              <a 
                href="/auth/sign-in"
                className="block w-full text-center px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/60 transition-colors"
              >
                Sign in
              </a>
              <a 
                href="/auth/sign-up"
                className="block w-full text-center px-4 py-2.5 text-sm font-semibold text-primary-foreground bg-primary rounded-md hover:opacity-90 transition-opacity"
              >
                Sign up
              </a>
            </div>
          )}
        </div>

        {/* Backdrop */}
        {showMobileMenu && (
          <div 
            className="fixed inset-0 z-[-1]" 
            onClick={() => setShowMobileMenu(false)}
          />
        )}
      </nav>
    )
  }

  // ─── Logged-in navbar ───
  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer" 
            onClick={() => setCurrentView('home')}
          >
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
              <span className="text-[11px] font-bold text-primary-foreground">SE</span>
            </div>
            <span className="text-sm font-semibold text-foreground hidden sm:block">
              Smart Evaluator
            </span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink view="home" icon={BookOpen}>Home</NavLink>
            <NavLink view="submit" icon={Plus}>Submit</NavLink>
            <NavLink view="my-submissions" icon={FileText}>My work</NavLink>
            <NavLink view="all-submissions" icon={Users}>Browse</NavLink>
            <NavLink views={['public-view', 'public-submit']} view="public-view" icon={Code2}>Codes</NavLink>
            <NavLink views={['public-output-view', 'public-output-submit']} view="public-output-view" icon={ImageIcon}>Outputs</NavLink>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            {/* Desktop user menu */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <div className="w-6 h-6 bg-primary/15 rounded-full flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-sm font-medium max-w-[120px] truncate">
                  {user.user_metadata?.name || user.email?.split('@')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-1.5 w-52 bg-card rounded-lg border border-border shadow-lg py-1 z-50">
                  <div className="px-3 py-2.5 border-b border-border">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user.user_metadata?.name || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden text-muted-foreground hover:text-foreground p-1.5"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-4 py-3 space-y-1">
            <NavLink view="home" icon={BookOpen}>Dashboard</NavLink>
            <NavLink view="submit" icon={Plus}>New Submission</NavLink>
            <NavLink view="my-submissions" icon={FileText}>My Submissions</NavLink>
            <NavLink view="all-submissions" icon={Users}>All Submissions</NavLink>
            <NavLink views={['public-view', 'public-submit']} view="public-view" icon={Code2}>Public Codes</NavLink>
            <NavLink views={['public-output-view', 'public-output-submit']} view="public-output-view" icon={ImageIcon}>Public Outputs</NavLink>

            <div className="border-t border-border pt-3 mt-3">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-foreground">
                  {user?.user_metadata?.name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={() => {
                  handleSignOut()
                  setShowMobileMenu(false)
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {(showUserMenu || showMobileMenu) && (
        <div 
          className="fixed inset-0 z-[-1]" 
          onClick={() => {
            setShowUserMenu(false)
            setShowMobileMenu(false)
          }}
        />
      )}
    </nav>
  )
}