import React, { useState, useEffect, useRef } from 'react';

const SaveIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline strokeLinecap="round" strokeLinejoin="round" points="17 21 17 13 7 13 7 21" />
      <polyline strokeLinecap="round" strokeLinejoin="round" points="7 3 7 8 15 8" />
    </svg>
);
const ImportIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);
const ExportIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
);

const AnimatedMenuIcon: React.FC<{ isOpen: boolean; className?: string }> = ({ isOpen, className }) => (
    <div className={`hamburger-container ${className || ''}`}>
        <span className={`hamburger-line top-line ${isOpen ? 'open' : ''}`} />
        <span className={`hamburger-line middle-line ${isOpen ? 'open' : ''}`} />
        <span className={`hamburger-line bottom-line ${isOpen ? 'open' : ''}`} />
    </div>
);


const BoltIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);


interface HeaderProps {
    onSaveVersion: () => void;
    onImportClick: () => void;
    onExportSession: () => void;
    isSaveEnabled: boolean;
    onGenerateTests: () => void;
    onGenerateDocs: () => void;
    onToggleVersionHistory: () => void;
    isToolsEnabled: boolean;
    isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
    onSaveVersion, 
    onImportClick, 
    onExportSession, 
    isSaveEnabled,
    onGenerateTests,
    onGenerateDocs,
    onToggleVersionHistory,
    isToolsEnabled,
    isLoading 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMenuClick = (action: () => void) => {
    action();
    setIsMenuOpen(false);
  }

  return (
    <header className="py-4 px-4 sm:px-6 lg:px-8 bg-transparent shadow-[0_4px_15px_rgba(21,250,250,0.1)] border-b border-[#15fafa]/50">
      <div className="max-w-7xl mx-auto flex items-center justify-between relative">
        <div className="flex-1 flex justify-start">
            {/* Tools Menu */}
            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setIsMenuOpen(prev => !prev)}
                    title="Tools dynamically populated here."
                    className="p-2 text-[#a0f0f0] rounded-full transition-all duration-200 hover:bg-[#15fafa]/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0F1A] focus:ring-[#15fafa]"
                    aria-label="Open additional tools menu"
                    aria-haspopup="true"
                    aria-expanded={isMenuOpen}
                >
                    <AnimatedMenuIcon isOpen={isMenuOpen} />
                </button>
                {isMenuOpen && (
                    <div className="absolute left-0 z-20 mt-2 w-56 origin-top-left rounded-md bg-[#101827]/80 backdrop-blur-md shadow-lg ring-1 ring-[#15fafa]/50 ring-opacity-5 focus:outline-none">
                        <div className="p-1" role="menu" aria-orientation="vertical">
                            <button
                                onClick={() => handleMenuClick(onGenerateTests)}
                                disabled={!isToolsEnabled || isLoading}
                                className="menu-item text-left w-full rounded-md px-3 py-2 text-sm text-[#e0ffff] disabled:opacity-50 disabled:cursor-not-allowed"
                                role="menuitem"
                            >
                                <span className="menu-item-content">
                                    <BoltIcon className="w-4 h-4 mr-3" />
                                    Generate Unit Tests
                                </span>
                            </button>
                             <button
                                onClick={() => handleMenuClick(onGenerateDocs)}
                                disabled={!isToolsEnabled || isLoading}
                                className="menu-item text-left w-full rounded-md px-3 py-2 text-sm text-[#e0ffff] disabled:opacity-50 disabled:cursor-not-allowed"
                                role="menuitem"
                            >
                                <span className="menu-item-content">
                                    <BoltIcon className="w-4 h-4 mr-3" />
                                    Generate Docs
                                </span>
                            </button>
                             <div className="my-1 h-px bg-[#15fafa]/30" />
                             <button
                                onClick={() => handleMenuClick(onToggleVersionHistory)}
                                disabled={isLoading}
                                className="menu-item text-left w-full rounded-md px-3 py-2 text-sm text-[#e0ffff] disabled:opacity-50 disabled:cursor-not-allowed"
                                role="menuitem"
                            >
                                <span className="menu-item-content">
                                    Versioning
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
        
        {/* Centered Title and Logo - Absolutely positioned */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center space-x-3">
          <svg 
            className="w-10 h-10 text-[#15fafa]" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9.172 9.172a4 4 0 015.656 0"></path>
          </svg>
          <h1 className="text-3xl font-bold font-heading">
              <span style={{
              background: 'linear-gradient(to right, #15fafa, #15adad, #157d7d)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}>
              4ndr0⫌ebugger
            </span>
          </h1>
        </div>
        
        {/* Global Actions - Right */}
        <div className="flex-1 flex items-center justify-end space-x-2">
            <button
                onClick={onSaveVersion}
                disabled={!isSaveEnabled}
                title="Save Version"
                className="p-2 text-[#a0f0f0] rounded-full transition-all duration-200 hover:bg-[#15fafa]/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0F1A] focus:ring-[#15fafa] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                aria-label="Save current review as a version"
            >
                <SaveIcon className="w-6 h-6" />
            </button>
            <button 
              onClick={onImportClick} 
              title="Import Session" 
              className="p-2 text-[#a0f0f0] rounded-full transition-all duration-200 hover:bg-[#15fafa]/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0F1A] focus:ring-[#15fafa]"
              aria-label="Import Session"
            >
              <ImportIcon className="w-6 h-6" />
            </button>
            <button 
              onClick={onExportSession} 
              title="Export Session" 
              className="p-2 text-[#a0f0f0] rounded-full transition-all duration-200 hover:bg-[#15fafa]/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0F1A] focus:ring-[#15fafa]"
              aria-label="Export Session"
            >
              <ExportIcon className="w-6 h-6" />
            </button>
        </div>
      </div>
    </header>
  );
};