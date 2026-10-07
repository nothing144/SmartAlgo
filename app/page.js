'use client'

import { useState, useEffect } from 'react'
import { BookOpen, Users, Bot, Star, Clock, FileText, ArrowRight, CheckCircle, Plus, LogIn, Code, ImageIcon, Send } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { AuthNavigation } from '../components/AuthNavigation'
import SubmissionForm from '../components/SubmissionForm'
import SubmissionResults from '../components/SubmissionResults'
import MySubmissions from '../components/MySubmissions'
import AllSubmissions from '../components/AllSubmissions'
import PublicCodeSubmit from '../components/PublicCodeSubmit'
import PublicCodeView from '../components/PublicCodeView'
import PublicOutputSubmit from '../components/PublicOutputSubmit'
import PublicOutputView from '../components/PublicOutputView'
import { ThemeToggle } from '../components/ThemeToggle'

const HomePage = () => {
  const { user, loading: authLoading } = useAuth()
  const [currentView, setCurrentView] = useState('home') // 'home', 'submit', 'results', 'my-submissions', 'all-submissions', 'public-submit', 'public-view', 'public-output-submit', 'public-output-view'
  const [recentSubmissions, setRecentSubmissions] = useState([])
  const [currentSubmissionId, setCurrentSubmissionId] = useState(null)

  useEffect(() => {
    if (!authLoading) {
      fetchRecentSubmissions()
    }
  }, [authLoading])

  const fetchRecentSubmissions = async () => {
    try {
      const response = await fetch('/api/submissions')
      if (response.ok) {
        const data = await response.json()
        
        // Group combined submissions together
        const combinedGroups = {}
        const standaloneSubmissions = []
        
        data.forEach(submission => {
          if (submission.combinedSubmissionId) {
            // This is part of a combined submission
            if (!combinedGroups[submission.combinedSubmissionId]) {
              combinedGroups[submission.combinedSubmissionId] = {
                submissionId: submission.combinedSubmissionId,
                isCombined: true,
                assignmentTitle: submission.assignmentTitle,
                studentName: submission.studentName,
                createdAt: submission.createdAt,
                parts: [],
                // Overall status: completed only if all parts are completed
                status: 'completed'
              }
            }
            combinedGroups[submission.combinedSubmissionId].parts.push(submission)
            // Update overall status - if any part is not completed, update the status
            if (submission.status === 'evaluating' && combinedGroups[submission.combinedSubmissionId].status !== 'error') {
              combinedGroups[submission.combinedSubmissionId].status = 'evaluating'
            } else if (submission.status === 'error') {
              combinedGroups[submission.combinedSubmissionId].status = 'error'
            } else if (submission.status === 'submitted' && combinedGroups[submission.combinedSubmissionId].status === 'completed') {
              combinedGroups[submission.combinedSubmissionId].status = 'submitted'
            }
          } else {
            // Standalone submission
            standaloneSubmissions.push(submission)
          }
        })
        
        // Combine and sort by date
        const allSubmissions = [...Object.values(combinedGroups), ...standaloneSubmissions]
        allSubmissions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        
        setRecentSubmissions(allSubmissions.slice(0, 5)) // Show latest 5
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
    }
  }

  const handleSubmissionSuccess = () => {
    fetchRecentSubmissions()
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  // Show different views based on currentView
  if (currentView === 'submit') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AuthNavigation currentView={currentView} setCurrentView={setCurrentView} />
        <SubmissionForm 
          setCurrentView={setCurrentView} 
          setCurrentSubmissionId={setCurrentSubmissionId}
          onSubmissionSuccess={handleSubmissionSuccess}
        />
      </div>
    )
  }

  if (currentView === 'results') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AuthNavigation currentView={currentView} setCurrentView={setCurrentView} />
        <SubmissionResults 
          submissionId={currentSubmissionId} 
          setCurrentView={setCurrentView} 
        />
      </div>
    )
  }

  if (currentView === 'my-submissions') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AuthNavigation currentView={currentView} setCurrentView={setCurrentView} />
        <MySubmissions 
          setCurrentView={setCurrentView} 
          setCurrentSubmissionId={setCurrentSubmissionId}
        />
      </div>
    )
  }

  if (currentView === 'all-submissions') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AuthNavigation currentView={currentView} setCurrentView={setCurrentView} />
        <AllSubmissions 
          setCurrentView={setCurrentView} 
          setCurrentSubmissionId={setCurrentSubmissionId}
        />
      </div>
    )
  }

  if (currentView === 'public-submit') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AuthNavigation currentView={currentView} setCurrentView={setCurrentView} />
        <PublicCodeSubmit setCurrentView={setCurrentView} />
      </div>
    )
  }

  if (currentView === 'public-view') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AuthNavigation currentView={currentView} setCurrentView={setCurrentView} />
        <PublicCodeView setCurrentView={setCurrentView} />
      </div>
    )
  }

  if (currentView === 'public-output-submit') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AuthNavigation currentView={currentView} setCurrentView={setCurrentView} />
        <PublicOutputSubmit setCurrentView={setCurrentView} />
      </div>
    )
  }

  if (currentView === 'public-output-view') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AuthNavigation currentView={currentView} setCurrentView={setCurrentView} />
        <PublicOutputView setCurrentView={setCurrentView} />
      </div>
    )
  }

  // Home/Dashboard view
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <AuthNavigation currentView={currentView} setCurrentView={setCurrentView} />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
        {/* Welcome Section */}
        <div className="max-w-2xl mb-24">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
            Smart Evaluator
          </h1>
          <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
            A rubric-based assessment tool for flowcharts, algorithms, and pseudocode. Designed to provide consistent, actionable feedback.
          </p>
          
          {user ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setCurrentView('submit')}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Submission
              </button>
              <button
                onClick={() => setCurrentView('my-submissions')}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors border border-border"
              >
                <FileText className="w-4 h-4" />
                View History
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="/auth/sign-up"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
              >
                Get Started
              </a>
              <a
                href="/auth/sign-in"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors border border-border"
              >
                Sign In
              </a>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mb-24">
          <h2 className="text-lg font-medium tracking-tight mb-8 text-foreground">Core concepts</h2>
          <div className="grid md:grid-cols-3 gap-x-8 gap-y-10 border-t border-border pt-8">
            <div>
              <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center mb-4">
                <FileText className="w-4 h-4 text-foreground" />
              </div>
              <h3 className="text-sm font-medium text-foreground mb-2">Multiple formats</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Submit flowcharts as images, or paste your algorithms and pseudocode directly into the editor.
              </p>
            </div>
            
            <div>
              <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center mb-4">
                <Star className="w-4 h-4 text-foreground" />
              </div>
              <h3 className="text-sm font-medium text-foreground mb-2">Standardized rubrics</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Submissions are evaluated against predefined criteria ensuring consistency across logic, structure, and syntax.
              </p>
            </div>

            <div>
              <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center mb-4">
                <Bot className="w-4 h-4 text-foreground" />
              </div>
              <h3 className="text-sm font-medium text-foreground mb-2">Immediate feedback</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Receive detailed analysis and scoring within seconds to help identify areas for improvement.
              </p>
            </div>
          </div>
        </div>

        {/* Community & Public Sections */}
        <div className="mb-24 pt-16 border-t border-border">
          <div className="flex items-baseline justify-between mb-8">
             <h2 className="text-lg font-medium tracking-tight text-foreground">Public directory</h2>
             <span className="text-xs text-muted-foreground">No account required</span>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Public Codes */}
            <div className="group border border-border rounded-lg p-5 hover:border-primary/30 transition-colors cursor-pointer bg-card flex flex-col" onClick={() => setCurrentView('public-view')}>
              <div className="flex justify-between items-start mb-4">
                 <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                   <Code className="w-4 h-4 text-foreground" />
                 </div>
                 <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <h3 className="text-sm font-medium text-foreground mb-1">Code submissions</h3>
              <p className="text-sm text-muted-foreground mb-6 flex-grow">
                Browse through diverse algorithms and implementations shared by the community.
              </p>
              <div className="flex items-center gap-4 mt-auto">
                <button
                  onClick={(e) => { e.stopPropagation(); setCurrentView('public-submit'); }}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  Submit code
                </button>
              </div>
            </div>

            {/* Public Output Photos */}
            <div className="group border border-border rounded-lg p-5 hover:border-primary/30 transition-colors cursor-pointer bg-card flex flex-col" onClick={() => setCurrentView('public-output-view')}>
              <div className="flex justify-between items-start mb-4">
                 <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                   <ImageIcon className="w-4 h-4 text-foreground" />
                 </div>
                 <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <h3 className="text-sm font-medium text-foreground mb-1">Visual outputs</h3>
              <p className="text-sm text-muted-foreground mb-6 flex-grow">
                Explore screenshots of program executions and visual results from other users.
              </p>
              <div className="flex items-center gap-4 mt-auto">
                <button
                  onClick={(e) => { e.stopPropagation(); setCurrentView('public-output-submit'); }}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  Share output
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {user && recentSubmissions.length > 0 && (
          <div className="pt-16 border-t border-border">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="text-lg font-medium tracking-tight text-foreground">Recent activity</h2>
              <button
                onClick={() => setCurrentView('my-submissions')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                View history <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="flex flex-col">
              {recentSubmissions.map((submission) => (
                <div
                  key={submission.submissionId}
                  className="flex items-center justify-between py-3 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer -mx-3 px-3 rounded-md"
                  onClick={() => {
                    setCurrentSubmissionId(submission.submissionId)
                    setCurrentView('results')
                  }}
                >
                  <div className="flex items-center gap-3">
                    {submission.status === 'completed' && <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />}
                    {submission.status === 'evaluating' && <Clock className="w-4 h-4 text-amber-600 dark:text-amber-500 animate-spin" />}
                    {submission.status === 'error' && <Clock className="w-4 h-4 text-red-600 dark:text-red-500" />}
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {submission.assignmentTitle}
                      </span>
                      <span className="hidden sm:inline text-muted-foreground text-xs">•</span>
                      <span className="text-xs text-muted-foreground">
                        {submission.isCombined ? 'Combined Submission' : submission.submissionType}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {new Date(submission.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-sm ${
                      submission.status === 'completed' 
                        ? 'bg-emerald-100/50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : submission.status === 'evaluating'
                        ? 'bg-amber-100/50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                        : 'bg-red-100/50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                    }`}>
                      {submission.status === 'completed' ? 'Completed' : 
                       submission.status === 'evaluating' ? 'Evaluating' : 'Failed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default HomePage