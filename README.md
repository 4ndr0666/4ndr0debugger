# 4ndr0⫌ebugger

Welcome to the 4ndr0⫌ebugger! This application leverages the power of Google's Gemini PRO 2.5 API to provide intelligent analysis, feedback and a complete revision of your code. Submit code or code snippets in all languages, and the AI will help you identify potential bugs, suggest improvements for quality, style, offer insights and provide a complete and production ready revisision.

The application features a sleek, cyan-centric and cyberpunk-inspired UI theme I call "electric glass".

<!--
**Screenshot Placeholder:**
Consider adding a screenshot or a GIF of the application in action here.
Example:
![Application Screenshot](path/to/your/screenshot.png)
-->

## Features

*   **AI-Powered Code Analysis & Generation:** Get feedback on code quality, bugs, style, potential improvements and a completed revision using the Gemini PRO 2.5 API.
*   **Multiple Language Support:** Review code in JavaScript, Python, Java, C#, Shell Script, and many more.
*   **Structured Feedback:** AI responses are formatted in markdown for clear readability, including code block examples.
*   **Persistent Code Template:** Input your code into a predefined template, "PASTE CODE HERE", designed to provide context to the AI for more targeted reviews that are language specific.
*   **Customizable Prompts:** The underlying prompts and system instructions for the AI can be modified (see `constants.ts`).
*   **Responsive Design:** User interface adapts to various screen sizes.
*   **Thematic UI:** My unique "electric glass" dark theme provides a visually appealing experience.
*   **API Key Status Banner:** Informs the user if the Gemini API key is configured.

## Tech Stack

*   **Frontend:** React 19, TypeScript
*   **Styling:** Tailwind CSS (via CDN)
*   **AI:** Google Gemini API (`@google/genai`)
*   **Module Loading:** ES Modules via `esm.sh` for direct browser imports.

## Prerequisites

*   A modern web browser.
*   A Google Gemini API Key. You can obtain one from [Google AI Studio](https://aistudio.google.com/app/apikey).

## Setup and Installation

This project is designed to be run directly in a browser without a complex build step, thanks to CDN-hosted libraries and ES module imports.

### 1. Clone the Repository (or Download Files)

If you've cloned a repository:
```bash
git clone https://github.com/4ndr0666/4ndr0debugger
cd 4ndr0debugger
```
If you have the files directly, ensure they are in a single directory.

### 2. Configure Gemini API Key

The application requires a Gemini API key to function. It expects this key to be available as `process.env.API_KEY`. Since this is a frontend application running directly in the browser without a Node.js backend or a typical build process that injects environment variables, you need to make this key available to the browser environment.

**The recommended method for this setup is to add a script tag in `index.html` before the main application script:**

1.  Open `index.html`.
2.  Locate the `<head>` section.
3.  Before the closing `</head>` tag or just before the `<script type="module" src="/index.tsx"></script>` line in the `<body>`, add the following script block, replacing `"YOUR_GEMINI_API_KEY"` with your actual API key:

    ```html
    <script>
      window.process = {
        env: {
          API_KEY: "YOUR_GEMINI_API_KEY"
        }
      };
    </script>
    ```

    **Example placement in `index.html` (within `<head>`):**
    ```html
    <head>
      <meta charset="UTF-R-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>AI Code Reviewer</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        /* ... existing styles ... */
      </style>
      <script>
        window.process = {
          env: {
            API_KEY: "YOUR_GEMINI_API_KEY" // <--- REPLACE THIS WITH YOUR ACTUAL KEY
          }
        };
      </script>
      <script type="importmap">
      {
        "imports": {
          "react/": "https://esm.sh/react@^19.1.0/",
          "react": "https://esm.sh/react@^19.1.0",
          "@google/genai": "https://esm.sh/@google/genai@^1.0.1",
          "react-dom/": "https://esm.sh/react-dom@^19.1.0/"
        }
      }
      </script>
    </head>
    ```

    **Security Note:** Be mindful that embedding API keys directly in client-side code is generally not recommended for production applications that will be publicly hosted, as it exposes the key. For personal use or development, this method is straightforward. For public deployment, consider using a backend proxy or serverless function to manage API calls.

## Running the Application

Once the API key is configured in `index.html`:

1.  Open the `index.html` file directly in your web browser.
    *   You can usually do this by double-clicking the file or right-clicking and choosing "Open with" your preferred browser.
    *   Alternatively, you can serve the directory using a simple HTTP server (e.g., `npx serve` or Python's `http.server`) if you encounter issues with ES module loading directly from the file system, although modern browsers are generally good with `file:///` paths for ES modules.

The application should now load, and the API Key banner should indicate that the key is configured (or show an error if it's still not detected or invalid).

## How to Use

1.  **Select Language:** Choose the programming language of the code you want to review from the "Select Language" dropdown.
2.  **Paste Code:** The input area provides a template. Paste your code snippet into the section marked `PASTE CODE HERE` within the pre-filled template. The rest of the template provides instructions and context to the Gemini AI model.
3.  **Submit for Review:** Click the "Review Code" button.
4.  **View Feedback:** The AI's review will appear in the "Review Feedback" panel. This panel will show a loading indicator while the AI processes your request. Any errors during the API call will also be displayed here.

## Code Input Template

The application uses a specific template for code input. This template is defined in `components/CodeInput.tsx` and includes:
*   Code fences (```shell ... ```) where your code should be pasted.
*   A "## Summary" section with detailed instructions for the AI reviewer.
*   A list of criteria and considerations for the AI to focus on.

Pasting your code within this template helps guide the Gemini model to provide more relevant and comprehensive feedback according to the established guidelines. The user interface restricts editing to only the `PASTE CODE HERE` section.

## Customization

You can customize various aspects of the AI's behavior:

### Gemini Model and Prompts

*   **Model:** The Gemini model used is `gemini-2.5-flash-preview-04-17`, defined in `constants.ts` (`GEMINI_MODEL_NAME`). You can change this to other compatible models if needed.
*   **System Instruction:** The high-level instruction given to the AI is defined in `constants.ts` (`SYSTEM_INSTRUCTION`).
*   **Default Prompt Template:** The structure of the prompt sent to the Gemini API (which includes your code and selected language) is defined in `constants.ts` (`DEFAULT_PROMPT_TEMPLATE`).
*   **Input Code Template:** The template visible in the UI is defined in `components/CodeInput.tsx` (`fullTemplate`).

### Supported Languages

*   The list of supported languages for the dropdown is defined in `constants.ts` (`SUPPORTED_LANGUAGES`).
*   The mapping of these languages to markdown tags (for code block formatting) is in `constants.ts` (`LANGUAGE_TAG_MAP`). You can extend these lists to support more languages.

---

Enjoy using the AI Code 4ndr0⫌ebugger!
