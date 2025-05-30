
import React from 'react';

export const ApiKeyBanner: React.FC = () => {
  const [isVisible, setIsVisible] = React.useState(true);

  if (!isVisible) {
    return null;
  }

  const apiKeyMissing = typeof process === 'undefined' || typeof process.env === 'undefined' || !process.env.API_KEY;

  const baseCardStyles = "rounded-lg shadow-xl p-3 text-sm text-center mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-6 lg:mb-8"; // Added container/spacing styles

  const informationalStyles = "bg-[#101827] shadow-[#156464]/30 border border-[#15adad]/60 text-[#e0ffff]";
  const errorStyles = "bg-red-900/50 shadow-red-500/30 border border-red-500/80 text-red-200";


  return (
    <div className={`${baseCardStyles} ${apiKeyMissing ? errorStyles : informationalStyles} transition-opacity duration-300`}>
      <div className="max-w-4xl mx-auto flex items-center justify-between"> {/* Kept inner container for content alignment */}
        <span className="text-left">
          {apiKeyMissing 
            ? "⚠️ Gemini API Key (API_KEY) not detected in environment. Please configure it to use the review functionality."
            : "ℹ️ This application uses the Gemini API. Ensure your API_KEY environment variable is correctly configured."
          }
        </span>
        <button 
          onClick={() => setIsVisible(false)} 
          className={`ml-4 p-1 rounded-full hover:bg-black/20 focus:outline-none focus:ring-1 ${apiKeyMissing ? 'focus:ring-red-400' : 'focus:ring-[#15adad]'}`}
          aria-label="Dismiss API key notice"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 ${apiKeyMissing ? 'text-red-200 hover:text-red-100' : 'text-[#15fafa] hover:text-[#30ffff]'}`}
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