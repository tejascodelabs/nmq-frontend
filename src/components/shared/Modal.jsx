import React, { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children }) {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity animate-fadeIn">
      {/* BACKDROP CLICK CLOSES MODAL */}
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      {/* MODAL CARD */}
      <div className="relative w-full max-w-md bg-[#fffdf9] border border-[#e7dfd5] rounded-2xl shadow-xl overflow-hidden z-10 transition-all">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e7dfd5] bg-[#f8f5ef]">
          <h3 className="text-base font-bold font-serif text-[#2f211b] m-0">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#7d7067] hover:text-[#2f211b] hover:bg-[#eae2d8] text-base font-bold transition-colors border-none bg-transparent cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}