'use client'

import { useState, useEffect } from 'react'
import { Code2, User, Calendar, Search, RefreshCw } from 'lucide-react'

const PublicCodeView = ({ setCurrentView }) => {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/public-code-submissions')
      if (response.ok) {
        const data = await response.json()
        setSubmissions(data)
      } else {
        console.error('Failed to fetch submissions')
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSubmissions = submissions.filter(submission => 
    submission.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    submission.codeTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    submission.codeContent.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code)
    alert('Code copied to clipboard!')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#090f4f] to-[#4a1d96] rounded-2xl mb-4">
            <Code2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Public Code Submissions
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            Browse all submitted code solutions from students
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => setCurrentView('public-submit')}
              className="bg-gradient-to-r from-[#090f4f] to-[#02050e] hover:from-[#0a1058] hover:to-[#030714] text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <Code2 className="w-5 h-5" />
              Submit Your Code
            </button>
            
            <button
              onClick={fetchSubmissions}
              className="border-2 border-[#090f4f] dark:border-[#5a6fd8] text-[#090f4f] dark:text-[#5a6fd8] hover:bg-[#090f4f] hover:text-white dark:hover:bg-[#5a6fd8] dark:hover:text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by student name, code title, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#090f4f] dark:focus:ring-[#5a6fd8] focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#090f4f] dark:border-[#5a6fd8] mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading submissions...</p>
          </div>
        )}

        {/* No Submissions */}
        {!loading && filteredSubmissions.length === 0 && (
          <div className="text-center py-12">
            <Code2 className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'No matching submissions found' : 'No submissions yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {searchQuery ? 'Try a different search term' : 'Be the first to submit your code!'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setCurrentView('public-submit')}
                className="bg-gradient-to-r from-[#090f4f] to-[#02050e] hover:from-[#0a1058] hover:to-[#030714] text-white px-6 py-3 rounded-lg font-medium transition-all inline-flex items-center gap-2"
              >
                <Code2 className="w-5 h-5" />
                Submit Code
              </button>
            )}
          </div>
        )}

        {/* Submissions Grid */}
        {!loading && filteredSubmissions.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Showing {filteredSubmissions.length} submission{filteredSubmissions.length !== 1 ? 's' : ''}
            </p>

            {filteredSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Card Header */}
                <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {submission.codeTitle}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{submission.studentName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(submission.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => toggleExpand(submission.id)}
                      className="px-4 py-2 bg-[#090f4f] dark:bg-[#5a6fd8] text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      {expandedId === submission.id ? 'Hide Code' : 'View Code'}
                    </button>
                  </div>
                </div>

                {/* Code Content (Expandable) */}
                {expandedId === submission.id && (
                  <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Code:</span>
                      <button
                        onClick={() => copyToClipboard(submission.codeContent)}
                        className="text-sm text-[#090f4f] dark:text-[#5a6fd8] hover:underline"
                      >
                        Copy to Clipboard
                      </button>
                    </div>
                    <pre className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 overflow-x-auto">
                      <code className="text-sm font-mono text-gray-800 dark:text-gray-200">
                        {submission.codeContent}
                      </code>
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PublicCodeView
