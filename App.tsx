import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat, Type } from "@google/genai";
import { Header } from './components/Header';
import { CodeInput } from './components/CodeInput';
import { ReviewOutput } from './components/ReviewOutput';
import { SupportedLanguage, ChatMessage, Version, ReviewProfile, LoadingAction } from './types';
import { SUPPORTED_LANGUAGES, GEMINI_MODEL_NAME, SYSTEM_INSTRUCTION, DOCS_SYSTEM_INSTRUCTION, PROFILE_SYSTEM_INSTRUCTIONS, GENERATE_TESTS_INSTRUCTION, EXPLAIN_CODE_INSTRUCTION, REVIEW_SELECTION_INSTRUCTION, COMMIT_MESSAGE_SYSTEM_INSTRUCTION, DOCS_INSTRUCTION, COMPARISON_SYSTEM_INSTRUCTION, generateComparisonTemplate, generateDocsTemplate } from './constants';
import { Button } from './components/Button';
import { DiffViewer } from './components/DiffViewer';
import { ChatContext } from './components/ChatContext';
import { ComparisonInput } from './components/ComparisonInput';
import { VersionHistoryModal } from './components/VersionHistoryModal';

type OutputType = LoadingAction;
type ActivePanel = 'input' | 'output';
type AppMode = 'single' | 'comparison';

// --- Save Version Modal Component ---
interface SaveVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  versionName: string;
  setVersionName: (name: string) => void;
}

const SaveVersionModal: React.FC<SaveVersionModalProps> = ({ isOpen, onClose, onSave, versionName, setVersionName }) => {
  if (!isOpen) return null;

  const handleSaveClick = () => {
    if (versionName.trim()) {
      onSave();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveClick();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 transition-opacity duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-modal-title"
    >
      <div 
        className="bg-[#101827] rounded-lg shadow-xl shadow-[#156464]/50 w-full max-w-md p-6 border border-[#15adad]/60"
        onClick={e => e.stopPropagation()} // Prevent clicks inside from closing the modal
      >
        <h2 id="save-modal-title" className="text-xl font-semibold text-center mb-4 font-heading">
           <span style={{
              background: 'linear-gradient(to right, #15fafa, #15adad, #157d7d)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}>
            Save Version
          </span>
        </h2>
        <div className="space-y-4">
          <label htmlFor="version-name" className="block text-sm font-medium text-[#a0f0f0]">
            Version Name
          </label>
          <input
            id="version-name"
            type="text"
            value={versionName}
            onChange={(e) => setVersionName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="block w-full p-2.5 font-sans text-sm text-[#e0ffff] bg-[#070B14] border border-[#15adad]/70 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#15ffff] focus:border-[#15ffff]"
            placeholder="e.g., Initial Refactor"
            autoFocus
          />
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSaveClick} disabled={!versionName.trim()}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  // --- Mode State ---
  const [appMode, setAppMode] = useState<AppMode>('single');
  
  // --- Working State (shared across modes) ---
  const [language, setLanguage] = useState<SupportedLanguage>(SUPPORTED_LANGUAGES[0].value);
  const [reviewFeedback, setReviewFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
  const [outputType, setOutputType] = useState<OutputType>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewedCode, setReviewedCode] = useState<string | null>(null); // The "before" code for a review
  const [revisedCode, setRevisedCode] = useState<string | null>(null); // The "after" code from a review
  const [fullCodeForReview, setFullCodeForReview] = useState<string>('');
  
  // --- Single Review Mode State ---
  const [userOnlyCode, setUserOnlyCode] = useState<string>('');
  const [reviewProfile, setReviewProfile] = useState<ReviewProfile | 'none'>('none');

  // --- Comparison Mode State ---
  const [codeB, setCodeB] = useState<string>('');
  const [comparisonGoal, setComparisonGoal] = useState<string>('');

  // --- View & Chat State ---
  const [isChatMode, setIsChatMode] = useState<boolean>(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [activePanel, setActivePanel] = useState<ActivePanel>('input');
  
  // --- Versioning State ---
  const [versions, setVersions] = useState<Version[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isVersionHistoryModalOpen, setIsVersionHistoryModalOpen] = useState(false);
  const [versionName, setVersionName] = useState('');
  
  const [ai] = useState(() => process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isReviewContextCurrent = reviewedCode !== null && (appMode === 'single' ? userOnlyCode === reviewedCode : true);
  const reviewAvailable = !!reviewFeedback && isReviewContextCurrent;
  const commitMessageAvailable = !!reviewedCode && !!revisedCode && reviewedCode !== revisedCode;
  const canSaveReview = !!reviewFeedback && !isChatMode && !isLoading && !error;

  // Load versions from localStorage on initial render
  useEffect(() => {
    try {
      const savedVersions = localStorage.getItem('codeReviewVersions');
      if (savedVersions) {
        setVersions(JSON.parse(savedVersions));
      }
    } catch (e) {
      console.error("Failed to load versions from localStorage", e);
    }
  }, []);

  // Save versions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('codeReviewVersions', JSON.stringify(versions));
    } catch (e) {
      console.error("Failed to save versions to localStorage", e);
    }
  }, [versions]);

  const getSystemInstructionForReview = useCallback(() => {
    let instruction = SYSTEM_INSTRUCTION;
    if (reviewProfile && reviewProfile !== 'none' && PROFILE_SYSTEM_INSTRUCTIONS[reviewProfile]) {
        instruction += `\n\n## Special Focus: ${reviewProfile}\n${PROFILE_SYSTEM_INSTRUCTIONS[reviewProfile]}`;
    }
    return instruction;
  }, [reviewProfile]);


  const performStreamingRequest = async (fullCode: string, systemInstruction: string) => {
    if (!ai) {
      setError("Error: API Key not configured.");
      setIsLoading(false);
      setLoadingAction(null);
      return;
    }
    try {
      setReviewFeedback(''); // Start with an empty string for streaming
      const responseStream = await ai.models.generateContentStream({
        model: GEMINI_MODEL_NAME,
        contents: fullCode,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.3,
        },
      });

      let fullResponse = "";
      for await (const chunk of responseStream) {
        fullResponse += chunk.text;
        setReviewFeedback(fullResponse);
      }
      return fullResponse;
    } catch (apiError) {
      console.error("API Error:", apiError);
      const message = apiError instanceof Error ? apiError.message : "An unexpected error occurred.";
      setError(`Failed to get review: ${message}`);
      setReviewFeedback(null);
      setReviewedCode(null);
      setRevisedCode(null);
      return null;
    }
  };

  const resetForNewRequest = () => {
    setError(null);
    setReviewFeedback(null);
    setIsChatMode(false);
    setChatHistory([]);
    setChatSession(null);
    setActivePanel('output');
    setReviewedCode(null);
    setRevisedCode(null);
  }

  const extractFinalCodeBlock = (response: string) => {
    const finalCodeRegex = /```(?:[a-zA-Z0-9-]*)\n([\s\S]*?)\n```$/;
    const match = finalCodeRegex.exec(response);
    return match && match[1] ? match[1].trim() : null;
  }

  const handleReviewSubmit = useCallback(async (fullCodeToSubmit: string) => {
    setIsLoading(true);
    setLoadingAction('review');
    setOutputType('review');
    resetForNewRequest();
    setFullCodeForReview(fullCodeToSubmit);
    setReviewedCode(userOnlyCode);
    
    const fullResponse = await performStreamingRequest(fullCodeToSubmit, getSystemInstructionForReview());

    if (fullResponse) {
        setRevisedCode(extractFinalCodeBlock(fullResponse));
    }

    setIsLoading(false);
    setLoadingAction(null);
  }, [ai, getSystemInstructionForReview, userOnlyCode]);

  const handleCompareAndOptimize = useCallback(async () => {
    setIsLoading(true);
    setLoadingAction('comparison');
    setOutputType('comparison');
    resetForNewRequest();

    const prompt = generateComparisonTemplate(language, comparisonGoal, userOnlyCode, codeB);
    setFullCodeForReview(prompt); // Save for versioning
    setReviewedCode(userOnlyCode); // Set Code A as the "before" for diffing

    const fullResponse = await performStreamingRequest(prompt, COMPARISON_SYSTEM_INSTRUCTION);
    
    if (fullResponse) {
        setRevisedCode(extractFinalCodeBlock(fullResponse));
    }
    
    setIsLoading(false);
    setLoadingAction(null);
  }, [ai, language, comparisonGoal, userOnlyCode, codeB]);


  const handleGenerateDocs = useCallback(async () => {
    if (appMode !== 'single' || !userOnlyCode.trim() || isChatMode) return;
    setIsLoading(true);
    setLoadingAction('docs');
    setOutputType('docs');
    resetForNewRequest();
    
    const template = generateDocsTemplate(language);
    const fullCodeToSubmit = template.replace('PASTE CODE HERE', userOnlyCode);

    setFullCodeForReview(fullCodeToSubmit);
    setReviewedCode(userOnlyCode);
    
    await performStreamingRequest(fullCodeToSubmit, DOCS_SYSTEM_INSTRUCTION);

    setIsLoading(false);
    setLoadingAction(null);
  }, [ai, userOnlyCode, language, appMode, isChatMode]);

  const handleGenerateTests = useCallback(async () => {
    if (appMode !== 'single' || !userOnlyCode.trim() || isChatMode) return;
    setIsLoading(true);
    setLoadingAction('tests');
    setOutputType('tests');
    resetForNewRequest();
    setReviewedCode(userOnlyCode);

    const prompt = `${GENERATE_TESTS_INSTRUCTION}\n\n\`\`\`${language}\n${userOnlyCode}\n\`\`\``;
    await performStreamingRequest(prompt, SYSTEM_INSTRUCTION);

    setIsLoading(false);
    setLoadingAction(null);
  }, [ai, userOnlyCode, language, appMode, isChatMode]);
  
  const handleExplainSelection = useCallback(async (selection: string) => {
    setIsLoading(true);
    setLoadingAction('explain-selection');
    setOutputType('explain-selection');
    resetForNewRequest();

    const prompt = `${EXPLAIN_CODE_INSTRUCTION}\n\n\`\`\`${language}\n${selection}\n\`\`\``;
    await performStreamingRequest(prompt, SYSTEM_INSTRUCTION);

    setIsLoading(false);
    setLoadingAction(null);
  }, [ai, language]);
  
  const handleReviewSelection = useCallback(async (selection: string) => {
    setIsLoading(true);
    setLoadingAction('review-selection');
    setOutputType('review-selection');
    resetForNewRequest();

    const prompt = `${REVIEW_SELECTION_INSTRUCTION}\n\n\`\`\`${language}\n${selection}\n\`\`\``;
    await performStreamingRequest(prompt, getSystemInstructionForReview());

    setIsLoading(false);
    setLoadingAction(null);
  }, [ai, language, getSystemInstructionForReview]);

  const handleGenerateCommitMessage = useCallback(async () => {
      if (!ai || !reviewedCode || !revisedCode) {
          setError("Cannot generate commit message. Original or revised code is missing.");
          return;
      }
      
      setIsLoading(true);
      setLoadingAction('commit');
      setOutputType('commit');
      resetForNewRequest();

      const schema = {
          type: Type.OBJECT,
          properties: {
              type: { type: Type.STRING, description: "The conventional commit type (e.g., feat, fix, chore, refactor)." },
              scope: { type: Type.STRING, description: "Optional scope of the change (e.g., api, db, ui)."},
              subject: { type: Type.STRING, description: "A short, imperative-mood summary of the change, under 50 chars." },
              body: { type: Type.STRING, description: "A longer, detailed description of the changes and motivation. Use markdown newlines." }
          },
          required: ['type', 'subject', 'body']
      };

      const prompt = `Based on the following code changes, generate a conventional commit message.\n\n### Original Code:\n\`\`\`${language}\n${reviewedCode}\n\`\`\`\n\n### Revised Code:\n\`\`\`${language}\n${revisedCode}\n\`\`\``;

      try {
          const response = await ai.models.generateContent({
              model: GEMINI_MODEL_NAME,
              contents: prompt,
              config: {
                  systemInstruction: COMMIT_MESSAGE_SYSTEM_INSTRUCTION,
                  responseMimeType: 'application/json',
                  responseSchema: schema,
              }
          });
          
          const jsonResponse = JSON.parse(response.text);
          const { type, scope, subject, body } = jsonResponse;
          const scopeText = scope ? `(${scope})` : '';
          
          const header = `${type}${scopeText}: ${subject}`;
          const fullGitCommand = `git commit -m "${header}" -m "${body.replace(/"/g, '\\"')}"`;

          const formattedMarkdown = `### Suggested Commit Message\n\n**${header}**\n\n${body.replace(/\n/g, '\n\n')}\n\n---\n\n#### As a git command:\n\`\`\`bash\n${fullGitCommand}\n\`\`\``;
          setReviewFeedback(formattedMarkdown);

      } catch (apiError) {
          console.error("Commit Message API Error:", apiError);
          const message = apiError instanceof Error ? apiError.message : "An unexpected error occurred.";
          setError(`Failed to generate commit message: ${message}`);
          setReviewFeedback(null);
      } finally {
          setIsLoading(false);
          setLoadingAction(null);
      }
  }, [ai, reviewedCode, revisedCode, language]);


  const handleStartFollowUp = useCallback((version?: Version) => {
    const contextFeedback = version ? version.feedback : reviewFeedback;
    const contextCode = version ? version.fullPrompt : fullCodeForReview;
    const contextUserCode = version ? version.userCode : userOnlyCode;
    
    if (!contextFeedback || !contextCode || !ai) return;

    // Set the state needed for the chat context panel
    setReviewedCode(contextUserCode);
    setReviewFeedback(contextFeedback);
    
    let selectionText = '';
    if (!version) {
      const selection = window.getSelection();
      if (selection && selection.toString().trim() !== '') {
        const selectedNode = selection.anchorNode;
        if (selectedNode?.parentElement?.closest('#review-output-content')) {
          selectionText = selection.toString().trim();
        }
      }
    }

    const historyForAPI = [
      { role: 'user' as const, parts: [{ text: contextCode }] },
      { role: 'model' as const, parts: [{ text: contextFeedback }] }
    ];

    const historyForUI: ChatMessage[] = [];
    
    if (version) {
        historyForUI.push({ role: 'model', content: `Starting a follow-up about version: **"${version.name}"**.\n\nWhat would you like to ask?` });
    } else if (selectionText) {
      const followUpContext = `My follow-up question is about this specific part of your code revision:\n\n\`\`\`\n${selectionText}\n\`\`\``;
      historyForAPI.push({ role: 'user' as const, parts: [{ text: followUpContext }] });
      const uiConfirmation = `Okay, let's talk about this snippet:\n\n\`\`\`\n${selectionText}\n\`\`\``;
      historyForUI.push({ role: 'model', content: uiConfirmation });
    } else {
      historyForUI.push({ role: 'model', content: "What would you like to ask about the review?" });
    }

    const newChat = ai.chats.create({ 
      model: GEMINI_MODEL_NAME, 
      history: historyForAPI,
      config: {
        systemInstruction: getSystemInstructionForReview(),
      }
    });

    setChatSession(newChat);
    setChatHistory(historyForUI);
    setIsChatMode(true);
    setActivePanel('input');
  }, [reviewFeedback, fullCodeForReview, ai, getSystemInstructionForReview, userOnlyCode]);

  const handleFollowUpSubmit = useCallback(async (message: string) => {
    if (!chatSession) return;
    setIsChatLoading(true);
    setError(null);
    setChatHistory(prev => [...prev, { role: 'user', content: message }]);
    setActivePanel('input');
    
    try {
      setChatHistory(prev => [...prev, { role: 'model', content: '' }]); // Add empty placeholder
      
      const responseStream = await chatSession.sendMessageStream({ message });
      
      let currentResponse = "";
      for await (const chunk of responseStream) {
        currentResponse += chunk.text;
        setChatHistory(prev => {
          const newHistory = [...prev];
          newHistory[newHistory.length - 1] = { role: 'model', content: currentResponse };
          return newHistory;
        });
      }
      
    } catch (apiError) {
      console.error("Chat API Error:", apiError);
      const message = apiError instanceof Error ? apiError.message : "An unexpected error occurred.";
      setError(`Failed to get response: ${message}`);
      setChatHistory(prev => prev.slice(0, -1)); // Remove the empty placeholder on error
    } finally {
      setIsChatLoading(false);
    }
  }, [chatSession]);

  const handleNewReview = () => {
    setAppMode('single');
    setIsChatMode(false);
    setReviewFeedback(null);
    setError(null);
    setOutputType(null);
    setChatSession(null);
    setChatHistory([]);
    setUserOnlyCode('');
    setReviewedCode(null);
    setRevisedCode(null);
    setActivePanel('input');
    setCodeB('');
    setComparisonGoal('');
  };

  const handleStartComparison = () => {
    setAppMode('comparison');
  };

  const handleOpenSaveModal = () => {
    if (!canSaveReview) return;
    setVersionName(`Result ${new Date().toLocaleString()}`);
    setIsSaveModalOpen(true);
  };

  const handleConfirmSaveVersion = () => {
    if (!versionName.trim() || !reviewFeedback || !fullCodeForReview) return;
    
    const newVersion: Version = {
      id: `v_${Date.now()}`,
      name: versionName.trim(),
      userCode: userOnlyCode, // In comparison mode, this is Code A
      fullPrompt: fullCodeForReview,
      feedback: reviewFeedback,
      language,
      timestamp: Date.now(),
    };

    setVersions(prevVersions => [newVersion, ...prevVersions]);
    setIsSaveModalOpen(false);
    setVersionName('');
  };
  
  const handleLoadVersion = (version: Version) => {
    handleNewReview(); // Reset everything first

    setUserOnlyCode(version.userCode);
    setLanguage(version.language);
    setFullCodeForReview(version.fullPrompt);
    setReviewFeedback(version.feedback);
    setReviewedCode(version.userCode);
    setRevisedCode(null); // Cannot determine revised code from old version
    setActivePanel('output');
    
    // Determine which mode this version was from
    if (version.fullPrompt.includes('### Codebase B')) {
      setAppMode('comparison');
    } else {
      setAppMode('single');
    }

    if (version.fullPrompt.includes(DOCS_INSTRUCTION)) {
      setOutputType('docs');
    } else if (version.fullPrompt.includes(GENERATE_TESTS_INSTRUCTION)) {
      setOutputType('tests');
    } else if (version.fullPrompt.includes(EXPLAIN_CODE_INSTRUCTION)) {
      setOutputType('explain-selection');
    } else if (version.fullPrompt.includes(REVIEW_SELECTION_INSTRUCTION)) {
      setOutputType('review-selection');
    } else {
      setOutputType('review');
    }
  };

  const handleDeleteVersion = (versionId: string) => {
    setVersions(prevVersions => prevVersions.filter(v => v.id !== versionId));
  };

  const handleExportSession = () => {
    const sessionData = {
      versions,
      userOnlyCode,
      language,
      reviewProfile,
      fullCodeForReview,
      reviewFeedback,
      chatHistory,
      reviewedCode,
      revisedCode,
      appMode,
      codeB,
      comparisonGoal,
    };
    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `4ndroDebugger_session_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportSession = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("File is not a text file.");
        const data = JSON.parse(text);

        // Basic validation
        if (!Array.isArray(data.versions)) throw new Error("Invalid session file format.");

        // Reset state and load data
        handleNewReview();
        setVersions(data.versions ?? []);
        setUserOnlyCode(data.userOnlyCode ?? '');
        setLanguage(data.language ?? SUPPORTED_LANGUAGES[0].value);
        setReviewProfile(data.reviewProfile ?? 'none');
        setFullCodeForReview(data.fullCodeForReview ?? '');
        setReviewFeedback(data.reviewFeedback ?? null);
        setReviewedCode(data.reviewedCode ?? null);
        setRevisedCode(data.revisedCode ?? null);
        setChatHistory(data.chatHistory ?? []);
        setAppMode(data.appMode ?? 'single');
        setCodeB(data.codeB ?? '');
        setComparisonGoal(data.comparisonGoal ?? '');

        // Re-create chat session if there's history
        if (ai && data.chatHistory?.length > 0 && data.fullCodeForReview && data.reviewFeedback) {
            const historyForAPI = [
                { role: 'user' as const, parts: [{ text: data.fullCodeForReview }] },
                { role: 'model' as const, parts: [{ text: data.reviewFeedback }] }
            ];

            const qaPairs = data.chatHistory.slice(1);
            qaPairs.forEach((msg: ChatMessage) => {
                historyForAPI.push({ role: msg.role as 'user' | 'model', parts: [{ text: msg.content }] });
            });

            const newChat = ai.chats.create({
                model: GEMINI_MODEL_NAME,
                history: historyForAPI,
                config: { systemInstruction: getSystemInstructionForReview() }
            });
            setChatSession(newChat);
            setIsChatMode(true);
        } else {
            setIsChatMode(false);
        }
      } catch (err) {
        console.error("Failed to import session:", err);
        setError(err instanceof Error ? `Import failed: ${err.message}` : "Import failed: Invalid file.");
      }
    };
    reader.onerror = () => {
        setError("Failed to read the selected file.");
    }
    reader.readAsText(file);
    
    if(event.target) {
      event.target.value = '';
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        onSaveVersion={handleOpenSaveModal}
        onImportClick={handleImportClick}
        onExportSession={handleExportSession}
        isSaveEnabled={canSaveReview}
        onGenerateTests={handleGenerateTests}
        onGenerateDocs={handleGenerateDocs}
        onToggleVersionHistory={() => setIsVersionHistoryModalOpen(true)}
        isToolsEnabled={userOnlyCode.trim() !== '' && !isChatMode && appMode === 'single'}
        isLoading={isLoading}
      />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 animate-fade-in-up flex-grow">
          <div className="flex flex-col min-h-0" onClick={() => !isChatMode && setActivePanel('input')}>
            {appMode === 'single' ? (
                <CodeInput
                  userCode={userOnlyCode}
                  setUserCode={setUserOnlyCode}
                  language={language}
                  setLanguage={setLanguage}
                  reviewProfile={reviewProfile}
                  setReviewProfile={setReviewProfile}
                  onSubmit={handleReviewSubmit}
                  onGenerateDocs={handleGenerateDocs}
                  onStartComparison={handleStartComparison}
                  onGenerateCommitMessage={handleGenerateCommitMessage}
                  onExplainSelection={handleExplainSelection}
                  onReviewSelection={handleReviewSelection}
                  isLoading={isLoading}
                  isChatLoading={isChatLoading}
                  loadingAction={loadingAction}
                  reviewAvailable={reviewAvailable && !isChatMode}
                  commitMessageAvailable={commitMessageAvailable}
                  isChatMode={isChatMode}
                  onStartFollowUp={handleStartFollowUp}
                  onNewReview={handleNewReview}
                  onFollowUpSubmit={handleFollowUpSubmit}
                  chatHistory={chatHistory}
                  isActive={activePanel === 'input'}
                />
            ) : (
                <ComparisonInput 
                  codeA={userOnlyCode}
                  setCodeA={setUserOnlyCode}
                  codeB={codeB}
                  setCodeB={setCodeB}
                  language={language}
                  setLanguage={setLanguage}
                  goal={comparisonGoal}
                  setGoal={setComparisonGoal}
                  onSubmit={handleCompareAndOptimize}
                  isLoading={isLoading}
                  isChatLoading={isChatLoading}
                  isActive={activePanel === 'input'}
                  onNewReview={handleNewReview}
                  isChatMode={isChatMode}
                  onStartFollowUp={handleStartFollowUp}
                  reviewAvailable={reviewAvailable}
                  onFollowUpSubmit={handleFollowUpSubmit}
                  chatHistory={chatHistory}
                />
            )}
          </div>
          <div className="flex flex-col min-h-0" onClick={() => setActivePanel('output')}>
             {isChatMode ? (
                <ChatContext 
                    codeA={reviewedCode || ''}
                    codeB={appMode === 'comparison' ? codeB : undefined}
                    originalFeedback={reviewFeedback || ''}
                    language={language}
                    isActive={activePanel === 'output'}
                />
            ) : (
                <ReviewOutput
                  feedback={reviewFeedback}
                  isLoading={isLoading}
                  isChatLoading={isChatLoading}
                  loadingAction={loadingAction}
                  outputType={outputType}
                  error={error}
                  onSaveVersion={handleOpenSaveModal}
                  onShowDiff={() => setIsDiffModalOpen(true)}
                  canCompare={commitMessageAvailable}
                  isActive={activePanel === 'output'}
                />
            )}
          </div>
        </div>
      </main>
      <footer className="py-4">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportSession}
            style={{ display: 'none' }} 
            accept=".json,application/json" 
          />
      </footer>
       <SaveVersionModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          onSave={handleConfirmSaveVersion}
          versionName={versionName}
          setVersionName={setVersionName}
      />
      {isDiffModalOpen && reviewedCode && revisedCode && (
          <DiffViewer 
              oldCode={reviewedCode}
              newCode={revisedCode}
              onClose={() => setIsDiffModalOpen(false)}
          />
      )}
      <VersionHistoryModal
        isOpen={isVersionHistoryModalOpen}
        onClose={() => setIsVersionHistoryModalOpen(false)}
        versions={versions}
        onLoadVersion={handleLoadVersion}
        onDeleteVersion={handleDeleteVersion}
        onStartFollowUp={handleStartFollowUp}
      />
    </div>
  );
};

export default App;