
import React, { useState } from 'react';
import { useAppContext } from '../AppContext.tsx';
import { Version } from '../types.ts';
import { Button } from './Button.tsx';
import { BoltIcon, DeleteIcon, ImportIcon, SaveIcon as LoadIcon } from './Icons.tsx';

interface DocumentationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (code: string) => void;
  onLoadVersion: (version: Version) => void;
  onDeleteVersion: (versionId: string) => void;
  onDownload: (content: string, filename: string) => void;
}

type ActiveTab = 'generate' | 'saved';

const timeAgo = (timestamp: number): string => {
    const seconds = Math.floor((new Date().getTime() - timestamp) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "just now";
}


const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-heading uppercase tracking-wider transition-all duration-200 border-b-2 ${active ? 'border-[var(--hud-color)] text-[var(--hud-color)]' : 'border-transparent text-[var(--hud-color-darker)] hover:text-[var(--hud-color)]'}`}
    >
        {children}
    </button>
);

export const DocumentationCenterModal = ({ 
    isOpen, onClose, onGenerate, 
    onLoadVersion, onDeleteVersion, onDownload 
}: DocumentationCenterModalProps) => {
  const { versions, userOnlyCode: currentUserCode } = useAppContext();
  const [activeTab, setActiveTab] = useState<ActiveTab>('generate');

  if (!isOpen) return null;

  const savedDocs = versions.filter(v => v.type === 'docs').sort((a, b) => b.timestamp - a.timestamp);
  const otherVersions = versions.filter(v => v.type !== 'docs').sort((a, b) => b.timestamp - a.timestamp);
  
  const handleLoad = (version: Version) => {
    onLoadVersion(version);
    onClose();
  };
  
  const handleGenerate = (code: string) => {
    onGenerate(code);
    onClose();
  }

  const renderGenerateTab = () => (
    <div className="space-y-4 animate-fade-in">
        <div>
            <h4 className="text-lg font-heading mb-2">From Current Code</h4>
            <div className="p-3 bg-black/50 border border-[var(--hud-color-darkest)] flex justify-between items-center">
                <p className="text-sm text-[var(--hud-color-darker)] truncate pr-4">Generate documentation for the code currently in the editor.</p>
                <Button onClick={() => handleGenerate(currentUserCode)} disabled={!currentUserCode.trim()}>Generate</Button>
            </div>
        </div>
        <div>
            <h4 className="text-lg font-heading mb-2">From Saved Version</h4>
            {otherVersions.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {otherVersions.map(version => (
                        <div key={version.id} className="p-3 bg-black/50 border border-[var(--hud-color-darkest)] flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-[var(--hud-color)] uppercase tracking-wider text-sm truncate">{version.name}</p>
                                <p className="text-xs text-[var(--hud-color-darker)]">{timeAgo(version.timestamp)}</p>
                            </div>
                            <Button onClick={() => handleGenerate(version.userCode)}>
                                <BoltIcon className="w-4 h-4 mr-2" /> Generate
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-center text-[var(--hud-color-darker)] p-4">No other saved versions available.</p>
            )}
        </div>
    </div>
  );

  const renderSavedTab = () => (
     <div className="animate-fade-in">
        {savedDocs.length > 0 ? (
             <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-2">
                 {savedDocs.map(doc => (
                     <div key={doc.id} className="p-3 bg-black/50 border border-[var(--hud-color-darkest)]">
                         <div className="flex justify-between items-start">
                             <div>
                                 <p className="font-semibold text-[var(--hud-color)] uppercase tracking-wider">{doc.name}</p>
                                 <p className="text-xs text-[var(--hud-color-darker)]">{timeAgo(doc.timestamp)}</p>
                             </div>
                             <div className="flex items-center space-x-1 flex-shrink-0">
                                 <button onClick={() => handleLoad(doc)} title="Load Document" className="p-1.5 text-[var(--hud-color)] rounded-full hover:bg-[var(--hud-color)]/20 focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)]">
                                     <LoadIcon className="w-4 h-4" />
                                 </button>
                                 <button onClick={() => onDownload(doc.feedback, `${doc.name.replace(/ /g, '_')}.md`)} title="Download .md" className="p-1.5 text-[var(--hud-color)] rounded-full hover:bg-[var(--hud-color)]/20 focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)]">
                                     <ImportIcon className="w-4 h-4" />
                                 </button>
                                 <button onClick={() => onDeleteVersion(doc.id)} title="Delete Document" className="p-1.5 text-[var(--red-color)]/70 rounded-full hover:bg-red-500/30 hover:text-[var(--red-color)] focus:outline-none focus:ring-1 focus:ring-[var(--red-color)]">
                                     <DeleteIcon className="w-4 h-4" />
                                 </button>
                             </div>
                         </div>
                     </div>
                 ))}
             </div>
         ) : (
             <div className="flex flex-col items-center justify-center h-48 text-center text-[var(--hud-color-darker)]">
                 <h3 className="text-lg mb-2">No Saved Documentation</h3>
                 <p>Generated documentation that you save will appear here.</p>
             </div>
         )}
     </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="docs-modal-title"
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
            <h2 id="docs-modal-title" className="text-xl">Documentation Center</h2>
            <button
                onClick={onClose}
                className="absolute -top-4 -right-4 p-1.5 rounded-full hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)]"
                aria-label="Close documentation center"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <div className="flex-shrink-0 border-b border-[var(--hud-color-darkest)] my-4">
            <TabButton active={activeTab === 'generate'} onClick={() => setActiveTab('generate')}>Generate New</TabButton>
            <TabButton active={activeTab === 'saved'} onClick={() => setActiveTab('saved')}>Saved Documentation</TabButton>
        </div>

        <div className="flex-grow overflow-y-auto">
            {activeTab === 'generate' ? renderGenerateTab() : renderSavedTab()}
        </div>
      </div>
    </div>
  );
};