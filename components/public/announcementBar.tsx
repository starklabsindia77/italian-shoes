import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const AnnouncementBar: React.FC = () => {
  return (
    <div className="w-full" style={{ backgroundColor: '#ff5e0f', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
      <div className="max-w-[1140px] mx-auto px-4 py-2.5 flex items-center justify-center relative">

        <button
          className="absolute left-2 text-white/70 hover:text-white transition-colors"
          aria-label="Previous announcement"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <p
          className="text-center text-white flex items-center gap-2 select-none"
          style={{ fontSize: 13, letterSpacing: '0.5px', fontWeight: 400 }}
        >
          {/* Sun icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-[14px] h-[14px] flex-shrink-0 text-white"
            aria-hidden="true"
          >
            <path d="M12 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm0 16a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm9-7a1 1 0 010 2h-1a1 1 0 110-2h1zM4 11a1 1 0 010 2H3a1 1 0 110-2h1zm14.95-6.364a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0zM6.757 17.657a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0zM18.95 17.657a1 1 0 00-1.414 0l-.707.707a1 1 0 001.414 1.414l.707-.707a1 1 0 000-1.414zM6.757 6.343a1 1 0 00-1.414 0l-.707.707a1 1 0 001.414 1.414l.707-.707a1 1 0 000-1.414zM12 7a5 5 0 100 10A5 5 0 0012 7z" />
          </svg>

          {/* Main text */}
          <span>
            <span style={{ fontWeight: 700 }}>HOT SUMMER SALE</span>
            &nbsp;|&nbsp;Extra 10% OFF &ndash; Use code:&nbsp;
            <span
              style={{
                fontWeight: 800,
                letterSpacing: '1.5px',
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              HOT
            </span>
          </span>
        </p>

        <button
          className="absolute right-2 text-white/70 hover:text-white transition-colors"
          aria-label="Next announcement"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
};

export default AnnouncementBar;