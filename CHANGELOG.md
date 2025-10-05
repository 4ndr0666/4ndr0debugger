# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.8.0] - 2024-08-15

### Added
- **Project File Management**: Implemented a full-featured project file system. Users can now upload files (text, images, etc.) to a persistent local repository, accessible via the "Project Files" modal in the command palette.
- **View, Download, & Delete Project Files**: The new modal allows users to view all their uploaded project files, download any file back to their machine, and permanently delete files from the repository.
- **Chat Attachments**: Implemented the ability to attach files to chat sessions. Users can attach new files from their local machine or select existing files from their project repository. Attached files are previewed above the chat input before being sent.

## [1.7.5] - 2024-08-14

### Added
- **Version History**: Implemented a full-featured version history system. Users can now save, load, rename, and delete past sessions from a dedicated modal. This includes restoring code, review feedback, and full chat histories to seamlessly continue work from any saved point.
- **Contextual Follow-up**: Starting a "Follow-up" chat from a saved version now correctly loads the full context of that session, allowing for a seamless continuation of the conversation.

### Changed
- **Session Saving**: Saving a version that includes a chat session now stores the full, structured chat history, enabling perfect state restoration when loaded.

## [1.7.2] - 2024-08-12

### Fixed
- **Toast Animation**: Corrected the toast animation to restore the slide-in entrance animation while keeping the "zap" effect for the exit animation only. The previous change had incorrectly removed the entrance transition.

## [1.7.1] - 2024-08-11

### Changed
- **Toast "Zap" Animation**: Updated the toast notification's dismissal animation to a "zap" effect. Instead of sliding off-screen, it now quickly shrinks horizontally and fades out for a sharper, more thematic feel.

## [1.6.9] - 2024-08-10

### Changed
- **Toast UI Refinement**: Adjusted the toast notification's background to be nearly transparent by reducing its opacity, further enhancing the layered HUD aesthetic while maintaining readability.

## [1.6.7] - 2024-08-09

### Changed
- **Toast Notification UI**: Refined the toast notification component to better align with the overall HUD aesthetic. The new design removes the custom clip-path in favor of the standard `hud-container` corner decorations, uses a consistent blurred background, and improves icon alignment for a cleaner, more integrated look.

## [1.6.6] - 2024-08-08

### Added
- **Generate Unit Tests**: Implemented the "Generate Unit Tests" feature, accessible from the command palette. It uses the AI to create a test suite for the code currently in the editor.
- **Generate Commit Message**: After a review that results in changes, a "Generate Commit" button now appears, which uses the AI to create a conventional commit message based on the code diff.
- **Finalize Comparative Revision**: The "Compare & Revise" workflow can now be completed. After making decisions on all features, the "Finalize Revision" button will instruct the AI to generate a single, unified codebase based on the plan.
- **Downloadable Documentation**: Generated documentation can now be downloaded as a `.md` file directly from the output panel.
- **Auto-Generate Version Name**: The "Save Version" modal now includes a button to ask the AI to suggest a concise, descriptive name for the session, streamlining the saving process.

### Changed
- **Toast Notification Redesign**: The toast notifications have been completely restyled to match the application's futuristic HUD aesthetic, featuring a custom shape, themed colors, and a shorter display duration for a more polished user experience.

## [1.6.5] - 2024-08-07

### Fixed
- **Chat Session Import**: Corrected a major bug where importing a session file containing a chat history would incorrectly load the standard code editor instead of the chat interface. The application now properly restores the chat view, displaying the full conversation history as intended.
- **Component Prop-Drilling**: Resolved an issue where essential props were not being passed down to child components (`CodeInput`, `ComparisonInput`), leading to the session import bug and other potential instabilities.

### Changed
- **Session Manager Accessibility**: The "Session Manager" is now accessible from the main command palette (hamburger menu), providing a more intuitive and centralized location for managing imported sessions. The redundant "Import" icon has been removed from the main header.

## [1.6.4] - 2024-08-06

### Changed
- **Refactored Session Management**: Improved the internal logic for importing and loading sessions in `App.tsx`. The code is now better organized and more maintainable, ensuring that session files are processed and their state is restored more reliably.

## [1.6.3] - 2024-08-05

### Changed
- **Smarter Session Loading**: When loading a session, the application now only enters chat mode if the session file actually contains a chat history. This prevents an empty chat interface from appearing for non-chat sessions.
- **Context-Aware Command Menu**: The command palette is now more dynamic. "Follow-up Chat" only appears when a review is available and you're not already in a chat, and "End & Save Chat" only appears when you are in a chat.

## [1.6.2] - 2024-08-04

### Changed
- **Improved Session Loading**: Refactored the session loading logic in `App.tsx` to be more robust. When loading a session, the application now more reliably enters chat mode if a chat history exists, ensuring a seamless continuation of conversations.

## [1.6.1] - 2024-08-03

### Changed
- **Improved Session Import Workflow**: Importing a session now correctly transitions the application into the appropriate state. If the session contains a chat history, it will open directly in the chat interface. Otherwise, it will show the standard review/input panels.
- **Contextual Menu Actions**: The command palette menu is now more intelligent. It will only show "Follow-up Chat" when a review is available and no chat is active. Conversely, "End & Save Chat" is only shown when a chat session is active. This prevents starting a new chat over an imported one.
- **UI Consistency**: The "load" icon used for sessions, versions, and documents has been updated to a floppy disk icon for better visual recognition.

## [1.6.0] - 2024-08-02

### Added
- **Multi-File Context Analysis**: Users can now select any uploaded Project Files to be included as context for a code review, comparison, or audit. This allows the AI to understand cross-file dependencies and provide more accurate, project-aware feedback.
- **AI-Powered Root Cause Analysis**: In Debugger mode, after a fix is generated, a new "Analyze Root Cause" button appears. This triggers a deeper analysis from the AI to explain the underlying architectural or logical flaw that led to the bug, promoting better understanding and prevention.

### Changed
- Refactored the main request handler in `App.tsx` to properly accommodate prompts that include context from multiple files.
- Input panels for all modes now include the new "Context Files" selector, allowing for a more integrated analysis workflow.
- Session management (export/import) now includes the list of selected context files, ensuring a complete restoration of the workspace.

## [1.5.4] - 2024-08-01

### Changed
- **Enriched Version Saving**: Saved versions now include additional metadata from the session, such as the selected review profile, custom instructions, comparison goal, and any generated chat files. This ensures that loading a version more accurately restores the full context of the work.

## [1.5.3] - 2024-07-31

### Added
- **Session Manager**: A new modal for managing imported sessions. Users can now import multiple session files and see them in a list, with options to load or remove any session. This provides a much-improved workflow for handling shared or backed-up sessions.

### Changed
- **Session Import Workflow**: The "Import Session" button in the header now opens the new Session Manager instead of directly opening a file dialog. This prevents accidental overwrites of the current session and provides better context for imported files.

### Fixed
- **App State on Import**: The process of loading an imported session's state is now more robust and correctly updates all relevant parts of the application, including chat history, project files, and comparison mode data.

## [1.5.2] - 2024-07-30

### Fixed
- **Session Import for Chats**: Importing a session file containing a chat history now correctly loads and displays the chat interface, providing a seamless user experience.
- **End & Save Chat**: The "End & Save Chat" button is now fully functional, allowing users to properly save their chat sessions as a new version.
- **Chat Component Stability**: Resolved TypeScript errors in `ChatInterface` and `ChatContext` by making several props optional to align with their usage in parent components, preventing potential runtime issues.

## [1.5.1] - 2024-07-29

### Fixed
- **Import/Export Functionality**: Corrected a regression where session import/export was non-functional. The session format now includes a version number (`1.5.0`) for backward compatibility, and the import process is hardened to handle older session files gracefully.
- **Missing Chat Properties**: Resolved crashes in `CodeInput` and `ComparisonInput` by correctly passing required props (`onNewReview`, `language`, `codeB`) to the `ChatInterface` component.
- **Session State Error**: Fixed a reference error in `App.tsx` by destructuring `errorMessage` from context, ensuring session export and sharing work correctly.
- **Type Errors**: Corrected various TypeScript errors across multiple components (`Button`, `ChatContext`, `ChatInterface`, `ErrorBoundary`, `MarkdownRenderer`, `ProjectFilesModal`, `Toast`) for improved type safety and stability.

### Changed
- **Header Functionality**: Wired up all previously unimplemented handlers in the `Header` component for features like generating tests, opening modals, and managing chat sessions.
- **Code Selection Handlers**: Implemented the `onExplainSelection` and `onReviewSelection` handlers in `App.tsx` to enable contextual actions on highlighted code.
- **Session Sharing**: The "Share" feature now correctly generates a URL that captures the current session's state.

### Removed
- Removed several outdated "FIX" comments from the codebase where the underlying issues had already been resolved.

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