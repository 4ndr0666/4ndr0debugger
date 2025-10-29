import React, { createContext, useContext, useMemo } from 'react';
import { FeatureFlags } from '../types.ts';
import { usePersistentState } from './PersistenceContext.tsx';

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  red_team_tools: true,
  workbench_mode: true,
  code_audit_mode: true,
  multi_file_context: true,
  experimental_features: false,
};

interface FeatureFlagsContextType {
  featureFlags: FeatureFlags;
  setFeatureFlags: React.Dispatch<React.SetStateAction<FeatureFlags>>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

export const FeatureFlagsProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [featureFlags, setFeatureFlags] = usePersistentState<FeatureFlags>('featureFlags_v2', DEFAULT_FEATURE_FLAGS);

  const value = useMemo(() => ({
    featureFlags,
    setFeatureFlags,
  }), [featureFlags, setFeatureFlags]);

  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
};

export const useFeatureFlags = (): FeatureFlagsContextType => {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
};
