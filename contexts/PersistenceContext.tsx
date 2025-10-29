import React, { createContext, useState, useContext, useMemo } from 'react';
import { ProjectFile, Version, ImportedSession } from '../types.ts';

// A custom hook to manage state with localStorage persistence.
export const usePersistentState = <T,>(storageKey: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [state, setState] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(storageKey);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${storageKey}":`, error);
            return defaultValue;
        }
    });

    React.useEffect(() => {
        try {
            window.localStorage.setItem(storageKey, JSON.stringify(state));
        } catch (error) {
            console.error(`Error setting localStorage key "${storageKey}":`, error);
        }
    }, [storageKey, state]);

    return [state, setState];
};

interface PersistenceContextType {
  projectFiles: ProjectFile[];
  versions: Version[];
  importedSessions: ImportedSession[];
  setProjectFiles: React.Dispatch<React.SetStateAction<ProjectFile[]>>;
  setVersions: React.Dispatch<React.SetStateAction<Version[]>>;
  setImportedSessions: React.Dispatch<React.SetStateAction<ImportedSession[]>>;
}

const PersistenceContext = createContext<PersistenceContextType | undefined>(undefined);

export const PersistenceProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [projectFiles, setProjectFiles] = usePersistentState<ProjectFile[]>('projectFiles', []);
  const [versions, setVersions] = usePersistentState<Version[]>('codeReviewVersions', []);
  const [importedSessions, setImportedSessions] = usePersistentState<ImportedSession[]>('importedSessions', []);
  
  const value = useMemo(() => ({
    projectFiles, setProjectFiles,
    versions, setVersions,
    importedSessions, setImportedSessions,
  }), [projectFiles, versions, importedSessions, setProjectFiles, setVersions, setImportedSessions]);

  return <PersistenceContext.Provider value={value}>{children}</PersistenceContext.Provider>;
}

export const usePersistenceContext = (): PersistenceContextType => {
  const context = useContext(PersistenceContext);
  if (!context) {
    throw new Error('usePersistenceContext must be used within a PersistenceProvider');
  }
  return context;
};