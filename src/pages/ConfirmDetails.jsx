import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Phone,
  User,
  Plus,
  Minus,
  AlertTriangle,
  Users,
  Info,
  CheckCircle2,
  RotateCw,
  Store
} from 'lucide-react'
import backgroundImage from '../assets/background.png'
import { createTokenApi } from "../api/token.api";
import { useEffect } from 'react';
import { getShopByIdApi } from '../api/shop.api';
import SimpleLoader from '../components/SimpleLoader';

export default function ConfirmDetails() {
  const navigate = useNavigate()
  const { id } = useParams();

  // Receive initial shop details passed via route state
  // const [shop] = useState(location.state?.shop || null)
  const [shop, setShop] = useState(null);
  const [shopLoading, setShopLoading] = useState(true);

  const [mobile, setMobile] = useState('')
  const [name, setName] = useState('')
  const [people, setPeople] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isQueuePaused = (shop?.status || '').toLowerCase() === 'paused'

  useEffect(() => {
    const fetchShop = async () => {
      if (!id) {
        setError("Invalid shop QR code.");
        setShopLoading(false);
        return;
      }

      try {
        setShopLoading(true);
        setError("");

        const response = await getShopByIdApi(id);

        console.log("Shop API Response:", response);

        const shopData = response?.shop || response?.data || response;

        if (!shopData?.id) {
          throw new Error("Shop not found.");
        }

        setShop(shopData);
      } catch (error) {
        console.error("Fetch shop failed:", error);

        setError(
          error?.response?.data?.message ||
          error?.message ||
          "Unable to fetch shop details."
        );

        setShop(null);
      } finally {
        setShopLoading(false);
      }
    };

    fetchShop();
  }, [id]);

  if (shopLoading) {
    return (
      <SimpleLoader fullScreen text="Fetching Shop..." />
    );
  }

  // If no shop data is present
  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f4ea] p-6 font-sans">
        <div className="max-w-sm w-full bg-white rounded-3xl p-7 text-center shadow-xl border border-orange-100">
          <div className="flex justify-center text-amber-500 mb-2">
            <AlertTriangle className="w-14 h-14" />
          </div>

          <h2 className="mt-3 text-2xl font-extrabold text-[#3b1d00]">
            Shop Not Found
          </h2>

          <p className="mt-3 text-gray-500 leading-relaxed text-sm">
            This QR code is invalid, expired, or unavailable. Please scan the QR code again.
          </p>

          <button
            onClick={() => navigate("/scan-qr")}
            className="w-full h-13 mt-6 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold shadow-md hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <RotateCw className="w-5 h-5" />
            <span>Scan QR Again</span>
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full h-13 mt-3 rounded-2xl border-2 border-orange-500 bg-white text-orange-600 font-bold hover:bg-orange-50 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Store className="w-5 h-5" />
            <span>Browse Shops</span>
          </button>
        </div>
      </div>
    )
  }

  const queueType =
    people <= 2 ? 'Q2' :
      people <= 4 ? 'Q4' :
        people <= 6 ? 'Q6' : 'Q8'

const handleContinue = async () => {
  if (loading) return;

  if (isQueuePaused) {
    setError("Queue is temporarily paused. Please try again later.");
    return;
  }

  setError("");

  // Mobile validation
  const trimmedMobile = mobile.trim();

  if (!trimmedMobile || !/^[6-9]\d{9}$/.test(trimmedMobile)) {
    setError("Enter a valid 10-digit mobile number");
    return;
  }

  // Name validation
  const trimmedName = name.trim();

  if (!trimmedName) {
    setError("Please enter your name");
    return;
  }

  // Shop validation
  if (!shop?.id) {
    setError("Shop information is missing.");
    return;
  }

  setLoading(true);

  try {
    const payload = {
      shopId: Number(shop.id),
      mobile: trimmedMobile,
      name: trimmedName,
      groupSize: Number(people),
      queueType: queueType.toUpperCase(),
    };

    console.log("Create Token Payload:", payload);

    const response = await createTokenApi(payload);

    console.log("Create Token Response:", response);

    const createdToken = response?.token;

    // Validate created token
    if (!createdToken?.id) {
      throw new Error("Token was not created.");
    }

    console.log("Created Token:", createdToken);

    // Navigate with token ID
    navigate("/queue-status", {
      state: {
        tokenId: createdToken.id,
        mobile: trimmedMobile,
        shop,
        token: createdToken,
      },
    });
  } catch (error) {
    console.error("Create token failed:", error);

    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Could not create token. Please try again.";

    setError(message);
  } finally {
    setLoading(false);
  }
};


  return (
    <div
      className="min-h-screen w-full bg-[#f8f4ea] bg-top bg-repeat-y font-sans pb-10 antialiased"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: '100% auto'
      }}
    >
      {/* Top Header Bar */}
      <div className="max-w-4xl mx-auto flex items-center justify-between p-4 sm:p-6">
        <button
          onClick={() => navigate(-1)}
          className="bg-transparent border-none text-[#6b4f26] text-sm sm:text-base font-bold cursor-pointer flex items-center gap-1.5 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="max-w-md sm:max-w-lg md:max-w-xl mx-auto px-4 sm:px-6">

        {/* Page Title */}
        <div className="text-center mb-6">
          <h1 className="m-0 text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#3b1d00] leading-tight">
            Confirm Details
          </h1>
          <p className="mt-1.5 text-[#6b4f26] text-xs sm:text-sm md:text-base leading-snug">
            Verify your details to instantly reserve your table track
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white/60 backdrop-blur-md rounded-3xl p-4 sm:p-6 shadow-xl border border-white/70">

          {/* Shop Highlight Card */}
          <div className="bg-white rounded-2xl p-3.5 mb-5 flex items-center shadow-sm border border-orange-100/50">
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-[#fcf7ec] bg-white shrink-0">
                <img
                  src={shop?.profileImage}
                  alt={shop?.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="min-w-0">
                <div className="text-base sm:text-lg md:text-xl font-extrabold text-[#2c1000] truncate leading-tight">
                  {shop.shopName}
                </div>

                <div
                  className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${isQueuePaused
                    ? 'bg-red-100 text-red-600'
                    : 'bg-emerald-100 text-emerald-700'
                    }`}
                >
                  {isQueuePaused ? '⏸ Paused' : '● Live Accepting'}
                </div>
              </div>
            </div>
          </div>

          {/* Form Inputs */}
          <div className="space-y-4">
            {/* Mobile Input */}
            <div>
              <label className="block mb-2 font-bold text-[#4a2500] text-xs sm:text-sm">
                Mobile Number
              </label>
              <div className="flex items-center bg-white rounded-2xl px-4 h-12 border border-[#e1d5c1] focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                <Phone className="w-5 h-5 text-gray-400 mr-2.5 shrink-0" />
                <input
                  type="tel"
                  value={mobile}
                  placeholder="Enter 10 digit number"
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full border-none outline-none text-sm sm:text-base font-semibold text-[#2c1000] bg-transparent placeholder-gray-400"
                />
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="block mb-2 font-bold text-[#4a2500] text-xs sm:text-sm">
                Your Name
              </label>
              <div className="flex items-center bg-white rounded-2xl px-4 h-12 border border-[#e1d5c1] focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                <User className="w-5 h-5 text-gray-400 mr-2.5 shrink-0" />
                <input
                  type="text"
                  value={name}
                  placeholder="Enter your name"
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border-none outline-none text-sm sm:text-base font-semibold text-[#2c1000] bg-transparent placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Guest Selector Counter */}
          <div className="mt-6 text-center">
            <label className="block font-extrabold text-[#3b1d00] mb-3 text-sm sm:text-base">
              Number of Guests
            </label>

            <div className="inline-block w-full max-w-xs">
              <div className="flex items-center justify-between bg-white px-2 py-1.5 rounded-2xl border border-[#e1d5c1] shadow-xs">
                <button
                  type="button"
                  onClick={() => setPeople((p) => Math.max(1, p - 1))}
                  className="w-10 h-10 rounded-xl bg-[#fcf7ec] text-orange-500 flex items-center justify-center font-bold cursor-pointer active:scale-90 transition-transform"
                  aria-label="Decrease guest count"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="text-xl font-extrabold text-[#2c1000] min-w-10 text-center">
                  {people}
                </span>
                <button
                  type="button"
                  onClick={() => setPeople((p) => Math.min(20, p + 1))}
                  className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold cursor-pointer active:scale-90 transition-transform"
                  aria-label="Increase guest count"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="mt-2.5 text-[#7c5c2e] text-xs sm:text-sm font-medium">
              You can add up to 20 people max
            </div>

            {people >= 7 && (
              <div className="mt-3 text-xs text-amber-800 bg-amber-50 rounded-xl p-2.5 font-semibold border border-amber-200">
                Groups of 7+ join the Q8 queue together
              </div>
            )}
          </div>

          {/* Queue Type Info */}
          {!error && (
            <div className="mt-5 bg-emerald-50 rounded-2xl p-3 flex items-center gap-2.5 border border-emerald-200">
              <Users className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs sm:text-sm font-bold text-emerald-800">
                You will join the <span className="underline">{queueType}</span> group queue
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-2xl p-3 text-red-600 font-bold text-xs sm:text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isQueuePaused && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center gap-2.5 text-red-600 font-bold text-xs sm:text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Queue is temporarily paused. Please try again later.</span>
            </div>
          )}

          {/* Actions */}
          <div className="mt-5">
            <button
              onClick={handleContinue}
              disabled={loading || isQueuePaused}
              className={`w-full h-13 rounded-2xl text-white font-bold text-base transition-all shadow-md flex items-center justify-center ${loading || isQueuePaused
                ? 'bg-gray-400 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:opacity-95 active:scale-95'
                }`}
            >
              {loading ? 'Reserving Position...' : isQueuePaused ? 'QUEUE PAUSED' : 'JOIN THE QUEUE'}
            </button>

            {/* Rules Block */}
            <div className="mt-5 bg-white p-4 rounded-2xl shadow-xs border border-amber-100/60">
              <div className="text-sm sm:text-base font-extrabold text-[#3b1d00] mb-3 flex items-center gap-1.5">
                <Info className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                <span>Queue Rules & Guidelines</span>
              </div>

              <div className="flex flex-col gap-2.5 text-gray-600 text-xs sm:text-sm font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>One active token per unique mobile registration.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Please stay near premises; turn on push warnings.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Token automatically expires if context call is skipped.</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}