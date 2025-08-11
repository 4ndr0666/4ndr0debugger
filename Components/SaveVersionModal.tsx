import React from 'react';
import { Button } from './Button.tsx';

interface SaveVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  versionName: string;
  setVersionName: (name: string) => void;
}

export const SaveVersionModal = ({ isOpen, onClose, onSave, versionName, setVersionName }: SaveVersionModalProps) => {
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
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-modal-title"
    >
      <div 
        className="hud-container w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="hud-corner corner-top-left"></div>
        <div className="hud-corner corner-top-right"></div>
        <div className="hud-corner corner-bottom-left"></div>
        <div className="hud-corner corner-bottom-right"></div>

        <h2 id="save-modal-title" className="text-xl text-center mb-4">
            Save Version
        </h2>
        <div className="space-y-4">
          <label htmlFor="version-name" className="block text-sm uppercase tracking-wider text-[var(--hud-color-darker)]">
            Version Name
          </label>
          <input
            id="version-name"
            type="text"
            value={versionName}
            onChange={(e) => setVersionName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="block w-full p-2.5 font-mono text-sm text-[var(--hud-color)] bg-black border border-[var(--hud-color-darker)] focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)] focus:border-[var(--hud-color)]"
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