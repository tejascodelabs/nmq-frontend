import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Ticket,
  User,
  Users,
  Activity,
  Bell,
  Home,
  X,
  AlertTriangle
} from 'lucide-react'
import backgroundImage from '../assets/background.png'
import AdvertisementCarousel from '../components/AdvertisementCarousel'
import { cancelTokenApi, getTokenByIdApi } from '../api/token.api'
import { socket } from '../utils/socket'

export default function QueueStatus() {
  const navigate = useNavigate()
  const location = useLocation()
  const { state } = location
  const tokenId = state?.tokenId || localStorage.getItem('currentTokenId')
  const [activeToken, setActiveToken] = useState(null)
  const [loading, setLoading] = useState(true)

  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [error, setError] = useState('')

    const shop = location.state?.shop || null


  useEffect(() => {
    if (!tokenId) {
      navigate('/', { replace: true })
      return
    }

    let isActive = true

    const fetchToken = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await getTokenByIdApi(tokenId)
        const token =
          response?.token ??
          response?.data?.token ??
          response?.data?.data?.token ??
          response?.data ??
          response

        if (!token?.id) {
          throw new Error('Token not found.')
        }

        if (isActive) setActiveToken(token)
      } catch (error) {
        console.error('Get token failed:', error)
        if (isActive) {
          setError(
            error?.response?.data?.message ||
            error?.message ||
            'Could not load your token.'
          )
        }
      } finally {
        if (isActive) setLoading(false)
      }
    }

    fetchToken()

    return () => {
      isActive = false
    }
  }, [tokenId, navigate])

  const handleCancelToken = async () => {
    if (!tokenId) {
      setError("Token ID is missing.");
      return;
    }

    try {
      setCanceling(true);
      setError("");

      await cancelTokenApi(
        tokenId,
        state?.mobile || activeToken?.mobile || localStorage.getItem('currentMobile')
      );

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      console.error("Cancel token failed:", error);

      setError(
        error?.response?.data?.message ||
        error?.message ||
        "Could not cancel token."
      );
    } finally {
      setCanceling(false);
      setShowCancelConfirm(false);
    }
  };


  // useEffect(() => {
  //   if (!tokenId) return

  //   const handleTokenCalled = (data) => {
  //     const payload = data?.data ?? data
  //     const calledToken = payload?.token ?? payload
  //     const calledTokenId =
  //       calledToken?.id ??
  //       calledToken?.tokenId ??
  //       calledToken?.token_id ??
  //       data?.tokenId ??
  //       data?.token_id

  //     if (calledTokenId == null || String(calledTokenId) !== String(tokenId)) {
  //       return
  //     }

  //     navigate('/final-call', {
  //       state: {
  //         token: calledToken?.id ? calledToken : activeToken,
  //         tokenId,
  //         mobile: state?.mobile || activeToken?.mobile || localStorage.getItem('currentMobile'),
  //         shop: state?.shop || activeToken?.shops || activeToken?.shop,
  //       },
  //     })
  //   }

  //   socket.on('token:called', handleTokenCalled)

  //   return () => {
  //     socket.off('token:called', handleTokenCalled)
  //   }
  // }, [tokenId, activeToken, state, navigate])

  // Queue status logic
 // Queue status logic
  
 useEffect(() => {
    if (!tokenId) return

    const shopId = activeToken?.shopId || state?.shop?.shopId || state?.shop?.id;
    if (shopId && socket) {
      socket.emit('join-shop', shopId);
    }

    const handleTokenCalled = (data) => {
      const payload = data?.data ?? data
      const calledToken = payload?.token ?? payload
      const calledTokenId =
        calledToken?.id ??
        calledToken?.tokenId ??
        calledToken?.token_id ??
        data?.tokenId ??
        data?.token_id

      if (calledTokenId == null || String(calledTokenId) !== String(tokenId)) {
        return
      }

      navigate('/final-call', {
        state: {
          token: calledToken?.id ? calledToken : activeToken,
          tokenId,
          mobile: state?.mobile || activeToken?.mobile || localStorage.getItem('currentMobile'),
          shop: state?.shop || activeToken?.shops || activeToken?.shop,
        },
      })
    }

    socket.on('token:called', handleTokenCalled)

    return () => {
      socket.off('token:called', handleTokenCalled)
    }
  }, [tokenId, activeToken, state, navigate])
 
 const groupsAhead = activeToken?.groupsAhead ?? activeToken?.groups_ahead ?? null
  const tokenStatus = activeToken?.status

  const getQueueStatus = () => {
    if (tokenStatus === 'cancelled') {
      return {
        title: "Token Cancelled",
        colorClass: 'text-red-600',
        bgClass: 'bg-red-50 text-red-600'
      }
    }

    if (tokenStatus === 'not_arrived') {
      return {
        title: "Call Expired / Not Arrived",
        colorClass: 'text-amber-600',
        bgClass: 'bg-amber-50 text-amber-600'
      }
    }

    if (tokenStatus === 'arrived') {
      return {
        title: "Arrived at Counter",
        colorClass: 'text-emerald-600',
        bgClass: 'bg-emerald-50 text-emerald-600'
      }
    }

    if (groupsAhead === 0) {
      return {
        title: "You're Next!",
        colorClass: 'text-emerald-600',
        bgClass: 'bg-emerald-50 text-emerald-600'
      }
    }

    if (groupsAhead != null && groupsAhead <= 3) {
      return {
        title: 'Almost Ready',
        colorClass: 'text-amber-600',
        bgClass: 'bg-amber-50 text-amber-600'
      }
    }

    return {
      title: 'Waiting',
      colorClass: 'text-blue-600',
      bgClass: 'bg-blue-50 text-blue-600'
    }
  }

  const queueStatus = getQueueStatus()
  const peopleCount = activeToken?.group_size ?? activeToken?.groupSize ?? 1
  const queueType = activeToken?.queue_type ?? activeToken?.queueType
  const tokenNumber = activeToken?.token_no ?? activeToken?.tokenNo

  if (loading || !activeToken) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f8f4ea] p-5">
        <div className="text-center">
          {loading ? (
            <p className="font-semibold text-[#8A7F71]">Loading your queue status...</p>
          ) : (
            <>
              <p role="alert" className="font-semibold text-red-700">
                {error || 'Could not load your token.'}
              </p>
              <button
                type="button"
                onClick={() => navigate('/', { replace: true })}
                className="mt-4 font-bold text-[#F2793A]"
              >
                Back to home
              </button>
            </>
          )}
        </div>
      </main>
    )
  }

  return (
    <div
      className="min-h-screen w-full bg-[#f8f4ea] bg-top bg-repeat-y flex items-start justify-center p-3 sm:p-5 pb-10 box-border"
      style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: '100% auto' }}
    >
      <style>{`
        @keyframes qsFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes liveDotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.9); }
        }
        @keyframes ticketFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
          100% { transform: translateY(0px); }
        }
        .token-ticket-card {
          animation: qsFadeUp .45s ease, ticketFloat 3.5s ease-in-out infinite;
        }
        .qs-d1 { animation: qsFadeUp .4s ease both; }
        .qs-d2 { animation: qsFadeUp .4s ease .08s both; }
        .qs-d3 { animation: qsFadeUp .4s ease .16s both; }
        .qs-live-dot { animation: liveDotPulse 1.6s ease infinite; }
      `}</style>

      {/* MAIN CONTAINER */}
      <div className="w-full max-w-[480px] min-h-[calc(100vh-40px)] flex flex-col">
        <div className="flex-1">

          {/* HEADER */}
          <div className="qs-d1 flex items-center justify-between gap-2 mb-4 sm:mb-6 w-full">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl shadow-[0_6px_16px_rgba(242,121,58,0.12)] bg-gradient-to-br from-[#FFF5EB] to-[#FFE7C8] border border-[#F3DEC2] flex items-center justify-center shrink-0">
                <Ticket className="w-6 h-6 sm:w-7 sm:h-7 text-[#F2793A]" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#2B2118] tracking-tight leading-tight truncate">
                  Queue Status
                </h1>
                <p className="text-xs sm:text-sm text-[#8A7F71] mt-0.5 truncate">
                  Track your live queue in real time
                </p>
              </div>
            </div>

            <div className="bg-[#EAFBF2] text-emerald-600 border border-[#BFE8D1] rounded-full px-2.5 sm:px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-sm shrink-0">
              <span className="qs-live-dot text-[10px] sm:text-xs">●</span>
              <span>LIVE</span>
            </div>
          </div>

          {/* TOKEN INFORMATION CARD */}
          <div className="qs-d1 token-ticket-card w-full bg-white rounded-3xl mb-3.5 border border-[#F1E6D8] box-border shadow-[0_12px_30px_rgba(43,33,24,0.06)] overflow-hidden">
            {/* Ticket Header */}
            <div className="p-4 sm:p-5 pb-3.5 flex items-center justify-between gap-3 flex-nowrap">
              <div className="flex items-center gap-2 shrink-0">
                <Ticket className="w-5 h-5 text-[#F2793A]" />
                <span className="text-lg sm:text-xl font-black tracking-tight text-[#F2793A]">
                  {queueType && tokenNumber ? `${queueType}-${tokenNumber}` : 'Token'}
                </span>
              </div>

              <div className="w-px h-6 bg-[#F1E6D8] shrink-0" />

              <span className="flex-1 min-w-0 text-right text-sm sm:text-base font-bold text-[#2B2118] truncate">
                {shop?.shopName || 'Shop Name'}
              </span>
            </div>

            {/* Ticket Divider Notch */}
            <div className="relative flex items-center mx-4">
              <div className="absolute -left-6 w-4 h-4 rounded-full bg-[#FDF6EC] border-r border-[#F1E6D8] z-10" />
              <div className="flex-1 border-t border-dashed border-[#F1E6D8]" />
              <div className="absolute -right-6 w-4 h-4 rounded-full bg-[#FDF6EC] border-l border-[#F1E6D8] z-10" />
            </div>

            {/* Stats */}
            <div className="p-4 sm:p-5 grid grid-cols-2 gap-3 divide-x divide-[#F1E6D8]">
              <div className="flex flex-col items-center justify-center text-center gap-1">
                <User className="w-5 h-5 text-[#8A7F71]" />
                <div className="text-xs text-[#8A7F71] font-medium">No. of Guests</div>
                <div className="font-bold text-sm sm:text-base text-[#2B2118]">
                  {peopleCount} {peopleCount === 1 ? 'Guest' : 'Guests'}
                </div>
              </div>

              <div className="flex flex-col items-center justify-center text-center gap-1 pl-3">
                <Users className="w-5 h-5 text-[#8A7F71]" />
                <div className="text-xs text-[#8A7F71] font-medium">Groups Ahead</div>
                <div className="text-[#F2793A] font-bold text-sm sm:text-base">
                  {groupsAhead === 0
                    ? "You're next!"
                    : groupsAhead == null
                      ? 'Updating'
                      : `${groupsAhead} ahead`}
                </div>
              </div>
            </div>
          </div>

          {/* LIVE STATUS CARD */}
          <div className="qs-d2 bg-white border border-[#F1E6D8] rounded-3xl p-4 sm:p-5 mb-3.5 shadow-[0_10px_24px_rgba(43,33,24,0.06)] relative overflow-hidden">
            <div
              className={`absolute left-0 top-0 bottom-0 w-1.5 ${groupsAhead === 0 ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
            />

            <div className="flex items-center gap-3.5 sm:gap-4">
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${queueStatus.bgClass} flex items-center justify-center shrink-0 shadow-sm`}
              >
                <Activity className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[11px] sm:text-xs font-bold text-[#8A7F71] uppercase tracking-wider">
                  LIVE STATUS
                </div>
                <div className={`mt-0.5 text-lg sm:text-xl font-extrabold ${queueStatus.colorClass}`}>
                  {queueStatus.title}
                </div>
                <div className="mt-1 text-xs sm:text-sm text-gray-500 leading-normal">
                  {groupsAhead === 0
                    ? 'Please proceed towards the counter. Your table will be ready shortly.'
                    : groupsAhead == null
                      ? 'Your queue position is being updated.'
                      : `${groupsAhead} group${groupsAhead > 1 ? 's' : ''} ahead of you.`}
                </div>
              </div>
            </div>
          </div>

          {/* TRACK YOUR QUEUE CARD */}
          <div className="qs-d3 bg-white border border-[#F1E6D8] rounded-3xl p-4 sm:p-4.5 mb-3.5 shadow-[0_8px_20px_rgba(43,33,24,0.05)] flex items-center gap-3.5">
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-[#FFF5EB] to-[#FFE7C8] border border-[#F3DEC2] shadow-xs flex items-center justify-center shrink-0">
              <Bell className="w-6 h-6 text-[#F2793A]" />
            </div>

            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm sm:text-base font-bold text-[#2B2118]">
                Track your queue anytime
              </div>
              <div className="text-xs sm:text-sm text-gray-500 leading-snug mt-0.5">
                We'll notify you when your turn is approaching.
              </div>
            </div>
          </div>

          {/* ADVERTISEMENT */}
          <AdvertisementCarousel
            shopId={null}
            placement="shop_list"
          />

          {/* ACTIONS */}
          <div className="mt-4 pb-2">
            {error && (
              <p role="alert" className="mb-3 text-sm font-medium text-red-700">
                {error}
              </p>
            )}
            {!showCancelConfirm ? (
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full sm:flex-1 h-12 sm:h-13 border border-[#F3DEC2] rounded-2xl bg-white text-[#F2793A] text-sm sm:text-base font-bold cursor-pointer flex items-center justify-center gap-2 shadow-xs hover:bg-orange-50/50 active:scale-[0.99] transition-all duration-200"
                >
                  <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Browse Shops</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  className="w-full sm:flex-1 h-12 sm:h-13 border border-red-200 rounded-2xl bg-red-50/80 text-red-600 text-sm sm:text-base font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-xs hover:bg-red-100/80 active:scale-[0.99] transition-all duration-200"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Cancel my token</span>
                </button>
              </div>
            ) : (
              <div className="bg-white border border-[#F1E6D8] rounded-3xl p-4 sm:p-5 shadow-[0_8px_24px_rgba(0,0,0,0.1)]">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 mb-4 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-red-700 mb-0.5">
                      Cancel Queue?
                    </div>
                    <div className="text-xs sm:text-sm text-red-900 leading-relaxed">
                      Your current queue position will be lost and you'll need to join again.
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(false)}
                    disabled={canceling}
                    className="w-full sm:flex-1 h-11 border border-gray-200 rounded-xl bg-white text-gray-700 text-sm font-bold cursor-pointer disabled:cursor-not-allowed hover:bg-gray-50 active:scale-[0.98] transition-all duration-150"
                  >
                    Keep My Token
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelToken}
                    disabled={canceling}
                    className="w-full sm:flex-1 h-11 border-none rounded-xl bg-red-600 text-white text-sm font-bold cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 hover:bg-red-700 active:scale-[0.98] transition-all duration-150 flex items-center justify-center"
                  >
                    {canceling ? 'Canceling Queue...' : 'Cancel Queue'}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}