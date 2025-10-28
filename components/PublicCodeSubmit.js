'use client'

import { useState } from 'react'
import { Send, Code, Upload, X } from 'lucide-react'

const PublicCodeSubmit = ({ setCurrentView }) => {
  const [studentName, setStudentName] = useState('')
  const [codeTitle, setCodeTitle] = useState('')
  const [codeContent, setCodeContent] = useState('')
  const [outputPhoto, setOutputPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB')
      return
    }

    // Read file and create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setOutputPhoto(reader.result)
      setPhotoPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!studentName.trim() || !codeTitle.trim() || !codeContent.trim()) {
      alert('Please fill in all fields')
      return
    }

    setIsSubmitting(true)
    setSubmitSuccess(false)

    try {
      const response = await fetch('/api/public-code-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentName: studentName.trim(),
          codeTitle: codeTitle.trim(),
          codeContent: codeContent.trim(),
          outputPhotoData: outputPhoto // Optional
        })
      })

      if (response.ok) {
        setSubmitSuccess(true)
        // Reset form
        setStudentName('')
        setCodeTitle('')
        setCodeContent('')
        setOutputPhoto(null)
        setPhotoPreview(null)
        
        // Show success message and redirect
        setTimeout(() => {
          setCurrentView('public-view')
        }, 2000)
      } else {
        const error = await response.json()
        alert(`Submission failed: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error submitting code:', error)
      alert('Failed to submit code. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#090f4f] to-[#4a1d96] rounded-2xl mb-4">
            <Code className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Submit Your Code
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Share your code solution publicly - No login required!
          </p>
        </div>

        {/* Success Message */}
        {submitSuccess && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg">
            <p className="text-green-800 dark:text-green-200 font-medium text-center">
              ✅ Code submitted successfully! Redirecting to view all submissions...
            </p>
          </div>
        )}

        {/* Submission Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Name */}
            <div>
              <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Student Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="studentName"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#090f4f] dark:focus:ring-[#5a6fd8] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                required
              />
            </div>

            {/* Code Title/Question */}
            <div>
              <label htmlFor="codeTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Code Title / Question <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="codeTitle"
                value={codeTitle}
                onChange={(e) => setCodeTitle(e.target.value)}
                placeholder="e.g., Bubble Sort Algorithm, Fibonacci Series, etc."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#090f4f] dark:focus:ring-[#5a6fd8] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                required
              />
            </div>

            {/* Code Content */}
            <div>
              <label htmlFor="codeContent" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Code <span className="text-red-500">*</span>
              </label>
              <textarea
                id="codeContent"
                value={codeContent}
                onChange={(e) => setCodeContent(e.target.value)}
                placeholder="Paste or type your code here..."
                rows={15}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#090f4f] dark:focus:ring-[#5a6fd8] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-mono text-sm"
                required
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {codeContent.length} characters
              </p>
            </div>

            {/* Optional Output Photo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Output Screenshot <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
              
              {!photoPreview ? (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-[#090f4f] dark:hover:border-[#5a6fd8] transition-colors bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-400" />
                    <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Click to upload output screenshot</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PNG, JPG (MAX. 10MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                  />
                </label>
              ) : (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Output preview"
                    className="w-full h-40 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setOutputPhoto(null)
                      setPhotoPreview(null)
                    }}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Attach a screenshot of your program's output (optional but recommended)
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-[#090f4f] to-[#02050e] hover:from-[#0a1058] hover:to-[#030714] text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Code
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => setCurrentView('public-view')}
                className="px-6 py-3 border-2 border-[#090f4f] dark:border-[#5a6fd8] text-[#090f4f] dark:text-[#5a6fd8] hover:bg-[#090f4f] hover:text-white dark:hover:bg-[#5a6fd8] dark:hover:text-white rounded-lg font-medium transition-all"
              >
                View Submissions
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            ℹ️ <strong>Note:</strong> All submissions are public and visible to everyone. Your code will NOT be evaluated - this is just for sharing solutions.
          </p>
        </div>
      </div>
    </div>
  )
}

export default PublicCodeSubmit
