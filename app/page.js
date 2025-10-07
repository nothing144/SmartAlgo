'use client'

import { useState, useEffect } from 'react'
import { BookOpen, Users, Bot, Star, Clock, FileText, ArrowRight, CheckCircle } from 'lucide-react'
import SubmissionForm from '../components/SubmissionForm'
import SubmissionResults from '../components/SubmissionResults'

const HomePage = () => {
  const [currentView, setCurrentView] = useState('home') // 'home', 'submit', 'results'
  const [recentSubmissions, setRecentSubmissions] = useState([])
  const [currentSubmissionId, setCurrentSubmissionId] = useState(null)

  useEffect(() => {
    fetchRecentSubmissions()
  }, [])

  const fetchRecentSubmissions = async () => {
    try {
      const response = await fetch('/api/submissions')
      if (response.ok) {
        const data = await response.json()
        // Filter and prioritize submissions: completed first, then evaluating, error submissions last
        const sortedData = data.sort((a, b) => {
          const statusPriority = { completed: 0, evaluating: 1, submitted: 2, error: 3 }
          const aPriority = statusPriority[a.status] || 3
          const bPriority = statusPriority[b.status] || 3
          if (aPriority !== bPriority) return aPriority - bPriority
          // If same status, sort by creation date (newest first)
          return new Date(b.createdAt) - new Date(a.createdAt)
        })
        setRecentSubmissions(sortedData.slice(0, 5)) // Show top 5 submissions
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
    }
  }

  const handleSubmissionComplete = (submission) => {
    setCurrentSubmissionId(submission.submissionId)
    setCurrentView('results')
    // Refresh the list with a slight delay to ensure backend has updated
    setTimeout(fetchRecentSubmissions, 1000)
  }

  const handleViewSubmission = (submissionId) => {
    // Clear any previous submission data to ensure clean state
    setCurrentSubmissionId(null)
    setTimeout(() => {
      setCurrentSubmissionId(submissionId)
      setCurrentView('results')
    }, 100) // Small delay to ensure state clears first
  }

  if (currentView === 'submit') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentView('home')}
                className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Home
              </button>
              <h1 className="text-xl font-semibold text-gray-900">New Submission</h1>
              <div></div>
            </div>
          </div>
        </div>
        
        <div className="py-8">
          <SubmissionForm onSubmissionComplete={handleSubmissionComplete} />
        </div>
      </div>
    )
  }

  if (currentView === 'results') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentView('home')}
                className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Home
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Submission Results</h1>
              <div></div>
            </div>
          </div>
        </div>
        
        <div className="py-8">
          <SubmissionResults submissionId={currentSubmissionId} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Smart Evaluator</h1>
                <p className="text-sm text-gray-600">AI-Powered Rubrics-Based Assessment</p>
              </div>
            </div>
            <button
              onClick={() => setCurrentView('submit')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>New Submission</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">
                Intelligent Assessment Made Simple
              </h2>
              <p className="text-blue-100 mb-6">
                Submit your flowcharts, algorithms, and pseudocode for instant AI-powered evaluation. 
                Get detailed feedback and scores based on comprehensive rubrics.
              </p>
              <button
                onClick={() => setCurrentView('submit')}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center space-x-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                <Bot className="w-8 h-8 mb-2" />
                <h3 className="font-semibold mb-1">AI-Powered</h3>
                <p className="text-sm text-blue-100">Advanced Gemini AI analysis</p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                <Star className="w-8 h-8 mb-2" />
                <h3 className="font-semibold mb-1">Rubric-Based</h3>
                <p className="text-sm text-blue-100">Consistent scoring criteria</p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                <Clock className="w-8 h-8 mb-2" />
                <h3 className="font-semibold mb-1">Instant Results</h3>
                <p className="text-sm text-blue-100">Fast evaluation and feedback</p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                <Users className="w-8 h-8 mb-2" />
                <h3 className="font-semibold mb-1">Student-Friendly</h3>
                <p className="text-sm text-blue-100">Easy submission process</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Multiple Formats</h3>
            <p className="text-gray-600 text-sm">
              Support for flowcharts (image upload), algorithms, and pseudocode submissions
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Bot className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Analysis</h3>
            <p className="text-gray-600 text-sm">
              Gemini AI evaluates logic, structure, and clarity with detailed feedback
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Detailed Scoring</h3>
            <p className="text-gray-600 text-sm">
              Comprehensive rubric-based evaluation with criterion-specific feedback
            </p>
          </div>
        </div>

        {/* Recent Submissions */}
        {recentSubmissions.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Submissions</h3>
            <div className="space-y-3">
              {recentSubmissions.map((submission) => (
                <div 
                  key={submission.submissionId}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleViewSubmission(submission.submissionId)}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      submission.status === 'completed' ? 'bg-green-500' :
                      submission.status === 'evaluating' ? 'bg-blue-500' :
                      submission.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
                    }`}></div>
                    <div>
                      <p className="font-medium text-gray-900">{submission.assignmentTitle}</p>
                      <p className="text-sm text-gray-600">
                        {submission.studentName} • {submission.submissionType} • {new Date(submission.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      submission.status === 'completed' ? 'bg-green-100 text-green-800' :
                      submission.status === 'evaluating' ? 'bg-blue-100 text-blue-800' :
                      submission.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {submission.status}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HomePage