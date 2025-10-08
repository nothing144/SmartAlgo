'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

export function CursorGlow() {
  const { theme } = useTheme()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (theme !== 'dark') return

    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [theme])

  // Don't render on server or in light mode
  if (!mounted || theme !== 'dark') return null

  return (
    <div
      className="cursor-glow"
      style={{
        left: `${mousePosition.x}px`,
        top: `${mousePosition.y}px`,
      }}
    />
  )
}
