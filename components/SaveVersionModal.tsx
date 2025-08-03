import React from 'react';
import { Button } from './Button';

interface SaveVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  versionName: string;
  setVersionName: (name: string) => void;
}

export const SaveVersionModal: React.FC<SaveVersionModalProps> = ({ isOpen, onClose, onSave, versionName, setVersionName }) => {
  if (!isOpen) return null;

  const handleSaveClick = () => {
    if (versionName.trim()) {
      onSave();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveClick();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 transition-opacity duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-modal-title"
    >
      <div 
        className="bg-[#101827] rounded-lg shadow-xl shadow-[#156464]/50 w-full max-w-md p-6 border border-[#15adad]/60"
        onClick={e => e.stopPropagation()} // Prevent clicks inside from closing the modal
      >
        <h2 id="save-modal-title" className="text-xl font-semibold text-center mb-4 font-heading">
           <span style={{
              background: 'linear-gradient(to right, #15fafa, #15adad, #157d7d)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}>
            Save Version
          </span>
        </h2>
        <div className="space-y-4">
          <label htmlFor="version-name" className="block text-sm font-medium text-[#a0f0f0]">
            Version Name
          </label>
          <input
            id="version-name"
            type="text"
            value={versionName}
            onChange={(e) => setVersionName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="block w-full p-2.5 font-sans text-sm text-[#e0ffff] bg-[#070B14] border border-[#15adad]/70 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#15ffff] focus:border-[#15ffff]"
            placeholder="e.g., Initial Refactor"
            autoFocus
          />
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSaveClick} disabled={!versionName.trim()}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};
