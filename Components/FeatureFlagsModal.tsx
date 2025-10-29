import React from 'react';
import { useFeatureFlags, DEFAULT_FEATURE_FLAGS } from '../contexts/FeatureFlagsContext.tsx';
import { FeatureFlag, FeatureFlags } from '../types.ts';
import { Button } from './Button.tsx';

interface FeatureFlagsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FLAG_DESCRIPTIONS: Record<FeatureFlag, string> = {
  red_team_tools: "Enable all Red Team toolkit modules (Threat Vector, Recon, Stager, Report).",
  workbench_mode: "Enable the iterative script development 'Workbench' mode.",
  code_audit_mode: "Enable the 'Audit' mode for security-focused code analysis.",
  multi_file_context: "Enable the ability to select project files as context for analysis.",
  experimental_features: "Enable unstable or in-development features. Use with caution.",
};

export const FeatureFlagsModal: React.FC<FeatureFlagsModalProps> = ({ isOpen, onClose }) => {
  const { featureFlags, setFeatureFlags } = useFeatureFlags();

  if (!isOpen) return null;

  const handleToggle = (flag: FeatureFlag) => {
    setFeatureFlags(prev => ({ ...prev, [flag]: !prev[flag] }));
  };
  
  const handleReset = () => {
    setFeatureFlags(DEFAULT_FEATURE_FLAGS);
  }

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ff-modal-title"
    >
      <div
        className="hud-container w-full max-w-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="hud-corner corner-top-left"></div>
        <div className="hud-corner corner-top-right"></div>
        <div className="hud-corner corner-bottom-left"></div>
        <div className="hud-corner corner-bottom-right"></div>
        
        <div className="flex justify-between items-center flex-shrink-0 relative">
            <h2 id="ff-modal-title" className="text-xl">System Feature Flags</h2>
            <button
                onClick={onClose}
                className="absolute -top-4 -right-4 p-1.5 rounded-full hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)]"
                aria-label="Close Feature Flags"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <div className="mt-4 space-y-4">
            {Object.keys(FLAG_DESCRIPTIONS).map(key => {
                const flagKey = key as FeatureFlag;
                return (
                    <div key={flagKey} className="flex items-center justify-between p-3 bg-black/30 border border-[var(--hud-color-darkest)]">
                        <div>
                            <p className="font-semibold text-sm text-[var(--hud-color)] uppercase tracking-wider">{flagKey.replace(/_/g, ' ')}</p>
                            <p className="text-xs text-[var(--hud-color-darker)]">{FLAG_DESCRIPTIONS[flagKey]}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={featureFlags[flagKey]} onChange={() => handleToggle(flagKey)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-[var(--hud-color-darkest)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--hud-color)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-black after:border after:border-[var(--hud-color-darker)] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--hud-color)]"></div>
                        </label>
                    </div>
                );
            })}
        </div>
        <div className="mt-6 flex justify-between items-center">
            <Button onClick={handleReset} variant="secondary">Reset to Defaults</Button>
            <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};
