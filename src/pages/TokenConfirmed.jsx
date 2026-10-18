import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import backgroundImage from '../assets/background.png'
import { cancelTokenApi, getTokenByIdApi } from '../api/token.api'

export default function TokenConfirmed() {
    const navigate = useNavigate()
    const location = useLocation()

    // Route state se data fetch karein ya fallback dummy data use karein
    const initialToken = location.state?.token || {
        id: 1,
        token_no: '05',
        queue_type: 'Q2',
        group_size: 3,
        status: 'active'
    }

    const [activeToken, setActiveToken] = useState(initialToken)
    const [shop] = useState(location.state?.shop || null)
    
    const [groupsAhead, setGroupsAhead] = useState(
        location.state?.groupsAhead ?? 2
    );
    const [estimatedWait, setEstimatedWait] = useState(
        location.state?.estimatedWait ?? 15
    );

    const [loading, setLoading] = useState(false)
    const [cancelling, setCancelling] = useState(false)
    const [showCancelConfirm, setShowCancelConfirm] = useState(false)
    const [error, setError] = useState('')

    const tokenId = activeToken?.id || location.state?.tokenId

    const tokenNumber = activeToken?.token_no ?? activeToken?.token_number ?? '05'
    const peopleCount = activeToken?.group_size ?? activeToken?.people_count ?? 3

    // Optional: Fetch latest token details if tokenId is present
    useEffect(() => {
        if (!tokenId) return

        let isActive = true

        const fetchToken = async () => {
            try {
                setLoading(true)
                setError('')

                const response = await getTokenByIdApi(tokenId)
                const fetchedToken =
                    response?.token ??
                    response?.data?.token ??
                    response?.data?.data?.token ??
                    response?.data ??
                    response

                if (fetchedToken?.id && isActive) {
                    setActiveToken(fetchedToken)
                }
            } catch (err) {
                console.error('Get token failed:', err)
                if (isActive) {
                    setError(
                        err?.response?.data?.message ||
                        err?.message ||
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
    }, [tokenId])

    // Cancel Token Handler Logic
    const handleCancelToken = async () => {
        if (!tokenId) {
            setError("Token ID is missing.");
            return;
        }

        try {
            setCancelling(true);
            setError("");

            await cancelTokenApi(
                tokenId,
                location.state?.mobile || activeToken?.mobile || localStorage.getItem('currentMobile')
            );

            navigate("/", {
                replace: true,
            });
        } catch (err) {
            console.error("Cancel token failed:", err);
            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Could not cancel token."
            );
        } finally {
            setCancelling(false);
            setShowCancelConfirm(false);
        }
    };

    return (
        <div
            className="min-h-screen w-full px-4 flex flex-col items-center bg-cover bg-center bg-no-repeat overflow-x-hidden box-border font-sans"
            style={{ backgroundImage: `url(${backgroundImage})` }}
        >
            <style>
                {`
          @keyframes scaleIn {
            0% { transform: scale(0); opacity: 0; }
            60% { transform: scale(1.15); }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes drawCheck {
            to { stroke-dashoffset: 0; }
          }
          @keyframes tcFadeUp {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes ticketPulseEntrance {
            0% { transform: scale(0.95); opacity: 0; }
            70% { transform: scale(1.02); opacity: 0.9; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes floatEffect {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
            100% { transform: translateY(0px); }
          }
          .tc-tick-container { animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; }
          .tc-svg-check { stroke-dasharray: 50; stroke-dashoffset: 50; animation: drawCheck 0.45s cubic-bezier(0.4, 0, 0.2, 1) 0.3s forwards; }
          .token-ticket-card { animation: ticketPulseEntrance 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both, floatEffect 3.5s ease-in-out infinite 0.6s; }
          .tc-d3 { animation: tcFadeUp .4s cubic-bezier(0.16, 1, 0.3, 1) .15s both; }
          .tc-d4 { animation: tcFadeUp .4s cubic-bezier(0.16, 1, 0.3, 1) .20s both; }
        `}
            </style>

            {/* Main Content Layout Block */}
            <div className="w-full max-w-[440px] px-4 flex flex-col items-center flex-1 pt-8 pb-5 box-border">

                {/* Header Confirmation Area */}
                <div className="text-center mb-6">
                    <div className="tc-tick-container w-16 h-16 rounded-full bg-[#E3F1FF] flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <svg
                            width="30"
                            height="30"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#2F80ED"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline className="tc-svg-check" points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>

                    <h2 className="m-0 text-2xl font-bold text-[#2B2118] tracking-tight">
                        Token Confirmed
                    </h2>

                    <p className="text-[#8A7F71] mt-1.5 text-sm font-normal">
                        Your table reservation has been generated successfully
                    </p>
                </div>

                {/* Error Banner if any */}
                {error && (
                    <div className="w-full bg-red-50 border border-red-200 rounded-2xl p-3 mb-4 text-red-600 font-bold text-xs sm:text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Unified Physical Premium Ticket-Style Card */}
                <div className="token-ticket-card w-full bg-white rounded-3xl mb-4 border border-[#F1E6D8] box-border shadow-xl relative overflow-hidden">

                    {/* Top Token + Shop Row */}
                    <div className="px-6 pt-5 pb-4 flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 shrink-0">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F2793A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                                <path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" />
                            </svg>
                            <span className="text-[22px] font-bold text-[#F2793A] tracking-tight">
                                {activeToken.queue_type || 'Q2'}-{tokenNumber}
                            </span>
                        </div>

                        <div className="w-[1px] self-stretch bg-[#F1E6D8] shrink-0" />

                        <span className="flex-1 min-w-0 text-[15px] font-bold text-[#2B2118] truncate">
                            {shop?.shopName || shop?.name || 'Shop Name'}
                        </span>
                    </div>

                    {/* Ticket Dashed Separator Line with structural side-cuts */}
                    <div className="relative flex items-center mx-4">
                        <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-[#FDF6EC] border-r border-[#F1E6D8] z-10" />
                        <div className="flex-1 border-t border-[#F1E6D8] h-0" />
                        <div className="absolute -right-[25px] w-4 h-4 rounded-full bg-[#FDF6EC] border-l border-[#F1E6D8] z-10" />
                    </div>

                    {/* Bottom 3-Column Stats Row */}
                    <div className="p-5 flex flex-wrap gap-3 justify-between">
                        <div className="flex-1 min-w-[100px] flex flex-col items-center text-center gap-1">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F2793A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                            </svg>
                            <span className="text-xs font-medium text-[#8A7F71]">No. of Guest</span>
                            <span className="text-[15px] font-bold text-[#2B2118]">
                                {peopleCount} {peopleCount === 1 ? 'Guest' : 'Guests'}
                            </span>
                        </div>

                        <div className="flex-1 min-w-[100px] flex flex-col items-center text-center gap-1">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F2793A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            <span className="text-xs font-medium text-[#8A7F71]">No. Groups Ahead</span>
                            <span className="text-[15px] font-bold text-[#F2793A]">
                                {groupsAhead === 0 ? "You're next!" : `${groupsAhead} ahead`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Informational Guidance Notification Banner */}
                <div className="tc-d3 w-full bg-[#FDF3DD] border border-[#F3E3B8] rounded-2xl p-3.5 mb-5 flex items-start gap-2.5 text-[#8A7250] text-xs font-normal leading-relaxed box-border shadow-xs">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F2A83A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                    </svg>
                    <p className="m-0 whitespace-pre-line">
                        {`Track your queue status anytime.

We'll notify you when your turn is approaching.
If you've saved the app, you can reopen it anytime from your home screen.`}
                    </p>
                </div>

                {/* Action Controls Module Block */}
                <div className="tc-d4 w-full flex flex-col gap-2.5 mb-5">
                    {/* View Live Status Button */}
                    <button
                        onClick={() => navigate('/queue-status', { state: { token: activeToken, shop, tokenId } })}
                        className="w-full h-12.5 border-none rounded-xl bg-[#F2793A] hover:bg-[#E06829] active:bg-[#D9631C] text-white text-sm font-bold tracking-wide cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                        TRACK LIVE STATUS
                    </button>

                    {/* Back to Home + Cancel Token Responsive Layout */}
                    <div className="flex flex-wrap gap-2.5 w-full">
                        <button
                            onClick={() => navigate('/shop-list')}
                            className="flex-1 min-w-40 h-12.5 bg-white border border-[#F0B4A6] rounded-xl text-[#E4572E] text-sm font-bold cursor-pointer flex items-center justify-center gap-2 box-border m-0 p-0 leading-none transition-all hover:bg-orange-50 active:bg-[#FDEEE0]"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F2793A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 9.5 12 3l9 6.5" /><path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" />
                            </svg>
                            BROWSE SHOPS
                        </button>

                        <div className="flex-1 min-w-40 flex">
                            {!showCancelConfirm ? (
                                <button
                                    onClick={() => setShowCancelConfirm(true)}
                                    className="w-full h-12.5 bg-white border border-[#F0B4A6] rounded-xl text-[#E4572E] text-sm font-bold cursor-pointer flex items-center justify-center gap-2 box-border m-0 p-0 leading-none transition-all hover:bg-red-50"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E4572E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="9" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                                    </svg>
                                    CANCEL TOKEN
                                </button>
                            ) : (
                                <div className="w-full bg-[rgba(228,87,46,0.06)] border border-[rgba(228,87,46,0.25)] rounded-xl px-1.5 text-center h-12.5 box-border flex flex-row items-center justify-center gap-1.5">
                                    <button
                                        onClick={handleCancelToken}
                                        disabled={cancelling}
                                        className="flex-1 bg-[#E4572E] hover:bg-[#D04924] text-white border-none rounded-lg h-[36px] text-xs font-semibold cursor-pointer transition-all"
                                    >
                                        {cancelling ? '...' : 'Cancel'}
                                    </button>
                                    <button
                                        onClick={() => setShowCancelConfirm(false)}
                                        disabled={cancelling}
                                        className="flex-1 bg-white text-[#2B2118] border border-[#F1E6D8] rounded-lg h-[36px] text-xs font-medium cursor-pointer transition-all hover:bg-gray-50"
                                    >
                                        Keep
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}