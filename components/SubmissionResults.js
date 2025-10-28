'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, Clock, AlertCircle, Eye, Star, BookOpen, Code, FileText, Image as ImageIcon, Download } from 'lucide-react'

// Helper component to render a single submission card
const SingleSubmissionCard = ({ submission, icon: Icon, title }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'evaluating':
        return <Clock className="w-5 h-5 animate-spin text-blue-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-800 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
      case 'evaluating':
        return 'text-blue-800 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30'
      case 'error':
        return 'text-red-800 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
      default:
        return 'text-gray-800 dark:text-gray-400 bg-gray-100 dark:bg-gray-800'
    }
  }

  const handleDownloadImage = async (imageUrl, fileName = 'flowchart.png') => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading image:', error)
      alert('Failed to download image. Please try again.')
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b dark:border-gray-700 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
        <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(submission.status)}`}>
          {getStatusIcon(submission.status)}
          <span className="ml-2 capitalize">{submission.status}</span>
        </div>
      </div>

      {/* Content Preview */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
          <Eye className="w-4 h-4 mr-2" />
          Content
        </h4>
        {submission.submissionType === 'flowchart' ? (
          <div className="space-y-3">
            <div className="border dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
              {submission.content?.imageUrl ? (
                <img 
                  src={submission.content.imageUrl} 
                  alt="Flowchart"
                  className="max-w-full h-auto rounded-md"
                />
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Image not available</p>
              )}
            </div>
            {submission.content?.imageUrl && (
              <button
                onClick={() => handleDownloadImage(
                  submission.content.imageUrl, 
                  `${submission.assignmentTitle || 'flowchart'}-${submission.studentName || 'submission'}.png`
                )}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Flowchart</span>
              </button>
            )}
          </div>
        ) : (
          <div className="border dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900 max-h-48 overflow-y-auto">
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-200">
              {submission.content?.text || 'No content available'}
            </pre>
          </div>
        )}
      </div>

      {/* Evaluation Results */}
      {submission.evaluation ? (
        <div className="space-y-4">
          {/* Score */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Score</span>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {submission.evaluation.totalScore}/{submission.evaluation.maxScore}
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(submission.evaluation.totalScore / submission.evaluation.maxScore) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Detailed Scores */}
          {submission.evaluation.rubricScores && submission.evaluation.rubricScores.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                <BookOpen className="w-4 h-4 mr-2" />
                Breakdown
              </h5>
              {submission.evaluation.rubricScores.map((score, index) => (
                <div key={index} className="border dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {score.criterionName || `Criterion ${index + 1}`}
                    </span>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {score.earnedPoints}/{score.maxPoints}
                    </span>
                  </div>
                  {score.feedback && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{score.feedback}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* AI Analysis */}
          {submission.evaluation.aiAnalysis && (
            <div>
              <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">AI Analysis</h5>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border dark:border-gray-700">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {typeof submission.evaluation.aiAnalysis === 'object' 
                    ? submission.evaluation.aiAnalysis.analysis || JSON.stringify(submission.evaluation.aiAnalysis, null, 2)
                    : submission.evaluation.aiAnalysis
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      ) : submission.status === 'evaluating' ? (
        <div className="flex items-center justify-center py-6">
          <Clock className="w-6 h-6 animate-spin text-blue-600 mr-3" />
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Evaluating...</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">AI is analyzing this submission</p>
          </div>
        </div>
      ) : submission.status === 'error' ? (
        <div className="flex items-center justify-center py-6">
          <AlertCircle className="w-6 h-6 mr-3 text-orange-500" />
          <div className="text-center">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Evaluation Error</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              This submission experienced an evaluation error.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

// Combined submission view component
const CombinedSubmissionView = ({ submission }) => {
  const submissions = submission.submissions || []
  
  // Find each type
  const algorithmSub = submissions.find(s => s.submissionType === 'algorithm')
  const pseudocodeSub = submissions.find(s => s.submissionType === 'pseudocode')
  const flowchartSub = submissions.find(s => s.submissionType === 'flowchart')
  
  // Calculate overall score
  const totalScore = submissions.reduce((sum, s) => 
    sum + (s.evaluation?.totalScore || 0), 0
  )
  const maxScore = submissions.reduce((sum, s) => 
    sum + (s.evaluation?.maxScore || 0), 0
  )
  
  // Determine overall status
  const allCompleted = submissions.every(s => s.status === 'completed')
  const anyEvaluating = submissions.some(s => s.status === 'evaluating')
  const anyError = submissions.some(s => s.status === 'error')
  
  let overallStatus = 'completed'
  if (anyEvaluating) overallStatus = 'evaluating'
  if (anyError) overallStatus = 'error'

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Overall Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {algorithmSub?.assignmentTitle || 'Combined Submission'}
          </h2>
          <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            overallStatus === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
            overallStatus === 'evaluating' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
            'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
          }`}>
            <Star className="w-4 h-4 mr-2" />
            <span className="capitalize">{overallStatus}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <span className="font-medium">Student:</span> {algorithmSub?.studentName || 'N/A'}
          </div>
          <div>
            <span className="font-medium">Type:</span> Combined Submission
          </div>
          <div>
            <span className="font-medium">Submitted:</span> {algorithmSub?.createdAt ? new Date(algorithmSub.createdAt).toLocaleDateString() : 'N/A'}
          </div>
        </div>

        {/* Overall Combined Score */}
        {maxScore > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium text-gray-900 dark:text-gray-100">Overall Combined Score</span>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {totalScore}/{maxScore}
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${maxScore > 0 ? (totalScore / maxScore) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0}% - 
              {totalScore / maxScore >= 0.9 ? ' Excellent!' :
               totalScore / maxScore >= 0.8 ? ' Great work!' :
               totalScore / maxScore >= 0.7 ? ' Good effort!' :
               totalScore / maxScore >= 0.6 ? ' Satisfactory' :
               ' Needs improvement'}
            </div>
          </div>
        )}
      </div>

      {/* Individual Submission Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {algorithmSub && (
          <SingleSubmissionCard 
            submission={algorithmSub} 
            icon={Code}
            title="Algorithm"
          />
        )}
        {pseudocodeSub && (
          <SingleSubmissionCard 
            submission={pseudocodeSub} 
            icon={FileText}
            title="Pseudocode"
          />
        )}
        {flowchartSub && (
          <SingleSubmissionCard 
            submission={flowchartSub} 
            icon={ImageIcon}
            title="Flowchart"
          />
        )}
      </div>
    </div>
  )
}

const SubmissionResults = ({ submissionId }) => {
  const [submission, setSubmission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isCombined, setIsCombined] = useState(false)

  const handleDownloadImage = async (imageUrl, fileName = 'flowchart.png') => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading image:', error)
      alert('Failed to download image. Please try again.')
    }
  }

  const fetchSubmission = useCallback(async () => {
    if (!submissionId) return
    
    try {
      const response = await fetch(`/api/submissions/${submissionId}`)
      if (response.ok) {
        const data = await response.json()
        
        // Check if this is a combined submission
        if (data.type === 'combined' && data.submissions) {
          setIsCombined(true)
          setSubmission(data)
        } else {
          setIsCombined(false)
          setSubmission(data)
        }
        setError(null)
      } else {
        throw new Error('Failed to fetch submission')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [submissionId])

  useEffect(() => {
    if (submissionId) {
      // Reset state when submissionId changes  
      setSubmission(null)
      setLoading(true)
      setError(null)
      
      // Small delay to let backend start evaluation
      const timer = setTimeout(() => {
        fetchSubmission()
      }, 500)
      return () => clearTimeout(timer)
    } else {
      // Clear state if no submissionId
      setSubmission(null)
      setLoading(false)
      setError(null)
    }
  }, [submissionId, fetchSubmission])
  
  useEffect(() => {
    // Set up polling for evaluation updates
    const interval = setInterval(() => {
      // Poll if submission is not yet completed
      if (isCombined && submission?.submissions) {
        // For combined submissions, check if any part is still evaluating
        const anyEvaluating = submission.submissions.some(s => 
          s.status !== 'completed' && s.status !== 'error'
        )
        if (anyEvaluating) {
          fetchSubmission()
        }
      } else if (submission?.status && submission.status !== 'completed' && submission.status !== 'error') {
        fetchSubmission()
      }
    }, 2000) // Poll every 2 seconds
    
    return () => clearInterval(interval)
  }, [submission, isCombined, fetchSubmission])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Clock className="w-6 h-6 animate-spin mr-2 text-blue-600" />
        <span className="text-gray-700 dark:text-gray-300">Loading submission...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-center text-red-800 dark:text-red-400">
          <AlertCircle className="w-5 h-5 mr-2" />
          Error: {error}
        </div>
      </div>
    )
  }

  if (!submission) return null
  
  // Render combined submission view
  if (isCombined && submission.submissions) {
    return <CombinedSubmissionView submission={submission} />
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'evaluating':
        return <Clock className="w-5 h-5 animate-spin text-blue-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-800 bg-green-100'
      case 'evaluating':
        return 'text-blue-800 bg-blue-100'
      case 'error':
        return 'text-red-800 bg-red-100'
      default:
        return 'text-gray-800 bg-gray-100'
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Submission Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {submission.assignmentTitle}
          </h2>
          <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(submission.status)}`}>
            {getStatusIcon(submission.status)}
            <span className="ml-2 capitalize">{submission.status}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Student:</span> {submission.studentName}
          </div>
          <div>
            <span className="font-medium">Type:</span> {submission.submissionType}
          </div>
          <div>
            <span className="font-medium">Submitted:</span> {new Date(submission.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Content Preview */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Eye className="w-5 h-5 mr-2" />
          Submission Content
        </h3>
        
        {submission.submissionType === 'flowchart' ? (
          <div className="border rounded-lg p-4 bg-gray-50">
            {submission.content.imageUrl ? (
              <img 
                src={submission.content.imageUrl} 
                alt="Flowchart"
                className="max-w-full h-auto rounded-md"
              />
            ) : (
              <p className="text-gray-500">Image not available</p>
            )}
          </div>
        ) : (
          <div className="border rounded-lg p-4 bg-gray-50">
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
              {submission.content.text || 'No content available'}
            </pre>
          </div>
        )}
      </div>

      {/* Evaluation Results */}
      {submission.evaluation ? (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Star className="w-5 h-5 mr-2 text-yellow-500" />
            AI Evaluation Results
          </h3>
          
          {/* Overall Score */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium text-gray-900">Overall Score</span>
              <div className="text-3xl font-bold text-blue-600">
                {submission.evaluation.totalScore}/{submission.evaluation.maxScore}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(submission.evaluation.totalScore / submission.evaluation.maxScore) * 100}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              {Math.round((submission.evaluation.totalScore / submission.evaluation.maxScore) * 100)}% - 
              {submission.evaluation.totalScore / submission.evaluation.maxScore >= 0.9 ? ' Excellent!' :
               submission.evaluation.totalScore / submission.evaluation.maxScore >= 0.8 ? ' Great work!' :
               submission.evaluation.totalScore / submission.evaluation.maxScore >= 0.7 ? ' Good effort!' :
               submission.evaluation.totalScore / submission.evaluation.maxScore >= 0.6 ? ' Satisfactory' :
               ' Needs improvement'}
            </div>
          </div>

          {/* Detailed Scores */}
          <div className="space-y-4 mb-6">
            <h4 className="font-semibold text-gray-900 flex items-center">
              <BookOpen className="w-4 h-4 mr-2" />
              Detailed Breakdown
            </h4>
            {submission.evaluation.rubricScores && submission.evaluation.rubricScores.map((score, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">
                    {score.criterionName || `Criterion ${index + 1}`}
                  </span>
                  <span className="text-lg font-semibold text-blue-600">
                    {score.earnedPoints}/{score.maxPoints}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${(score.earnedPoints / score.maxPoints) * 100}%` }}
                  ></div>
                </div>
                {score.feedback && (
                  <p className="text-sm text-gray-600">{score.feedback}</p>
                )}
              </div>
            ))}
          </div>

          {/* AI Analysis */}
          {submission.evaluation.aiAnalysis && (
            <div className="border-t pt-6">
              <h4 className="font-semibold text-gray-900 mb-3">AI Analysis</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {typeof submission.evaluation.aiAnalysis === 'object' 
                    ? submission.evaluation.aiAnalysis.analysis || JSON.stringify(submission.evaluation.aiAnalysis, null, 2)
                    : submission.evaluation.aiAnalysis
                  }
                </p>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {submission.evaluation.aiAnalysis?.suggestions && (
            <div className="border-t pt-6">
              <h4 className="font-semibold text-gray-900 mb-3">Suggestions for Improvement</h4>
              <ul className="space-y-2">
                {submission.evaluation.aiAnalysis.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start text-gray-700">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : submission.status === 'evaluating' ? (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-center py-8">
            <Clock className="w-8 h-8 animate-spin text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">AI Evaluation in Progress</h3>
              <p className="text-gray-600">Please wait while our AI analyzes your submission...</p>
            </div>
          </div>
        </div>
      ) : submission.status === 'error' ? (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-center py-8">
            <AlertCircle className="w-8 h-8 mr-3 text-orange-500" />
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">Historical Evaluation Issue</h3>
              <p className="text-gray-600 mt-2">
                This submission experienced an evaluation error during a previous system issue. 
                The evaluation system has since been fixed and is working properly.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                You can resubmit your work for a fresh evaluation if needed.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default SubmissionResults