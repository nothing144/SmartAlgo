'use client'

import { useState, useEffect } from 'react'
import { Send, Clock, CheckCircle, AlertCircle, FileText, Image as ImageIcon, Code } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import FileUpload from './FileUpload'
import CodeEditor from './CodeEditor'

const SubmissionForm = ({ onSubmissionComplete }) => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    studentName: '',
    assignmentTitle: '',
    submissionType: 'algorithm'
  })
  // Track all three inputs separately for "Submit All" functionality
  const [algorithmContent, setAlgorithmContent] = useState('')
  const [pseudocodeContent, setPseudocodeContent] = useState('')
  const [flowchartFile, setFlowchartFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rubrics, setRubrics] = useState([])
  const [selectedRubric, setSelectedRubric] = useState('')
  const [isPublic, setIsPublic] = useState(true) // Default to public

  useEffect(() => {
    // Load available rubrics
    fetchRubrics()
  }, [])

  const fetchRubrics = async () => {
    try {
      const response = await fetch('/api/rubrics')
      if (response.ok) {
        const data = await response.json()
        setRubrics(data)
        // Auto-select default rubric (prefer one with "Default" in title, otherwise use first)
        if (data.length > 0) {
          const defaultRubric = data.find(r => r.title.toLowerCase().includes('default')) || data[0]
          setSelectedRubric(defaultRubric.id)
        }
      }
    } catch (error) {
      console.error('Error fetching rubrics:', error)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Get current content based on active tab
  const getCurrentContent = () => {
    if (formData.submissionType === 'algorithm') return algorithmContent
    if (formData.submissionType === 'pseudocode') return pseudocodeContent
    return ''
  }

  // Set current content based on active tab
  const setCurrentContent = (value) => {
    if (formData.submissionType === 'algorithm') setAlgorithmContent(value)
    else if (formData.submissionType === 'pseudocode') setPseudocodeContent(value)
  }

  // Get current file based on active tab
  const getCurrentFile = () => {
    if (formData.submissionType === 'flowchart') return flowchartFile
    return null
  }

  // Set current file
  const setCurrentFile = (file) => {
    if (formData.submissionType === 'flowchart') setFlowchartFile(file)
  }

  // Handle single submission (current tab only)
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.studentName || !formData.assignmentTitle) {
      alert('Please fill in all required fields')
      return
    }

    const currentContent = getCurrentContent()
    const currentFile = getCurrentFile()

    if (formData.submissionType === 'flowchart' && !currentFile) {
      alert('Please upload a flowchart image')
      return
    }

    if ((formData.submissionType === 'algorithm' || formData.submissionType === 'pseudocode') && !currentContent.trim()) {
      alert('Please enter your code/pseudocode')
      return
    }

    setIsSubmitting(true)
    
    try {
      const submissionData = {
        userId: user?.id || 'anonymous',
        studentName: formData.studentName,
        assignmentTitle: formData.assignmentTitle,
        submissionType: formData.submissionType,
        rubricId: selectedRubric,
        isPublic: isPublic
      }

      if (formData.submissionType === 'flowchart') {
        submissionData.imageData = currentFile.preview
        submissionData.fileName = currentFile.name
      } else {
        submissionData.textContent = currentContent
      }

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      })

      if (response.ok) {
        const submission = await response.json()
        alert(`${formData.submissionType.charAt(0).toUpperCase() + formData.submissionType.slice(1)} submitted successfully! AI evaluation is in progress.`)
        
        if (onSubmissionComplete) {
          onSubmissionComplete(submission)
        }
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Submission error:', error)
      alert('Failed to submit. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle combined submission (all three together)
  const handleSubmitAll = async () => {
    if (!formData.studentName || !formData.assignmentTitle) {
      alert('Please fill in student name and assignment title')
      return
    }

    if (!algorithmContent.trim()) {
      alert('Please enter your algorithm code')
      return
    }

    if (!pseudocodeContent.trim()) {
      alert('Please enter your pseudocode')
      return
    }

    if (!flowchartFile) {
      alert('Please upload your flowchart image')
      return
    }

    setIsSubmitting(true)
    
    try {
      const submissionData = {
        userId: user?.id || 'anonymous',
        studentName: formData.studentName,
        assignmentTitle: formData.assignmentTitle,
        submissionType: 'combined',
        rubricId: selectedRubric,
        isPublic: isPublic,
        algorithmContent: algorithmContent,
        pseudocodeContent: pseudocodeContent,
        flowchartData: {
          imageData: flowchartFile.preview,
          fileName: flowchartFile.name
        }
      }

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      })

      if (response.ok) {
        const result = await response.json()
        alert('All three submissions created successfully! AI evaluation is in progress.')
        
        // Clear all fields
        setFormData({
          studentName: '',
          assignmentTitle: '',
          submissionType: 'algorithm'
        })
        setAlgorithmContent('')
        setPseudocodeContent('')
        setFlowchartFile(null)
        
        // Pass the combined submission ID to show combined results
        if (onSubmissionComplete && result.combinedSubmissionId) {
          onSubmissionComplete({ 
            submissionId: result.combinedSubmissionId,
            isCombined: true 
          })
        }
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Submission error:', error)
      alert('Failed to submit. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Submit Your Assignment</h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Upload your flowchart, algorithm, or pseudocode for AI-powered evaluation
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Student Name *
            </label>
            <input
              type="text"
              value={formData.studentName}
              onChange={(e) => handleInputChange('studentName', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your full name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assignment Title *
            </label>
            <input
              type="text"
              value={formData.assignmentTitle}
              onChange={(e) => handleInputChange('assignmentTitle', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Bubble Sort Algorithm"
              required
            />
          </div>
        </div>

        {/* Submission Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Submission Type *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              { value: 'flowchart', label: 'Flowchart', icon: ImageIcon, desc: 'Upload flowchart image' },
              { value: 'algorithm', label: 'Algorithm', icon: Code, desc: 'Code implementation' },
              { value: 'pseudocode', label: 'Pseudocode', icon: FileText, desc: 'Step-by-step logic' }
            ].map(({ value, label, icon: Icon, desc }) => (
              <label
                key={value}
                className={`flex items-center p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.submissionType === value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <input
                  type="radio"
                  name="submissionType"
                  value={value}
                  checked={formData.submissionType === value}
                  onChange={(e) => handleInputChange('submissionType', e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">{label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{desc}</div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Content Input */}
        <div>
          {formData.submissionType === 'flowchart' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Upload Flowchart *
              </label>
              <FileUpload
                onFileSelect={setCurrentFile}
                currentFile={getCurrentFile()}
                accept="image/*"
                maxSize={10 * 1024 * 1024} // 10MB
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Enter Your {formData.submissionType === 'algorithm' ? 'Algorithm' : 'Pseudocode'} *
              </label>
              <CodeEditor
                value={getCurrentContent()}
                onChange={setCurrentContent}
                submissionType={formData.submissionType}
              />
            </div>
          )}
        </div>

        {/* Privacy Settings */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                Submission Visibility
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isPublic 
                  ? 'Your submission will be visible in the public "All Submissions" section for other students to learn from.'
                  : 'Your submission will be private and only visible to you in "My Submissions".'
                }
              </p>
            </div>
            <div className="ml-4">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`block w-14 h-8 rounded-full transition-colors ${
                    isPublic ? 'bg-green-400' : 'bg-gray-300 dark:bg-gray-600'
                  }`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                    isPublic ? 'transform translate-x-6' : ''
                  }`}></div>
                </div>
                <span className={`ml-3 text-sm font-medium ${
                  isPublic ? 'text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {isPublic ? 'Public' : 'Private'}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-between items-center">
          {/* Submit All Button */}
          <button
            type="button"
            onClick={handleSubmitAll}
            disabled={isSubmitting}
            className={`px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {isSubmitting ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Submit All Three</span>
              </>
            )}
          </button>

          {/* Single Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-8 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isSubmitting ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit {formData.submissionType.charAt(0).toUpperCase() + formData.submissionType.slice(1)}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SubmissionForm