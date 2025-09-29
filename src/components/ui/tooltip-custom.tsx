'use client'

import { useState, useRef, useEffect } from 'react'

interface CustomTooltipProps {
  content: string
  children: React.ReactNode
  disabled?: boolean
}

export function CustomTooltip({ content, children, disabled = false }: CustomTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 8 // Немного выше элемента
      })
    }
  }, [isVisible])

  if (disabled || !content) {
    return <>{children}</>
  }

  return (
    <>
      <div 
        ref={triggerRef}
        className="inline-block"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      
      {isVisible && (
        <div 
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: position.x,
            top: position.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
            {content}
          </div>
          {/* Стрелочка */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </>
  )
}
