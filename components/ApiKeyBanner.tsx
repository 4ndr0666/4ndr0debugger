

import React from 'react';

export const ApiKeyBanner = () => {
  const [isVisible, setIsVisible] = React.useState(true);

  if (!isVisible) {
    return null;
  }

  const apiKeyMissing = typeof process === 'undefined' || typeof process.env === 'undefined' || !process.env.API_KEY;

  const baseCardStyles = "hud-container text-sm text-center mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-6 lg:mb-8";

  const informationalStyles = "border-[var(--hud-color-darker)] text-[var(--hud-color)]";
  const errorStyles = "border-[var(--red-color)] text-[var(--red-color)]";


  return (
    <div className={`${baseCardStyles} ${apiKeyMissing ? errorStyles : informationalStyles} transition-opacity duration-300 relative`}>
      <div className="hud-corner corner-top-left"></div>
      <div className="hud-corner corner-top-right"></div>
      <div className="hud-corner corner-bottom-left"></div>
      <div className="hud-corner corner-bottom-right"></div>
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <span className="text-left uppercase tracking-widest">
          {apiKeyMissing 
            ? "ATTN: GEMINI API KEY (API_KEY) NOT DETECTED IN ENVIRONMENT."
            : "SYSTEM ONLINE: CONNECTED TO https://4ndr0666.github.io/4ndr0site"
          }
        </span>
        <button 
          onClick={() => setIsVisible(false)} 
          className={`ml-4 p-1 rounded-full hover:bg-black/20 focus:outline-none focus:ring-1 ${apiKeyMissing ? 'focus:ring-[var(--red-color)]' : 'focus:ring-[var(--hud-color)]'}`}
          aria-label="Dismiss API key notice"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 ${apiKeyMissing ? 'text-[var(--red-color)]' : 'text-[var(--hud-color)]'}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};