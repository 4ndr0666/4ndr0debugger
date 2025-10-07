import React, { useState } from 'react';
import { Button } from './Button.tsx';
import { useSessionContext } from '../contexts/SessionContext.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';

interface ThreatVectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThreatVectorModal: React.FC<ThreatVectorModalProps> = ({ isOpen, onClose }) => {
  const { 
    isGeneratingThreatVector, 
    threatVectorReport, 
    handleThreatVectorAnalysis,
    setThreatVectorReport 
  } = useSessionContext();
  const [targetUrl, setTargetUrl] = useState('');

  const handleScan = () => {
    if (!targetUrl) return;
    handleThreatVectorAnalysis(targetUrl);
  };
  
  const handleClose = () => {
    setThreatVectorReport(null);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-opacity duration-300 animate-fade-in"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="threat-vector-modal-title"
    >
      <div
        className="hud-container w-full max-w-3xl h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="hud-corner corner-top-left"></div>
        <div className="hud-corner corner-top-right"></div>
        <div className="hud-corner corner-bottom-left"></div>
        <div className="hud-corner corner-bottom-right"></div>
        
        <div className="flex justify-between items-center flex-shrink-0 relative">
            <h2 id="threat-vector-modal-title" className="text-xl">Threat Vector Analysis</h2>
            <button
                onClick={handleClose}
                className="absolute -top-4 -right-4 p-1.5 rounded-full hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)]"
                aria-label="Close Threat Vector Analysis"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <div className="flex-grow mt-4 flex flex-col min-h-0 space-y-4">
          <div className="flex items-end gap-3">
              <div className="flex-grow">
                <label htmlFor="target-url-threat" className="block text-sm uppercase tracking-wider text-[var(--hud-color-darker)] mb-1">
                    Target URL
                </label>
                <input
                    id="target-url-threat"
                    type="url"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    className="block w-full p-2.5 font-mono text-sm text-[var(--hud-color)] bg-black border border-[var(--hud-color-darkest)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--bright-cyan)] placeholder:text-[var(--hud-color-darker)] transition-all duration-150"
                    placeholder="https://example.com"
                    disabled={isGeneratingThreatVector}
                />
              </div>
              <Button onClick={handleScan} disabled={!targetUrl || isGeneratingThreatVector} isLoading={isGeneratingThreatVector}>
                Scan
              </Button>
          </div>
          
          <div className="flex-grow flex flex-col min-h-0">
            <div className="flex-grow overflow-y-auto pr-2 border border-[var(--hud-color-darkest)] p-3 bg-black/30">
                {isGeneratingThreatVector && !threatVectorReport ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <LoadingSpinner size="w-10 h-10" />
                        <p className="mt-4 text-sm uppercase tracking-wider">Analyzing Target...</p>
                    </div>
                ) : (
                    <MarkdownRenderer markdown={threatVectorReport || ''} />
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};