'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export const FloralBackground = () => {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient background */}
      <div className={`absolute inset-0 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800' 
          : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
      }`} />
      
      {/* Floral Pattern Overlay */}
      <div className="absolute inset-0 opacity-20">
        {/* Large decorative flowers */}
        <div className={`absolute top-10 left-10 w-32 h-32 rounded-full ${
          theme === 'dark' ? 'bg-purple-400/30' : 'bg-pink-300/40'
        } blur-xl animate-pulse`} />
        
        <div className={`absolute top-32 right-16 w-24 h-24 rounded-full ${
          theme === 'dark' ? 'bg-blue-400/25' : 'bg-blue-300/35'
        } blur-lg animate-pulse delay-1000`} />
        
        <div className={`absolute bottom-20 left-20 w-40 h-40 rounded-full ${
          theme === 'dark' ? 'bg-emerald-400/20' : 'bg-green-300/30'
        } blur-2xl animate-pulse delay-2000`} />
        
        <div className={`absolute bottom-32 right-12 w-28 h-28 rounded-full ${
          theme === 'dark' ? 'bg-rose-400/25' : 'bg-rose-300/35'
        } blur-xl animate-pulse delay-500`} />

        {/* Medium decorative elements */}
        <div className={`absolute top-1/2 left-1/4 w-20 h-20 rounded-full ${
          theme === 'dark' ? 'bg-yellow-400/20' : 'bg-yellow-300/30'
        } blur-lg animate-pulse delay-3000`} />
        
        <div className={`absolute top-1/3 right-1/3 w-16 h-16 rounded-full ${
          theme === 'dark' ? 'bg-indigo-400/25' : 'bg-indigo-300/35'
        } blur-md animate-pulse delay-1500`} />

        {/* Small scattered elements */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className={`absolute w-3 h-3 rounded-full animate-pulse ${
              theme === 'dark' 
                ? 'bg-white/10' 
                : 'bg-purple-400/30'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4000}ms`,
              animationDuration: `${2000 + Math.random() * 2000}ms`
            }}
          />
        ))}

        {/* Organic shapes for floral feel */}
        <div className={`absolute top-0 left-1/2 w-64 h-64 ${
          theme === 'dark' ? 'bg-purple-600/10' : 'bg-purple-200/20'
        } rounded-full blur-3xl transform -translate-x-1/2 animate-pulse delay-1000`} />
        
        <div className={`absolute bottom-0 right-1/3 w-48 h-48 ${
          theme === 'dark' ? 'bg-pink-600/10' : 'bg-pink-200/20'
        } rounded-full blur-2xl animate-pulse delay-2500`} />

        {/* Subtle leaf-like shapes */}
        <div className={`absolute top-1/4 left-1/6 w-12 h-24 ${
          theme === 'dark' ? 'bg-emerald-500/15' : 'bg-emerald-300/25'
        } rounded-full blur-lg transform rotate-45 animate-pulse delay-4000`} />
        
        <div className={`absolute bottom-1/3 right-1/4 w-16 h-32 ${
          theme === 'dark' ? 'bg-teal-500/15' : 'bg-teal-300/25'
        } rounded-full blur-lg transform -rotate-12 animate-pulse delay-3500`} />
      </div>

      {/* Subtle texture overlay */}
      <div className={`absolute inset-0 opacity-5 ${
        theme === 'dark' ? 'bg-white' : 'bg-gray-900'
      }`} 
      style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
        backgroundSize: '24px 24px'
      }} />
    </div>
  )
}