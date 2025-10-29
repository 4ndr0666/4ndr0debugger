import React, { createContext, useState, useContext, useMemo, useCallback } from 'react';
import { AppMode, SupportedLanguage, Toast, ReviewProfile } from './types.ts';
import { SUPPORTED_LANGUAGES } from './constants.ts';
import { ToastContainer } from './Components/ToastContainer.tsx';

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


// --- Refactored App Contexts ---

// 1. Config Context: For global settings that change infrequently.
export interface ConfigContextType {
  appMode: AppMode;
  language: SupportedLanguage;
  reviewProfile: ReviewProfile | 'none';
  customReviewProfile: string;
  targetHostname: string;
  setAppMode: React.Dispatch<React.SetStateAction<AppMode>>;
  setLanguage: React.Dispatch<React.SetStateAction<SupportedLanguage>>;
  setReviewProfile: React.Dispatch<React.SetStateAction<ReviewProfile | 'none'>>;
  setCustomReviewProfile: React.Dispatch<React.SetStateAction<string>>;
  setTargetHostname: React.Dispatch<React.SetStateAction<string>>;
}
const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

// 2. Input Context: For user-provided data that changes often.
export interface InputContextType {
  userOnlyCode: string; // Code A
  codeB: string;
  errorMessage: string;
  comparisonGoal: string;
  workbenchScript: string;
  setUserOnlyCode: React.Dispatch<React.SetStateAction<string>>;
  setCodeB: React.Dispatch<React.SetStateAction<string>>;
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>;
  setComparisonGoal: React.Dispatch<React.SetStateAction<string>>;
  setWorkbenchScript: React.Dispatch<React.SetStateAction<string>>;
}
const InputContext = createContext<InputContextType | undefined>(undefined);

// 3. Actions Context: For functions that trigger state changes.
export interface ActionsContextType {
  resetAndSetMode: (mode: AppMode) => void;
}
const ActionsContext = createContext<ActionsContextType | undefined>(undefined);


// --- Combined Provider ---
export const GlobalStateProvider: React.FC<React.PropsWithChildren<{ onReset: () => void }>> = ({ children, onReset }) => {
  const [appMode, setAppMode] = useState<AppMode>('debug');
  const [language, setLanguage] = useState<SupportedLanguage>(SUPPORTED_LANGUAGES[0].value);
  const [reviewProfile, setReviewProfile] = useState<ReviewProfile | 'none'>('none');
  const [customReviewProfile, setCustomReviewProfile] = useState<string>('');
  const [userOnlyCode, setUserOnlyCode] = useState<string>(''); // Code A
  const [codeB, setCodeB] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [comparisonGoal, setComparisonGoal] = useState<string>('');
  const [targetHostname, setTargetHostname] = useState<string>('');
  const [workbenchScript, setWorkbenchScript] = useState<string>('// Paste your script here to begin analysis...');
  
  const resetAndSetMode = useCallback((mode: AppMode) => {
    setAppMode(mode);
    setReviewProfile('none');
    setCustomReviewProfile('');
    setUserOnlyCode('');
    setCodeB('');
    setErrorMessage('');
    setComparisonGoal('');
    setWorkbenchScript('// Paste your script here to begin analysis...');
    onReset();
  }, [onReset]);

  const configValue: ConfigContextType = useMemo(() => ({
    appMode, setAppMode,
    language, setLanguage,
    reviewProfile, setReviewProfile,
    customReviewProfile, setCustomReviewProfile,
    targetHostname, setTargetHostname,
  }), [appMode, language, reviewProfile, customReviewProfile, targetHostname]);

  const inputValue: InputContextType = useMemo(() => ({
    userOnlyCode, setUserOnlyCode,
    codeB, setCodeB,
    errorMessage, setErrorMessage,
    comparisonGoal, setComparisonGoal,
    workbenchScript, setWorkbenchScript,
  }), [userOnlyCode, codeB, errorMessage, comparisonGoal, workbenchScript]);

  const actionsValue: ActionsContextType = useMemo(() => ({
    resetAndSetMode,
  }), [resetAndSetMode]);

  return (
    <ActionsContext.Provider value={actionsValue}>
      <ConfigContext.Provider value={configValue}>
        <InputContext.Provider value={inputValue}>
          {children}
        </InputContext.Provider>
      </ConfigContext.Provider>
    </ActionsContext.Provider>
  );
};


// --- Custom Hooks for Consumption ---
export const useConfigContext = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (!context) throw new Error('useConfigContext must be used within a GlobalStateProvider');
  return context;
};

export const useInputContext = (): InputContextType => {
  const context = useContext(InputContext);
  if (!context) throw new Error('useInputContext must be used within a GlobalStateProvider');
  return context;
};

export const useActionsContext = (): ActionsContextType => {
  const context = useContext(ActionsContext);
  if (!context) throw new Error('useActionsContext must be used within a GlobalStateProvider');
  return context;
};