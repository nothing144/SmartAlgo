'use client'

import { useState } from 'react'
import { Send, ImageIcon, Upload } from 'lucide-react'

const PublicOutputSubmit = ({ setCurrentView }) => {
  const [studentName, setStudentName] = useState('')
  const [outputTitle, setOutputTitle] = useState('')
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
    
    if (!studentName.trim() || !outputTitle.trim() || !outputPhoto) {
      alert('Please fill in all fields and upload a photo')
      return
    }

    setIsSubmitting(true)
    setSubmitSuccess(false)

    try {
      const response = await fetch('/api/public-output-photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentName: studentName.trim(),
          outputTitle: outputTitle.trim(),
          outputPhotoData: outputPhoto
        })
      })

      if (response.ok) {
        setSubmitSuccess(true)
        // Reset form
        setStudentName('')
        setOutputTitle('')
        setOutputPhoto(null)
        setPhotoPreview(null)
        
        // Show success message and redirect
        setTimeout(() => {
          setCurrentView('public-output-view')
        }, 2000)
      } else {
        const error = await response.json()
        alert(`Submission failed: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error submitting output photo:', error)
      alert('Failed to submit. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#4a1d96] to-[#2d1055] rounded-2xl mb-4">
            <ImageIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Submit Output Photo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Share your program output screenshot publicly - No login required!
          </p>
        </div>

        {/* Success Message */}
        {submitSuccess && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg">
            <p className="text-green-800 dark:text-green-200 font-medium text-center">
              ✅ Output photo submitted successfully! Redirecting to view all outputs...
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
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#4a1d96] dark:focus:ring-[#a78bfa] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                required
              />
            </div>

            {/* Output Title */}
            <div>
              <label htmlFor="outputTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Output Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="outputTitle"
                value={outputTitle}
                onChange={(e) => setOutputTitle(e.target.value)}
                placeholder="e.g., Bubble Sort Output, Calculator Result, etc."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#4a1d96] dark:focus:ring-[#a78bfa] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                required
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Output Screenshot <span className="text-red-500">*</span>
              </label>
              
              {!photoPreview ? (
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-[#4a1d96] dark:hover:border-[#a78bfa] transition-colors bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-12 h-12 mb-4 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PNG, JPG, or JPEG (MAX. 10MB)
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
                    className="w-full h-auto max-h-96 object-contain rounded-lg border border-gray-300 dark:border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setOutputPhoto(null)
                      setPhotoPreview(null)
                    }}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-[#4a1d96] to-[#2d1055] hover:from-[#5a2da6] hover:to-[#3d1865] text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Output Photo
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => setCurrentView('public-output-view')}
                className="px-6 py-3 border-2 border-[#4a1d96] dark:border-[#a78bfa] text-[#4a1d96] dark:text-[#a78bfa] hover:bg-[#4a1d96] hover:text-white dark:hover:bg-[#a78bfa] dark:hover:text-white rounded-lg font-medium transition-all"
              >
                View Gallery
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            ℹ️ <strong>Note:</strong> All submissions are public and visible to everyone. Share clean screenshots of your program outputs.
          </p>
        </div>
      </div>
    </div>
  )
}

export default PublicOutputSubmit
