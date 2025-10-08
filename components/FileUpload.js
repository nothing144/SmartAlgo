'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileImage, CheckCircle } from 'lucide-react'

const FileUpload = ({ onFileSelect, currentFile = null, accept = "image/*", maxSize = 5 * 1024 * 1024 }) => {
  const uploadedFile = currentFile
  const preview = currentFile?.preview || null

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      alert('File rejected. Please check file type and size limits.')
      return
    }

    const file = acceptedFiles[0]
    if (file) {
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          onFileSelect({
            file: file,
            preview: e.target.result,
            name: file.name,
            size: file.size
          })
        }
        reader.readAsDataURL(file)
      } else {
        onFileSelect({
          file: file,
          preview: null,
          name: file.name,
          size: file.size
        })
      }
    }
  }, [onFileSelect])

  const removeFile = () => {
    onFileSelect(null)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { [accept]: [] },
    maxSize,
    maxFiles: 1
  })

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (uploadedFile) {
    return (
      <div className="border-2 border-dashed border-green-300 dark:border-green-600 rounded-lg p-6 bg-green-50 dark:bg-green-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-300">{uploadedFile.name}</p>
              <p className="text-xs text-green-600 dark:text-green-400">{formatFileSize(uploadedFile.size)}</p>
            </div>
          </div>
          <button
            onClick={removeFile}
            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {preview && (
          <div className="mt-4">
            <img 
              src={preview} 
              alt="Preview" 
              className="max-w-full h-48 object-contain border border-gray-200 dark:border-gray-600 rounded-md"
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer transition-colors touch-manipulation
        ${isDragActive 
          ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-500' 
          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center space-y-4">
        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
          <Upload className="w-8 h-8 text-gray-600 dark:text-gray-400" />
        </div>
        
        <div>
          <p className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">
            {isDragActive ? 'Drop your file here' : 'Upload your flowchart'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            <span className="hidden sm:inline">Drag and drop or </span>Tap to browse
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Supports: JPG, PNG, PDF (max {Math.round(maxSize / (1024 * 1024))}MB)
          </p>
        </div>
      </div>
    </div>
  )
}

export default FileUpload