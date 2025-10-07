import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../AppContext.tsx';
import { useSessionContext } from '../contexts/SessionContext.tsx';
import { SaveIcon, ImportIcon, ExportIcon, AnimatedMenuIcon, BoltIcon, LogoIcon, ChatIcon, HistoryIcon, EyeIcon, EyeOffIcon, CodeIcon, CompareIconSvg, BugIcon, DocsIcon, FolderIcon, ShareIcon, ShieldIcon, ReportIcon, TargetIcon, SkullIcon, CrosshairsIcon } from './Icons.tsx';

interface HeaderProps {
    onImportClick: () => void;
    onExportSession: () => void;
    onShare: () => void;
    onOpenDocsModal: () => void;
    onOpenProjectFilesModal: () => void;
    onToggleVersionHistory: () => void;
    onOpenReportGenerator: () => void;
    onOpenReconModal: () => void;
    onOpenExploitStagerModal: () => void;
    onOpenThreatVectorModal: () => void;
    isToolsEnabled: boolean;
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
    onShare,
    onOpenDocsModal,
    onOpenProjectFilesModal,
    onToggleVersionHistory,
    onOpenReportGenerator,
    onOpenReconModal,
    onOpenExploitStagerModal,
    onOpenThreatVectorModal,
    isToolsEnabled,
    onEndChatSession
}) => {
  const { resetAndSetMode } = useAppContext();
  const { 
      isLoading, isChatLoading, isInputPanelVisible, setIsInputPanelVisible,
      reviewAvailable, handleStartFollowUp, isChatMode, handleGenerateTests
  } = useSessionContext();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const anyLoading = isLoading || isChatLoading;

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
                    <div className="absolute left-0 z-20 mt-2 w-64 origin-top-left border border-[var(--hud-color)] bg-black/80 backdrop-blur-md focus:outline-none">
                        <div className="p-1" role="menu" aria-orientation="vertical">
                            <MenuDivider label="View" />
                            <MenuItem onClick={() => handleMenuClick(() => setIsInputPanelVisible(p => !p))}>
                                {isInputPanelVisible ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                {isInputPanelVisible ? 'Hide' : 'Show'} Input Panel
                            </MenuItem>

                            <MenuDivider label="Tools" />
                            <MenuItem onClick={() => handleMenuClick(onOpenThreatVectorModal)} disabled={anyLoading}>
                                <CrosshairsIcon className="w-4 h-4" /> Threat Vector Analysis
                            </MenuItem>
                            <MenuItem onClick={() => handleMenuClick(onOpenReconModal)} disabled={anyLoading}>
                                <TargetIcon className="w-4 h-4" /> Live Recon
                            </MenuItem>
                             <MenuItem onClick={() => handleMenuClick(onOpenExploitStagerModal)} disabled={anyLoading}>
                                <SkullIcon className="w-4 h-4" /> Exploit Stager
                            </MenuItem>
                            <MenuItem onClick={() => handleMenuClick(onOpenReportGenerator)} disabled={anyLoading}>
                                <ReportIcon className="w-4 h-4" /> Adversarial Report
                            </MenuItem>
                            <MenuItem onClick={() => handleMenuClick(handleGenerateTests)} disabled={!isToolsEnabled || anyLoading}>
                                <BoltIcon className="w-4 h-4" /> Generate Unit Tests
                            </MenuItem>
                            <MenuItem onClick={() => handleMenuClick(onOpenDocsModal)} disabled={!isToolsEnabled || anyLoading}>
                                <DocsIcon className="w-4 h-4" /> Generate Documentation
                            </MenuItem>
                             {!isChatMode && (
                                <MenuItem onClick={() => handleMenuClick(() => handleStartFollowUp())} disabled={!reviewAvailable || anyLoading}>
                                    <ChatIcon className="w-4 h-4" /> Follow-up Chat
                                </MenuItem>
                             )}

                            <MenuDivider label="Session" />
                             {isChatMode && (
                                <MenuItem onClick={() => handleMenuClick(onEndChatSession)} disabled={anyLoading}>
                                    <SaveIcon className="w-4 h-4" /> End & Save Chat
                                </MenuItem>
                             )}
                            <MenuItem onClick={() => handleMenuClick(onToggleVersionHistory)} disabled={anyLoading}>
                                <HistoryIcon className="w-4 h-4" /> Version History
                            </MenuItem>
                             <MenuItem onClick={() => handleMenuClick(onOpenProjectFilesModal)} disabled={anyLoading}>
                                <FolderIcon className="w-4 h-4" /> Project Files
                            </MenuItem>
                            <MenuItem onClick={() => handleMenuClick(onImportClick)} disabled={anyLoading}>
                                <ImportIcon className="w-4 h-4" /> Session Manager
                            </MenuItem>
                        </div>
                    </div>
                )}
            </div>
        </div>
        
        <div className="flex-shrink-0 px-4 flex items-center space-x-2 sm:space-x-3">
          <LogoIcon className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--hud-color)] animate-flicker" />
          <h1 className="text-2xl sm:text-3xl text-gradient-cyan">
              4ndr0⫌ebugger
          </h1>
        </div>
        
        <div className="flex-1 flex items-center justify-end space-x-1 sm:space-x-2">
            <button
              onClick={onShare}
              title="Share Session"
              className="p-2 text-[var(--hud-color)] rounded-full transition-all duration-200 hover:bg-[var(--hud-color)]/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--hud-color)]"
              aria-label="Share Session via URL"
            >
              <ShareIcon className="w-6 h-6" />
            </button>
            <button 
              onClick={onExportSession} 
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