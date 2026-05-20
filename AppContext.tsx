import React, { createContext, useState, useContext, useMemo, useCallback } from 'react';
import { AppMode, SupportedLanguage, Toast, ReviewProfile } from './types.ts';
import { SUPPORTED_LANGUAGES } from './constants.ts';
import { ToastContainer } from './Components/ToastContainer.tsx';
import { usePersistentState } from './contexts/PersistenceContext.tsx';

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
  setUserOnlyCode: React.Dispatch<React.SetStateAction<string>>;
  setCodeB: React.Dispatch<React.SetStateAction<string>>;
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>;
  setComparisonGoal: React.Dispatch<React.SetStateAction<string>>;
}
const InputContext = createContext<InputContextType | undefined>(undefined);

// 3. Actions Context: For functions that trigger state changes.
export interface ActionsContextType {
  resetAndSetMode: (mode: AppMode) => void;
}
const ActionsContext = createContext<ActionsContextType | undefined>(undefined);

// These keys represent session-specific state that should be cleared when changing modes.
const SESSION_STATE_KEYS_TO_CLEAR = [
    // from InputContext
    'input_userOnlyCode',
    'input_codeB',
    'input_errorMessage',
    'input_comparisonGoal',
    // from SessionContext
    'session_reviewFeedback',
    'session_revisedCode',
    'session_reviewedCode',
    'session_fullCodeForReview',
    'session_featureMatrix',
    'session_rawFeatureMatrixJson',
    'session_featureDecisions',
    'session_finalizationSummary',
    'session_finalizationBriefing',
    'session_isInputPanelVisible',
    'session_isChatMode',
    'session_chatHistory',
    'session_chatInputValue',
    'session_chatRevisions',
    'session_chatFiles',
    'session_chatContext',
    'session_activeFeatureForDiscussion',
    'session_adversarialReportContent',
    'session_threatVectorReport',
    'session_contextFileIds',
    'session_outputType',
];


// --- Combined Provider ---
export const GlobalStateProvider: React.FC<React.PropsWithChildren<{ onReset: () => void }>> = ({ children, onReset }) => {
  const [appMode, setAppMode] = usePersistentState<AppMode>('config_appMode', 'debug');
  const [language, setLanguage] = usePersistentState<SupportedLanguage>('config_language', SUPPORTED_LANGUAGES[0].value);
  const [reviewProfile, setReviewProfile] = usePersistentState<ReviewProfile | 'none'>('config_reviewProfile', 'none');
  const [customReviewProfile, setCustomReviewProfile] = usePersistentState<string>('config_customReviewProfile', '');
  const [userOnlyCode, setUserOnlyCode] = usePersistentState<string>('input_userOnlyCode', ''); // Code A
  const [codeB, setCodeB] = usePersistentState<string>('input_codeB', '');
  const [errorMessage, setErrorMessage] = usePersistentState<string>('input_errorMessage', '');
  const [comparisonGoal, setComparisonGoal] = usePersistentState<string>('input_comparisonGoal', '');
  const [targetHostname, setTargetHostname] = usePersistentState<string>('config_targetHostname', '');
  
  const resetAndSetMode = useCallback((mode: AppMode) => {
    // Phase 1: Atomically purge all session-related keys from physical storage
    SESSION_STATE_KEYS_TO_CLEAR.forEach(key => window.localStorage.removeItem(key));

    // Phase 2: Force global state update to reset in-memory buffers
    setAppMode(mode);
    setReviewProfile('none');
    setCustomReviewProfile('');
    setUserOnlyCode('');
    setCodeB('');
    setErrorMessage('');
    setComparisonGoal('');
    
    // Phase 3: Trigger the remount of SessionProvider via parent resetCount
    // This ensures all hooks and local state in children are re-initialized
    onReset();
  }, [onReset, setAppMode, setReviewProfile, setCustomReviewProfile, setUserOnlyCode, setCodeB, setErrorMessage, setComparisonGoal]);

  const configValue: ConfigContextType = useMemo(() => ({
    appMode, setAppMode,
    language, setLanguage,
    reviewProfile, setReviewProfile,
    customReviewProfile, setCustomReviewProfile,
    targetHostname, setTargetHostname,
  }), [appMode, language, reviewProfile, customReviewProfile, targetHostname, setAppMode, setLanguage, setReviewProfile, setCustomReviewProfile, setTargetHostname]);

  const inputValue: InputContextType = useMemo(() => ({
    userOnlyCode, setUserOnlyCode,
    codeB, setCodeB,
    errorMessage, setErrorMessage,
    comparisonGoal, setComparisonGoal,
  }), [userOnlyCode, codeB, errorMessage, comparisonGoal, setUserOnlyCode, setCodeB, setErrorMessage, setComparisonGoal]);

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