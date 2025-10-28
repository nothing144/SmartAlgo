'use client'

import { useState, useEffect } from 'react'
import { ImageIcon, User, Calendar, Search, RefreshCw, ZoomIn, Download } from 'lucide-react'

const PublicOutputView = ({ setCurrentView }) => {
  const [outputs, setOutputs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOutput, setSelectedOutput] = useState(null)

  useEffect(() => {
    fetchOutputs()
  }, [])

  const fetchOutputs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/public-output-photos')
      if (response.ok) {
        const data = await response.json()
        setOutputs(data)
      } else {
        console.error('Failed to fetch output photos')
      }
    } catch (error) {
      console.error('Error fetching output photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadImage = async (imageUrl, fileName = 'output-photo.png') => {
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

  const filteredOutputs = outputs.filter(output => 
    output.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    output.outputTitle.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const openImageModal = (output) => {
    setSelectedOutput(output)
  }

  const closeImageModal = () => {
    setSelectedOutput(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#4a1d96] to-[#2d1055] rounded-2xl mb-4">
            <ImageIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Public Output Photos
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            Browse program output screenshots shared by students
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => setCurrentView('public-output-submit')}
              className="bg-gradient-to-r from-[#4a1d96] to-[#2d1055] hover:from-[#5a2da6] hover:to-[#3d1865] text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <ImageIcon className="w-5 h-5" />
              Submit Output Photo
            </button>
            
            <button
              onClick={fetchOutputs}
              className="border-2 border-[#4a1d96] dark:border-[#a78bfa] text-[#4a1d96] dark:text-[#a78bfa] hover:bg-[#4a1d96] hover:text-white dark:hover:bg-[#a78bfa] dark:hover:text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2"
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
              placeholder="Search by student name or output title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#4a1d96] dark:focus:ring-[#a78bfa] focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4a1d96] dark:border-[#a78bfa] mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading outputs...</p>
          </div>
        )}

        {/* No Outputs */}
        {!loading && filteredOutputs.length === 0 && (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'No matching outputs found' : 'No output photos yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {searchQuery ? 'Try a different search term' : 'Be the first to submit an output photo!'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setCurrentView('public-output-submit')}
                className="bg-gradient-to-r from-[#4a1d96] to-[#2d1055] hover:from-[#5a2da6] hover:to-[#3d1865] text-white px-6 py-3 rounded-lg font-medium transition-all inline-flex items-center gap-2"
              >
                <ImageIcon className="w-5 h-5" />
                Submit Output Photo
              </button>
            )}
          </div>
        )}

        {/* Gallery Grid */}
        {!loading && filteredOutputs.length > 0 && (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Showing {filteredOutputs.length} output{filteredOutputs.length !== 1 ? 's' : ''}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOutputs.map((output) => (
                <div
                  key={output.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Image */}
                  <div className="relative group cursor-pointer" onClick={() => openImageModal(output.outputPhotoUrl)}>
                    <img
                      src={output.outputPhotoUrl}
                      alt={output.outputTitle}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 truncate">
                      {output.outputTitle}
                    </h3>
                    <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{output.studentName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>{new Date(output.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {/* Download Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownloadImage(
                          output.outputPhotoUrl, 
                          `${output.outputTitle}-${output.studentName}.png`
                        )
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#4a1d96] hover:bg-[#5a2da6] text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Stats */}
        {outputs.length > 0 && (
          <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Gallery Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                  {outputs.length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Outputs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {new Set(outputs.map(o => o.studentName)).size}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Contributors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {outputs.filter(o => {
                    const date = new Date(o.createdAt)
                    const today = new Date()
                    return date.toDateString() === today.toDateString()
                  }).length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Today</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={closeImageModal}
        >
          <div className="relative max-w-6xl max-h-full">
            <button
              onClick={closeImageModal}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedImage}
              alt="Full size output"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default PublicOutputView
