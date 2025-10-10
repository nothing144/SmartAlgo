'use client'

import { useState, useEffect } from 'react'
import { Clock, FileText, CheckCircle, AlertCircle, Eye, Calendar, User, Globe } from 'lucide-react'

const AllSubmissions = ({ setCurrentView, setCurrentSubmissionId }) => {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'completed', 'evaluating', 'error'
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchAllSubmissions()
  }, [])

  const fetchAllSubmissions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/submissions')
      if (response.ok) {
        const data = await response.json()
        
        // Backend now filters for public submissions, but double-check on frontend
        const publicSubmissions = data.filter(submission => 
          submission.isPublic !== false // Show if explicitly public or undefined (default)
        )
        
        // Group combined submissions
        const combinedGroups = {}
        const standaloneSubmissions = []
        
        publicSubmissions.forEach(submission => {
          if (submission.combinedSubmissionId) {
            if (!combinedGroups[submission.combinedSubmissionId]) {
              combinedGroups[submission.combinedSubmissionId] = {
                submissionId: submission.combinedSubmissionId,
                isCombined: true,
                assignmentTitle: submission.assignmentTitle,
                studentName: submission.studentName,
                createdAt: submission.createdAt,
                parts: [],
                status: 'completed',
                isPublic: submission.isPublic // Use actual isPublic value from submission
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

  // Filter submissions based on search and status
  const filteredSubmissions = submissions.filter(submission => {
    const matchesFilter = filter === 'all' || submission.status === filter
    const matchesSearch = searchTerm === '' || 
      submission.assignmentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.studentName.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Public Submissions
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Explore public submissions from all students and learn from their approaches
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by title or student name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Filter Dropdown */}
          <div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="evaluating">Evaluating</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'all', label: 'All Submissions', count: submissions.length },
                { key: 'completed', label: 'Completed', count: submissions.filter(s => s.status === 'completed').length },
                { key: 'evaluating', label: 'In Progress', count: submissions.filter(s => s.status === 'evaluating').length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    filter === tab.key
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    filter === tab.key
                      ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {filter === 'all' ? submissions.length : 
                     filter === 'completed' ? submissions.filter(s => s.status === 'completed').length :
                     submissions.filter(s => s.status === 'evaluating').length}
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
            <Globe className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No matching submissions' : 
               filter === 'all' ? 'No public submissions yet' : `No ${filter} submissions`}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm ? 'Try adjusting your search terms' :
               filter === 'all' ? 'Be the first to share your submission publicly!' : 
               `No ${filter} submissions to display.`}
            </p>
            {!searchTerm && filter === 'all' && (
              <button
                onClick={() => setCurrentView('submit')}
                className="bg-gradient-to-r from-[#4a1d96] to-[#2d1055] hover:from-[#5a2da6] hover:to-[#3d1865] text-white px-6 py-3 rounded-lg font-medium transition-all"
              >
                Create Your First Submission
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
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate mb-2">
                          {submission.assignmentTitle}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {submission.isCombined && (
                            <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-full text-xs font-medium">
                              Combined ({submission.parts?.length || 3})
                            </span>
                          )}
                          <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            Public
                          </span>
                        </div>
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
                    <div className="flex flex-wrap gap-2 mb-4 sm:mb-2">
                      {submission.isCombined ? (
                        submission.parts?.map((part, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm capitalize"
                          >
                            {part.submissionType}
                          </span>
                        ))
                      ) : (
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm capitalize">
                          {submission.submissionType}
                        </span>
                      )}
                    </div>

                    {/* Public indicator note */}
                    <div className="text-xs text-gray-500 dark:text-gray-400 italic hidden sm:block">
                      This submission is publicly viewable by all students
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
                    {submission.status === 'evaluating' ? 'Evaluating...' : 'View Submission'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results Summary */}
        {filteredSubmissions.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredSubmissions.length} of {submissions.length} public submissions
            {searchTerm && (
              <span> matching "{searchTerm}"</span>
            )}
          </div>
        )}

        {/* Community Stats */}
        {submissions.length > 0 && (
          <div className="mt-12">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Community Stats</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center border border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                  {submissions.length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Public Submissions</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center border border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {submissions.filter(s => s.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center border border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {new Set(submissions.map(s => s.studentName)).size}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Active Students</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center border border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                  {submissions.filter(s => s.isCombined).length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Combined Projects</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AllSubmissions