

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

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
}

export interface ChatRevision {
  id: string;
  name: string;
  code: string;
}

export interface Version {
  id: string;
  name: string;
  userCode: string;
  fullPrompt: string;
  feedback: string;
  language: SupportedLanguage;
  timestamp: number;
  chatRevisions?: ChatRevision[];
}

export type LoadingAction = 'review' | 'docs' | 'tests' | 'commit' | 'explain-selection' | 'review-selection' | 'comparison' | null;

export type AppMode = 'debug' | 'single' | 'comparison';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}