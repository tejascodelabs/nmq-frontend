import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getTokenByIdApi,
  cancelTokenApi,
} from "../api/token.api";
import {
  Check,
  Ticket,
  User,
  Users,
  Bell,
  BarChart3,
  Store,
  XCircle
} from 'lucide-react'
import backgroundImage from '../assets/background.png'
import { socket } from "../utils/socket"

export default function TokenConfirmed() {
  const navigate = useNavigate()
  const location = useLocation()

  const { state } = useLocation();
  const [token, setToken] = useState(state?.token || null);
  const [error, setError] = useState("");

  console.log("=================================",token)


  // Retrieve state passed from previous route or default props
  const shop = location.state?.shop || null
  const initialGroupsAhead = location.state?.groupsAhead ?? 0

  const [groupsAhead] = useState(initialGroupsAhead)
  const [cancelling, setCancelling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  useEffect(() => {
  const fetchToken = async () => {
    if (!state?.tokenId) {
      navigate("/", { replace: true });
      return;
    }

    try {
      setError("");

      const response = await getTokenByIdApi(
        state.tokenId
      );

      console.log("Token response:", response);

      const tokenData =
        response?.token || response?.data || response;

      if (!tokenData) {
        throw new Error("Token not found.");
      }

      setToken(tokenData);
    } catch (error) {
      console.error("Get token failed:", error);

      setError(
        error?.response?.data?.message ||
        error?.message ||
        "Token not found."
      );
    }
  };

  fetchToken();
}, [state?.tokenId, navigate]);

const handleCancelToken = async () => {
  if (!state?.tokenId) {
    setError("Token ID is missing.");
    return;
  }

  try {
    setCancelling(true);
    setError("");

    const response = await cancelTokenApi(
      state.tokenId,
      state.mobile
    );

    console.log("Cancel token response:", response);

    navigate("/shop-list", {
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
    setCancelling(false);
    setShowCancelConfirm(false);
  }
};

useEffect(() => {
  if (!state?.tokenId) return;

  const handleTokenCalled = (data) => {
    console.log("🔔 token:called received:", data);

    const calledToken = data?.token || data?.data?.token || data;
    const calledTokenId = calledToken?.id ?? data?.tokenId ?? data?.token_id;

    if (String(calledTokenId) === String(state.tokenId)) {
      navigate("/final-call", {
        state: {
          token: calledToken,
          tokenId: state.tokenId,
          mobile: state.mobile,
          shop,
        },
      });
    }
  };

  socket.on("token:called", handleTokenCalled);

  return () => {
    socket.off("token:called", handleTokenCalled);
  };
}, [state?.tokenId, state?.mobile, shop, navigate]);

  if (!token) {
    return null
  }

  return (
    <div
      className="min-h-screen w-full px-4 flex flex-col items-center bg-cover bg-center bg-no-repeat overflow-x-hidden font-sans antialiased"
      style={{
        backgroundImage: `url(${backgroundImage})`
      }}
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
          .token-ticket-card {
            animation: ticketPulseEntrance 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both, floatEffect 3.5s ease-in-out infinite 0.6s;
          }
        `}
      </style>

      {/* Main Container Wrapper */}
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl px-2 sm:px-4 flex flex-col items-center flex-1 pt-6 sm:pt-8 md:pt-10 pb-6">

        {/* Header Confirmation Section */}
        <div className="text-center mb-6">
          <div className="tc-tick-container w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Check className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 stroke-[3]" />
          </div>

          <h2 className="m-0 text-xl sm:text-2xl md:text-3xl font-extrabold text-[#2B2118] tracking-tight">
            Token Confirmed
          </h2>

          <p className="text-stone-500 mt-1.5 text-xs sm:text-sm font-medium">
            Your table reservation has been generated successfully
          </p>
        </div>

        {error && (
          <p role="alert" className="w-full mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {/* Physical Ticket Component */}
        <div className="token-ticket-card w-full bg-white rounded-3xl mb-4 border border-[#F1E6D8] shadow-md relative overflow-hidden">

          {/* Ticket Header Row */}
          <div className="p-4 sm:p-6 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 shrink-0">
              <Ticket className="w-5 h-5 sm:w-6 sm:h-6 text-[#F2793A]" />
              <span className="text-xl sm:text-2xl font-extrabold text-[#F2793A] tracking-tight">
                {token.queueType || 'Q'}-{token.tokenNo}
              </span>
            </div>

            <div className="w-px h-6 bg-[#F1E6D8] shrink-0 hidden sm:block" />

            <span className="flex-1 min-w-0 text-sm sm:text-base font-bold text-[#2B2118] truncate">
              {shop?.shopName || 'Shop Name'}
            </span>
          </div>

          {/* Ticket Cutout Divider */}
          <div className="relative flex items-center mx-4">
            <div className="absolute -left-6 w-4 h-4 rounded-full bg-[#FDF6EC] border-r border-[#F1E6D8] z-10" />
            <div className="flex-1 border-t border-dashed border-[#F1E6D8] h-0" />
            <div className="absolute -right-6 w-4 h-4 rounded-full bg-[#FDF6EC] border-l border-[#F1E6D8] z-10" />
          </div>

          {/* Ticket Details Grid */}
          <div className="p-4 sm:p-6 flex flex-wrap gap-4 justify-between">
            <div className="flex-1 min-w-[100px] flex flex-col items-center text-center gap-1">
              <User className="w-5 h-5 text-[#F2793A]" />
              <span className="text-xs font-medium text-stone-500">No. of Guests</span>
              <span className="text-sm sm:text-base font-bold text-[#2B2118]">
                {token.groupSize}
              </span>
            </div>

            <div className="flex-1 min-w-[100px] flex flex-col items-center text-center gap-1">
              <Users className="w-5 h-5 text-[#F2793A]" />
              <span className="text-xs font-medium text-stone-500">Groups Ahead</span>
              <span className="text-sm sm:text-base font-bold text-[#F2793A]">
                {groupsAhead === 0 ? "You're next!" : `${groupsAhead} ahead`}
              </span>
            </div>
          </div>
        </div>

        {/* Guidance Notification Banner */}
        <div className="w-full bg-[#FDF3DD] border border-[#F3E3B8] rounded-2xl p-3.5 sm:p-4 mb-5 flex items-start gap-2.5 text-[#8A7250] text-xs sm:text-sm font-normal leading-relaxed">
          <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-[#F2A83A] shrink-0 mt-0.5" />
          <p className="m-0 whitespace-pre-line">
            {`Track your queue status anytime.

We'll notify you when your turn is approaching.
If you've saved the app, you can reopen it anytime from your home screen.`}
          </p>
        </div>

        {/* Action Buttons Block */}
        <div className="w-full flex flex-col gap-2.5 mb-5">
          {/* Live Status Button */}
          {/* <button
            onClick={() => navigate('/queue-status')}
            className="w-full h-12 sm:h-13 rounded-xl bg-[#F2793A] text-white text-xs sm:text-sm font-bold tracking-wide cursor-pointer flex items-center justify-center gap-2 hover:bg-[#e06829] active:scale-98 transition-all shadow-sm"
          >
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>TRACK LIVE STATUS</span>
          </button> */}

          {/* Action Grid: Browse + Cancel */}
          <div className="flex flex-col sm:flex-row gap-2.5 w-full">
            <button
              onClick={() => navigate('/')}
              className="flex-1 h-12 sm:h-13 bg-white border border-[#F0B4A6] rounded-xl text-[#E4572E] text-xs sm:text-sm font-bold cursor-pointer flex items-center justify-center gap-2 hover:bg-orange-50 active:scale-98 transition-all"
            >
              <Store className="w-4 h-4 sm:w-5 sm:h-5 text-[#F2793A]" />
              <span>BROWSE SHOPS</span>
            </button>

            <div className="flex-1 flex">
              {!showCancelConfirm ? (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="w-full h-12 sm:h-13 bg-white border border-[#F0B4A6] rounded-xl text-[#E4572E] text-xs sm:text-sm font-bold cursor-pointer flex items-center justify-center gap-2 hover:bg-red-50 active:scale-98 transition-all"
                >
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#E4572E]" />
                  <span>CANCEL TOKEN</span>
                </button>
              ) : (
                <div className="w-full bg-orange-500/10 border border-orange-500/30 rounded-xl px-2 h-12 sm:h-13 flex items-center justify-center gap-2">
                  <button
                    onClick={handleCancelToken}
                    disabled={cancelling}
                    className="flex-1 bg-[#E4572E] text-white rounded-lg h-9 text-xs font-bold cursor-pointer hover:bg-red-700 active:scale-95 transition-all"
                  >
                    {cancelling ? '...' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    disabled={cancelling}
                    className="flex-1 bg-white text-[#2B2118] border border-[#F1E6D8] rounded-lg h-9 text-xs font-semibold cursor-pointer hover:bg-stone-50 active:scale-95 transition-all"
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