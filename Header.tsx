import React, { useState } from 'react';
import { useChatStateContext, useOutputContext, useSessionActionsContext } from '../contexts/SessionContext.tsx';
import { ExportIcon, LogoIcon, ShareIcon } from './Icons.tsx';
import { RadialMenu } from './RadialMenu.tsx';
import { Tooltip } from './Tooltip.tsx';

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
    onOpenHelpModal: () => void;
    onOpenFeatureFlagsModal: () => void;
    isToolsEnabled: boolean;
    onEndChatSession: () => void;
}


export const Header: React.FC<HeaderProps> = (props) => {
  const { isInputPanelVisible, setIsInputPanelVisible, isChatMode } = useChatStateContext();
  const { reviewAvailable } = useOutputContext();
  const { handleStartFollowUp, handleGenerateTests } = useSessionActionsContext();
  const [isRadialMenuOpen, setIsRadialMenuOpen] = useState(false);
  
  return (
    <>
      <header className="py-4 px-10 sm:px-12 lg:px-14 bg-black/50 backdrop-blur-sm border-b border-[var(--hud-color-darker)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex-1 flex justify-start">
              {/* Command Palette Menu */}
              <div>
                  <button
                      onClick={() => setIsRadialMenuOpen(true)}
                      title="Command Palette"
                      className="p-2 text-[var(--hud-color)] rounded-full transition-all duration-200 hover:bg-[var(--hud-color)]/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--hud-color)]"
                      aria-label="Open command palette menu"
                      aria-haspopup="true"
                      aria-expanded={isRadialMenuOpen}
                  >
                      <div className="w-6 h-6 flex items-center justify-center font-mono text-xl leading-none font-bold tracking-tighter">
                          &gt;&gt;&gt;
                      </div>
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

      <RadialMenu 
        isOpen={isRadialMenuOpen}
        onClose={() => setIsRadialMenuOpen(false)}
        {...props}
        isInputPanelVisible={isInputPanelVisible}
        setIsInputPanelVisible={setIsInputPanelVisible}
        reviewAvailable={reviewAvailable}
        handleStartFollowUp={handleStartFollowUp}
        isChatMode={isChatMode}
        handleGenerateTests={handleGenerateTests}
      />
    </>
  );
};