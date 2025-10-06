'use client'

import { useState, useEffect } from 'react'
import { Send, Clock, CheckCircle, AlertCircle, FileText, Image as ImageIcon, Code } from 'lucide-react'
import FileUpload from './FileUpload'
import CodeEditor from './CodeEditor'

const SubmissionForm = ({ onSubmissionComplete }) => {
  const [formData, setFormData] = useState({
    studentName: '',
    assignmentTitle: '',
    submissionType: 'algorithm'
  })
  const [textContent, setTextContent] = useState('')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rubrics, setRubrics] = useState([])
  const [selectedRubric, setSelectedRubric] = useState('')

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
        if (data.length > 0) {
          setSelectedRubric(data[0].rubricId)
        }
      }
    } catch (error) {
      console.error('Error fetching rubrics:', error)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Reset content when switching submission types
    if (field === 'submissionType') {
      setTextContent('')
      setUploadedFile(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.studentName || !formData.assignmentTitle) {
      alert('Please fill in all required fields')
      return
    }

    if (formData.submissionType === 'flowchart' && !uploadedFile) {
      alert('Please upload a flowchart image')
      return
    }

    if ((formData.submissionType === 'algorithm' || formData.submissionType === 'pseudocode') && !textContent.trim()) {
      alert('Please enter your code/pseudocode')
      return
    }

    setIsSubmitting(true)
    
    try {
      const submissionData = {
        studentName: formData.studentName,
        assignmentTitle: formData.assignmentTitle,
        submissionType: formData.submissionType,
        rubricId: selectedRubric
      }

      if (formData.submissionType === 'flowchart') {
        submissionData.imageData = uploadedFile.preview
        submissionData.fileName = uploadedFile.name
      } else {
        submissionData.textContent = textContent
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
        alert('Submission created successfully! AI evaluation is in progress.')
        
        // Clear form
        setFormData({
          studentName: '',
          assignmentTitle: '',
          submissionType: 'algorithm'
        })
        setTextContent('')
        setUploadedFile(null)
        
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

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Submit Your Assignment</h2>
        <p className="text-gray-600">
          Upload your flowchart, algorithm, or pseudocode for AI-powered evaluation
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student Name *
            </label>
            <input
              type="text"
              value={formData.studentName}
              onChange={(e) => handleInputChange('studentName', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your full name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignment Title *
            </label>
            <input
              type="text"
              value={formData.assignmentTitle}
              onChange={(e) => handleInputChange('assignmentTitle', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Bubble Sort Algorithm"
              required
            />
          </div>
        </div>

        {/* Submission Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Submission Type *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { value: 'flowchart', label: 'Flowchart', icon: ImageIcon, desc: 'Upload flowchart image' },
              { value: 'algorithm', label: 'Algorithm', icon: Code, desc: 'Code implementation' },
              { value: 'pseudocode', label: 'Pseudocode', icon: FileText, desc: 'Step-by-step logic' }
            ].map(({ value, label, icon: Icon, desc }) => (
              <label
                key={value}
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.submissionType === value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
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
                  <Icon className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">{label}</div>
                    <div className="text-xs text-gray-500">{desc}</div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Rubric Selection */}
        {rubrics.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Evaluation Rubric
            </label>
            <select
              value={selectedRubric}
              onChange={(e) => setSelectedRubric(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {rubrics.map((rubric) => (
                <option key={rubric.rubricId} value={rubric.rubricId}>
                  {rubric.title} ({rubric.submissionType})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Content Input */}
        <div>
          {formData.submissionType === 'flowchart' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Upload Flowchart *
              </label>
              <FileUpload
                onFileSelect={setUploadedFile}
                accept="image/*"
                maxSize={10 * 1024 * 1024} // 10MB
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Enter Your {formData.submissionType === 'algorithm' ? 'Algorithm' : 'Pseudocode'} *
              </label>
              <CodeEditor
                value={textContent}
                onChange={setTextContent}
                submissionType={formData.submissionType}
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
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
                <span>Submit for Evaluation</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SubmissionForm