
import React from 'react';
import { useAppContext } from '../AppContext.tsx';
import { Version } from '../types.ts';
import { VersionHistory } from './VersionHistory.tsx';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadVersion: (version: Version) => void;
  onDeleteVersion: (versionId: string) => void;
  onStartFollowUp: (version: Version) => void;
  onRenameVersion: (versionId: string, newName: string) => void;
}

export const VersionHistoryModal = ({ isOpen, onClose, ...versionHistoryProps }: VersionHistoryModalProps) => {
  const { versions } = useAppContext();
  
  if (!isOpen) return null;

  const handleLoadVersion = (version: Version) => {
    versionHistoryProps.onLoadVersion(version);
    onClose();
  };

  const handleStartFollowUp = (version: Version) => {
    versionHistoryProps.onStartFollowUp(version);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="version-history-modal-title"
    >
      <div
        className="hud-container w-full max-w-2xl h-[70vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="hud-corner corner-top-left"></div>
        <div className="hud-corner corner-top-right"></div>
        <div className="hud-corner corner-bottom-left"></div>
        <div className="hud-corner corner-bottom-right"></div>

        <div className="flex justify-end items-center flex-shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute -top-4 -right-4 p-1.5 rounded-full hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)]"
            aria-label="Close version history"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-grow overflow-hidden mt-2">
            <VersionHistory 
                {...versionHistoryProps}
                versions={versions}
                onLoadVersion={handleLoadVersion} 
                onStartFollowUp={handleStartFollowUp}
            />
        </div>
      </div>
    </div>
  );
};
