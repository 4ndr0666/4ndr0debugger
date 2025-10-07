import React, { useState } from 'react';
import { Button } from './Button.tsx';
import { SCOUT_SCRIPT_TEMPLATE } from '../constants.ts';
import { useAppContext } from '../AppContext.tsx';
import { CheckIcon, CopyIcon } from './Icons.tsx';

interface LiveReconModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveReconModal: React.FC<LiveReconModalProps> = ({ isOpen, onClose }) => {
  const { targetHostname, setTargetHostname } = useAppContext();
  const [scoutScript, setScoutScript] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const handleGenerate = () => {
    if (!targetHostname) return;
    const script = SCOUT_SCRIPT_TEMPLATE.replace('__TARGET_URL__', targetHostname);
    setScoutScript(script);
  };

  const handleCopy = () => {
    if (!scoutScript) return;
    navigator.clipboard.writeText(scoutScript).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="recon-modal-title"
    >
      <div
        className="hud-container w-full max-w-2xl h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="hud-corner corner-top-left"></div>
        <div className="hud-corner corner-top-right"></div>
        <div className="hud-corner corner-bottom-left"></div>
        <div className="hud-corner corner-bottom-right"></div>
        
        <div className="flex justify-between items-center flex-shrink-0 relative">
            <h2 id="recon-modal-title" className="text-xl">Live Reconnaissance</h2>
            <button
                onClick={onClose}
                className="absolute -top-4 -right-4 p-1.5 rounded-full hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)]"
                aria-label="Close Live Recon"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <div className="flex-grow mt-4 flex flex-col min-h-0 space-y-4">
          <div>
              <label htmlFor="target-url-recon" className="block text-sm uppercase tracking-wider text-[var(--hud-color-darker)] mb-1">
                  Target URL
              </label>
              <input
                  id="target-url-recon"
                  type="url"
                  value={targetHostname}
                  onChange={(e) => setTargetHostname(e.target.value)}
                  className="block w-full p-2.5 font-mono text-sm text-[var(--hud-color)] bg-black border border-[var(--hud-color-darkest)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--bright-cyan)] placeholder:text-[var(--hud-color-darker)] transition-all duration-150"
                  placeholder="https://example.com"
              />
          </div>
          <Button onClick={handleGenerate} disabled={!targetHostname}>
            [ Generate Scout Script ]
          </Button>

          {scoutScript && (
            <div className="flex-grow flex flex-col min-h-0 space-y-4 animate-fade-in">
                <div className="relative flex-grow min-h-0">
                    <textarea
                        readOnly
                        value={scoutScript}
                        className="block w-full h-full p-3 font-mono text-xs text-[var(--hud-color)] bg-black border border-[var(--hud-color-darkest)] resize-none transition-all duration-150"
                        aria-label="Generated scout script"
                    />
                    <button onClick={handleCopy} className="absolute top-2 right-2 p-1.5 bg-black/50 text-[var(--hud-color)] hover:bg-[var(--hud-color)] hover:text-black">
                        {isCopied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                    </button>
                </div>
                <div className="flex-shrink-0 border border-[var(--hud-color-darkest)] bg-black/50 p-3 font-mono text-xs text-[var(--hud-color-darker)] space-y-2">
                    <h4 className="text-sm uppercase tracking-wider text-[var(--hud-color)]">Operator Workflow:</h4>
                    <p>1. Copy the scout script.</p>
                    <p>2. Execute it in the target's developer console.</p>
                    <p>3. Interact with the target page to generate network traffic.</p>
                    <p>4. Call <code className="text-[var(--hud-color)] bg-black px-1">dumpRecon()</code> in the console.</p>
                    <p>5. Copy the logged JSON output.</p>
                    <p>6. Paste JSON into the Adversarial Report Generator.</p>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
