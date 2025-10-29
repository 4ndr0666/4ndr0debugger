# 4ndr0⫌ebugger (AI Code Reviewer)

Welcome to 4ndr0⫌ebugger! This application leverages the power of Google's Gemini API, using a dual-model strategy: `gemini-2.5-pro` for deep, core analysis and `gemini-2.5-flash` for faster, auxiliary tasks. It provides intelligent analysis and feedback on your code across a suite of powerful tools designed to help you write production-ready code.

The application features a sleek, futuristic HUD (Heads-Up Display) inspired UI theme with glowing cyan elements on a black background.

## Features

*   **Multi-Mode AI Analysis:**
    *   **Debug Mode:** Provide code and an error message to get an AI-powered diagnosis and a corrected code snippet.
    *   **Single Review:** Submit code for a comprehensive review of quality, bugs, style, and potential improvements.
    *   **Comparative Analysis:** Input two codebases and a shared goal. The AI can either generate a single, merged, and optimized version or initiate an interactive revision workflow.
    *   **Code Audit Mode:** Analyze code against a selection of industry-recognized security and programming standards (e.g., OSCP, OSWE, Security+, PCAP).
    *   **Workbench Mode:** A dedicated workspace with a script editor and an AI chat. Paste any script to iteratively enhance, audit, or optimize it using intel from other tools or direct instructions.

*   **Advanced Tools & Workflows:**
    *   **Red Team Toolkit:**
        *   **Threat Vector Analysis:** Perform passive reconnaissance on a target URL. The AI infers the tech stack and generates a report of likely vulnerabilities and actionable enumeration commands.
        *   **Live Reconnaissance:** Generate a disposable 'scout' script to inject into a target's browser console, intercepting network traffic to capture live API calls and data.
        *   **Exploit Stager:** For a discovered vulnerability, generate ready-to-use `curl` commands to deliver C2 payloads (e.g., reverse shells) to the target.
        *   **Adversarial Report Generator:** Use exfiltrated recon data to have the AI write a compelling, high-impact bug bounty report.
    *   **Follow-up Chat:** After any analysis, engage in a contextual conversation with the AI to ask questions, request modifications, and iterate on the code.
    *   **Contextual Actions:** Highlight code in the editor to trigger specific actions like "Explain Selection" or "Review Selection".
    *   **Code Generators:** Automatically generate Unit Tests, Documentation, and Conventional Commit Messages based on the code and its revisions.
    *   **Diff Viewer:** See a clear, side-by-side comparison of original and AI-revised code.

*   **Project & Session Management:**
    *   **Project Files:** Upload and manage a repository of files (logs, scripts, images) that can be attached to any chat session for richer context.
    *   **Chat Attachments:** Attach local files or saved project files directly to your chat messages.
    *   **Versioning:** Save, load, and delete named versions of your reviews and sessions.
    *   **Session Import/Export:** Save and load your entire workspace (code, history, project files, saved versions) to a JSON file.
    *   **URL Sharing:** Generate a shareable URL that encodes your current session's state (code, mode, language) for easy collaboration.

*   **Customization & UI/UX:**
    *   **Multiple Language Support:** Review code in JavaScript, Python, Java, C#, Shell Script, and many more.
    *   **Customizable Review Profiles:** Focus the AI's analysis on specific areas like Security, Performance, Modularity, or provide your own custom instructions. Includes specialized profiles like `CTF`, `Red Team`, and `Suckless`.
    *   **Modern UI:** A unique, futuristic HUD theme with streaming responses, a command palette for quick access to all features, and a responsive design.
    *   **API Key Status Banner:** Informs the user if the required API key is missing from the environment.

## Tech Stack

*   **Frontend:** React, TypeScript
*   **Styling:** Tailwind CSS (via CDN)
*   **AI:** Google Gemini API (`@google/genai`)
*   **Build/Dev:** Vite
*   **Syntax Highlighting:** highlight.js

## Prerequisites

*   A modern web browser.
*   A Google Gemini API Key. You can obtain one from [Google AI Studio](https://aistudio.google.com/app/apikey).

## Setup and Running

This project uses Vite for development.

1.  **Clone the Repository**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Gemini API Key**
    The application requires a Gemini API key. Create a `.env` file in the root of the project:
    ```
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
    ```
    Replace `YOUR_GEMINI_API_KEY_HERE` with your actual key. The Vite configuration in `vite.config.ts` will make this key available to the application.

4.  **Run the Development Server**
    ```bash
    npm run dev
    ```
    The application will be available at the local URL provided by Vite (usually `http://localhost:5173`).

## How to Use

1.  **Open the App:** Navigate to the local URL after starting the dev server.
2.  **Select a Mode:** Use the segmented control to choose between "Debug", "Single Review", "Compare", "Audit", or "Workbench".
3.  **Input Code:** Paste your code into the appropriate editor panel(s).
4.  **Configure & Submit:** Select the language and an optional review profile, then click the primary action button.
5.  **View Feedback:** The input panel will collapse, and the AI's analysis will stream into the output panel.
6.  **Use Post-Review Tools:** After a review, buttons will appear for "Show Diff," "Generate Commit," "Follow-up," and "Save Version."
7.  **Manage Versions & Files:** Use the menu to access your saved versions or project files.
8.  **Session Management:** Use the import/export/share icons in the header to save, load, or share your work.


## Future Enhancements

This is a list of potential features and improvements for future development:

*   **Interactive Annotations**: Imagine if, instead of just reading the feedback, the AI's suggestions appeared as annotations directly inside the code editor. A highlight on a specific line could pop up a suggestion from the AI.
*   **One-Click Code Patching**: Taking the above idea further, each suggestion could have an "Accept" button. Clicking it would instantly apply the AI's suggested code change to the editor. This would transform the review process from a manual copy-paste task into a seamless, interactive dialogue.
*   **Multi-File Context Analysis:** Allow the user to upload or reference multiple files from a project. When reviewing one file, the AI would have the context of the others, enabling it to understand cross-file dependencies, function calls, and type definitions for more accurate and insightful reviews.

---

Enjoy using 4ndr0⫌ebugger!