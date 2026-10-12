import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { 
  ArrowLeft, 
  Camera, 
  Lightbulb, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react'

// Original asset imports preserved
import backgroundImage from '../assets/background.png'
import misalBanner from '../assets/misal-shop-banner.png'

export default function ScanQRCode() {
  const navigate = useNavigate()
  const scannerRef = useRef(null)

  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(true)

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const size = Math.min(viewfinderWidth, viewfinderHeight) * 0.85
          return { width: size, height: size }
        }
      },
      async (decodedText) => {
        if (!scanning) return
        setScanning(false)

        try {
          if (scannerRef.current?.isScanning) {
            await scannerRef.current.stop()
          }
        } catch (e) {
          // Scanner stop error suppression
        }

        scannerRef.current = null

        // Pass decoded QR data to the confirmation route or state handler
        if (!decodedText) {
          setError('Invalid QR code scanned')
          setScanning(true)
          return
        }

        navigate('/details', {
          state: { qrData: decodedText },
          replace: true
        })
      },
      () => {}
    )

    return () => {
      try {
        if (scannerRef.current?.isScanning) {
          scannerRef.current.stop().catch(() => {})
        }
      } catch (e) {
        // Cleanup error suppression
      }
    }
  }, [navigate, scanning])

  return (
    <div
      className="min-h-screen w-full bg-[#f8f4ea] bg-top bg-repeat-y font-sans pb-8 antialiased"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: '100% auto'
      }}
    >
      <style>
        {`
          @keyframes scanLineMove {
            0% { top: 6%; }
            50% { top: 92%; }
            100% { top: 6%; }
          }
          .animate-scan-line {
            animation: scanLineMove 2.4s ease-in-out infinite;
          }
          #qr-reader video {
            object-fit: cover !important;
            width: 100% !important;
            height: 100% !important;
            border-radius: 1.5rem !important;
          }
        `}
      </style>

      {/* Main Responsive Wrapper */}
      <div className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto overflow-hidden relative px-4 sm:px-6">
        
        {/* Top Header Controls */}
        <div className="relative pt-4 sm:pt-6 z-10 flex items-center justify-between">
          <button
            onClick={() => navigate('/shops')}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white text-orange-600 shadow-md flex items-center justify-center hover:bg-orange-50 active:scale-95 transition-all"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>

          {/* Banner Graphic */}
          <img
            src={misalBanner}
            alt=""
            className="absolute -right-6 -top-4 w-1/2 max-w-[140px] sm:max-w-[180px] lg:max-w-[200px] pointer-events-none -z-10"
          />
        </div>

        {/* Title Section */}
        <div className="text-center py-5 sm:py-7">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#4a1d00] leading-tight tracking-tight">
            Scan QR
          </h1>
          <p className="mt-2 text-gray-600 text-sm sm:text-base md:text-lg max-w-xs sm:max-w-sm md:max-w-md mx-auto leading-relaxed">
            Point your camera at the shop QR code to instantly receive your queue token.
          </p>
        </div>

        {/* QR Scanner Area */}
        <div className="px-1 sm:px-3">
          <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-lg border border-orange-100 transition-all duration-300">
            <div className="relative">
              <div
                id="qr-reader"
                className="w-full max-w-[420px] mx-auto aspect-square overflow-hidden rounded-3xl bg-transparent relative"
              />
              
              {/* Laser Scan Line */}
              <div className="absolute left-[4%] right-[4%] h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-scan-line pointer-events-none" />
            </div>

            <div className="mt-4 text-center text-gray-700 text-sm sm:text-base font-medium flex items-center justify-center gap-2">
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
              <span>Align the QR code within the frame</span>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 text-red-600 rounded-xl p-3 font-semibold text-xs sm:text-sm text-center flex items-center justify-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tips Box */}
        <div className="pt-5 sm:pt-6">
          <div className="bg-[#fff8ef] rounded-3xl p-5 sm:p-6 border border-[#fde2c3] shadow-sm">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-[#8b2c00] leading-snug">
                Tips for Better Scanning
              </h2>
            </div>

            <div className="my-4 border-t-2 border-dashed border-[#f7d2b4]" />

            <div className="flex flex-col gap-3 text-gray-700 text-xs sm:text-sm md:text-base">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
                <span>Ensure good lighting</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
                <span>Hold camera steady</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
                <span>Keep QR code centered inside the frame</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}