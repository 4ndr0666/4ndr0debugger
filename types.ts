
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
  role: 'user' | 'model';
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
}