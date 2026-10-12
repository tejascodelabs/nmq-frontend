import React from 'react'

function MisalLoader({ message = "Finding the best Misal Point..." }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center gap-4 bg-slate-50 p-4 select-none">
      {/* Animated Emoji Container with Glow */}
      <div className="relative flex items-center justify-center">
        <div className="absolute w-16 h-16 bg-orange-500/20 rounded-full blur-xl animate-pulse" />
        <div className="text-6xl animate-bounce relative z-10 filter drop-shadow-md">
          🍲
        </div>
      </div>

      {/* Loading Message */}
      <div className="flex flex-col items-center gap-1.5 text-center">
        <p className="text-slate-800 text-sm md:text-base font-bold tracking-tight">
          {message}
        </p>
        <p className="text-xs text-slate-400 font-medium animate-pulse">
          Please wait a moment...
        </p>
      </div>
    </div>
  )
}

export default MisalLoader