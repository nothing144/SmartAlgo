'use client'

import { useState } from 'react'
import { Code, Type } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamic import to avoid SSR issues with Monaco Editor
const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 flex items-center justify-center bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading editor...</p>
      </div>
    </div>
  )
})

const CodeEditor = ({ value, onChange, submissionType = 'algorithm', placeholder }) => {
  const [isFocused, setIsFocused] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('javascript')

  const programmingLanguages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' },
    { value: 'csharp', label: 'C#' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'php', label: 'PHP' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'swift', label: 'Swift' },
    { value: 'kotlin', label: 'Kotlin' },
    { value: 'sql', label: 'SQL' },
    { value: 'r', label: 'R' },
    { value: 'perl', label: 'Perl' },
    { value: 'scala', label: 'Scala' },
    { value: 'dart', label: 'Dart' },
    { value: 'lua', label: 'Lua' },
    { value: 'shell', label: 'Shell' }
  ]

  const defaultPlaceholders = {
    algorithm: `// Enter your algorithm here
// Example:
function bubbleSort(arr) {
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr.length - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                // Swap elements
                let temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
    return arr;
}`,
    pseudocode: `// Enter your pseudocode here
// Example:
BEGIN BubbleSort
    FOR i = 0 TO length(array) - 1
        FOR j = 0 TO length(array) - i - 2
            IF array[j] > array[j+1] THEN
                SWAP array[j] AND array[j+1]
            END IF
        END FOR
    END FOR
END BubbleSort`
  }

  const editorOptions = {
    minimap: { enabled: true },
    fontSize: 14,
    lineNumbers: 'on',
    roundedSelection: true,
    scrollBeyondLastLine: false,
    readOnly: false,
    automaticLayout: true,
    tabSize: 4,
    wordWrap: 'on',
    padding: { top: 10 },
    suggestOnTriggerCharacters: true,
    quickSuggestions: true,
    folding: true,
    foldingStrategy: 'indentation',
    showFoldingControls: 'always',
    matchBrackets: 'always',
    autoClosingBrackets: 'always',
    autoClosingQuotes: 'always',
    formatOnPaste: true,
    formatOnType: true
  }

  // For algorithm type, use Monaco Editor
  if (submissionType === 'algorithm') {
    return (
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Code className="w-4 h-4" />
            <span>Algorithm Code</span>
          </div>
          
          {/* Language Selector */}
          <div className="flex items-center space-x-2">
            <label className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">Language:</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 min-w-0 flex-1 touch-manipulation"
            >
              {programmingLanguages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
          <Editor
            height="300px"
            language={selectedLanguage}
            value={value || ''}
            onChange={(newValue) => onChange(newValue || '')}
            theme="vs-dark"
            options={editorOptions}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row sm:justify-between text-xs text-gray-500 dark:text-gray-400 gap-4">
          <div>
            <p className="font-medium mb-1">Tips:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Use clear variable names and comments</li>
              <li>Follow proper indentation (auto-formatted)</li>
              <li>Include all necessary steps and conditions</li>
            </ul>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-gray-400 dark:text-gray-500">{value?.length || 0} characters</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              <span className="hidden sm:inline">Press Ctrl+Space for suggestions</span>
              <span className="sm:hidden">Long press for suggestions</span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // For pseudocode, keep the original textarea
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        <Type className="w-4 h-4" />
        <span>Pseudocode</span>
      </div>
      
      <div className={`relative border rounded-lg transition-colors ${
        isFocused 
          ? 'border-blue-400 ring-2 ring-blue-100 dark:ring-blue-900/30' 
          : 'border-gray-300 dark:border-gray-600'
      }`}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder || defaultPlaceholders[submissionType] || 'Enter your pseudocode here...'}
          className="w-full h-64 p-4 font-mono text-sm bg-gray-50 dark:bg-gray-700 border-0 rounded-lg resize-none focus:outline-none focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
        />
        
        <div className="absolute bottom-2 right-2 text-xs text-gray-400 dark:text-gray-500">
          {value?.length || 0} characters
        </div>
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400">
        <p>Tips:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Use clear variable names and comments</li>
          <li>Follow proper indentation</li>
          <li>Include all necessary steps and conditions</li>
        </ul>
      </div>
    </div>
  )
}

export default CodeEditor