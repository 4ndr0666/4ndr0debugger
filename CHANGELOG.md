# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.5.0] - 2024-07-28

### Added
- **Code Audit Mode**: New top-level mode to analyze code against industry-standard security frameworks (OWASP Top 10, SANS/CWE Top 25, etc.).
- **Project Files**: A central place to upload and manage files (logs, scripts, images) that can be attached to debugger or chat sessions.
- **File Attachments in Debugger & Chat**: Users can now attach one or more files from their local machine or from the new Project Files repository to provide more context to the AI.
- **URL-Based Session Sharing**: Generate a shareable URL that encodes the current session's state (code, mode, language) for easy collaboration.

### Changed
- **Debugger Mode Enhanced**: The debugger can now accept file attachments in addition to code and error messages for more comprehensive analysis.
- **UI/UX Polish**: Minor improvements to modal dialogs, buttons, and overall layout for a more consistent user experience.
- The `finalizing` type in `types.ts` has been corrected to `finalization` for consistency across the application.

## [1.4.0] - 2024-07-20

### Added
- **Comparative Revision Mode**: A new interactive workflow for comparative analysis. The AI first identifies features from both codebases, then allows the user to discuss, include, or exclude each feature before generating a final, unified version.
- **Documentation Center**: A dedicated modal for generating and managing documentation. Users can generate docs from current code or saved versions and view previously saved documentation.
- **Auto Name Generation for Versions**: Added a button in the "Save Version" modal to let the AI suggest a name for the current review or session based on its content.

### Changed
- **Gemini Model Update**: Updated `gemini-1.5-pro` to `gemini-2.5-pro` for core analysis tasks to leverage the latest model capabilities.
- **Refactored Chat Interface**: The chat UI is now more componentized and includes a dedicated context panel for displaying original code, revisions, or feature discussion points.
- **Improved System Prompts**: All system instructions have been reviewed and refined for better clarity, consistency, and AI performance across all features.

## [1.3.0] - 2024-07-12

### Added
- **Command Palette**: A new hamburger menu in the header opens a command palette, providing quick access to all major functions like switching modes, generating tests/docs, managing versions, and toggling UI panels.
- **Custom Review Profiles**: Users can now provide their own custom instructions for code reviews, in addition to the predefined profiles.
- **New Review Profiles**: Added `CTF`, `Red Team`, and `Suckless` profiles for more specialized code analysis.
- **"Show Diff" Feature**: After a review, a "Show Diff" button appears, opening a modal with a side-by-side comparison of the original and revised code.

### Changed
- **UI Overhaul**: The application UI has been redesigned with a more distinct "Electric-Glass" futuristic HUD theme, featuring glowing cyan elements, custom fonts, and improved layout.
- **Component Refactoring**: Major components like `CodeInput`, `ReviewOutput`, and modals have been refactored for better state management and reusability.

## [1.2.0] - 2024-07-05

### Added
- **Debugger Mode**: A new "Debugger" mode is now the default, allowing users to input code, an error message, and get AI-powered debugging assistance.
- **Selection-Based Actions**: Users can highlight code in the editor to trigger specific actions like "Explain Selection" or "Review Selection".
- **Commit Message Generation**: After a review results in changes, users can automatically generate a conventional commit message based on the diff.
- **Toast Notifications**: Added non-intrusive toast notifications for actions like saving versions, copying text, and session import/export.

### Security
- **Error Boundary**: Implemented an error boundary around the `CodeBlock` component to prevent app crashes from syntax highlighting errors on complex or malformed code.

## [1.1.0] - 2024-06-28

### Added
- **Comparative Analysis Mode**: Users can now input two code snippets and a shared goal to receive an optimized, merged version from the AI.
- **Follow-up Chat**: After receiving a review, users can now start a follow-up chat session to ask questions, request modifications, and iterate on the code. This feature includes chat history and the ability to generate new code revisions within the chat.
- **Session Management**: Implemented session import and export functionality, allowing users to save and load their entire workspace (code, history, saved versions) to a JSON file.

### Changed
- **State Management**: Refactored state management to use a combination of `useState` and a custom `usePersistentState` hook for saving versions to localStorage.

## [1.0.0] - 2024-06-21

### Added
- **Initial Release of 4ndr0⫌ebugger**
- **Core Code Review**: AI-powered code analysis using the Gemini API.
- **Language Support**: Support for a wide range of popular programming languages.
- **Review Profiles**: Pre-defined profiles to focus reviews on Security, Modularity, Idiomatic Code, and DRY principles.
- **Versioning**: Ability to save, load, and delete named versions of code reviews in the browser's local storage.
- **Streaming API Responses**: Feedback from the AI is streamed in real-time.
- **API Key Banner**: A banner appears if the Gemini API key is not configured.
- **Basic UI**: A functional two-panel layout for code input and review output with a futuristic dark theme.