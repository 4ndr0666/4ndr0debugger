
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
    <header className="py-4 px-4 sm:px-6 lg:px-8 bg-transparent shadow-[0_4px_15px_rgba(21,250,250,0.1)] border-b border-[#15fafa]/50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex-1 flex justify-start">
            {/* Tools Menu */}
            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setIsMenuOpen(prev => !prev)}
                    title="Additional Tools"
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
        
        {/* Centered Title and Logo - In flex flow */}
        <div className="flex-shrink-0 px-4 flex items-center space-x-2 sm:space-x-3">
          <LogoIcon className="w-8 h-8 sm:w-10 sm:h-10 text-[#15fafa]" />
          <h1 className="text-2xl sm:text-3xl font-bold font-heading">
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
        <div className="flex-1 flex items-center justify-end space-x-1 sm:space-x-2">
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
              onClick={handleExport} 
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