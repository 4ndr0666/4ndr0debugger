import React from 'react';
import { Version } from '../types';
import { VersionHistory } from './VersionHistory';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: Version[];
  onLoadVersion: (version: Version) => void;
  onDeleteVersion: (versionId: string) => void;
  onStartFollowUp: (version: Version) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({ isOpen, onClose, ...versionHistoryProps }) => {
  if (!isOpen) return null;

  // Wrap onLoadVersion to close the modal
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
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 transition-opacity duration-300 animate-fade-in-up"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="version-history-modal-title"
    >
      <div
        className="bg-[#0A0F1A] rounded-lg shadow-xl shadow-[#156464]/50 w-full max-w-2xl h-[70vh] p-4 sm:p-6 flex flex-col border border-[#15adad]/60"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 flex-shrink-0 relative">
          {/* Title is provided by VersionHistory component now */}
          <div className="w-full"></div>
          <button
            onClick={onClose}
            className="absolute -top-2 -right-2 p-1.5 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#15adad]"
            aria-label="Close version history"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-grow overflow-hidden">
            <VersionHistory 
              {...versionHistoryProps} 
              onLoadVersion={handleLoadVersion}
              onStartFollowUp={handleStartFollowUp}
            />
        </div>
      </div>
    </div>
  );
};
