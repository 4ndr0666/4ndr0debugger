
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

export interface LanguageOption {
  value: SupportedLanguage;
  label: string;
}
    