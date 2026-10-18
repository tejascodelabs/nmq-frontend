import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ClipboardList,
  Clock,
  Timer,
  Users,
  Star,
  BadgeCheck,
  Home,
  Megaphone,
} from 'lucide-react'
import AdvertisementCarousel from '../components/AdvertisementCarousel'

const API_BASE_URL = import.meta.env.VITE_API_URL

// Dummy feedback options
const FEEDBACK_OPTIONS = [
  'Easy Booking',
  'Smooth Queue',
  'Friendly Staff',
  'Fast Service',
  'Clean Restaurant',
]

// Rating level descriptors
const RATING_LABELS = [
  '',
  '⭐ Poor Experience',
  '⭐⭐ Fair Experience',
  '⭐⭐⭐ Good Experience',
  '⭐⭐⭐⭐ Very Good',
  '⭐⭐⭐⭐⭐ Excellent!',
]

export default function CustomerArrived() {
  const navigate = useNavigate()
  const location = useLocation()
  const activeToken = location.state?.token || null

  const [rating, setRating] = useState(0)
  const [likedOptions, setLikedOptions] = useState([])
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!activeToken) navigate('/', { replace: true })
  }, [activeToken, navigate])

  if (!activeToken) return null

  const visitSummary = {
    totalWait: '-',
    arrivalTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    peopleAhead: '0',
  }

  // Token number display string
  const tokenDisplay = activeToken
    ? `${activeToken.queueType || activeToken.queue_type}-${activeToken.tokenNo || activeToken.token_no}`
    : '--'

  const handleBrowseShops = () => {
    navigate('/shop-list')
  }

  const toggleOption = (option) => {
    setLikedOptions((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option]
    )
  }

  // Handle feedback form submission with backend API integration
  const handleSubmitFeedback = async () => {
    if (submitted || submitting) return

    if (rating === 0 && likedOptions.length === 0 && feedback.trim() === '') {
      alert('Please share at least one feedback before submitting.')
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        shopId: activeToken.shopId || activeToken.shop_id,
        tokenId: activeToken.id,
        customerName: activeToken.name || activeToken.customer_name || 'Guest',
        mobile: activeToken.mobile || activeToken.phone || '',
        rating: rating > 0 ? rating : null,
        likedOptions,
        feedbackText: feedback.trim() || null,
      }

      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to submit feedback')
      }

      setSubmitted(true)
    } catch (error) {
      console.error('Feedback submission error:', error)
      alert(error.message || 'Could not submit feedback. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const getCharCountColor = () => {
    if (feedback.length > 260) return 'text-red-600'
    if (feedback.length > 200) return 'text-amber-600'
    return 'text-emerald-600'
  }

  return (
    <div className="relative min-h-screen w-full bg-[#F8F4EA] px-4 py-8 sm:px-6 sm:py-10 flex justify-center items-center overflow-x-hidden font-sans">
      <div className="w-full max-w-md text-center z-10">
        {!submitted ? (
          <>
            <div className="relative w-28 h-20 mx-auto mb-2">
              <div className="absolute left-1/2 -top-2.5 -translate-x-1/2 w-20 h-20 rounded-full bg-emerald-500/10 shadow-[0_0_50px_rgba(34,197,94,0.18)]" />
              <div className="arr-tick absolute left-1/2 top-0 -translate-x-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <BadgeCheck className="w-10 h-10 stroke-[2.5]" />
              </div>
            </div>

            <h1 className="arr-d1 text-gray-900 font-extrabold text-3xl sm:text-4xl mb-3">
              Welcome Back,{' '}
              <span className="text-orange-600">
                {activeToken?.name || activeToken?.customer_name || 'Guest'}
              </span>
            </h1>

            <p className="arr-d1 text-gray-500 text-base leading-relaxed m-0">
              Thank you for choosing us.
              <br />
              You're all set.
              <br />
              Enjoy your meal!
            </p>

            <div className="arr-d2 bg-white rounded-2xl p-5 border border-[#F3E5D0] shadow-sm flex flex-col mt-6">
              <div className="text-xs font-bold text-[#8A7F71] mb-4 uppercase tracking-wider text-center">
                Your Queue Token
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-orange-600/30">
                  <ClipboardList className="w-7 h-7 stroke-[2.3]" />
                </div>

                <div className="flex-1 text-left">
                  <div className="text-xs text-[#8A7F71] font-semibold mb-1">
                    TOKEN NUMBER
                  </div>
                  <div className="text-3xl sm:text-4xl tracking-wide font-black text-[#2B2118]">
                    {tokenDisplay}
                  </div>
                </div>

                <div className="w-px self-stretch bg-[#ECE2D3] my-1" />

                <div className="flex flex-col text-left">
                  <div className="text-xs text-[#8A7F71]">Guests</div>
                  <div className="text-sm font-bold text-[#2B2118] whitespace-nowrap">
                    {activeToken?.groupSize || activeToken?.group_size || 1} People
                  </div>
                </div>
              </div>
            </div>

            <div className="arr-d3 bg-[#F0F9EE] rounded-2xl border border-[#DCEFD6] overflow-hidden mt-5">
              <div className="flex items-center gap-2 px-4 py-3.5 border-b border-[#DCEFD6]">
                <ClipboardList className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-800">
                  Today's Visit Summary
                </span>
              </div>

              <div className="grid grid-cols-3 py-5 px-3 text-center">
                <div className="relative px-2 border-r border-[#DCEFD6]">
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center mx-auto mb-2.5 shadow-sm">
                    <Clock className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xs text-[#557C4E]">Total Wait</div>
                  <div className="text-base font-extrabold text-gray-800 mt-0.5">
                    {visitSummary.totalWait === '-'
                      ? '-'
                      : `${visitSummary.totalWait} mins`}
                  </div>
                </div>

                <div className="relative px-2 border-r border-[#DCEFD6]">
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center mx-auto mb-2.5 shadow-sm">
                    <Timer className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xs text-[#557C4E]">Arrived At</div>
                  <div className="text-base font-extrabold text-gray-800 mt-0.5">
                    {visitSummary.arrivalTime}
                  </div>
                </div>

                <div className="px-2">
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center mx-auto mb-2.5 shadow-sm">
                    <Users className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xs text-[#557C4E]">Queue Ahead</div>
                  <div className="text-base font-extrabold text-gray-800 mt-0.5">
                    {visitSummary.peopleAhead}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-1">
              <AdvertisementCarousel
                shopId={null}
                placement="arrived"
              />
            </div>


            <div className="arr-d3 bg-white rounded-2xl p-5 border border-[#F3E5D0] shadow-sm mt-5">
              <h3 className="m-0 text-gray-900 text-lg font-bold">
                Rate Your Experience
              </h3>
              <p className="text-[#8A7F71] text-sm mt-0.5 mb-3">
                How was your queue experience today?
              </p>

              <div className="flex justify-center items-center gap-3 min-h-12">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-0 border-none bg-transparent cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-90"
                  >
                    <Star
                      className={`w-9 h-9 ${rating >= star
                          ? 'fill-amber-400 text-amber-300'
                          : 'fill-transparent text-amber-300'
                        }`}
                    />
                  </button>
                ))}
              </div>

              <div className="mt-4 text-sm font-bold text-gray-700 min-h-5.5">
                {RATING_LABELS[rating]}
              </div>
            </div>

            <div className="arr-d3 bg-white rounded-2xl p-5 border border-[#F3E5D0] shadow-sm mt-5 text-left">
              <h3 className="m-0 text-gray-900 text-lg font-bold text-center">
                What did you like?
              </h3>
              <p className="text-[#8A7F71] text-sm text-center mt-1 mb-4">
                Select all that apply
              </p>

              <div className="flex flex-wrap gap-2.5 justify-center">
                {FEEDBACK_OPTIONS.map((option) => {
                  const selected = likedOptions.includes(option)
                  return (
                    <button
                      type="button"
                      key={option}
                      onClick={() => toggleOption(option)}
                      className={`px-3.5 py-2.5 rounded-full text-xs font-semibold border transition-all duration-200 ${selected
                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:-translate-y-0.5 shadow-none'
                        }`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="arr-d3 bg-white rounded-2xl p-5 border border-[#F3E5D0] shadow-sm mt-5 text-left">
              <h3 className="m-0 text-gray-900 text-lg font-bold text-center">
                Anything else you'd like to tell us?
              </h3>
              <p className="text-[#8A7F71] text-sm text-center mt-1 mb-4">
                Your feedback helps us improve our service.
              </p>

              <textarea
                value={feedback}
                onChange={(e) => {
                  if (e.target.value.length <= 300) {
                    setFeedback(e.target.value)
                  }
                }}
                placeholder="Share your experience or suggestions..."
                className="w-full min-h-[110px] resize-none border border-gray-200 rounded-xl p-4 text-sm bg-gray-50 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all font-sans"
              />

              <div
                className={`mt-2 text-right text-xs font-semibold ${getCharCountColor()}`}
              >
                {300 - feedback.length} characters remaining
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-4 shadow-md mt-5 flex items-center justify-between">
              <div className="flex items-center gap-3 text-left">
                <Megaphone className="w-6 h-6 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Special Offer!</h4>
                  <p className="text-xs text-amber-100">Get 15% off on your next visit dessert.</p>
                </div>
              </div>
              <span className="text-xs font-extrabold bg-white text-orange-600 px-3 py-1.5 rounded-lg shrink-0">
                CLAIM
              </span>
            </div>

            <button
              type="button"
              onClick={handleSubmitFeedback}
              disabled={submitting}
              className={`w-full mt-5 h-14 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-base shadow-lg shadow-emerald-600/25 transition-all ${submitting
                  ? 'opacity-75 cursor-not-allowed'
                  : 'hover:-translate-y-0.5 active:scale-95 cursor-pointer'
                }`}
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </>
        ) : (
          <div className="min-h-[75vh] flex flex-col justify-center items-center py-8">
            <div className="thank-you-pop w-24 h-24 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30 mb-6">
              <BadgeCheck className="w-14 h-14 stroke-[2.5]" />
            </div>

            <div className="arr-d3 w-full bg-gradient-to-b from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-3xl p-8 text-center shadow-lg shadow-emerald-600/10">
              <div className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest mb-2">
                Feedback Received
              </div>

              <h1 className="m-0 text-emerald-900 text-3xl sm:text-4xl font-extrabold">
                Thank You!
              </h1>

              <p className="mt-4 text-gray-600 text-base leading-relaxed">
                Your feedback has been submitted.
                <br />
                <br />
                It helps us improve the queue experience.
                <br />
                <br />
                We appreciate your time.
              </p>
            </div>

            <button
              type="button"
              onClick={handleBrowseShops}
              className="w-full h-14 mt-6 flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-extrabold text-lg shadow-lg shadow-orange-600/30 transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer animate-pulse"
            >
              <Home className="w-5 h-5 stroke-[2.4]" />
              <span>Browse Shops</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}