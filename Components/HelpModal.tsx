import React from 'react';
import { AccordionItem } from './AccordionItem.tsx';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
    >
      <div
        className="hud-container w-full max-w-3xl h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="hud-corner corner-top-left"></div>
        <div className="hud-corner corner-top-right"></div>
        <div className="hud-corner corner-bottom-left"></div>
        <div className="hud-corner corner-bottom-right"></div>
        
        <div className="flex justify-between items-center flex-shrink-0 relative">
            <h2 id="help-modal-title" className="text-xl">System Manual & Doctrines</h2>
            <button
                onClick={onClose}
                className="absolute -top-4 -right-4 p-1.5 rounded-full hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)]"
                aria-label="Close Help"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <div className="flex-grow mt-4 overflow-y-auto pr-2 space-y-2 text-sm text-[var(--hud-color-darker)]">
            <AccordionItem title="Operational Modes" defaultOpen={true}>
                <ul className="space-y-4 list-disc list-inside">
                    <li><b>Debug:</b> Provide code and an error message/context to receive a diagnosis and a corrected code snippet.
                        <blockquote className="mt-1 pl-2 border-l-2 border-[var(--hud-color-darkest)] text-xs">
                            <b>Core Principle:</b> The more context, the better the diagnosis. Always include the full error message and any relevant logs.
                        </blockquote>
                    </li>
                    <li><b>Single Review:</b> Submit a single piece of code for a comprehensive analysis of quality, style, and potential bugs.
                        <blockquote className="mt-1 pl-2 border-l-2 border-[var(--hud-color-darkest)] text-xs">
                           <b>Getting Started:</b> Paste your code, select the correct language, and choose an optional "Profile" to focus the AI's analysis.
                        </blockquote>
                    </li>
                    <li><b>Compare:</b> Provide two codebases to have the AI merge them into a single, optimized version or to begin an interactive revision workflow.
                        <blockquote className="mt-1 pl-2 border-l-2 border-[var(--hud-color-darkest)] text-xs">
                            <b>Core Principle:</b> Use "Compare & Optimize" for a direct merge, or "Compare & Revise" to discuss each identified feature before finalizing.
                        </blockquote>
                    </li>
                    <li><b>Audit:</b> Perform a comprehensive security audit on a piece of code based on industry best practices and frameworks.
                        <blockquote className="mt-1 pl-2 border-l-2 border-[var(--hud-color-darkest)] text-xs">
                            <b>Getting Started:</b> This mode is highly intensive. Provide clean, functional code for the most effective security analysis.
                        </blockquote>
                    </li>
                    <li><b>Workbench:</b> An iterative development environment. A script editor paired with an AI chat that has full context of the script, ideal for complex modifications.
                         <blockquote className="mt-1 pl-2 border-l-2 border-[var(--hud-color-darkest)] text-xs">
                           <b>Core Principle:</b> The AI always sees the code in the editor. Use the chat to give instructions or provide intel from other tools to guide its revisions.
                        </blockquote>
                    </li>
                </ul>
            </AccordionItem>
            <AccordionItem title="Red Team Toolkit">
                <ul className="space-y-4 list-disc list-inside">
                    <li><b>Threat Vector:</b> Input a target URL to receive an AI-generated analysis of the likely technology stack and potential attack surfaces.
                        <blockquote className="mt-1 pl-2 border-l-2 border-[var(--hud-color-darkest)] text-xs">
                           <b>Getting Started:</b> Provide a full URL (e.g., `https://example.com/login.php`). The AI will infer the technology and provide actionable recon commands.
                        </blockquote>
                    </li>
                    <li><b>Live Recon:</b> Generates a 'scout' script to execute in a target's browser console. It intercepts network traffic and prepares it for exfiltration.
                         <blockquote className="mt-1 pl-2 border-l-2 border-[var(--hud-color-darkest)] text-xs">
                           <b>Workflow:</b> Generate script -> Execute in target console -> Interact with site -> Call `dumpRecon()` in console -> Copy JSON output.
                        </blockquote>
                    </li>
                    <li><b>Exploit Stager:</b> For a known RCE or injection vulnerability, this tool generates `curl` commands to deliver common C2 payloads (e.g., reverse shells).
                        <blockquote className="mt-1 pl-2 border-l-2 border-[var(--hud-color-darkest)] text-xs">
                           <b>Getting Started:</b> Fill in the target endpoint, vulnerable parameter, and your listener details (LHOST/LPORT) to generate a payload delivery command.
                        </blockquote>
                    </li>
                    <li><b>Adversarial Report:</b> Uses the JSON output from the Live Recon scout to generate a high-impact, professional bug bounty report.
                        <blockquote className="mt-1 pl-2 border-l-2 border-[var(--hud-color-darkest)] text-xs">
                           <b>Workflow:</b> After running the Live Recon scout and copying the JSON data, upload the file here to generate a formatted report.
                        </blockquote>
                    </li>
                </ul>
            </AccordionItem>
             <AccordionItem title="Core Features">
                <ul className="space-y-3 list-disc list-inside">
                    <li><b>Generate Tests/Docs:</b> When a review is available, instruct the AI to generate unit tests or technical documentation for the code.</li>
                    <li><b>Follow-up Chat:</b> After any analysis, start a conversation with the AI to ask questions or request further modifications.</li>
                    <li><b>Project Files:</b> A central repository for files (logs, images, code snippets) that can be attached to any analysis for greater context.</li>
                    <li><b>Session Management:</b> Save your entire workspace (code, settings, history, project files) to a JSON file for backup or sharing. The Session Manager allows you to load these files.</li>
                </ul>
            </AccordionItem>
        </div>
      </div>
    </div>
  );
};