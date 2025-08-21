

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat, Type } from "@google/genai";
import { Header } from './Components/Header.tsx';
import { CodeInput } from './Components/CodeInput.tsx';
import { ReviewOutput } from './Components/ReviewOutput.tsx';
import { SupportedLanguage, ChatMessage, Version, ReviewProfile, LoadingAction, Toast, AppMode, ChatRevision } from './types.ts';
import { SUPPORTED_LANGUAGES, GEMINI_MODELS, SYSTEM_INSTRUCTION, DEBUG_SYSTEM_INSTRUCTION, DOCS_SYSTEM_INSTRUCTION, PROFILE_SYSTEM_INSTRUCTIONS, GENERATE_TESTS_INSTRUCTION, EXPLAIN_CODE_INSTRUCTION, REVIEW_SELECTION_INSTRUCTION, COMMIT_MESSAGE_SYSTEM_INSTRUCTION, DOCS_INSTRUCTION, COMPARISON_SYSTEM_INSTRUCTION, generateComparisonTemplate, generateDocsTemplate, LANGUAGE_TAG_MAP, PLACEHOLDER_MARKER } from './constants.ts';
import { DiffViewer } from './Components/DiffViewer.tsx';
import { ComparisonInput } from './Components/ComparisonInput.tsx';
import { VersionHistoryModal } from './Components/VersionHistoryModal.tsx';
import { SaveVersionModal } from './Components/SaveVersionModal.tsx';
import { ToastContainer } from './Components/ToastContainer.tsx';
import { ApiKeyBanner } from './Components/ApiKeyBanner.tsx';

type OutputType = LoadingAction;
type ActivePanel = 'input' | 'output';

const App: React.FC = () => {
  // --- Mode State ---
  const [appMode, setAppMode] = useState<AppMode>('debug');
  
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
  
  // --- Single Review & Debug Mode State ---
  const [userOnlyCode, setUserOnlyCode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [reviewProfile, setReviewProfile] = useState<ReviewProfile | 'none'>('none');
  const [customReviewProfile, setCustomReviewProfile] = useState<string>('');

  // --- Comparison Mode State ---
  const [codeB, setCodeB] = useState<string>('');
  const [comparisonGoal, setComparisonGoal] = useState<string>('');

  // --- View & Chat State ---
  const [isInputPanelVisible, setIsInputPanelVisible] = useState(true);
  const [isChatMode, setIsChatMode] = useState<boolean>(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [activePanel, setActivePanel] = useState<ActivePanel>('input');
  const [chatInputValue, setChatInputValue] = useState('');
  const [chatRevisions, setChatRevisions] = useState<ChatRevision[]>([]);
  
  // --- Versioning State ---
  const [versions, setVersions] = useState<Version[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isVersionHistoryModalOpen, setIsVersionHistoryModalOpen] = useState(false);
  const [versionName, setVersionName] = useState('');

  // --- Toast State ---
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const [ai] = useState(() => process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortStreamRef = useRef(false);

  const isReviewContextCurrent = reviewedCode !== null && (appMode === 'single' || appMode === 'debug' ? userOnlyCode === reviewedCode : true);
  const reviewAvailable = !!reviewFeedback && isReviewContextCurrent;
  const commitMessageAvailable = !!reviewedCode && !!revisedCode && reviewedCode !== revisedCode;
  const showOutputPanel = isLoading || !!reviewFeedback || !!error;

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

  const addToast = (message: string, type: Toast['type']) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };


  const getSystemInstructionForReview = useCallback(() => {
    let instruction = SYSTEM_INSTRUCTION;
    if (reviewProfile && reviewProfile !== 'none' && reviewProfile !== ReviewProfile.CUSTOM && PROFILE_SYSTEM_INSTRUCTIONS[reviewProfile]) {
        instruction += `\n\n## Special Focus: ${reviewProfile}\n${PROFILE_SYSTEM_INSTRUCTIONS[reviewProfile]}`;
    } else if (reviewProfile === ReviewProfile.CUSTOM && customReviewProfile.trim()) {
        instruction += `\n\n## Custom Review Instructions:\n${customReviewProfile.trim()}`;
    }
    return instruction;
  }, [reviewProfile, customReviewProfile]);


  const performStreamingRequest = async (fullCode: string, systemInstruction: string, model: string) => {
    if (!ai) {
      const msg = "Error: API Key not configured.";
      setError(msg);
      addToast(msg, 'error');
      setIsLoading(false);
      setLoadingAction(null);
      return;
    }
    
    abortStreamRef.current = false;
    
    try {
      setReviewFeedback(''); // Start with an empty string for streaming
      const responseStream = await ai.models.generateContentStream({
        model: model,
        contents: fullCode,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.3,
          maxOutputTokens: 8192,
          thinkingConfig: { thinkingBudget: 1024 },
        },
      });

      let fullResponse = "";
      for await (const chunk of responseStream) {
        if (abortStreamRef.current) break;
        const chunkText = chunk.text;
        fullResponse += chunkText;
        setReviewFeedback(fullResponse);
      }
      return fullResponse;
    } catch (apiError) {
      if (abortStreamRef.current) {
        console.log("Stream aborted by user.");
        return null;
      }
      console.error("API Error:", apiError);
      const message = apiError instanceof Error ? apiError.message : "An unexpected error occurred.";
      setError(`Failed to get review: ${message}`);
      addToast(`API Error: ${message}`, 'error');
      setReviewFeedback(null);
      setReviewedCode(null);
      setRevisedCode(null);
      return null;
    }
  };

  const handleStopGenerating = () => {
    abortStreamRef.current = true;
    setIsLoading(false);
    setIsChatLoading(false); // also stop chat loading if applicable
    setLoadingAction(null);
    addToast("Generation stopped.", "info");
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
    setChatRevisions([]);
  }

  const extractFinalCodeBlock = (response: string, isInitialReview: boolean) => {
    // Priority 1: Look for the explicit "Revised Code" heading. This is the most reliable.
    const revisedCodeRegex = /###\s*(?:Revised|Updated|Full|Optimized)\s+Code\s*`{3}(?:[a-zA-Z0-9-]*)?\n([\s\S]*?)\n`{3}/im;
    const headingMatch = response.match(revisedCodeRegex);
    if (headingMatch && headingMatch[1]) {
      return headingMatch[1].trim();
    }
    
    // Fallback for initial reviews: If no heading is found, find all code blocks and return the last significant one.
    // This is less reliable but handles cases where the AI forgets the heading. It's disabled for chat
    // follow-ups to prevent incorrectly capturing snippets as full revisions.
    if (isInitialReview) {
      const allCodeBlocksRegex = /`{3}(?:[a-zA-Z0-9-]*)?\n([\s\S]*?)\n`{3}/g;
      const matches = [...response.matchAll(allCodeBlocksRegex)];
      
      if (matches.length > 0) {
        const lastMatch = matches[matches.length - 1];
        if (lastMatch && lastMatch[1]) {
          // A simple heuristic: if the last code block is very short, it might be an example snippet.
          // A full revision is usually longer. This helps avoid capturing small snippets.
          if (lastMatch[1].trim().split('\n').length >= 3) {
            return lastMatch[1].trim();
          }
        }
      }
    }

    return null;
  }

  const handleReviewSubmit = useCallback(async (fullCodeToSubmit: string) => {
    setIsLoading(true);
    setLoadingAction('review');
    setOutputType('review');
    setIsInputPanelVisible(false); // Requirement #5: Collapse input panel on submit
    resetForNewRequest();
    setFullCodeForReview(fullCodeToSubmit);
    setReviewedCode(userOnlyCode);

    const systemInstruction = appMode === 'debug'
      ? DEBUG_SYSTEM_INSTRUCTION
      : getSystemInstructionForReview();
    
    const fullResponse = await performStreamingRequest(fullCodeToSubmit, systemInstruction, GEMINI_MODELS.CORE_ANALYSIS);

    if (fullResponse) {
        setRevisedCode(extractFinalCodeBlock(fullResponse, true));
    }

    setIsLoading(false);
    setLoadingAction(null);
  }, [ai, getSystemInstructionForReview, userOnlyCode, language, appMode]);

  const handleCompareAndOptimize = useCallback(async () => {
    setIsLoading(true);
    setLoadingAction('comparison');
    setOutputType('comparison');
    setIsInputPanelVisible(false); // Requirement #5: Collapse input panel on submit
    resetForNewRequest();

    const prompt = generateComparisonTemplate(language, comparisonGoal, userOnlyCode, codeB);
    setFullCodeForReview(prompt); // Save for versioning
    setReviewedCode(userOnlyCode); // Set Code A as the "before" for diffing

    const fullResponse = await performStreamingRequest(prompt, COMPARISON_SYSTEM_INSTRUCTION, GEMINI_MODELS.CORE_ANALYSIS);
    
    if (fullResponse) {
        setRevisedCode(extractFinalCodeBlock(fullResponse, true));
    }
    
    setIsLoading(false);
    setLoadingAction(null);
  }, [ai, language, comparisonGoal, userOnlyCode, codeB]);


  const handleGenerateDocs = useCallback(async () => {
    if (appMode === 'comparison' || !userOnlyCode.trim() || isChatMode) return;
    setIsLoading(true);
    setLoadingAction('docs');
    setOutputType('docs');
    setIsInputPanelVisible(false);
    resetForNewRequest();
    
    const template = generateDocsTemplate(language);
    const fullCodeToSubmit = template.replace(PLACEHOLDER_MARKER, userOnlyCode);

    setFullCodeForReview(fullCodeToSubmit);
    setReviewedCode(userOnlyCode);
    
    await performStreamingRequest(fullCodeToSubmit, DOCS_SYSTEM_INSTRUCTION, GEMINI_MODELS.CORE_ANALYSIS);

    setIsLoading(false);
    setLoadingAction(null);
  }, [ai, userOnlyCode, language, appMode, isChatMode]);

  const handleGenerateTests = useCallback(async () => {
    if (appMode === 'comparison' || !userOnlyCode.trim() || isChatMode) return;
    setIsLoading(true);
    setLoadingAction('tests');
    setOutputType('tests');
    setIsInputPanelVisible(false);
    resetForNewRequest();
    setReviewedCode(userOnlyCode);

    const prompt = `${GENERATE_TESTS_INSTRUCTION}\n\n\`\`\`${language}\n${userOnlyCode}\n\`\`\``;
    await performStreamingRequest(prompt, SYSTEM_INSTRUCTION, GEMINI_MODELS.CORE_ANALYSIS);

    setIsLoading(false);
    setLoadingAction(null);
  }, [ai, userOnlyCode, language, appMode, isChatMode]);
  
  const handleExplainSelection = useCallback(async (selection: string) => {
    setIsLoading(true);
    setLoadingAction('explain-selection');
    setOutputType('explain-selection');
    setIsInputPanelVisible(false);
    resetForNewRequest();

    const prompt = `${EXPLAIN_CODE_INSTRUCTION}\n\n\`\`\`${language}\n${selection}\n\`\`\``;
    await performStreamingRequest(prompt, SYSTEM_INSTRUCTION, GEMINI_MODELS.FAST_TASKS);

    setIsLoading(false);
    setLoadingAction(null);
  }, [ai, language]);
  
  const handleReviewSelection = useCallback(async (selection: string) => {
    setIsLoading(true);
    setLoadingAction('review-selection');
    setOutputType('review-selection');
    setIsInputPanelVisible(false);
    resetForNewRequest();

    const prompt = `${REVIEW_SELECTION_INSTRUCTION}\n\n\`\`\`${language}\n${selection}\n\`\`\``;
    await performStreamingRequest(prompt, getSystemInstructionForReview(), GEMINI_MODELS.CORE_ANALYSIS);

    setIsLoading(false);
    setLoadingAction(null);
  }, [ai, language, getSystemInstructionForReview]);

  const handleGenerateCommitMessage = useCallback(async () => {
      if (!ai || !reviewedCode || !revisedCode) {
          const msg = "Cannot generate commit message. Original or revised code is missing.";
          setError(msg);
          addToast(msg, 'error');
          return;
      }
      
      setIsLoading(true);
      setLoadingAction('commit');
      setOutputType('commit');
      setIsInputPanelVisible(false);
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
              model: GEMINI_MODELS.FAST_TASKS,
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
          const gitCommand = `git commit -m "${header}"`;

          const formattedMarkdown = `### Suggested Commit Message\n\n**${header}**\n\n${body.replace(/\n/g, '\n\n')}\n\n---\n\n#### As a git command:\n\`\`\`bash\n${gitCommand}\n\`\`\``;
          setReviewFeedback(formattedMarkdown);

      } catch (apiError) {
          console.error("Commit Message API Error:", apiError);
          const message = apiError instanceof Error ? apiError.message : "An unexpected error occurred.";
          setError(`Failed to generate commit message: ${message}`);
          addToast(`Error: ${message}`, 'error');
          setReviewFeedback(null);
      } finally {
          setIsLoading(false);
          setLoadingAction(null);
      }
  }, [ai, reviewedCode, revisedCode, language]);


  const handleStartFollowUp = useCallback((version?: Version, modeOverride?: AppMode) => {
    const contextFeedback = version ? version.feedback : reviewFeedback;
    const contextCode = version ? version.fullPrompt : fullCodeForReview;
    const contextUserCode = version ? version.userCode : userOnlyCode;
    
    if (!contextFeedback || !contextCode || !ai) return;

    if (modeOverride) {
      setAppMode(modeOverride);
    }

    // Set the state needed for the chat context panel
    setReviewedCode(contextUserCode);
    setReviewFeedback(contextFeedback);
    
    // If starting from a saved version, load its revisions.
    if (version) {
        setRevisedCode(extractFinalCodeBlock(version.feedback, true));
        setChatRevisions(version.chatRevisions || []);
    } else {
        // For a new chat, clear any previous chat revisions
        setChatRevisions([]);
    }
    
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

    // The history for the API's memory starts with the original prompt and its full response.
    const historyForAPI: {role: 'user' | 'model', parts: {text: string}[]}[] = [
      { role: 'user', parts: [{ text: contextCode }] },
      { role: 'model', parts: [{ text: contextFeedback }] }
    ];

    // The history for the UI starts with the model's initial analysis.
    const historyForUI: ChatMessage[] = [
      { id: `chat_initial_${Date.now()}`, role: 'model', content: contextFeedback }
    ];
    
    if (version) {
        historyForUI.push({ id: `chat_prompt_${Date.now()}`, role: 'model', content: `Context for **"${version.name}"** loaded. What is your question?` });
    }
    
    // If the user selected text, pre-fill the input box for them as a starting point.
    if (!version && selectionText) {
      setChatInputValue(`Regarding this section:\n\n> ${selectionText.split('\n').join('\n> ')}\n\n`);
    } else {
      setChatInputValue('');
    }
    
    const systemInstructionForChat = (modeOverride || appMode) === 'debug'
        ? DEBUG_SYSTEM_INSTRUCTION
        : getSystemInstructionForReview();

    const newChat = ai.chats.create({ 
      model: GEMINI_MODELS.FAST_TASKS, 
      history: historyForAPI,
      config: {
        systemInstruction: systemInstructionForChat,
      }
    });

    setChatSession(newChat);
    setChatHistory(historyForUI);
    setIsChatMode(true);
    setActivePanel('input');
    setIsInputPanelVisible(true);
  }, [reviewFeedback, fullCodeForReview, ai, getSystemInstructionForReview, userOnlyCode, appMode]);

  const handleFollowUpSubmit = useCallback(async (message: string) => {
    if (!chatSession) return;
    setIsChatLoading(true);
    setError(null);
    setChatHistory(prev => [...prev, { id: `chat_user_${Date.now()}`, role: 'user', content: message }]);
    setActivePanel('input');
    abortStreamRef.current = false;
    
    const modelMessageId = `chat_model_${Date.now()}`;
    
    try {
      setChatHistory(prev => [...prev, { id: modelMessageId, role: 'model', content: '' }]); // Add empty placeholder
      
      const responseStream = await chatSession.sendMessageStream({ message });
      
      let currentResponse = "";
      for await (const chunk of responseStream) {
        if (abortStreamRef.current) break;
        const chunkText = chunk.text;
        currentResponse += chunkText;
        setChatHistory(prev => {
          const newHistory = [...prev];
          newHistory[newHistory.length - 1] = { id: modelMessageId, role: 'model', content: currentResponse };
          return newHistory;
        });
      }
      
      if (!abortStreamRef.current) {
        const newRevisionCode = extractFinalCodeBlock(currentResponse, false);
        if (newRevisionCode) {
          setChatRevisions(prev => {
            const lastRevisionCode = prev.length > 0 ? prev[prev.length - 1].code : revisedCode;
            if (lastRevisionCode !== newRevisionCode) {
              const newVersionName = `Version 1.${prev.length + 1}`;
              const newId = `rev_${Date.now()}`;
              return [...prev, { id: newId, name: newVersionName, code: newRevisionCode }];
            }
            return prev;
          });
        }
      }
      
    } catch (apiError) {
      if (abortStreamRef.current) {
        console.log("Chat stream aborted.");
      } else {
        console.error("Chat API Error:", apiError);
        const errorMsg = apiError instanceof Error ? apiError.message : "An unexpected error occurred.";
        setError(`Failed to get response: ${errorMsg}`);
        addToast(`Chat Error: ${errorMsg}`, 'error');
        setChatHistory(prev => prev.slice(0, -1)); // Remove the empty placeholder on error
      }
    } finally {
      setIsChatLoading(false);
    }
  }, [chatSession, revisedCode]);

  const handleCodeLineClick = (line: string) => {
    setChatInputValue(`Can you explain this line for me?\n\`\`\`\n${line}\n\`\`\``);
    setActivePanel('input');
  };
  
  const handleClearChatRevisions = () => {
    setChatRevisions([]);
    addToast("Revision history cleared.", "info");
  };

  const handleRenameChatRevision = (revisionId: string, newName: string) => {
    setChatRevisions(prev => prev.map(rev => 
        rev.id === revisionId ? { ...rev, name: newName } : rev
    ));
    addToast("Revision renamed.", "info");
  };

  const resetAndSetMode = (mode: AppMode) => {
    setAppMode(mode);
    setIsChatMode(false);
    setReviewFeedback(null);
    setError(null);
    setOutputType(null);
    setChatSession(null);
    setChatHistory([]);
    setUserOnlyCode('');
    setReviewedCode(null);
    setRevisedCode(null);
    setChatRevisions([]);
    setActivePanel('input');
    setCodeB('');
    setComparisonGoal('');
    setIsInputPanelVisible(true);
    setReviewProfile('none');
    setCustomReviewProfile('');
    setErrorMessage('');
  };

  const handleSaveChatAndEnd = () => {
    // Exclude the initial review message from the chat log to avoid duplication
    const chatLog = chatHistory.slice(1)
        .map(msg => `**[${msg.role.toUpperCase()}]**\n\n${msg.content}`)
        .join('\n\n---\n\n');
    
    const feedbackToSave = (reviewFeedback || '') + '\n\n---\n\n## Follow-up Chat History\n\n' + chatLog;

    const newVersion: Version = {
      id: `v_${Date.now()}`,
      name: `Follow-up Chat - ${new Date().toLocaleString()}`,
      userCode: reviewedCode || userOnlyCode,
      fullPrompt: fullCodeForReview,
      feedback: feedbackToSave,
      language,
      timestamp: Date.now(),
      chatRevisions,
    };

    setVersions(prev => [newVersion, ...prev]);
    addToast("Chat session saved.", "success");
    resetAndSetMode('debug');
  };

  const handleEndChat = () => {
    if (chatHistory.length > 1) { 
        if (window.confirm("Save this chat session to your Version History?")) {
            handleSaveChatAndEnd();
        } else {
            resetAndSetMode('debug');
        }
    } else {
        resetAndSetMode('debug');
    }
  };

  const handleOpenSaveModal = () => {
    const canSaveReview = !!reviewFeedback && !isChatMode && !isLoading && !error;
    if (!canSaveReview) return;
    setVersionName(`SYS_SAVE // ${new Date().toLocaleString()}`);
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
      chatRevisions,
    };

    setVersions(prevVersions => [newVersion, ...prevVersions]);
    setIsSaveModalOpen(false);
    setVersionName('');
    addToast('Version saved successfully!', 'success');
  };
  
  const handleLoadVersion = (version: Version) => {
    resetAndSetMode('single'); // Reset with a temporary mode

    setUserOnlyCode(version.userCode);
    setLanguage(version.language);
    setFullCodeForReview(version.fullPrompt);
    setReviewFeedback(version.feedback);
    setReviewedCode(version.userCode);
    setChatRevisions(version.chatRevisions || []);
    
    const finalCodeInLoaded = extractFinalCodeBlock(version.feedback, true);
    setRevisedCode(finalCodeInLoaded);

    setActivePanel('output');
    setIsInputPanelVisible(false);
    
    if (version.fullPrompt.includes('### Codebase B')) {
      setAppMode('comparison');
    } else if (version.fullPrompt.includes('### Error Message / Context')) {
      setAppMode('debug');
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
    addToast(`Version "${version.name}" loaded.`, 'info');
  };

  const handleDeleteVersion = (versionId: string) => {
    setVersions(prevVersions => prevVersions.filter(v => v.id !== versionId));
    addToast('Version deleted.', 'info');
  };

  const handleExportSession = () => {
    const sessionData = {
      versions,
      userOnlyCode,
      language,
      reviewProfile,
      customReviewProfile,
      fullCodeForReview,
      reviewFeedback,
      chatHistory,
      reviewedCode,
      revisedCode,
      appMode,
      codeB,
      comparisonGoal,
      chatRevisions,
      errorMessage,
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

        if (!Array.isArray(data.versions)) throw new Error("Invalid session file format.");

        resetAndSetMode('debug');
        setVersions(data.versions ?? []);
        setUserOnlyCode(data.userOnlyCode ?? '');
        setLanguage(data.language ?? SUPPORTED_LANGUAGES[0].value);
        setReviewProfile(data.reviewProfile ?? 'none');
        setCustomReviewProfile(data.customReviewProfile ?? '');
        setFullCodeForReview(data.fullCodeForReview ?? '');
        setReviewFeedback(data.reviewFeedback ?? null);
        setReviewedCode(data.reviewedCode ?? null);
        setRevisedCode(data.revisedCode ?? null);
        setChatRevisions(data.chatRevisions ?? []);
        setErrorMessage(data.errorMessage ?? '');
        
        const chatHistoryWithIds = (data.chatHistory ?? []).map((msg: Omit<ChatMessage, 'id'>, index: number) => ({
          ...msg,
          id: `imported_${Date.now()}_${index}`
        }));
        setChatHistory(chatHistoryWithIds);

        setAppMode(data.appMode ?? 'debug');
        setCodeB(data.codeB ?? '');
        setComparisonGoal(data.comparisonGoal ?? '');
        
        addToast('Session imported successfully!', 'success');
        setIsInputPanelVisible(false);


        if (ai && chatHistoryWithIds.length > 0 && data.fullCodeForReview && data.reviewFeedback) {
            const historyForAPI: {role: 'user' | 'model', parts: {text: string}[]}[] = [
                { role: 'user', parts: [{ text: data.fullCodeForReview }] },
                { role: 'model', parts: [{ text: data.reviewFeedback }] }
            ];

            const qaPairs = chatHistoryWithIds.slice(1);
            qaPairs.forEach((msg: ChatMessage) => {
                historyForAPI.push({ role: msg.role as 'user' | 'model', parts: [{ text: msg.content }] });
            });

            const newChat = ai.chats.create({
                model: GEMINI_MODELS.FAST_TASKS,
                history: historyForAPI,
                config: { systemInstruction: getSystemInstructionForReview() }
            });
            setChatSession(newChat);
            setIsChatMode(true);
            setIsInputPanelVisible(true);
        } else {
            setIsChatMode(false);
        }
      } catch (err) {
        const msg = err instanceof Error ? `Import failed: ${err.message}` : "Import failed: Invalid file.";
        console.error("Failed to import session:", err);
        setError(msg);
        addToast(msg, 'error');
      }
    };
    reader.onerror = () => {
        const msg = "Failed to read the selected file.";
        setError(msg);
        addToast(msg, 'error');
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
    <div className="h-screen flex flex-col relative">
      <div className="fixed top-1/4 left-8 w-1/4 h-px bg-[var(--hud-color-darker)] opacity-50"></div>
      <div className="fixed bottom-1/4 right-8 w-1/4 h-px bg-[var(--hud-color-darker)] opacity-50"></div>
      <div className="fixed top-1/2 right-12 w-px h-1/4 bg-[var(--hud-color-darker)] opacity-50"></div>
      <div className="fixed bottom-1/3 left-12 w-px h-1/4 bg-[var(--hud-color-darker)] opacity-50"></div>

      <Header 
        onImportClick={handleImportClick}
        onExportSession={handleExportSession}
        onGenerateTests={handleGenerateTests}
        onGenerateDocs={handleGenerateDocs}
        onToggleVersionHistory={() => setIsVersionHistoryModalOpen(true)}
        isToolsEnabled={userOnlyCode.trim() !== '' && !isChatMode && (appMode === 'single' || appMode === 'debug')}
        isLoading={isLoading || isChatLoading}
        addToast={addToast}
        onStartDebug={() => resetAndSetMode('debug')}
        onStartSingleReview={() => resetAndSetMode('single')}
        onStartComparison={() => resetAndSetMode('comparison')}
        isInputPanelVisible={isInputPanelVisible}
        onToggleInputPanel={() => setIsInputPanelVisible(p => !p)}
        onNewReview={() => resetAndSetMode('debug')}
        isFollowUpAvailable={reviewAvailable}
        onStartFollowUp={handleStartFollowUp}
      />
      <ApiKeyBanner />
      <main className={`flex-grow container mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 ${isInputPanelVisible && showOutputPanel && !isChatMode ? 'lg:grid-cols-2' : ''} gap-6 lg:gap-8 animate-fade-in overflow-hidden`}>
          {isInputPanelVisible && (
            <div className={`min-h-0 ${isChatMode ? 'lg:col-span-2' : ''}`} onClick={() => !isChatMode && setActivePanel('input')}>
              {appMode === 'single' || appMode === 'debug' ? (
                  <CodeInput
                    userCode={userOnlyCode}
                    setUserCode={setUserOnlyCode}
                    errorMessage={errorMessage}
                    setErrorMessage={setErrorMessage}
                    language={language}
                    setLanguage={setLanguage}
                    reviewProfile={reviewProfile}
                    setReviewProfile={setReviewProfile}
                    customReviewProfile={customReviewProfile}
                    setCustomReviewProfile={setCustomReviewProfile}
                    onSubmit={handleReviewSubmit}
                    onExplainSelection={handleExplainSelection}
                    onReviewSelection={handleReviewSelection}
                    isLoading={isLoading}
                    isChatLoading={isChatLoading}
                    loadingAction={loadingAction}
                    isChatMode={isChatMode}
                    onNewReview={() => resetAndSetMode(appMode)}
                    onEndChat={handleEndChat}
                    onFollowUpSubmit={handleFollowUpSubmit}
                    chatHistory={chatHistory}
                    chatInputValue={chatInputValue}
                    setChatInputValue={setChatInputValue}
                    isActive={activePanel === 'input'}
                    onStopGenerating={handleStopGenerating}
                    originalReviewedCode={reviewedCode}
                    appMode={appMode}
                    codeB={codeB}
                    onCodeLineClick={handleCodeLineClick}
                    initialRevisedCode={revisedCode}
                    chatRevisions={chatRevisions}
                    onClearChatRevisions={handleClearChatRevisions}
                    onRenameChatRevision={handleRenameChatRevision}
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
                    onNewReview={() => resetAndSetMode('comparison')}
                    onEndChat={handleEndChat}
                    isChatMode={isChatMode}
                    onFollowUpSubmit={handleFollowUpSubmit}
                    chatHistory={chatHistory}
                    chatInputValue={chatInputValue}
                    setChatInputValue={setChatInputValue}
                    onStopGenerating={handleStopGenerating}
                    originalReviewedCode={reviewedCode}
                    appMode={appMode}
                    onCodeLineClick={handleCodeLineClick}
                    initialRevisedCode={revisedCode}
                    chatRevisions={chatRevisions}
                    onClearChatRevisions={handleClearChatRevisions}
                    onRenameChatRevision={handleRenameChatRevision}
                  />
              )}
            </div>
          )}
          
          {showOutputPanel && !isChatMode && (
            <div className="min-h-0" onClick={() => setActivePanel('output')}>
                <ReviewOutput
                  feedback={reviewFeedback}
                  revisedCode={revisedCode}
                  language={language}
                  isLoading={isLoading}
                  isChatLoading={isChatLoading}
                  loadingAction={loadingAction}
                  outputType={outputType}
                  error={error}
                  onSaveVersion={handleOpenSaveModal}
                  onShowDiff={() => setIsDiffModalOpen(true)}
                  canCompare={commitMessageAvailable}
                  isActive={activePanel === 'output'}
                  addToast={addToast}
                  onStartFollowUp={handleStartFollowUp}
                  onGenerateCommitMessage={handleGenerateCommitMessage}
                  reviewAvailable={reviewAvailable}
                  appMode={appMode}
                />
            </div>
          )}
      </main>
      <footer className="py-4 text-center">
          <div className="flex justify-center items-center space-x-6 text-xs text-[var(--hud-color-darker)]">
            <span>4ndr0⫌ebugger &copy; 2024</span>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportSession}
            style={{ display: 'none' }} 
            accept=".json,application/json" 
          />
          <ToastContainer toasts={toasts} onDismiss={removeToast} />
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
              language={language}
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