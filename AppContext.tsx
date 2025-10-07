
import React, { createContext, useState, useContext, useMemo, useCallback } from 'react';
import { AppMode, SupportedLanguage, ProjectFile, Toast, ReviewProfile, Version, ImportedSession } from './types.ts';
import { SUPPORTED_LANGUAGES } from './constants.ts';
import { ToastContainer } from './Components/ToastContainer.tsx';

// A custom hook to manage state with localStorage persistence.
const usePersistentState = <T,>(storageKey: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
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


// --- Toast Context ---
interface ToastContextType {
  addToast: (message: string, type: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type']) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);
  
  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const value = useMemo(() => ({ addToast }), [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};


// --- Main App Context ---
export interface AppContextType {
  // State
  appMode: AppMode;
  language: SupportedLanguage;
  reviewProfile: ReviewProfile | 'none';
  customReviewProfile: string;
  userOnlyCode: string; // Code A
  codeB: string;
  errorMessage: string;
  comparisonGoal: string;
  projectFiles: ProjectFile[];
  versions: Version[];
  importedSessions: ImportedSession[];
  targetHostname: string;

  // Setters
  setAppMode: React.Dispatch<React.SetStateAction<AppMode>>;
  setLanguage: React.Dispatch<React.SetStateAction<SupportedLanguage>>;
  setReviewProfile: React.Dispatch<React.SetStateAction<ReviewProfile | 'none'>>;
  setCustomReviewProfile: React.Dispatch<React.SetStateAction<string>>;
  setUserOnlyCode: React.Dispatch<React.SetStateAction<string>>;
  setCodeB: React.Dispatch<React.SetStateAction<string>>;
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>;
  setComparisonGoal: React.Dispatch<React.SetStateAction<string>>;
  setProjectFiles: React.Dispatch<React.SetStateAction<ProjectFile[]>>;
  setVersions: React.Dispatch<React.SetStateAction<Version[]>>;
  setImportedSessions: React.Dispatch<React.SetStateAction<ImportedSession[]>>;
  setTargetHostname: React.Dispatch<React.SetStateAction<string>>;

  // Derived State & Helpers
  resetAndSetMode: (mode: AppMode) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<React.PropsWithChildren<{ onReset: () => void }>> = ({ children, onReset }) => {
  const [appMode, setAppMode] = useState<AppMode>('debug');
  const [language, setLanguage] = useState<SupportedLanguage>(SUPPORTED_LANGUAGES[0].value);
  const [reviewProfile, setReviewProfile] = useState<ReviewProfile | 'none'>('none');
  const [customReviewProfile, setCustomReviewProfile] = useState<string>('');
  const [userOnlyCode, setUserOnlyCode] = useState<string>(''); // Code A
  const [codeB, setCodeB] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [comparisonGoal, setComparisonGoal] = useState<string>('');
  const [projectFiles, setProjectFiles] = usePersistentState<ProjectFile[]>('projectFiles', []);
  const [versions, setVersions] = usePersistentState<Version[]>('codeReviewVersions', []);
  const [importedSessions, setImportedSessions] = usePersistentState<ImportedSession[]>('importedSessions', []);
  const [targetHostname, setTargetHostname] = useState<string>('');
  
  const resetAndSetMode = useCallback((mode: AppMode) => {
    setAppMode(mode);
    setReviewProfile('none');
    setCustomReviewProfile('');
    setUserOnlyCode('');
    setCodeB('');
    setErrorMessage('');
    setComparisonGoal('');
    // Do not reset targetHostname, as it might be useful across modes
    onReset(); // Delegate resetting session-specific state to App.tsx
  }, [onReset]);

  const value: AppContextType = useMemo(() => ({
    appMode, setAppMode,
    language, setLanguage,
    reviewProfile, setReviewProfile,
    customReviewProfile, setCustomReviewProfile,
    userOnlyCode, setUserOnlyCode,
    codeB, setCodeB,
    errorMessage, setErrorMessage,
    comparisonGoal, setComparisonGoal,
    projectFiles, setProjectFiles,
    versions, setVersions,
    importedSessions, setImportedSessions,
    targetHostname, setTargetHostname,
    resetAndSetMode,
  }), [
    appMode, language, reviewProfile, customReviewProfile, userOnlyCode, 
    codeB, errorMessage, comparisonGoal, projectFiles, versions, importedSessions, targetHostname, resetAndSetMode
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};