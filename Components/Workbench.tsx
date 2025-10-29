import React, { useEffect } from 'react';
import { useInputContext } from '../AppContext.tsx';
import { useChatStateContext, useSessionActionsContext } from '../contexts/SessionContext.tsx';
import { ChatInterface } from './ChatInterface.tsx';

interface WorkbenchProps {
    onAttachFileClick: () => void;
    onOpenProjectFilesModal: () => void;
    onSaveChatSession: () => void;
    onLoadCodeIntoWorkbench: (code: string) => void;
}

export const Workbench: React.FC<WorkbenchProps> = ({ onAttachFileClick, onOpenProjectFilesModal, onSaveChatSession, onLoadCodeIntoWorkbench }) => {
    const { workbenchScript, setWorkbenchScript } = useInputContext();
    const { isChatMode } = useChatStateContext();
    const { handleStartFollowUp } = useSessionActionsContext();

    useEffect(() => {
        if (!isChatMode) {
            handleStartFollowUp();
        }
    }, [isChatMode, handleStartFollowUp]);

    const textareaClasses = `
        block w-full h-full p-3 font-mono text-sm text-[var(--hud-color)]
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--bright-cyan)]
        resize-y placeholder:text-transparent bg-black/70 border border-[var(--hud-color-darker)]
        transition-all duration-150
    `.trim().replace(/\s+/g, ' ');

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 h-full min-h-0">
            {/* Left Panel: Script Editor */}
            <div className="hud-container h-full flex flex-col active min-h-0">
                <div className="hud-corner corner-top-left"></div>
                <div className="hud-corner corner-top-right"></div>
                <div className="hud-corner corner-bottom-left"></div>
                <div className="hud-corner corner-bottom-right"></div>
                
                <h2 className="text-xl text-center flex-shrink-0 mb-4">Script Workbench</h2>
                
                <div className="relative flex-grow min-h-0">
                    <textarea
                        id="workbench-script-editor"
                        className={textareaClasses}
                        value={workbenchScript}
                        onChange={(e) => setWorkbenchScript(e.target.value)}
                        aria-label="Script Workbench Editor"
                        placeholder=" "
                    />
                </div>
            </div>

            {/* Right Panel: Intel Briefing Chat */}
            <div className="hud-container h-full flex flex-col min-h-0">
                 <div className="hud-corner corner-top-left"></div>
                <div className="hud-corner corner-top-right"></div>
                <div className="hud-corner corner-bottom-left"></div>
                <div className="hud-corner corner-bottom-right"></div>
                
                {isChatMode ? (
                     <ChatInterface 
                        onSaveChatSession={onSaveChatSession} 
                        onAttachFileClick={onAttachFileClick}
                        onOpenProjectFilesModal={onOpenProjectFilesModal}
                        onLoadCodeIntoWorkbench={onLoadCodeIntoWorkbench}
                    />
                ) : (
                    <div className="text-center text-[var(--hud-color-darker)]">Initializing comms link...</div>
                )}
            </div>
        </div>
    );
};
