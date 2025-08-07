

import React, { useState, useEffect, useRef } from 'react';
import { SaveIcon, ImportIcon, ExportIcon, AnimatedMenuIcon, BoltIcon, LogoIcon } from './Icons';
import { Toast } from '../types';

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
    addToast: (message: string, type: Toast['type']) => void;
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
    isLoading,
    addToast
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
  
  const handleExport = () => {
      onExportSession();
      addToast('Session exported successfully!', 'success');
  }

  return (
    <header className="py-4 px-4 sm:px-6 lg:px-8 bg-transparent border-b border-[var(--hud-color-darker)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex-1 flex justify-start">
            {/* Tools Menu */}
            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setIsMenuOpen(prev => !prev)}
                    title="Additional Tools"
                    className="p-2 text-[var(--hud-color)] rounded-full transition-all duration-200 hover:bg-[var(--hud-color)]/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--hud-color)]"
                    aria-label="Open additional tools menu"
                    aria-haspopup="true"
                    aria-expanded={isMenuOpen}
                >
                    <AnimatedMenuIcon isOpen={isMenuOpen} />
                </button>
                {isMenuOpen && (
                    <div className="absolute left-0 z-20 mt-2 w-56 origin-top-left bg-black/90 backdrop-blur-sm border border-[var(--hud-color-darker)] focus:outline-none">
                        <div className="p-1" role="menu" aria-orientation="vertical">
                            <button
                                onClick={() => handleMenuClick(onGenerateTests)}
                                disabled={!isToolsEnabled || isLoading}
                                className="text-left w-full px-3 py-2 text-sm text-[var(--hud-color)] uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--hud-color)]/20"
                                role="menuitem"
                            >
                                <span className="flex items-center">
                                    <BoltIcon className="w-4 h-4 mr-3" />
                                    Generate Tests
                                </span>
                            </button>
                             <button
                                onClick={() => handleMenuClick(onGenerateDocs)}
                                disabled={!isToolsEnabled || isLoading}
                                className="text-left w-full px-3 py-2 text-sm text-[var(--hud-color)] uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--hud-color)]/20"
                                role="menuitem"
                            >
                                <span className="flex items-center">
                                    <BoltIcon className="w-4 h-4 mr-3" />
                                    Generate Docs
                                </span>
                            </button>
                             <div className="my-1 h-px bg-[var(--hud-color-darker)]" />
                             <button
                                onClick={() => handleMenuClick(onToggleVersionHistory)}
                                disabled={isLoading}
                                className="text-left w-full px-3 py-2 text-sm text-[var(--hud-color)] uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--hud-color)]/20"
                                role="menuitem"
                            >
                                Versioning
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
        
        <div className="flex-shrink-0 px-4 flex items-center space-x-2 sm:space-x-3">
          <LogoIcon className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--hud-color)] animate-flicker" />
          <h1 className="text-2xl sm:text-3xl">
              4ndr0⫌ebugger
          </h1>
        </div>
        
        <div className="flex-1 flex items-center justify-end space-x-1 sm:space-x-2">
            <button
                onClick={onSaveVersion}
                disabled={!isSaveEnabled}
                title="Save Version"
                className="p-2 text-[var(--hud-color)] rounded-full transition-all duration-200 hover:bg-[var(--hud-color)]/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--hud-color)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                aria-label="Save current review as a version"
            >
                <SaveIcon className="w-6 h-6" />
            </button>
            <button 
              onClick={onImportClick} 
              title="Import Session" 
              className="p-2 text-[var(--hud-color)] rounded-full transition-all duration-200 hover:bg-[var(--hud-color)]/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--hud-color)]"
              aria-label="Import Session"
            >
              <ImportIcon className="w-6 h-6" />
            </button>
            <button 
              onClick={handleExport} 
              title="Export Session" 
              className="p-2 text-[var(--hud-color)] rounded-full transition-all duration-200 hover:bg-[var(--hud-color)]/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--hud-color)]"
              aria-label="Export Session"
            >
              <ExportIcon className="w-6 h-6" />
            </button>
        </div>
      </div>
    </header>
  );
};