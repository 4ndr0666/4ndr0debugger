import React, { useRef } from 'react';
import { useAppContext } from '../AppContext.tsx';
import { ImportedSession } from '../types.ts';
import { Button } from './Button.tsx';
import { DeleteIcon, ImportIcon, SaveIcon as LoadIcon } from './Icons.tsx';

interface SessionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportFile: (file: File) => void;
  onLoadSession: (sessionState: any) => void;
  onDeleteSession: (sessionId: string) => void;
  isLoading?: boolean;
}

const timeAgo = (timestamp: number): string => {
    const seconds = Math.floor((new Date().getTime() - timestamp) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export const SessionManagerModal = ({ isOpen, onClose, onImportFile, onLoadSession, onDeleteSession, isLoading = false }: SessionManagerModalProps) => {
    const { importedSessions } = useAppContext();
    const importInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleImportClick = () => {
        importInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            // Explicitly type `file` as `File` to ensure type safety when iterating over the FileList.
            Array.from(files).forEach((file: File) => onImportFile(file));
        }
        if (event.target) {
            event.target.value = '';
        }
    };

    const handleDeleteClick = (session: ImportedSession) => {
        if (window.confirm(`Are you sure you want to remove "${session.filename}" from this list? The original file will not be deleted.`)) {
            onDeleteSession(session.id);
        }
    };
    
    return (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-opacity duration-300 animate-fade-in"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="session-manager-modal-title"
        >
          <div
            className="hud-container w-full max-w-2xl h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="hud-corner corner-top-left"></div>
            <div className="hud-corner corner-top-right"></div>
            <div className="hud-corner corner-bottom-left"></div>
            <div className="hud-corner corner-bottom-right"></div>
            
            <div className="flex justify-between items-center flex-shrink-0 relative">
                <h2 id="session-manager-modal-title" className="text-xl">Session Manager</h2>
                <button
                    onClick={onClose}
                    className="absolute -top-4 -right-4 p-1.5 rounded-full hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)]"
                    aria-label="Close session manager"
                    disabled={isLoading}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="flex-shrink-0 my-4">
                <Button onClick={handleImportClick} className="w-full" disabled={isLoading}>
                    <ImportIcon className="w-5 h-5 mr-2" />
                    Import Session(s) From File...
                </Button>
                <input 
                  type="file"
                  ref={importInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".json,application/json"
                  multiple
                  disabled={isLoading}
                />
            </div>

            <div className="flex-grow overflow-y-auto pr-2">
                {importedSessions.length > 0 ? (
                    <div className="space-y-3">
                        {importedSessions.slice().sort((a,b) => b.importedAt - a.importedAt).map(session => (
                            <div key={session.id} className="p-3 bg-black/50 border border-[var(--hud-color-darkest)] flex justify-between items-center gap-4">
                                <div className="flex-grow overflow-hidden">
                                    <p className="font-semibold text-[var(--hud-color)] uppercase tracking-wider text-sm truncate" title={session.filename}>{session.filename}</p>
                                    <p className="text-xs text-[var(--hud-color-darker)] capitalize">
                                        Mode: {session.appMode} &middot; Lang: {session.language}
                                    </p>
                                     <p className="text-xs text-[var(--hud-color-darker)] mt-1">
                                        {session.versionCount} versions &middot; {session.projectFileCount} files &middot; Chat: {session.hasChatHistory ? 'Yes' : 'No'}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-1 flex-shrink-0">
                                    <button onClick={() => onLoadSession(session.sessionState)} title="Load Session" className="p-1.5 text-[var(--hud-color)] rounded-full hover:bg-[var(--hud-color)]/20 focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)] disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
                                        <LoadIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDeleteClick(session)} title="Remove From List" className="p-1.5 text-[var(--red-color)]/70 rounded-full hover:bg-red-500/30 hover:text-[var(--red-color)] focus:outline-none focus:ring-1 focus:ring-[var(--red-color)] disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
                                        <DeleteIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-[var(--hud-color-darker)]">
                        <h3 className="text-lg mb-2">No Imported Sessions</h3>
                        <p>Import a session file (.json) to load it here.</p>
                    </div>
                )}
            </div>
          </div>
        </div>
    );
};