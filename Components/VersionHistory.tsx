import React from 'react';
import { Version } from '../types.ts';
import { LoadIcon, ChatIcon, DeleteIcon } from './Icons.tsx';

interface VersionHistoryProps {
  versions: Version[];
  onLoadVersion: (version: Version) => void;
  onDeleteVersion: (versionId: string) => void;
  onStartFollowUp: (version: Version) => void;
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

export const VersionHistory = ({ versions, onLoadVersion, onDeleteVersion, onStartFollowUp }: VersionHistoryProps) => {
  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-[var(--hud-color-darker)]">
        <h3 className="text-lg mb-2">No Saved Versions</h3>
        <p>After a review, save it as a version to revisit later.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg text-center mb-4 flex-shrink-0">Saved Versions</h3>
      <div className="flex-grow overflow-y-auto space-y-3 pr-2">
        {versions.map(version => (
          <div key={version.id} className="p-3 bg-black/50 border border-[var(--hud-color-darkest)]">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-[var(--hud-color)] uppercase tracking-wider">{version.name}</p>
                <p className="text-xs text-[var(--hud-color-darker)]">
                  {version.language} &middot; {timeAgo(version.timestamp)}
                </p>
              </div>
              <div className="flex items-center space-x-1 flex-shrink-0">
                 <button onClick={() => onLoadVersion(version)} title="Load Version" className="p-1.5 text-[var(--hud-color)] rounded-full hover:bg-[var(--hud-color)]/20 focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)]">
                   <LoadIcon className="w-4 h-4" />
                 </button>
                 <button onClick={() => onStartFollowUp(version)} title="Follow-up on this Version" className="p-1.5 text-[var(--hud-color)] rounded-full hover:bg-[var(--hud-color)]/20 focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)]">
                   <ChatIcon className="w-4 h-4" />
                 </button>
                 <button onClick={() => onDeleteVersion(version.id)} title="Delete Version" className="p-1.5 text-[var(--red-color)]/70 rounded-full hover:bg-red-500/30 hover:text-[var(--red-color)] focus:outline-none focus:ring-1 focus:ring-[var(--red-color)]">
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