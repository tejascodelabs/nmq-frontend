import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Ticket,
  User,
  Users,
  Bell,
  TimerReset,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'
import backgroundImage from '../assets/background.png'
import AdvertisementCarousel from '../components/AdvertisementCarousel'
import api from '../api/axios'

const FINAL_CALL_DURATION = 120 // 2 Minutes timer as requested

export default function FinalCall() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token: routeToken, tokenId, mobile } = location.state || {}

  const [pageReady, setPageReady] = useState(false)
  const [liveToken] = useState(routeToken || null)
  const [seconds, setSeconds] = useState(FINAL_CALL_DURATION)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timerExpired, setTimerExpired] = useState(false)

  const bellRef = useRef(null)
  const bellIntervalRef = useRef(null)

  useEffect(() => {
    if (!liveToken) navigate('/', { replace: true })
  }, [liveToken, navigate])

  useEffect(() => {
    const t = setTimeout(() => {
      setPageReady(true)
    }, 80)
    return () => clearTimeout(t)
  }, [])

  // Audio Bell Effect simulation & Vibration
  const stopBell = () => {
    if (bellIntervalRef.current) {
      clearInterval(bellIntervalRef.current)
    }
    if (bellRef.current) {
      bellRef.current.pause()
      bellRef.current.currentTime = 0
    }
  }

  useEffect(() => {
    bellRef.current = new Audio('/call-bell.mp3')

    const playBell = () => {
      navigator.vibrate?.([500, 300, 500, 300, 500])
      bellRef.current.currentTime = 0
      bellRef.current.play().catch(() => {})
    }

    playBell()
    bellIntervalRef.current = setInterval(playBell, 5000)

    return () => {
      stopBell()
    }
  }, [])

  // Countdown Timer Logic (2 Minutes)
  useEffect(() => {
    if (timerExpired) return

    const countdown = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(countdown)
          stopBell()
          setTimerExpired(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(countdown)
  }, [timerExpired])

  const handleImHere = async () => {
    if (loading) return

    try {
      setLoading(true)

      const activeTokenId = liveToken?.id || tokenId
      if (!activeTokenId) {
        setError('Token ID not found.')
        return
      }

      const response = await api.patch(
        `/tokens/${activeTokenId}/im-here`,
        {
          mobile: liveToken?.mobile || mobile,
        }
      )

      const result = response.data
      if (result?.success === false) {
        throw new Error(result.message || 'Could not confirm your arrival.')
      }

      stopBell()
      navigate('/arrived', {
        replace: true,
        state: {
          token: result?.token || result?.data?.token || result?.data || liveToken,
        },
      })
    } catch (error) {
      console.error("I'm Here failed:", error)
      setError(
        error.response?.data?.message ||
          error.message ||
          "Could not confirm your arrival."
      )
    } finally {
      setLoading(false)
    }
  }

  if (!liveToken) return null

  const tokenNum = liveToken?.token_no || '00'
  const qType = liveToken?.queue_type || 'A'

  return (
    <div
      className={`min-h-screen w-full bg-[#F8F4EA] bg-top bg-repeat-y flex justify-center p-3 sm:p-5 md:p-8 transition-all duration-450 ease-out ${
        pageReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      }`}
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: '100% auto'
      }}
    >
      <style>{`
        @keyframes bellRing {
          0%, 100% { transform: rotate(0deg); }
          10% { transform: rotate(-12deg); }
          20% { transform: rotate(10deg); }
          30% { transform: rotate(-8deg); }
          40% { transform: rotate(6deg); }
          50% { transform: rotate(0deg); }
        }
        .fc-bell { animation: bellRing 1.6s ease infinite; }
        @keyframes fcPulseRed {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        .fc-timer-low { animation: fcPulseRed 1s ease infinite; }
      `}</style>

      {/* CONTAINER */}
      <div className="w-full max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-4xl min-h-[calc(100vh-40px)] flex flex-col gap-3.5 sm:gap-5 md:gap-6">
        
        {/* HEADER / BELL BANNER */}
        <div className="flex flex-col items-center justify-center gap-2 sm:gap-3 text-center pt-2">
          <div className="fc-bell w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-[#FFF5EB] to-[#FFE7C8] border border-[#F3DEC2] shadow-[0_6px_16px_rgba(242,121,58,0.12)] flex items-center justify-center shrink-0">
            <Bell className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#F2793A]" />
          </div>

          <div className="text-orange-800 text-xl sm:text-2xl md:text-3xl font-black tracking-tight">
            FINAL CALL
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#2B2118] tracking-tight">
            Your Table is Ready!
          </h1>
        </div>

        {/* TOKEN CARD */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-[#F1DEC5] shadow-[0_10px_24px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <div className="text-xs sm:text-sm font-semibold text-[#8A7F71] tracking-wider uppercase">
              YOUR TOKEN
            </div>
            <div className="text-4xl sm:text-5xl md:text-6xl font-black text-[#E65100] tracking-wide mt-1">
              {qType}-{tokenNum}
            </div>
          </div>

          <div className="flex-1 text-center px-2 sm:px-6">
            <span className="text-lg sm:text-xl md:text-2xl font-black text-gray-600 leading-snug">
              Please come to the counter now
            </span>
          </div>

          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-[#FFF5EB] to-[#FFE7C8] border border-[#F3DEC2] flex items-center justify-center shrink-0 shadow-sm">
            <Ticket className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#F2793A]" />
          </div>
        </div>

        {/* TIMER & ARRIVAL CONFIRMATION CARD */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 md:p-8 border border-[rgba(242,121,58,0.15)] shadow-[0_12px_28px_rgba(43,33,24,0.08)]">
          <div className="flex items-center justify-center gap-2 mb-3">
            <TimerReset className="w-5 h-5 text-[#F2793A]" />
            <span className="text-sm sm:text-base font-semibold text-gray-700">
              Final Call Timer (2 Mins)
            </span>
          </div>

          <div className="text-center">
            <div
              className={`text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-none ${
                seconds <= 15 ? 'fc-timer-low text-red-600' : 'text-emerald-600'
              }`}
            >
              {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
            </div>

            <div className="text-xs sm:text-sm text-[#8A7F71] font-medium mt-1">
              Time Remaining
            </div>
          </div>

          {timerExpired && (
            <div className="w-full max-w-lg mx-auto mt-4 p-3.5 bg-amber-50 border border-amber-400 rounded-xl text-center">
              <div className="text-xs sm:text-sm font-bold text-gray-600 flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Response time ended. Please reach the counter!</span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleImHere}
            disabled={loading}
            className="w-full h-14 sm:h-16 mt-6 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl text-white font-bold text-base sm:text-lg flex items-center justify-center gap-2.5 cursor-pointer shadow-lg active:scale-[0.98] transition-all"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/35 border-t-white rounded-full animate-spin" />
                <span>Confirming Arrival...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>I'm Here</span>
              </>
            )}
          </button>

          {error && (
            <p role="alert" className="mt-3 text-center text-sm font-medium text-red-700">
              {error}
            </p>
          )}
        </div>

        {/* ADVERTISEMENT */}
        <div className="mt-1">
          <AdvertisementCarousel
            shopId={liveToken?.shop_id}
            tokenId={liveToken?.id}
            placement="final_call"
            height={136}
            borderRadius={18}
          />
        </div>

      </div>
    </div>
  )
}