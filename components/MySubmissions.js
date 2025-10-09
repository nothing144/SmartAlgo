'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Clock, FileText, CheckCircle, AlertCircle, Eye, Calendar, User } from 'lucide-react'

const MySubmissions = ({ setCurrentView, setCurrentSubmissionId }) => {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'completed', 'evaluating', 'error'

  useEffect(() => {
    if (user) {
      fetchMySubmissions()
    }
  }, [user])

  const fetchMySubmissions = async () => {
    try {
      setLoading(true)
      // Use userId parameter to filter submissions server-side
      const response = await fetch(`/api/submissions?userId=${user.id}`)
      if (response.ok) {
        const userSubmissions = await response.json()
        
        // Group combined submissions
        const combinedGroups = {}
        const standaloneSubmissions = []
        
        userSubmissions.forEach(submission => {
          if (submission.combinedSubmissionId) {
            if (!combinedGroups[submission.combinedSubmissionId]) {
              combinedGroups[submission.combinedSubmissionId] = {
                submissionId: submission.combinedSubmissionId,
                isCombined: true,
                assignmentTitle: submission.assignmentTitle,
                studentName: submission.studentName,
                createdAt: submission.createdAt,
                parts: [],
                status: 'completed'
              }
            }
            combinedGroups[submission.combinedSubmissionId].parts.push(submission)
            
            // Update overall status
            if (submission.status === 'evaluating' && combinedGroups[submission.combinedSubmissionId].status !== 'error') {
              combinedGroups[submission.combinedSubmissionId].status = 'evaluating'
            } else if (submission.status === 'error') {
              combinedGroups[submission.combinedSubmissionId].status = 'error'
            } else if (submission.status === 'submitted' && combinedGroups[submission.combinedSubmissionId].status === 'completed') {
              combinedGroups[submission.combinedSubmissionId].status = 'submitted'
            }
          } else {
            standaloneSubmissions.push(submission)
          }
        })
        
        const allSubmissions = [...Object.values(combinedGroups), ...standaloneSubmissions]
        allSubmissions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        
        setSubmissions(allSubmissions)
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'evaluating':
        return <Clock className="w-5 h-5 text-yellow-500 animate-spin" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'evaluating':
        return 'Evaluating...'
      case 'error':
        return 'Error'
      default:
        return 'Submitted'
    }
  }

  const filteredSubmissions = submissions.filter(submission => {
    if (filter === 'all') return true
    return submission.status === filter
  })

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Sign in Required
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Please sign in to view your submissions
            </p>
            <a 
              href="/auth/sign-in"
              className="bg-gradient-to-r from-[#4a1d96] to-[#2d1055] hover:from-[#5a2da6] hover:to-[#3d1865] text-white px-6 py-3 rounded-lg font-medium transition-all"
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Submissions
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            View and manage all your submissions in one place
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-2 sm:space-x-8 overflow-x-auto">
              {[
                { key: 'all', label: 'All', longLabel: 'All Submissions', count: submissions.length },
                { key: 'completed', label: 'Done', longLabel: 'Completed', count: submissions.filter(s => s.status === 'completed').length },
                { key: 'evaluating', label: 'Pending', longLabel: 'Evaluating', count: submissions.filter(s => s.status === 'evaluating').length },
                { key: 'error', label: 'Errors', longLabel: 'Errors', count: submissions.filter(s => s.status === 'error').length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    filter === tab.key
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <span className="sm:hidden">{tab.label}</span>
                  <span className="hidden sm:inline">{tab.longLabel}</span>
                  <span className={`ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 rounded-full text-xs ${
                    filter === tab.key
                      ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Submissions List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {filter === 'all' ? 'No submissions yet' : `No ${filter} submissions`}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {filter === 'all' 
                ? 'Start by creating your first submission!' 
                : `You don't have any ${filter} submissions.`
              }
            </p>
            {filter === 'all' && (
              <button
                onClick={() => setCurrentView('submit')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-all"
              >
                Create New Submission
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredSubmissions.map((submission) => (
              <div
                key={submission.submissionId}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0 pt-1">
                        {getStatusIcon(submission.status)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {submission.assignmentTitle}
                        </h3>
                        {submission.isCombined && (
                          <span className="inline-block mt-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-full text-xs font-medium">
                            Combined ({submission.parts?.length || 3} parts)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{formatDate(submission.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{submission.studentName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Status:</span>
                        <span>{getStatusText(submission.status)}</span>
                      </div>
                    </div>

                    {/* Submission Type Details */}
                    <div className="flex flex-wrap gap-2 mb-4 sm:mb-0">
                      {submission.isCombined ? (
                        submission.parts?.map((part, index) => (
                          <span
                            key={index}
                            className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm capitalize"
                          >
                            {part.submissionType}
                          </span>
                        ))
                      ) : (
                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm capitalize">
                          {submission.submissionType}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => {
                      setCurrentSubmissionId(submission.submissionId)
                      setCurrentView('results')
                    }}
                    disabled={submission.status === 'evaluating'}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:cursor-not-allowed"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="sm:hidden">
                      {submission.status === 'evaluating' ? 'Evaluating...' : 'View'}
                    </span>
                    <span className="hidden sm:inline">
                      {submission.status === 'evaluating' ? 'Evaluating...' : 'View Results'}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Summary */}
        {submissions.length > 0 && (
          <div className="mt-8 sm:mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 text-center border border-gray-200 dark:border-gray-700">
              <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {submissions.length}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 text-center border border-gray-200 dark:border-gray-700">
              <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                {submissions.filter(s => s.status === 'completed').length}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Completed</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 text-center border border-gray-200 dark:border-gray-700">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                {submissions.filter(s => s.status === 'evaluating').length}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Pending</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 text-center border border-gray-200 dark:border-gray-700">
              <div className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
                {submissions.filter(s => s.status === 'error').length}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Errors</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MySubmissions