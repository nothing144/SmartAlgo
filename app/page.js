'use client'

import { useState, useEffect } from 'react'
import { BookOpen, Users, Bot, Star, Clock, FileText, ArrowRight, CheckCircle, Plus, LogIn } from 'lucide-react'
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
import { CodeBackground } from '../components/CodeBackground'

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

  // Home/Dashboard view
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      <CodeBackground />
      <AuthNavigation currentView={currentView} setCurrentView={setCurrentView} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-[#6366f1] to-[#a78bfa] bg-clip-text text-transparent">
              Smart Evaluator
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            AI-powered evaluation system for flowcharts, algorithms, and pseudocode. 
            Get instant feedback and improve your programming skills with our advanced rubric-based assessment.
          </p>
          
          {user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setCurrentView('submit')}
                className="bg-gradient-to-r from-[#090f4f] to-[#02050e] hover:from-[#0a1058] hover:to-[#030714] text-white px-8 py-3 rounded-lg text-lg font-medium transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create New Submission
              </button>
              <button
                onClick={() => setCurrentView('my-submissions')}
                className="border-2 border-[#090f4f] text-[#090f4f] dark:text-[#5a6fd8] hover:bg-[#090f4f] hover:text-white px-8 py-3 rounded-lg text-lg font-medium transition-all flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                View My Submissions
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auth/sign-up"
                className="bg-gradient-to-r from-[#090f4f] to-[#02050e] hover:from-[#0a1058] hover:to-[#030714] text-white px-8 py-3 rounded-lg text-lg font-medium transition-all flex items-center justify-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="/auth/sign-in"
                className="border-2 border-[#090f4f] text-[#090f4f] dark:text-[#5a6fd8] hover:bg-[#090f4f] hover:text-white px-8 py-3 rounded-lg text-lg font-medium transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-5 h-5" />
                Sign In
              </a>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-[#090f4f]/10 dark:bg-[#090f4f]/30 rounded-lg flex items-center justify-center mb-4">
              <Bot className="w-6 h-6 text-[#090f4f] dark:text-[#5a6fd8]" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">AI-Powered Evaluation</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Advanced Gemini AI analyzes your submissions with intelligent feedback and detailed scoring.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-[#4a1d96]/10 dark:bg-[#4a1d96]/30 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-[#4a1d96] dark:text-[#a78bfa]" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Multiple Formats</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Submit flowcharts, algorithms, and pseudocode. Support for images, code, and combined submissions.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-[#090f4f]/10 dark:bg-[#090f4f]/30 rounded-lg flex items-center justify-center mb-4">
              <Star className="w-6 h-6 text-[#090f4f] dark:text-[#5a6fd8]" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Rubric-Based Scoring</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Comprehensive evaluation with structured rubrics covering logic, structure, and syntax.
            </p>
          </div>
        </div>

        {/* Recent Submissions */}
        {user && recentSubmissions.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Submissions</h2>
              <button
                onClick={() => setCurrentView('my-submissions')}
                className="text-[#090f4f] dark:text-[#5a6fd8] hover:text-[#0a1058] dark:hover:text-[#7a8ff0] font-medium flex items-center gap-2"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid gap-4">
              {recentSubmissions.map((submission) => (
                <div
                  key={submission.submissionId}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setCurrentSubmissionId(submission.submissionId)
                    setCurrentView('results')
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {submission.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {submission.status === 'evaluating' && <Clock className="w-5 h-5 text-yellow-500 animate-spin" />}
                      {submission.status === 'error' && <Clock className="w-5 h-5 text-red-500" />}
                      
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {submission.assignmentTitle}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {submission.isCombined ? 'Combined Submission' : submission.submissionType} • {' '}
                          {new Date(submission.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      submission.status === 'completed' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : submission.status === 'evaluating'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {submission.status === 'completed' ? 'Completed' : 
                       submission.status === 'evaluating' ? 'Evaluating...' : 'Error'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-[#090f4f] to-[#02050e] rounded-xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">
            {user ? 'Ready to Submit Your Next Project?' : 'Ready to Get Started?'}
          </h2>
          <p className="text-lg mb-6 opacity-90">
            {user 
              ? 'Upload your algorithms, pseudocode, or flowcharts and get instant AI-powered feedback.'
              : 'Join thousands of students improving their programming skills with AI-powered evaluations.'
            }
          </p>
          {user ? (
            <button
              onClick={() => setCurrentView('submit')}
              className="bg-white text-[#090f4f] hover:bg-gray-100 px-8 py-3 rounded-lg text-lg font-medium transition-all"
            >
              Submit New Assignment
            </button>
          ) : (
            <a
              href="/auth/sign-up"
              className="bg-white text-[#090f4f] hover:bg-gray-100 px-8 py-3 rounded-lg text-lg font-medium transition-all inline-block"
            >
              Create Free Account
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default HomePage