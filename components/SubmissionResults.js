'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, Clock, AlertCircle, Eye, Star, BookOpen } from 'lucide-react'

const SubmissionResults = ({ submissionId }) => {
  const [submission, setSubmission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSubmission = useCallback(async () => {
    if (!submissionId) return
    
    try {
      const response = await fetch(`/api/submissions/${submissionId}`)
      if (response.ok) {
        const data = await response.json()
        setSubmission(data)
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
      if (submission?.status && submission.status !== 'completed' && submission.status !== 'error') {
        fetchSubmission()
      }
    }, 2000) // Poll every 2 seconds
    
    return () => clearInterval(interval)
  }, [submission?.status, fetchSubmission])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Clock className="w-6 h-6 animate-spin mr-2" />
        Loading submission...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center text-red-800">
          <AlertCircle className="w-5 h-5 mr-2" />
          Error: {error}
        </div>
      </div>
    )
  }

  if (!submission) return null

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
          <div className="flex items-center justify-center py-8 text-red-600">
            <AlertCircle className="w-8 h-8 mr-3" />
            <div>
              <h3 className="text-lg font-medium">Evaluation Failed</h3>
              <p className="text-gray-600">There was an error processing your submission. Please try again.</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default SubmissionResults