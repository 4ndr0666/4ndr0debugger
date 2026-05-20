import React, { useState } from 'react';
import { ExportIcon, LogoIcon, ShareIcon, MenuIcon, StopIcon } from './Icons.tsx';
import { CommandMenu } from './CommandMenu.tsx';
import { Tooltip } from './Tooltip.tsx';
import { useLoadingStateContext, useSessionActionsContext } from '../contexts/SessionContext.tsx';

interface HeaderProps {
    onImportClick: () => void;
    onExportSession: () => void;
    onShare: () => void;
    onOpenDocsModal: () => void;
    onOpenProjectFilesModal: () => void;
    onToggleVersionHistory: () => void;
    onOpenReportGenerator: () => void;
    onOpenReconModal: () => void;
    onOpenPayloadCraftingModal: () => void;
    onOpenThreatVectorModal: () => void;
    onOpenHelpModal: () => void;
    isToolsEnabled: boolean;
    onEndChatSession: () => void;
    // Props that were previously from context
    isInputPanelVisible: boolean;
    setIsInputPanelVisible: React.Dispatch<React.SetStateAction<boolean>>;
    isChatMode: boolean;
    reviewAvailable: boolean;
    handleStartFollowUp: () => void;
    handleGenerateTests: () => void;
}


export const Header: React.FC<HeaderProps> = (props) => {
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const { isLoading, isChatLoading } = useLoadingStateContext();
  const { handleStopGenerating } = useSessionActionsContext();
  
  const showAbort = isLoading || isChatLoading;

  return (
    <>
      <header className="py-4 px-6 sm:px-10 lg:px-14 bg-black/50 backdrop-blur-sm border-b border-[var(--hud-color-darker)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex-1 flex justify-start">
              {/* Command Palette Menu */}
              <div>
                  <button
                      onClick={() => setIsCommandMenuOpen(true)}
                      title="Command Palette"
                      className="p-2 text-[var(--hud-color)] rounded transition-all duration-200 hover:bg-[var(--hud-color)]/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--hud-color)]"
                      aria-label="Open command palette menu"
                      aria-haspopup="true"
                      aria-expanded={isCommandMenuOpen}
                  >
                      <MenuIcon className="w-6 h-6" />
                  </button>
              </div>
          </div>
          
          <div className="flex-shrink-0 px-4 flex items-center space-x-2 sm:space-x-3">
            <LogoIcon className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--hud-color)] animate-flicker" />
            <h1 className="text-2xl sm:text-3xl text-gradient-cyan">
                4ndr0⫌ebugger
            </h1>
          </div>
          
          <div className="flex-1 flex items-center justify-end space-x-1 sm:space-x-2">
              {showAbort && (
                  <Tooltip text="Abort current operation">
                    <button
                        onClick={handleStopGenerating}
                        className="p-2 text-[var(--red-color)] rounded-full transition-all duration-200 hover:bg-[var(--red-color)]/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--red-color)] animate-pulse"
                        aria-label="Abort Operation"
                    >
                        <StopIcon className="w-6 h-6" />
                    </button>
                  </Tooltip>
              )}
              <Tooltip text="Share session via URL">
                <button
                  onClick={props.onShare}
                  className="p-2 text-[var(--hud-color)] rounded-full transition-all duration-200 hover:bg-[var(--hud-color)]/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--hud-color)]"
                  aria-label="Share Session via URL"
                >
                  <ShareIcon className="w-6 h-6" />
                </button>
              </Tooltip>
              <Tooltip text="Export session to JSON">
                <button 
                  onClick={props.onExportSession} 
                  className="p-2 text-[var(--hud-color)] rounded-full transition-all duration-200 hover:bg-[var(--hud-color)]/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--hud-color)]"
                  aria-label="Export Session"
                >
                  <ExportIcon className="w-6 h-6" />
                </button>
              </Tooltip>
          </div>
        </div>
      </header>

      <CommandMenu 
        isOpen={isCommandMenuOpen}
        onClose={() => setIsCommandMenuOpen(false)}
        {...props}
      />
    </>
  );
};