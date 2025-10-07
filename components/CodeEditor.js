'use client'

import { useState } from 'react'
import { Code, Type } from 'lucide-react'

const CodeEditor = ({ value, onChange, submissionType = 'algorithm', placeholder }) => {
  const [isFocused, setIsFocused] = useState(false)

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

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        {submissionType === 'algorithm' ? (
          <Code className="w-4 h-4" />
        ) : (
          <Type className="w-4 h-4" />
        )}
        <span>
          {submissionType === 'algorithm' ? 'Algorithm Code' : 'Pseudocode'}
        </span>
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
          placeholder={placeholder || defaultPlaceholders[submissionType] || 'Enter your code here...'}
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