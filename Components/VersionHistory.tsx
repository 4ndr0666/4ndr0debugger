import React from 'react';
import { Version } from '../types.ts';
import { SaveIcon as LoadIcon, ChatIcon, DeleteIcon } from './Icons.tsx';
import { EditableTitle } from './EditableTitle.tsx';

interface VersionHistoryProps {
  versions: Version[];
  onLoadVersion: (version: Version) => void;
  onDeleteVersion: (versionId: string) => void;
  onStartFollowUp: (version: Version) => void;
  onRenameVersion: (versionId: string, newName: string) => void;
  isLoading?: boolean;
}

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

export const VersionHistory = ({ versions, onLoadVersion, onDeleteVersion, onStartFollowUp, onRenameVersion, isLoading = false }: VersionHistoryProps) => {
  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-[var(--hud-color-darker)]">
        <h3 className="text-lg mb-2">No Saved Versions</h3>
        <p>After a review, save it as a version to revisit later.</p>
      </div>
    );
  }

  const handleDeleteClick = (versionId: string, versionName: string) => {
    if (window.confirm(`Are you sure you want to delete the version "${versionName}"? This action cannot be undone.`)) {
      onDeleteVersion(versionId);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <h3 className="text-lg text-center mb-4 flex-shrink-0">Saved Versions</h3>
      <div className="flex-grow overflow-y-auto space-y-3 pr-2">
        {versions.map(version => (
          <div key={version.id} className="p-3 bg-black/50 border border-[var(--hud-color-darkest)]">
            <div className="flex justify-between items-start">
              <div className="flex-grow overflow-hidden mr-2">
                <div className="font-semibold text-[var(--hud-color)] uppercase tracking-wider">
                   <EditableTitle 
                    initialTitle={version.name}
                    onSave={(newName) => onRenameVersion(version.id, newName)}
                    className="cursor-pointer hover:text-white"
                    inputClassName="bg-transparent font-semibold text-[var(--hud-color)] uppercase tracking-wider w-full outline-none border-b border-b-[var(--hud-color-darker)]"
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-[var(--hud-color-darker)]">
                  {version.language} &middot; {timeAgo(version.timestamp)}
                </p>
              </div>
              <div className="flex items-center space-x-1 flex-shrink-0">
                 <button onClick={() => onLoadVersion(version)} title="Load Version" className="p-1.5 text-[var(--hud-color)] rounded-full hover:bg-[var(--hud-color)]/20 focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)] disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
                   <LoadIcon className="w-4 h-4" />
                 </button>
                 <button onClick={() => onStartFollowUp(version)} title="Follow-up on this Version" className="p-1.5 text-[var(--hud-color)] rounded-full hover:bg-[var(--hud-color)]/20 focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)] disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
                   <ChatIcon className="w-4 h-4" />
                 </button>
                 <button onClick={() => handleDeleteClick(version.id, version.name)} title="Delete Version" className="p-1.5 text-[var(--red-color)]/70 rounded-full hover:bg-red-500/30 hover:text-[var(--red-color)] focus:outline-none focus:ring-1 focus:ring-[var(--red-color)] disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
                    <DeleteIcon className="w-4 h-4"/>
                 </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};