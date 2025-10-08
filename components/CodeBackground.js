'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export const CodeBackground = () => {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  // High-quality code background images from Unsplash
  const codeImages = [
    'https://images.unsplash.com/photo-1653387319597-84bde7e5368e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxjb2RlJTIwcHJvZ3JhbW1pbmd8ZW58MHx8fGJsYWNrfDE3NTk5NDYzMDJ8MA&ixlib=rb-4.1.0&q=85',
    'https://images.unsplash.com/photo-1653387137517-fbc54d488ed8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyfHxjb2RlJTIwcHJvZ3JhbW1pbmd8ZW58MHx8fGJsYWNrfDE3NTk5NDYzMDJ8MA&ixlib=rb-4.1.0&q=85'
  ]

  // Use different image for sign-in vs sign-up (based on current path if available)
  const imageIndex = typeof window !== 'undefined' && window.location.pathname.includes('sign-up') ? 1 : 0
  const backgroundImage = codeImages[imageIndex]

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Code background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${backgroundImage})`,
        }}
      />
      
      {/* Dark overlay to ensure good contrast for form readability */}
      <div className={`absolute inset-0 ${
        theme === 'dark' 
          ? 'bg-black/60' 
          : 'bg-black/50'
      }`} />
      
      {/* Subtle gradient overlay for better form integration */}
      <div className={`absolute inset-0 ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-slate-900/40 via-purple-900/30 to-slate-800/40'
          : 'bg-gradient-to-br from-blue-900/20 via-indigo-900/15 to-purple-900/20'
      }`} />

      {/* Animated code elements floating overlay */}
      <div className="absolute inset-0 opacity-10">
        {/* Floating code snippets simulation */}
        <div className="absolute top-20 left-10 text-green-400 font-mono text-sm animate-pulse">
          const evaluate = (code) =&gt; &#123;
        </div>
        
        <div className="absolute top-40 right-20 text-blue-400 font-mono text-xs animate-pulse delay-1000">
          if (syntax.isValid) return true;
        </div>
        
        <div className="absolute bottom-32 left-16 text-yellow-400 font-mono text-xs animate-pulse delay-2000">
          function analyzeAlgorithm() &#123;
        </div>
        
        <div className="absolute bottom-48 right-12 text-purple-400 font-mono text-sm animate-pulse delay-500">
          &#125; // End evaluation
        </div>

        <div className="absolute top-1/2 left-1/4 text-emerald-400 font-mono text-xs animate-pulse delay-3000">
          rubric.score += points;
        </div>
        
        <div className="absolute top-1/3 right-1/3 text-cyan-400 font-mono text-xs animate-pulse delay-1500">
          AI.evaluate(submission);
        </div>

        {/* Subtle code-like dots and lines */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-green-400/30 rounded-full animate-pulse"
            style={{
              left: `${15 + Math.random() * 70}%`,
              top: `${15 + Math.random() * 70}%`,
              animationDelay: `${Math.random() * 4000}ms`,
              animationDuration: `${2000 + Math.random() * 3000}ms`
            }}
          />
        ))}
      </div>

      {/* Subtle texture overlay for depth */}
      <div className={`absolute inset-0 opacity-5 ${
        theme === 'dark' ? 'bg-white' : 'bg-gray-900'
      }`} 
      style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
        backgroundSize: '32px 32px'
      }} />
    </div>
  )
}