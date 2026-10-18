import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdvertisementCarousel from '../components/AdvertisementCarousel'
import api from '../api/axios' // Apne axios instance ka sahi path yahan check kar lein

export default function CheckToken() {
  const navigate = useNavigate()

  const [mobile, setMobile] = useState('')
  const [error, setError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(false)

  const mobileRegex = /^[6-9]\d{9}$/
  const isValidMobile = mobileRegex.test(mobile)

  const handleCheck = async () => {
    if (loading) return

    setError('')
    setInfoMessage('')
    setNotFound(false)

    if (!mobile.trim()) {
      return setError('Please enter your mobile number')
    }
    if (!mobileRegex.test(mobile.trim())) {
      return setError('Enter a valid 10-digit mobile number')
    }

    try {
      setLoading(true)
      
      // Real Backend API Call
      const response = await api.get(`/tokens/checkmytoken?mobile=${mobile.trim()}`)
      const data = response.data

      if (!data.success || !data.tokens || data.tokens.length === 0) {
        setNotFound(true)
        return
      }

      // Latest active token ko pick karna (agar multiple ho toh pehla wala)
      const token = data.tokens[0]

      // LocalStorage mein token data save karna
      localStorage.setItem("currentTokenId", token.id)
      localStorage.setItem("currentMobile", token.mobile)
      localStorage.setItem("currentShop", JSON.stringify({ shopId: token.shopId, shopName: token.shopName || "Queue Shop" }))

      // Status ke mutabiq navigation ya message show karna
      if (token.status === 'waiting') {
        navigate('/queue-status')
      } else if (token.status === 'called') {
        navigate('/final-call', { state: { token, tokenId: token.id, mobile: token.mobile } })
      } else if (token.status === 'serving') {
        setInfoMessage('✅ You have already received your table. Please enjoy your meal!')
        return
      } else if (token.status === 'completed') {
        setInfoMessage('✅ Your visit has been completed. Thank you for dining with us!')
        return
      } else {
        navigate('/queue-status')
      }

    } catch (err) {
      console.error(err)
      if (err.response && err.response.status === 404) {
        setNotFound(true)
      } else {
        setError(err.response?.data?.message || 'Unable to connect. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-white pb-8 box-border font-sans">
      <div className="max-w-[480px] mx-auto px-4 box-border">

        {/* Back Button */}
        <button
          onClick={() => navigate('/shop-list')}
          className="bg-transparent border-none cursor-pointer text-base sm:text-lg font-semibold text-amber-800 mb-3 flex items-center gap-1 hover:underline"
        >
          ← Browse Shops
        </button>

        {/* Heading & Subtitle */}
        <div className="text-center mb-9">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-amber-900 m-0 mb-2 tracking-tight">
            Check My Token
          </h1>
          <p className="text-sm sm:text-base text-gray-500 leading-relaxed m-0">
            Track your live queue using <br /> your registered mobile number.
          </p>
        </div>

        {/* Advertisement Carousel */}
        <div className="mb-6">
          <AdvertisementCarousel
            shopId={null}
            placement="check_token"
          />
        </div>

        {/* Main Card Container */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 box-border relative animate-fade-in">

          {/* Mobile Input Field */}
          <div className="mb-4">
            <label className="block mb-1.5 text-sm font-semibold text-gray-700">
              Mobile Number <span className="text-red-600">*</span>
            </label>

            <div className="flex relative items-center">
              <div className="flex items-center h-11 px-3 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-sm sm:text-base text-gray-700 select-none whitespace-nowrap">
                🇮🇳 +91 <span className="text-gray-300 ml-1">|</span>
              </div>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))
                  setError('')
                  setInfoMessage('')
                  setNotFound(false)
                }}
                placeholder="Enter 10-digit number"
                className="flex-1 h-11 px-3.5 rounded-r-xl border border-gray-300 text-sm sm:text-base outline-none box-border w-full transition-colors focus:border-orange-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading) {
                    handleCheck()
                  }
                }}
              />
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-3.5 text-sm font-semibold">
              ⚠ {error}
            </div>
          )}

          {/* Info Message Alert */}
          {infoMessage && (
            <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-xl mb-3.5 text-sm font-semibold">
              {infoMessage}
            </div>
          )}

          {/* Not Found Box */}
          {notFound && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-4 text-center">
              <div className="text-5xl mb-2.5">😔</div>
              <div className="font-bold text-lg text-amber-900 mb-2.5">
                No Active Token Found
              </div>
              <div className="text-xs sm:text-sm text-gray-500 mb-4 leading-relaxed">
                Looks like you don't have an active queue today.
                <br />
                Browse nearby shops and join instantly.
              </div>
              <button
                type="button"
                onClick={() => navigate('/shop-list')}
                className="w-full h-11 bg-white border-2 border-orange-500 text-orange-600 rounded-xl font-bold text-sm cursor-pointer hover:bg-orange-50 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                🍽 Browse Shops
              </button>
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-5">
            <button
              type="button"
              onClick={handleCheck}
              disabled={!isValidMobile || loading}
              className={`w-full h-12 bg-orange-500 text-white rounded-xl font-bold text-sm sm:text-base cursor-pointer shadow-md transition-all flex items-center justify-center gap-2 ${(!isValidMobile || loading) ? 'opacity-70 cursor-not-allowed' : 'hover:bg-orange-600 active:scale-[0.98]'
                }`}
            >
              {loading ? '⏳ Checking Token...' : 'CHECK STATUS →'}
            </button>
          </div>

          {/* Privacy Note */}
          <div className="mt-6 bg-gray-50 border border-gray-100 p-3.5 rounded-xl text-gray-500 text-xs leading-relaxed text-center">
            🔒 Your phone data is strictly mapped to active counter tokens only.
          </div>

        </div>
      </div>
    </div>
  )
}