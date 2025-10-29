import React from 'react';
import { ProjectFile } from '../types.ts';
import { AccordionItem } from './AccordionItem.tsx';
import { usePersistenceContext } from '../contexts/PersistenceContext.tsx';
import { useFeatureFlags } from '../contexts/FeatureFlagsContext.tsx';

interface ContextFilesSelectorProps {
  selectedFileIds: Set<string>;
  onSelectionChange: (fileId: string, isSelected: boolean) => void;
}

export const ContextFilesSelector: React.FC<ContextFilesSelectorProps> = ({ selectedFileIds, onSelectionChange }) => {
  const { projectFiles } = usePersistenceContext();
  const { featureFlags } = useFeatureFlags();

  if (!featureFlags.multi_file_context) {
    return null;
  }

  const title = `Context Files (${selectedFileIds.size} selected)`;

  if (projectFiles.length === 0) {
    return (
        <div className="text-center text-xs text-[var(--hud-color-darker)] py-2">
            No project files available. Upload files via the main menu to use them as context.
        </div>
    );
  }

  return (
    <div className="animate-fade-in my-4">
      <AccordionItem title={title} defaultOpen={false}>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
          {projectFiles.map(file => (
            <div key={file.id} className="flex items-center">
              <input
                type="checkbox"
                id={`context-file-${file.id}`}
                checked={selectedFileIds.has(file.id)}
                onChange={(e) => onSelectionChange(file.id, e.target.checked)}
                className="form-checkbox h-4 w-4 bg-black/50 border-[var(--hud-color-darkest)] text-[var(--hud-color)] focus:ring-[var(--hud-color)]"
              />
              <label htmlFor={`context-file-${file.id}`} className="ml-3 text-sm text-[var(--hud-color-darker)] cursor-pointer truncate" title={file.name}>
                {file.name}
              </label>
            </div>
          ))}
           {projectFiles.length > 5 && (
            <p className="text-center text-xs text-[var(--hud-color-darkest)] pt-2">Scroll for more files</p>
           )}
        </div>
      </AccordionItem>
    </div>
  );
};