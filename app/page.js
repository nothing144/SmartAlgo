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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-border border-t-primary mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    )
  }

  // Show different views based on currentView
  if (currentView === 'submit') {
    return (
      <div className="min-h-screen bg-background">
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
      <div className="min-h-screen bg-background">
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
      <div className="min-h-screen bg-background">
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
      <div className="min-h-screen bg-background">
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
      <div className="min-h-screen bg-background">
        <AuthNavigation currentView={currentView} setCurrentView={setCurrentView} />
        <PublicCodeSubmit setCurrentView={setCurrentView} />
      </div>
    )
  }

  if (currentView === 'public-view') {
    return (
      <div className="min-h-screen bg-background">
        <AuthNavigation currentView={currentView} setCurrentView={setCurrentView} />
        <PublicCodeView setCurrentView={setCurrentView} />
      </div>
    )
  }

  if (currentView === 'public-output-submit') {
    return (
      <div className="min-h-screen bg-background">
        <AuthNavigation currentView={currentView} setCurrentView={setCurrentView} />
        <PublicOutputSubmit setCurrentView={setCurrentView} />
      </div>
    )
  }

  if (currentView === 'public-output-view') {
    return (
      <div className="min-h-screen bg-background">
        <AuthNavigation currentView={currentView} setCurrentView={setCurrentView} />
        <PublicOutputView setCurrentView={setCurrentView} />
      </div>
    )
  }

  // Home/Dashboard view
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AuthNavigation currentView={currentView} setCurrentView={setCurrentView} />
      
      <main>
        {/* ─── Hero ─── */}
        <section className="relative overflow-hidden border-b border-border">
          {/* Dot grid background */}
          <div className="absolute inset-0 bg-dot-pattern opacity-40 dark:opacity-20" />
          {/* Subtle brand glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/8 dark:bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 md:pt-28 md:pb-32">
            <div className="animate-fade-up">
              <span className="inline-block text-xs font-medium tracking-widest uppercase text-primary mb-6">
                Rubric-based AI evaluation
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1] mb-6 max-w-3xl">
                Get real feedback on your{' '}
                <span className="text-primary">algorithms.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed mb-10">
                Submit flowcharts, pseudocode, or algorithm code — get back detailed, rubric-based evaluation in seconds. Not a grade, a conversation.
              </p>
            </div>

            <div className="animate-fade-up-delay-1 flex flex-col sm:flex-row gap-3">
              {user ? (
                <>
                  <button
                    onClick={() => setCurrentView('submit')}
                    className="inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm shadow-primary/25"
                  >
                    <Plus className="w-4 h-4" />
                    New submission
                  </button>
                  <button
                    onClick={() => setCurrentView('my-submissions')}
                    className="inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-card text-foreground rounded-lg text-sm font-medium border border-border hover:bg-muted/60 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    View history
                  </button>
                </>
              ) : (
                <>
                  <a
                    href="/auth/sign-up"
                    className="inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm shadow-primary/25"
                  >
                    Start for free
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <a
                    href="/auth/sign-in"
                    className="inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-card text-foreground rounded-lg text-sm font-medium border border-border hover:bg-muted/60 transition-colors"
                  >
                    Sign in
                  </a>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ─── How it works ─── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="animate-fade-up-delay-2">
            <span className="text-xs font-medium tracking-widest uppercase text-primary mb-3 block">How it works</span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-16 max-w-md">
              Three steps to better algorithms.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12 md:gap-8 animate-fade-up-delay-3">
            {/* Step 1 */}
            <div className="relative">
              <span className="text-6xl font-bold text-border dark:text-muted leading-none select-none">01</span>
              <h3 className="text-base font-semibold text-foreground mt-4 mb-2">Submit your work</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Upload a flowchart image, paste pseudocode, or write algorithm text. Combine multiple formats in a single submission.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <span className="text-6xl font-bold text-border dark:text-muted leading-none select-none">02</span>
              <h3 className="text-base font-semibold text-foreground mt-4 mb-2">AI evaluates against rubrics</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Gemini AI scores your submission on logic accuracy, structural flow, syntax clarity, and completeness using predefined rubrics.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <span className="text-6xl font-bold text-border dark:text-muted leading-none select-none">03</span>
              <h3 className="text-base font-semibold text-foreground mt-4 mb-2">Get actionable feedback</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Receive detailed scores per criterion, specific suggestions for improvement, and an overall assessment — within seconds.
              </p>
            </div>
          </div>
        </section>

        {/* ─── Community ─── */}
        <section className="border-t border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-4">
              <div>
                <span className="text-xs font-medium tracking-widest uppercase text-primary mb-3 block">Community</span>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground max-w-sm">
                  Learn from others. Share yours.
                </h2>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                Browse public code and visual outputs — no account needed.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Code Card */}
              <div
                onClick={() => setCurrentView('public-view')}
                className="group relative bg-card border border-border rounded-xl p-6 cursor-pointer hover:border-primary/40 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
                    <Code className="w-5 h-5 text-primary" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1.5">Code directory</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Algorithms, data structures, and solutions shared by the community.
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); setCurrentView('public-submit'); }}
                  className="text-sm font-medium text-primary hover:underline underline-offset-4"
                >
                  Submit your code →
                </button>
              </div>

              {/* Output Card */}
              <div
                onClick={() => setCurrentView('public-output-view')}
                className="group relative bg-card border border-border rounded-xl p-6 cursor-pointer hover:border-primary/40 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-primary" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1.5">Visual outputs</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Screenshots of program executions, flowchart diagrams, and visual results.
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); setCurrentView('public-output-submit'); }}
                  className="text-sm font-medium text-primary hover:underline underline-offset-4"
                >
                  Share an output →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Recent Activity ─── */}
        {user && recentSubmissions.length > 0 && (
          <section className="border-t border-border">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
              <div className="flex items-baseline justify-between mb-8">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">Recent activity</h2>
                <button
                  onClick={() => setCurrentView('my-submissions')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                >
                  All submissions <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              
              <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
                {recentSubmissions.map((submission) => (
                  <div
                    key={submission.submissionId}
                    className="flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => {
                      setCurrentSubmissionId(submission.submissionId)
                      setCurrentView('results')
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {submission.status === 'completed' && <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />}
                      {submission.status === 'evaluating' && <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin flex-shrink-0" />}
                      {submission.status === 'error' && <Clock className="w-4 h-4 text-destructive flex-shrink-0" />}
                      
                      <span className="text-sm font-medium text-foreground truncate">
                        {submission.assignmentTitle}
                      </span>
                      <span className="hidden sm:inline text-xs text-muted-foreground flex-shrink-0">
                        {submission.isCombined ? 'Combined' : submission.submissionType}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {new Date(submission.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                        submission.status === 'completed' 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                          : submission.status === 'evaluating'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
                      }`}>
                        {submission.status === 'completed' ? 'Done' : 
                         submission.status === 'evaluating' ? 'Running' : 'Failed'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── Bottom CTA ─── */}
        {!user && (
          <section className="border-t border-border bg-muted/30">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24 text-center">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                Ready to improve your code?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Create a free account and get AI-powered feedback on your first submission in under a minute.
              </p>
              <a
                href="/auth/sign-up"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm shadow-primary/25"
              >
                Get started
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default HomePage