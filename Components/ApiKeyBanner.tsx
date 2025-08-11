import React from 'react';

export const ApiKeyBanner = () => {
  const apiKeyMissing = typeof process === 'undefined' || typeof process.env === 'undefined' || !process.env.API_KEY;

  if (!apiKeyMissing) {
    return null;
  }

  const baseCardStyles = "hud-container text-sm text-center mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-6 lg:mb-8";
  const errorStyles = "border-[var(--red-color)] text-[var(--red-color)]";

  return (
    <div className={`${baseCardStyles} ${errorStyles} transition-opacity duration-300 relative`}>
      <div className="hud-corner corner-top-left"></div>
      <div className="hud-corner corner-top-right"></div>
      <div className="hud-corner corner-bottom-left"></div>
      <div className="hud-corner corner-bottom-right"></div>
      <div className="max-w-4xl mx-auto flex items-center justify-center">
        <span className="text-left uppercase tracking-widest">
          ATTN: GEMINI API KEY (API_KEY) NOT DETECTED IN ENVIRONMENT.
        </span>
      </div>
    </div>
  );
};