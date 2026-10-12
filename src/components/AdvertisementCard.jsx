// import React, { useState } from 'react'
// import { ImageOff, ExternalLink } from 'lucide-react'
// import {
//   recordAdvertisementImpressionApi,
//   recordAdvertisementClickApi,
// } from "../api/advertisements.api";

// export function AdvertisementCard({ advertisement, onClick }) {
//   const [loaded, setLoaded] = useState(false)
//   const [error, setError] = useState(false)

//   if (!advertisement) return null

//   const handleClick = () => {
//     if (onClick) onClick()

//     if (advertisement.redirect_url) {
//       window.open(
//         advertisement.redirect_url,
//         '_blank',
//         'noopener,noreferrer'
//       )
//     }
//   }

//   return (
//     <div
//       onClick={handleClick}
//       className={`group relative w-full aspect-[8/3] overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-amber-100/60 shadow-md hover:shadow-lg transition-all duration-300 ease-out active:scale-[0.985] ${
//         advertisement.redirect_url ? 'cursor-pointer' : 'cursor-default'
//       }`}
//     >
//       {/* Loading Skeleton */}
//       {!loaded && !error && (
//         <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-pulse" />
//       )}

//       {/* Image Error Fallback */}
//       {error ? (
//         <div className="w-full h-full flex flex-col justify-center items-center bg-gray-50 text-gray-400 gap-2 p-4">
//           <ImageOff className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300" />
//           <span className="text-xs sm:text-sm font-medium">
//             Advertisement unavailable
//           </span>
//         </div>
//       ) : (
//         <img
//           src={advertisement.image_url}
//           alt={advertisement.event_title || 'Advertisement'}
//           loading="lazy"
//           draggable={false}
//           onLoad={() => setLoaded(true)}
//           onError={() => setError(true)}
//           className={`w-full h-full object-cover transition-opacity duration-300 select-none ${
//             loaded ? 'opacity-100' : 'opacity-0'
//           }`}
//         />
//       )}

//       {/* CTA Button */}
//       {advertisement.cta_text && advertisement.redirect_url && (
//         <div className="absolute right-3 bottom-3 sm:right-4 sm:bottom-4 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/90 backdrop-blur-md text-[#E65100] text-xs sm:text-sm font-bold shadow-md border border-white/80 pointer-events-none flex items-center gap-1 group-hover:bg-white transition-colors">
//           <span>{advertisement.cta_text}</span>
//           <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
//         </div>
//       )}
//     </div>
//   )
// }


import React, { useEffect, useState } from "react";
import { ImageOff, ExternalLink } from "lucide-react";
import {
  recordAdvertisementImpressionApi,
  recordAdvertisementClickApi,
} from "../api/advertisements.api";

export function AdvertisementCard({ advertisement, onClick }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Prevent duplicate impression
  const [impressionRecorded, setImpressionRecorded] = useState(false);

  if (!advertisement) return null;

  const advertisementId = advertisement.id;

  const recordImpression = async () => {
    if (!advertisementId || impressionRecorded) return;

    try {
      await recordAdvertisementImpressionApi(advertisementId);
      setImpressionRecorded(true);
    } catch (error) {
      console.error("Failed to record advertisement impression:", error);
    }
  };

  const handleClick = async () => {
    // Record click
    if (advertisementId) {
      try {
        await recordAdvertisementClickApi(advertisementId);
      } catch (error) {
        console.error("Failed to record advertisement click:", error);
      }
    }

    // Parent callback
    if (onClick) {
      onClick();
    }

    // Redirect
    if (advertisement.redirect_url) {
      window.open(
        advertisement.redirect_url,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative w-full aspect-[8/3] overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-amber-100/60 shadow-md hover:shadow-lg transition-all duration-300 ease-out active:scale-[0.985] ${
        advertisement.redirect_url
          ? "cursor-pointer"
          : "cursor-default"
      }`}
    >
      {/* Loading Skeleton */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-pulse" />
      )}

      {/* Image */}
      {error ? (
        <div className="w-full h-full flex flex-col justify-center items-center bg-gray-50 text-gray-400 gap-2 p-4">
          <ImageOff className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300" />

          <span className="text-xs sm:text-sm font-medium">
            Advertisement unavailable
          </span>
        </div>
      ) : (
        <img
          src={advertisement.image_url}
          alt={advertisement.event_title || "Advertisement"}
          loading="lazy"
          draggable={false}
          onLoad={() => {
            setLoaded(true);

            // Image loaded = impression
            recordImpression();
          }}
          onError={() => setError(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 select-none ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* CTA */}
      {advertisement.cta_text && advertisement.redirect_url && (
        <div className="absolute right-3 bottom-3 sm:right-4 sm:bottom-4 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/90 backdrop-blur-md text-[#E65100] text-xs sm:text-sm font-bold shadow-md border border-white/80 pointer-events-none flex items-center gap-1 group-hover:bg-white transition-colors">
          <span>{advertisement.cta_text}</span>

          <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
      )}
    </div>
  );
}