
import React from 'react';
import { Version, SupportedLanguage } from '../types';
import { Button } from './Button';

interface VersionHistoryProps {
  versions: Version[];
  onLoadVersion: (version: Version) => void;
  onDeleteVersion: (versionId: string) => void;
  onStartFollowUp: (version: Version) => void;
}

const LoadIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
);

const ChatIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

const DeleteIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

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

export const VersionHistory: React.FC<VersionHistoryProps> = ({ versions, onLoadVersion, onDeleteVersion, onStartFollowUp }) => {
  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
        <h3 className="text-lg font-semibold text-gray-300 mb-2">No Saved Versions</h3>
        <p>After you get a code review, you can save it as a version to revisit it later.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-semibold text-center text-[#e0ffff] mb-4">Saved Versions</h3>
      <div className="flex-grow overflow-y-auto space-y-3 pr-2">
        {versions.map(version => (
          <div key={version.id} className="p-3 bg-[#070B14] border border-[#15adad]/70 rounded-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-[#e0ffff]">{version.name}</p>
                <p className="text-xs text-[#70c0c0]/80">
                  {version.language} &middot; {timeAgo(version.timestamp)}
                </p>
              </div>
              <div className="flex items-center space-x-1">
                 <button onClick={() => onLoadVersion(version)} title="Load Version" className="p-1.5 text-[#a0f0f0] rounded-full hover:bg-[#15fafa]/20 hover:text-white focus:outline-none focus:ring-1 focus:ring-[#15fafa]">
                   <LoadIcon className="w-4 h-4" />
                 </button>
                 <button onClick={() => onStartFollowUp(version)} title="Follow-up on this Version" className="p-1.5 text-[#a0f0f0] rounded-full hover:bg-[#15fafa]/20 hover:text-white focus:outline-none focus:ring-1 focus:ring-[#15fafa]">
                   <ChatIcon className="w-4 h-4" />
                 </button>
                 <button onClick={() => onDeleteVersion(version.id)} title="Delete Version" className="p-1.5 text-red-400/70 rounded-full hover:bg-red-500/30 hover:text-red-300 focus:outline-none focus:ring-1 focus:ring-red-400">
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
