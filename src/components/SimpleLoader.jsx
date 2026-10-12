import React from 'react'
import { Loader2 } from 'lucide-react'

function SimpleLoader({ 
  text = "Loading...", 
  size = "default", // 'small' | 'default' | 'large'
  fullScreen = false 
}) {
  const sizeClasses = {
    small: "w-4 h-4",
    default: "w-6 h-6",
    large: "w-10 h-10",
  }

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${sizeClasses[size] || sizeClasses.default} animate-spin text-orange-500`} />
      {text && (
        <span className="text-xs sm:text-sm font-medium text-slate-500 tracking-wide">
          {text}
        </span>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white/80 backdrop-blur-xs p-4">
        {content}
      </div>
    )
  }

  return <div className="p-4 flex justify-center items-center">{content}</div>
}

export default SimpleLoader