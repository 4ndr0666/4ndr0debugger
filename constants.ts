
import { LanguageOption, SupportedLanguage } from './types';

export const GEMINI_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';

export const SYSTEM_INSTRUCTION = "You are an expert AI code reviewer. Your feedback should be constructive, clear, precise, and actionable. Focus on code quality, best practices, potential bugs, security vulnerabilities, and performance optimizations. When suggesting changes, provide brief explanations and, if appropriate, example code snippets. Format your review clearly using markdown, including code blocks for examples.";

export const DEFAULT_PROMPT_TEMPLATE = `Please act as an expert code reviewer. Review the following {language} code for potential bugs, security vulnerabilities, performance issues, adherence to best practices, and areas for improvement. Provide clear, constructive, and actionable feedback. If possible, suggest code snippets for improvements. Format your review using markdown.

Code:
\`\`\`{language_tag}
{code}
\`\`\`
`;

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { value: SupportedLanguage.JAVASCRIPT, label: 'JavaScript' },
  { value: SupportedLanguage.TYPESCRIPT, label: 'TypeScript' },
  { value: SupportedLanguage.PYTHON, label: 'Python' },
  { value: SupportedLanguage.JAVA, label: 'Java' },
  { value: SupportedLanguage.CSHARP, label: 'C#' },
  { value: SupportedLanguage.CPP, label: 'C++' },
  { value: SupportedLanguage.GO, label: 'Go' },
  { value: SupportedLanguage.RUBY, label: 'Ruby' },
  { value: SupportedLanguage.PHP, label: 'PHP' },
  { value: SupportedLanguage.HTML, label: 'HTML' },
  { value: SupportedLanguage.CSS, label: 'CSS' },
  { value: SupportedLanguage.MARKDOWN, label: 'Markdown' },
  { value: SupportedLanguage.SQL, label: 'SQL' },
  { value: SupportedLanguage.SHELL, label: 'Shell Script' },
  { value: SupportedLanguage.KOTLIN, label: 'Kotlin' },
  { value: SupportedLanguage.SWIFT, label: 'Swift' },
  { value: SupportedLanguage.RUST, label: 'Rust' },
  { value: SupportedLanguage.OTHER, label: 'Other' },
];

// Simple map for language tag in markdown
export const LANGUAGE_TAG_MAP: Record<SupportedLanguage, string> = {
  [SupportedLanguage.JAVASCRIPT]: 'javascript',
  [SupportedLanguage.TYPESCRIPT]: 'typescript',
  [SupportedLanguage.PYTHON]: 'python',
  [SupportedLanguage.JAVA]: 'java',
  [SupportedLanguage.CSHARP]: 'csharp',
  [SupportedLanguage.CPP]: 'cpp',
  [SupportedLanguage.GO]: 'go',
  [SupportedLanguage.RUBY]: 'ruby',
  [SupportedLanguage.PHP]: 'php',
  [SupportedLanguage.HTML]: 'html',
  [SupportedLanguage.CSS]: 'css',
  [SupportedLanguage.MARKDOWN]: 'markdown',
  [SupportedLanguage.SQL]: 'sql',
  [SupportedLanguage.SHELL]: 'bash',
  [SupportedLanguage.KOTLIN]: 'kotlin',
  [SupportedLanguage.SWIFT]: 'swift',
  [SupportedLanguage.RUST]: 'rust',
  [SupportedLanguage.OTHER]: '',
};
    