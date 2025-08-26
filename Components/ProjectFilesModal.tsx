import React, { useRef } from 'react';
import { ProjectFile } from '../types.ts';
import { Button } from './Button.tsx';
import { BoltIcon, DeleteIcon, ImportIcon, LoadIcon, PaperclipIcon } from './Icons.tsx';

interface ProjectFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectFiles: ProjectFile[];
  onUploadFile: (file: File) => void;
  onDeleteFile: (fileId: string) => void;
  onAttachFile: (file: ProjectFile) => void;
  onDownloadFile: (content: string, filename: string, mimeType: string) => void;
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

export const ProjectFilesModal = ({ 
    isOpen, onClose, projectFiles, onUploadFile, 
    onDeleteFile, onAttachFile, onDownloadFile
}: ProjectFilesModalProps) => {
  const uploadInputRef = useRef<HTMLInputElement>(null);
  
  if (!isOpen) return null;
  
  const handleUploadClick = () => {
    uploadInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUploadFile(file);
    }
    // Reset file input to allow uploading the same file again
    if (event.target) {
      event.target.value = '';
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-files-modal-title"
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
            <h2 id="project-files-modal-title" className="text-xl">Project Files</h2>
            <button
                onClick={onClose}
                className="absolute -top-4 -right-4 p-1.5 rounded-full hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)]"
                aria-label="Close project files"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <div className="flex-shrink-0 my-4">
            <Button onClick={handleUploadClick} className="w-full">Upload New File</Button>
            <input 
              type="file"
              ref={uploadInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
        </div>

        <div className="flex-grow overflow-y-auto pr-2">
            {projectFiles.length > 0 ? (
                <div className="space-y-2">
                    {projectFiles.slice().sort((a,b) => b.timestamp - a.timestamp).map(file => (
                        <div key={file.id} className="p-3 bg-black/50 border border-[var(--hud-color-darkest)] flex justify-between items-center gap-4">
                            <div>
                                <p className="font-semibold text-[var(--hud-color)] uppercase tracking-wider text-sm truncate" title={file.name}>{file.name}</p>
                                <p className="text-xs text-[var(--hud-color-darker)]">{timeAgo(file.timestamp)}</p>
                            </div>
                            <div className="flex items-center space-x-1 flex-shrink-0">
                                <button onClick={() => onAttachFile(file)} title="Attach to Chat" className="p-1.5 text-[var(--hud-color)] rounded-full hover:bg-[var(--hud-color)]/20 focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)]">
                                    <PaperclipIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => onDownloadFile(file.content, file.name, file.mimeType)} title="Download File" className="p-1.5 text-[var(--hud-color)] rounded-full hover:bg-[var(--hud-color)]/20 focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)]">
                                    <ImportIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => onDeleteFile(file.id)} title="Delete File" className="p-1.5 text-[var(--red-color)]/70 rounded-full hover:bg-red-500/30 hover:text-[var(--red-color)] focus:outline-none focus:ring-1 focus:ring-[var(--red-color)]">
                                    <DeleteIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-[var(--hud-color-darker)]">
                    <h3 className="text-lg mb-2">No Project Files</h3>
                    <p>Upload files like logs or images to use them in your chat sessions.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};