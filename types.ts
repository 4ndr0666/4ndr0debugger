

export enum SupportedLanguage {
  JAVASCRIPT = 'JavaScript',
  TYPESCRIPT = 'TypeScript',
  PYTHON = 'Python',
  JAVA = 'Java',
  CSHARP = 'C#',
  CPP = 'C++',
  GO = 'Go',
  RUBY = 'Ruby',
  PHP = 'PHP',
  HTML = 'HTML',
  CSS = 'CSS',
  MARKDOWN = 'Markdown',
  SQL = 'SQL',
  SHELL = 'Shell Script',
  KOTLIN = 'Kotlin',
  SWIFT = 'Swift',
  RUST = 'Rust',
  OTHER = 'Other (Generic)',
}

export enum ReviewProfile {
  SECURITY = 'Security',
  SUCKLESS = 'Suckless',
  MODULAR = 'Modular',
  IDIOMATIC = 'Idiomatic',
  DRY = 'DRY',
  CTF = 'CTF',
  REDTEAM = 'Red Team',
  CUSTOM = 'Custom',
}

export interface ProfileOption {
  value: ReviewProfile;
  label: string;
}

export interface LanguageOption {
  value: SupportedLanguage;
  label: string;
}

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  attachments?: {
    name: string;
    mimeType: string;
    content: string; // base64 for images, raw text for others
  }[];
}

export interface ChatRevision {
  id: string;
  name: string;
  code: string;
}

export interface ChatFile {
  id: string;
  name: string;
  content: string;
}

export interface Version {
  id: string;
  name: string;
  userCode: string;
  fullPrompt: string;
  feedback: string;
  language: SupportedLanguage;
  timestamp: number;
  type?: 'review' | 'docs' | 'tests' | 'commit' | 'finalization' | 'audit' | 'root-cause';
  chatHistory?: ChatMessage[];
  chatRevisions?: ChatRevision[];
  rawFeatureMatrixJson?: string | null;
  reviewProfile?: ReviewProfile | 'none';
  customReviewProfile?: string;
  comparisonGoal?: string;
  chatFiles?: ChatFile[];
  contextFileIds?: string[];
}

export interface ProjectFile {
  id: string;
  name: string;
  content: string; // Base64 for images, raw text for others
  mimeType: string;
  timestamp: number;
}

export interface Feature {
  name: string;
  description: string;
  source: 'Unique to A' | 'Unique to B' | 'Common';
}

export type FeatureDecision = 'include' | 'remove' | 'discussed';

export interface FeatureDecisionRecord {
  decision: FeatureDecision;
  history?: ChatMessage[];
  revisedSnippet?: string;
}

export type LoadingAction = 'review' | 'docs' | 'tests' | 'commit' | 'explain-selection' | 'review-selection' | 'comparison' | 'revise' | 'finalization' | 'generate-name' | 'audit' | 'root-cause' | null;

export type AppMode = 'debug' | 'single' | 'comparison' | 'audit';

export type ChatContext = 'general' | 'feature_discussion' | 'finalization';

export interface FinalizationSummary {
  included: Feature[];
  removed: Feature[];
  revised: Feature[];
}

// FIX: Added missing properties `sessionEndpoint` and `uploadEndpoint`, and reordered for consistency.
export interface TargetProfile {
  generateEndpoint: string;
  statusEndpoint: string;
  creditsEndpoint: string;
  sessionEndpoint: string;
  uploadEndpoint: string;
  authTokenKey: string;
  taskIdKey: string;
  creditAmountKey: string;
}

export interface ImportedSession {
  id: string;
  filename: string;
  importedAt: number;
  appMode: AppMode;
  language: SupportedLanguage;
  versionCount: number;
  projectFileCount: number;
  hasChatHistory: boolean;
  sessionState: any; // The full state object from the imported file
}