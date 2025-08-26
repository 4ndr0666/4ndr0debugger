import React, { useState, useRef, useEffect } from 'react';
import { SaveIcon, ImportIcon, ExportIcon, AnimatedMenuIcon, BoltIcon, LogoIcon, ChatIcon, HistoryIcon, EyeIcon, EyeOffIcon, CodeIcon, CompareIcon as CompareIconSvg, BugIcon, DocsIcon, FolderIcon } from './Icons.tsx';
import { Toast } from '../types.ts';

interface HeaderProps {
    onImportClick: () => void;
    onExportSession: () => void;
    onGenerateTests: () => void;
    onOpenDocsModal: () => void;
    onOpenProjectFilesModal: () => void;
    onToggleVersionHistory: () => void;
    isToolsEnabled: boolean;
    isLoading: boolean;
    addToast: (message: string, type: Toast['type']) => void;
    onStartDebug: () => void;
    onStartSingleReview: () => void;
    onStartComparison: () => void;
    isInputPanelVisible: boolean;
    onToggleInputPanel: () => void;
    onNewReview: () => void; // Kept for the clear button functionality
    isFollowUpAvailable: boolean;
    onStartFollowUp: () => void;
    isChatMode: boolean;
    onEndChatSession: () => void;
}

const MenuItem: React.FC<{ onClick: () => void; disabled?: boolean; children: React.ReactNode; }> = ({ onClick, disabled, children }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="text-left w-full px-3 py-2 text-sm flex items-center gap-3 text-[var(--hud-color)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--hud-color)]/20 transition-colors duration-150"
        role="menuitem"
    >
        {children}
    </button>
);

const MenuDivider: React.FC<{ label: string }> = ({ label }) => (
    <>
        <div className="my-1 h-px bg-[var(--hud-color-darker)]" />
        <p className="px-3 py-2 text-xs text-[var(--hud-color-darker)] uppercase tracking-wider">{label}</p>
    </>
);

export const Header: React.FC<HeaderProps> = ({ 
    onImportClick, 
    onExportSession, 
    onGenerateTests,
    onOpenDocsModal,
    onOpenProjectFilesModal,
    onToggleVersionHistory,
    isToolsEnabled,
    isLoading,
    addToast,
    onStartDebug,
    onStartSingleReview,
    onStartComparison,
    isInputPanelVisible,
    onToggleInputPanel,
    isFollowUpAvailable,
    onStartFollowUp,
    isChatMode,
    onEndChatSession
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
            {/* Command Palette Menu */}
            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setIsMenuOpen(prev => !prev)}
                    title="Command Palette"
                    className="p-2 text-[var(--hud-color)] rounded-full transition-all duration-200 hover:bg-[var(--hud-color)]/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--hud-color)]"
                    aria-label="Open command palette menu"
                    aria-haspopup="true"
                    aria-expanded={isMenuOpen}
                >
                    <AnimatedMenuIcon isOpen={isMenuOpen} />
                </button>
                {isMenuOpen && (
                    <div className="absolute left-0 z-20 mt-2 w-64 origin-top-left bg-black/90 backdrop-blur-sm border border-[var(--hud-color-darker)] focus:outline-none">
                        <div className="p-1" role="menu" aria-orientation="vertical">
                            <MenuDivider label="Modes" />
                             <MenuItem onClick={() => handleMenuClick(onStartDebug)} disabled={isLoading}>
                                <BugIcon className="w-4 h-4" /> Debug
                            </MenuItem>
                            <MenuItem onClick={() => handleMenuClick(onStartSingleReview)} disabled={isLoading}>
                                <CodeIcon className="w-4 h-4" /> Single Review
                            </MenuItem>
                            <MenuItem onClick={() => handleMenuClick(onStartComparison)} disabled={isLoading}>
                                <CompareIconSvg className="w-4 h-4" /> Comparative Analysis
                            </MenuItem>

                            <MenuDivider label="View" />
                            <MenuItem onClick={() => handleMenuClick(onToggleInputPanel)}>
                                {isInputPanelVisible ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                {isInputPanelVisible ? 'Hide' : 'Show'} Input Panel
                            </MenuItem>

                            <MenuDivider label="Tools" />
                            <MenuItem onClick={() => handleMenuClick(onGenerateTests)} disabled={!isToolsEnabled || isLoading}>
                                <BoltIcon className="w-4 h-4" /> Generate Unit Tests
                            </MenuItem>
                            <MenuItem onClick={() => handleMenuClick(onOpenDocsModal)} disabled={!isToolsEnabled || isLoading}>
                                <DocsIcon className="w-4 h-4" /> Generate Documentation
                            </MenuItem>
                             <MenuItem onClick={() => handleMenuClick(onStartFollowUp)} disabled={!isFollowUpAvailable || isLoading}>
                                <ChatIcon className="w-4 h-4" /> Follow-up Chat
                            </MenuItem>

                            <MenuDivider label="Session" />
                             <MenuItem onClick={() => handleMenuClick(onEndChatSession)} disabled={!isChatMode || isLoading}>
                                <SaveIcon className="w-4 h-4" /> End & Save Chat
                            </MenuItem>
                            <MenuItem onClick={() => handleMenuClick(onToggleVersionHistory)} disabled={isLoading}>
                                <HistoryIcon className="w-4 h-4" /> Version History
                            </MenuItem>
                             <MenuItem onClick={() => handleMenuClick(onOpenProjectFilesModal)} disabled={isLoading}>
                                <FolderIcon className="w-4 h-4" /> Project Files
                            </MenuItem>
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