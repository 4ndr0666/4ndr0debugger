

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Chat, Part } from "@google/genai";
import { AppContextProvider, useAppContext, useToast } from './AppContext.tsx';
import { geminiService } from './services.ts';
import { Header } from './Components/Header.tsx';
import { CodeInput } from './Components/CodeInput.tsx';
import { ReviewOutput } from './Components/ReviewOutput.tsx';
import { SupportedLanguage, ChatMessage, Version, ReviewProfile, LoadingAction, AppMode, ChatRevision, Feature, FeatureDecision, ChatContext, FinalizationSummary, FeatureDecisionRecord, ProjectFile, ChatFile, ImportedSession } from './types.ts';
// FIX: Import generateCommitMessageTemplate
import { GEMINI_MODELS, SYSTEM_INSTRUCTION, DEBUG_SYSTEM_INSTRUCTION, DOCS_SYSTEM_INSTRUCTION, PROFILE_SYSTEM_INSTRUCTIONS, GENERATE_TESTS_INSTRUCTION, EXPLAIN_CODE_INSTRUCTION, REVIEW_SELECTION_INSTRUCTION, COMMIT_MESSAGE_SYSTEM_INSTRUCTION, DOCS_INSTRUCTION, COMPARISON_SYSTEM_INSTRUCTION, COMPARISON_REVISION_SYSTEM_INSTRUCTION, FEATURE_MATRIX_SCHEMA, generateComparisonTemplate, LANGUAGE_TAG_MAP, generateAuditTemplate, AUDIT_SYSTEM_INSTRUCTION, ROOT_CAUSE_SYSTEM_INSTRUCTION, generateRootCauseTemplate, COMMIT_MESSAGE_SCHEMA, generateFinalizationPrompt, generateVersionNamePrompt, generateCommitMessageTemplate } from './constants.ts';
import { DiffViewer } from './Components/DiffViewer.tsx';
import { ComparisonInput } from './Components/ComparisonInput.tsx';
import { VersionHistoryModal } from './Components/VersionHistoryModal.tsx';
import { SaveVersionModal } from './Components/SaveVersionModal.tsx';
import { ApiKeyBanner } from './Components/ApiKeyBanner.tsx';
import { DocumentationCenterModal } from './Components/DocumentationCenterModal.tsx';
import { ProjectFilesModal } from './Components/ProjectFilesModal.tsx';
import { AuditInput } from './Components/AuditInput.tsx';
import { SessionManagerModal } from './Components/SessionManagerModal.tsx';

// Extracts markdown files with filenames from a response.
const extractGeneratedMarkdownFiles = (responseText: string): { name: string, content: string }[] => {
    const files: { name: string, content: string }[] = [];
    const codeBlockRegex = /```([a-zA-Z0-9-:]*)\n([\sS]*?)\n```/g;
    const matches = [...responseText.matchAll(codeBlockRegex)];

    matches.forEach((match) => {
        const langInfo = match[1] || '';
        const code = match[2].trim();
        const language = langInfo.split(':')[0].trim().toLowerCase();

        if (language === 'markdown' || language === 'md') {
            let filename = langInfo.split(':')[1]?.trim();
            if (!filename) {
                const firstLine = code.split('\n')[0];
                if (firstLine.startsWith('# ')) {
                    filename = firstLine.substring(2).trim().replace(/[<>:"/\\|?*]/g, '').replace(/\s/g, '_') + '.md';
                } else {
                    filename = `document_${Date.now()}.md`;
                }
            }
            if (!filename.toLowerCase().endsWith('.md')) {
                filename += '.md';
            }
            files.push({ name: filename, content: code });
        }
    });
    return files;
};

const extractFinalCodeBlock = (response: string, isInitialReview: boolean) => {
    const revisedCodeRegex = /###\s*(?:Revised|Updated|Full|Optimized)\s+Code\s*`{3}(?:[a-zA-Z0-9-]*)?\n([\sS]*?)\n`{3}/im;
    const headingMatch = response.match(revisedCodeRegex);
    if (headingMatch && headingMatch[1]) {
      return headingMatch[1].trim();
    }
    
    if (isInitialReview) {
      const allCodeBlocksRegex = /`{3}(?:[a-zA-Z0-9-]*)?\n([\sS]*?)\n`{3}/g;
      const matches = [...response.matchAll(allCodeBlocksRegex)];
      
      if (matches.length > 0) {
        const lastMatch = matches[matches.length - 1];
        if (lastMatch && lastMatch[1]) {
          if (lastMatch[1].trim().split('\n').length >= 3) {
            return lastMatch[1].trim();
          }
        }
      }
    }

    return null;
};

const AppController: React.FC = () => {
  const { 
    appMode, language, reviewProfile, customReviewProfile, userOnlyCode, codeB, 
    comparisonGoal, projectFiles, versions, errorMessage, importedSessions,
    setVersions, setUserOnlyCode, setCodeB, setLanguage, setProjectFiles, 
    setAppMode, setComparisonGoal, setCustomReviewProfile, setErrorMessage, 
    setReviewProfile, setImportedSessions, resetAndSetMode
  } = useAppContext();
  const { addToast } = useToast();

  // --- Session/Output State (managed by AppController) ---
  const [reviewFeedback, setReviewFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
  const [outputType, setOutputType] = useState<LoadingAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewedCode, setReviewedCode] = useState<string | null>(null);
  const [revisedCode, setRevisedCode] = useState<string | null>(null);
  const [fullCodeForReview, setFullCodeForReview] = useState<string>('');
  
  // --- Comparison Mode State ---
  const [featureMatrix, setFeatureMatrix] = useState<Feature[] | null>(null);
  const [rawFeatureMatrixJson, setRawFeatureMatrixJson] = useState<string | null>(null);
  const [featureDecisions, setFeatureDecisions] = useState<Record<string, FeatureDecisionRecord>>({});
  const [allFeaturesDecided, setAllFeaturesDecided] = useState(false);
  const [finalizationSummary, setFinalizationSummary] = useState<FinalizationSummary | null>(null);
  const [finalizationBriefing, setFinalizationBriefing] = useState<string | null>(null);

  // --- View & Chat State ---
  const [isInputPanelVisible, setIsInputPanelVisible] = useState(true);
  const [isChatMode, setIsChatMode] = useState<boolean>(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [activePanel, setActivePanel] = useState<'input' | 'output'>('input');
  const [chatInputValue, setChatInputValue] = useState('');
  const [chatRevisions, setChatRevisions] = useState<ChatRevision[]>([]);
  const [chatFiles, setChatFiles] = useState<ChatFile[]>([]);
  const [chatContext, setChatContext] = useState<ChatContext>('general');
  const [activeFeatureForDiscussion, setActiveFeatureForDiscussion] = useState<Feature | null>(null);
  
  // --- Versioning & Modal State ---
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isVersionHistoryModalOpen, setIsVersionHistoryModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [isProjectFilesModalOpen, setIsProjectFilesModalOpen] = useState(false);
  const [isSessionManagerModalOpen, setIsSessionManagerModalOpen] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [isSavingChat, setIsSavingChat] = useState(false);
  const [isGeneratingName, setIsGeneratingName] = useState<boolean>(false);

  // --- File Attachment & Context State ---
  const [attachments, setAttachments] = useState<{ file: File; content: string; mimeType: string }[]>([]);
  const [contextFileIds, setContextFileIds] = useState<Set<string>>(new Set());

  const attachFileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isReviewContextCurrent = reviewedCode !== null && (appMode === 'single' || appMode === 'debug' || appMode === 'audit' ? userOnlyCode === reviewedCode : true);
  const reviewAvailable = !!reviewFeedback && isReviewContextCurrent;
  const commitMessageAvailable = !!reviewedCode && !!revisedCode && reviewedCode !== revisedCode;
  const showOutputPanel = isLoading || !!reviewFeedback || !!error;

  useEffect(() => {
    if (featureMatrix && featureMatrix.length > 0) {
        const allDecided = featureMatrix.every(feature => !!featureDecisions[feature.name]);
        setAllFeaturesDecided(allDecided);
    } else {
        setAllFeaturesDecided(false);
    }
  }, [featureDecisions, featureMatrix]);

  useEffect(() => {
    if (chatContext === 'feature_discussion' && activeFeatureForDiscussion) {
      handleStartFollowUp();
    }
  }, [chatContext, activeFeatureForDiscussion]);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
        try {
            const decodedState = JSON.parse(atob(hash));
            if (decodedState.appMode) setAppMode(decodedState.appMode);
            if (decodedState.language) setLanguage(decodedState.language);
            if (decodedState.userOnlyCode) setUserOnlyCode(decodedState.userOnlyCode);
            if (decodedState.codeB) setCodeB(decodedState.codeB);
            if (decodedState.errorMessage) setErrorMessage(decodedState.errorMessage);
            if (decodedState.comparisonGoal) setComparisonGoal(decodedState.comparisonGoal);
            if (decodedState.reviewProfile) setReviewProfile(decodedState.reviewProfile);
            if (decodedState.customReviewProfile) setCustomReviewProfile(decodedState.customReviewProfile);
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            addToast("Session loaded from URL", "info");
        } catch (e) {
            console.error("Failed to load state from URL hash:", e);
            addToast("Failed to load session from URL", "error");
        }
    }
  }, []); // Run only once on mount

  const getSystemInstructionForReview = useCallback(() => {
    let instruction = SYSTEM_INSTRUCTION;
    if (reviewProfile && reviewProfile !== 'none' && reviewProfile !== ReviewProfile.CUSTOM && PROFILE_SYSTEM_INSTRUCTIONS[reviewProfile]) {
        instruction += `\n\n## Special Focus: ${reviewProfile}\n${PROFILE_SYSTEM_INSTRUCTIONS[reviewProfile]}`;
    } else if (reviewProfile === ReviewProfile.CUSTOM && customReviewProfile.trim()) {
        instruction += `\n\n## Custom Review Instructions:\n${customReviewProfile.trim()}`;
    }
    return instruction;
  }, [reviewProfile, customReviewProfile]);

  const handleStopGenerating = () => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setIsChatLoading(false);
    setLoadingAction(null);
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
    setChatFiles([]);
    setFeatureMatrix(null);
    setFeatureDecisions({});
    setAllFeaturesDecided(false);
    setChatContext('general');
    setActiveFeatureForDiscussion(null);
    setRawFeatureMatrixJson(null);
    setFinalizationSummary(null);
    setFinalizationBriefing(null);
  }

  const handleStreamingRequest = async (
    action: LoadingAction,
    contents: string | { parts: any[] },
    systemInstruction: string,
    model: string,
    originalCode: string,
    fullPromptForSaving: string
  ) => {
    if (!geminiService.isConfigured()) {
        setError("API Key not configured.");
        return;
    }
    
    setIsLoading(true);
    setLoadingAction(action);
    setOutputType(action);
    setIsInputPanelVisible(false);
    resetForNewRequest();

    setFullCodeForReview(fullPromptForSaving);
    setReviewedCode(originalCode);
    setReviewFeedback(''); // Start with an empty string for streaming

    abortControllerRef.current = new AbortController();
    
    try {
        let fullResponse = "";
        await geminiService.streamRequest({
            contents,
            systemInstruction,
            model,
            abortSignal: abortControllerRef.current.signal,
            onChunk: (chunkText) => {
                fullResponse += chunkText;
                setReviewFeedback(fullResponse);
            },
        });
        
        setRevisedCode(extractFinalCodeBlock(fullResponse, true));

    } catch (apiError) {
        const message = apiError instanceof Error ? apiError.message : "An unexpected error occurred.";
        if (message !== "STREAM_ABORTED") {
          setError(`Failed to get review: ${message}`);
          setReviewFeedback(null);
        }
    } finally {
        setIsLoading(false);
        setLoadingAction(null);
    }
  };

  const handleChatSubmit = async (message: string) => {
    if (isChatLoading || !chatSession) {
        if (!chatSession) addToast("Chat session not initialized.", "error");
        return;
    }

    setIsChatLoading(true);

    const userMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: message,
        attachments: attachments.map(att => ({
            name: att.file.name,
            mimeType: att.mimeType,
            content: att.content // base64 for images, raw text for others
        })),
    };

    setChatHistory(prev => [...prev, userMessage]);
    setAttachments([]); // Clear attachments after sending

    try {
        const modelResponseContent: ChatMessage = {
            id: `msg_${Date.now() + 1}`,
            role: 'model',
            content: '',
        };
        setChatHistory(prev => [...prev, modelResponseContent]);

        const parts: Part[] = [{ text: message }];
        userMessage.attachments?.forEach(att => {
            parts.push({
                inlineData: {
                    mimeType: att.mimeType,
                    data: att.content
                }
            });
        });

        const responseStream = await chatSession.sendMessageStream({ message: parts });

        let fullResponseText = '';
        for await (const chunk of responseStream) {
            const chunkText = chunk.text;
            fullResponseText += chunkText;
            setChatHistory(prev => prev.map(msg =>
                msg.id === modelResponseContent.id ? { ...msg, content: fullResponseText } : msg
            ));
        }

        const newRevisedCode = extractFinalCodeBlock(fullResponseText, false);
        if (newRevisedCode) {
            const newRevision: ChatRevision = {
                id: `rev_${Date.now()}`,
                name: `Revision ${chatRevisions.length + 1}`,
                code: newRevisedCode,
            };
            setChatRevisions(prev => [...prev, newRevision]);
        }

        const newFiles = extractGeneratedMarkdownFiles(fullResponseText);
        if (newFiles.length > 0) {
            const newChatFiles: ChatFile[] = newFiles.map(f => ({
                id: `file_chat_${Date.now()}_${f.name}`,
                name: f.name,
                content: f.content,
            }));
            setChatFiles(prev => [...prev, ...newChatFiles]);
        }

    } catch (apiError) {
        const message = apiError instanceof Error ? apiError.message : "An unexpected error occurred.";
        setChatHistory(prev => [...prev, {
            id: `err_${Date.now()}`,
            role: 'model',
            content: `**Error:** ${message}`
        }]);
    } finally {
        setIsChatLoading(false);
    }
  };


  const handleReviewSubmit = (fullCodeToSubmit: string) => {
    const systemInstruction = appMode === 'debug'
      ? `${SYSTEM_INSTRUCTION}\n\n${DEBUG_SYSTEM_INSTRUCTION}`
      : getSystemInstructionForReview();
    const selectedContextFiles = projectFiles.filter(pf => contextFileIds.has(pf.id));
    const contents = geminiService.buildPromptWithProjectFiles(fullCodeToSubmit, selectedContextFiles);
    handleStreamingRequest('review', contents, systemInstruction, GEMINI_MODELS.CORE_ANALYSIS, userOnlyCode, fullCodeToSubmit);
  };

  const handleAuditSubmit = () => {
    const fullCodeToSubmit = generateAuditTemplate(language, userOnlyCode);
    const selectedContextFiles = projectFiles.filter(pf => contextFileIds.has(pf.id));
    const contents = geminiService.buildPromptWithProjectFiles(fullCodeToSubmit, selectedContextFiles);
    handleStreamingRequest('audit', contents, `${SYSTEM_INSTRUCTION}\n\n${AUDIT_SYSTEM_INSTRUCTION}`, GEMINI_MODELS.CORE_ANALYSIS, userOnlyCode, fullCodeToSubmit);
  };

  const handleCompareAndOptimize = () => {
    const prompt = generateComparisonTemplate(language, comparisonGoal, userOnlyCode, codeB);
    const selectedContextFiles = projectFiles.filter(pf => contextFileIds.has(pf.id));
    const contents = geminiService.buildPromptWithProjectFiles(prompt, selectedContextFiles);
    handleStreamingRequest('comparison', contents, `${SYSTEM_INSTRUCTION}\n\n${COMPARISON_SYSTEM_INSTRUCTION}`, GEMINI_MODELS.CORE_ANALYSIS, userOnlyCode, prompt);
  };

  const handleAnalyzeRootCause = () => {
    if (!reviewedCode || !reviewFeedback || !revisedCode) {
        addToast("Not enough context for root cause analysis.", "error");
        return;
    }
    const prompt = generateRootCauseTemplate(reviewedCode, errorMessage, reviewFeedback, revisedCode);
    const selectedContextFiles = projectFiles.filter(pf => contextFileIds.has(pf.id));
    const contents = geminiService.buildPromptWithProjectFiles(prompt, selectedContextFiles);
    handleStreamingRequest('root-cause', contents, ROOT_CAUSE_SYSTEM_INSTRUCTION, GEMINI_MODELS.CORE_ANALYSIS, reviewedCode, prompt);
  };
  
  const handleFinalizeFeatureDiscussion = () => {
    addToast("Feature discussion finalized.", "info");
    setChatContext('general');
    setActiveFeatureForDiscussion(null);
  };

  const handleReturnToOutputView = () => {
    setIsChatMode(false);
    if (showOutputPanel) {
      setIsInputPanelVisible(false);
      setActivePanel('output');
    }
  };

  const handleExportSession = () => {
    try {
        const sessionState = {
            version: "1.8.0",
            appMode, language, reviewProfile, customReviewProfile,
            userOnlyCode, codeB, errorMessage, comparisonGoal,
            versions, projectFiles, reviewFeedback, revisedCode,
            reviewedCode, chatHistory, chatRevisions, chatFiles,
            featureMatrix, rawFeatureMatrixJson, featureDecisions,
            finalizationSummary, finalizationBriefing,
            contextFileIds: Array.from(contextFileIds),
        };
        const blob = new Blob([JSON.stringify(sessionState, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `4ndr0debug_session_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast("Session exported successfully!", "success");
    } catch (err) {
        console.error("Failed to export session:", err);
        addToast("Failed to export session.", "error");
    }
  };

  const processImportedSessionFile = (fileContent: string, fileName: string) => {
    try {
        const importedState = JSON.parse(fileContent);
        
        if (typeof importedState.appMode !== 'string' || typeof importedState.language !== 'string') {
            throw new Error("Invalid session file format.");
        }

        const newSession: ImportedSession = {
            id: `session_${Date.now()}`,
            filename: fileName,
            importedAt: Date.now(),
            appMode: importedState.appMode,
            language: importedState.language,
            versionCount: Array.isArray(importedState.versions) ? importedState.versions.length : 0,
            projectFileCount: Array.isArray(importedState.projectFiles) ? importedState.projectFiles.length : 0,
            hasChatHistory: Array.isArray(importedState.chatHistory) && importedState.chatHistory.length > 0,
            sessionState: importedState,
        };
        
        setImportedSessions(prev => [newSession, ...prev.filter(s => s.filename !== newSession.filename)]);
        addToast(`Session "${fileName}" ready to load.`, "success");
    } catch (err) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred.";
        console.error("Failed to import session file:", err);
        addToast(`Failed to import session: ${message}`, "error");
    }
  };

  const handleImportFile = (file: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
            processImportedSessionFile(result, file.name);
        }
    };
    reader.readAsText(file);
  };

  const handleLoadSession = (sessionState: any) => {
    try {
        // Step 1: Reset all current session-specific state to avoid bleed-over.
        resetForNewRequest();

        // Step 2: Load core application settings and inputs.
        if (sessionState.appMode) setAppMode(sessionState.appMode);
        if (sessionState.language) setLanguage(sessionState.language);
        if (sessionState.reviewProfile) setReviewProfile(sessionState.reviewProfile);
        if (sessionState.customReviewProfile) setCustomReviewProfile(sessionState.customReviewProfile);
        if (typeof sessionState.userOnlyCode === 'string') setUserOnlyCode(sessionState.userOnlyCode);
        if (typeof sessionState.codeB === 'string') setCodeB(sessionState.codeB);
        if (typeof sessionState.errorMessage === 'string') setErrorMessage(sessionState.errorMessage);
        if (typeof sessionState.comparisonGoal === 'string') setComparisonGoal(sessionState.comparisonGoal);
        
        // Step 3: Load persistent project data.
        if (Array.isArray(sessionState.versions)) setVersions(sessionState.versions);
        if (Array.isArray(sessionState.projectFiles)) setProjectFiles(sessionState.projectFiles);
        if (Array.isArray(sessionState.contextFileIds)) setContextFileIds(new Set(sessionState.contextFileIds));
        
        // Step 4: Load the state of the last review/output.
        if (typeof sessionState.reviewFeedback === 'string') setReviewFeedback(sessionState.reviewFeedback);
        if (typeof sessionState.revisedCode === 'string') setRevisedCode(sessionState.revisedCode);
        if (typeof sessionState.reviewedCode === 'string') setReviewedCode(sessionState.reviewedCode);

        // Step 5: Load chat-specific history and generated assets.
        if (Array.isArray(sessionState.chatHistory)) setChatHistory(sessionState.chatHistory);
        if (Array.isArray(sessionState.chatRevisions)) setChatRevisions(sessionState.chatRevisions);
        if (Array.isArray(sessionState.chatFiles)) setChatFiles(sessionState.chatFiles);

        // Step 6: Load state specific to the comparative revision mode.
        if (sessionState.featureMatrix) setFeatureMatrix(sessionState.featureMatrix);
        if (sessionState.rawFeatureMatrixJson) setRawFeatureMatrixJson(sessionState.rawFeatureMatrixJson);
        if (sessionState.featureDecisions) setFeatureDecisions(sessionState.featureDecisions);
        if (sessionState.finalizationSummary) setFinalizationSummary(sessionState.finalizationSummary);
        if (sessionState.finalizationBriefing) setFinalizationBriefing(sessionState.finalizationBriefing);
        
        // Step 7: Determine and set the correct UI state based on the loaded data.
        const hasChat = Array.isArray(sessionState.chatHistory) && sessionState.chatHistory.length > 0;
        const hasFeedback = typeof sessionState.reviewFeedback === 'string' && sessionState.reviewFeedback.length > 0;

        if (hasChat) {
            setIsChatMode(true);
            setActivePanel('input');
            setIsInputPanelVisible(true); // Ensure input is visible for chat
        } else {
            setIsChatMode(false);
            if (hasFeedback) {
                setIsInputPanelVisible(false);
                setActivePanel('output');
            } else {
                setIsInputPanelVisible(true);
                setActivePanel('input');
            }
        }

        // Step 8: Finalize the loading process.
        setIsSessionManagerModalOpen(false);
        addToast("Session loaded successfully!", "success");

    } catch (err) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred.";
        console.error("Failed to load session state:", err);
        addToast(`Failed to load session: ${message}`, "error");
    }
  };

  const handleDeleteImportedSession = (sessionId: string) => {
    setImportedSessions(prev => prev.filter(s => s.id !== sessionId));
    addToast("Imported session removed from list.", "info");
  };

  const handleShareSession = () => {
    try {
        const shareableState = { appMode, language, userOnlyCode, codeB, errorMessage, comparisonGoal, reviewProfile, customReviewProfile };
        const base64State = btoa(JSON.stringify(shareableState));
        const url = new URL(window.location.href);
        url.hash = base64State;
        
        navigator.clipboard.writeText(url.toString())
            .then(() => addToast("Shareable URL copied to clipboard!", "success"))
            .catch(err => {
                console.error("Failed to copy URL:", err);
                addToast("Failed to copy URL to clipboard.", "error");
            });
    } catch (e) {
        console.error("Failed to create shareable URL:", e);
        addToast("Failed to create shareable URL.", "error");
    }
  };

  const handleExplainSelection = (selection: string) => {
    const prompt = `${EXPLAIN_CODE_INSTRUCTION}\n\n\`\`\`${LANGUAGE_TAG_MAP[language]}\n${selection}\n\`\`\``;
    handleStreamingRequest('explain-selection', prompt, SYSTEM_INSTRUCTION, GEMINI_MODELS.FAST_TASKS, selection, prompt);
  };

  const handleReviewSelection = (selection: string) => {
    const prompt = `${REVIEW_SELECTION_INSTRUCTION}\n\n\`\`\`${LANGUAGE_TAG_MAP[language]}\n${selection}\n\`\`\``;
    handleStreamingRequest('review-selection', prompt, getSystemInstructionForReview(), GEMINI_MODELS.CORE_ANALYSIS, selection, prompt);
  };

  const handleStartFollowUp = useCallback(async (version?: Version) => {
    if (version) {
        // Load context from a specific version
        addToast(`Starting follow-up from "${version.name}"...`, "info");
        
        setChatHistory(version.chatHistory || []);
        setChatRevisions(version.chatRevisions || []);
        setChatFiles(version.chatFiles || []);

        setLanguage(version.language);
        setUserOnlyCode(version.userCode);
        setFullCodeForReview(version.fullPrompt);
        setReviewFeedback(version.feedback);
        setReviewedCode(version.userCode);
        setRevisedCode(null);
        if (version.reviewProfile) setReviewProfile(version.reviewProfile);
        if (version.customReviewProfile) setCustomReviewProfile(version.customReviewProfile);
        if (version.comparisonGoal) setComparisonGoal(version.comparisonGoal);
        if (version.contextFileIds) setContextFileIds(new Set(version.contextFileIds));

    } else {
        addToast("Follow-up chat started!", "info");
        setChatHistory([]);
        setChatRevisions([]);
        setChatFiles([]);
    }
    
    setIsChatMode(true);
    setActivePanel('input');
    setIsInputPanelVisible(true);

    const ai = geminiService.getAiClient();
    if (!ai) {
        addToast("Gemini AI not configured. Cannot start chat.", "error");
        return;
    }

    const getChatSystemInstruction = () => {
        if (chatContext === 'feature_discussion' && activeFeatureForDiscussion) {
            return `${COMPARISON_SYSTEM_INSTRUCTION}\n\nThe user wants to discuss the following feature: "${activeFeatureForDiscussion.name}". Description: "${activeFeatureForDiscussion.description}". Source: ${activeFeatureForDiscussion.source}.`;
        }
        switch(appMode) {
            case 'debug': return `${SYSTEM_INSTRUCTION}\n\n${DEBUG_SYSTEM_INSTRUCTION}`;
            case 'comparison': return `${SYSTEM_INSTRUCTION}\n\n${COMPARISON_SYSTEM_INSTRUCTION}`;
            case 'audit': return `${SYSTEM_INSTRUCTION}\n\n${AUDIT_SYSTEM_INSTRUCTION}`;
            default: return getSystemInstructionForReview();
        }
    };

    const initialHistoryForGemini: { role: 'user' | 'model', parts: { text: string }[] }[] = [];
    const sourceFeedback = version ? version.feedback : reviewFeedback;
    const sourcePrompt = version ? version.fullPrompt : fullCodeForReview;
    if (sourcePrompt && sourceFeedback) {
        initialHistoryForGemini.push({ role: 'user', parts: [{ text: sourcePrompt }] });
        initialHistoryForGemini.push({ role: 'model', parts: [{ text: sourceFeedback }] });
    }

    const newChat = ai.chats.create({
        model: GEMINI_MODELS.CORE_ANALYSIS,
        history: initialHistoryForGemini,
        config: {
          systemInstruction: getChatSystemInstruction(),
        }
    });
    setChatSession(newChat);

  }, [addToast, setLanguage, setUserOnlyCode, setFullCodeForReview, setReviewFeedback, setReviewedCode, setRevisedCode, setReviewProfile, customReviewProfile, comparisonGoal, contextFileIds, appMode, chatContext, activeFeatureForDiscussion, getSystemInstructionForReview, reviewFeedback, fullCodeForReview]);
  
  const handleSaveChatSession = () => {
    setIsSavingChat(true);
    setIsSaveModalOpen(true);
  };

  const handleSaveVersion = useCallback(() => {
    if (!versionName.trim()) {
        addToast("Version name cannot be empty.", "error");
        return;
    }

    const newVersion: Version = {
        id: `version_${Date.now()}`,
        name: versionName.trim(),
        userCode: reviewedCode || userOnlyCode,
        fullPrompt: fullCodeForReview,
        feedback: reviewFeedback || '',
        language: language,
        timestamp: Date.now(),
        type: 'review',
        rawFeatureMatrixJson: rawFeatureMatrixJson,
        reviewProfile: reviewProfile,
        customReviewProfile: customReviewProfile,
        comparisonGoal: comparisonGoal,
        contextFileIds: Array.from(contextFileIds),
    };

    if (isSavingChat) {
        newVersion.chatHistory = chatHistory;
        newVersion.feedback = chatHistory.map(msg => `**${msg.role}**: ${msg.content}`).join('\n\n---\n\n');
        newVersion.chatRevisions = chatRevisions;
        newVersion.chatFiles = chatFiles;
    } else if (outputType) {
        const typeMap = { 'docs': 'docs', 'tests': 'tests', 'commit': 'commit', 'finalization': 'finalization', 'audit': 'audit', 'root-cause': 'root-cause' };
        if (typeMap[outputType]) newVersion.type = typeMap[outputType] as Version['type'];
    }
    
    setVersions(prev => [newVersion, ...prev]);
    addToast(`Version "${versionName.trim()}" saved!`, "success");
    setIsSaveModalOpen(false);
    setVersionName('');
    
    if (isSavingChat) {
        setIsSavingChat(false);
        setIsChatMode(false);
        setReviewFeedback(null);
        setChatHistory([]);
        setChatSession(null);
        setChatRevisions([]);
        setChatFiles([]);
    }
  }, [
    versionName, isSavingChat, chatHistory, chatRevisions, chatFiles, reviewedCode, userOnlyCode,
    fullCodeForReview, reviewFeedback, language, outputType, rawFeatureMatrixJson,
    reviewProfile, customReviewProfile, comparisonGoal, contextFileIds,
    setVersions, addToast
  ]);

  const handleLoadVersion = (version: Version) => {
    addToast(`Loading version "${version.name}"...`, "info");
    
    resetForNewRequest();

    // Restore common properties
    setLanguage(version.language);
    setUserOnlyCode(version.userCode);
    setFullCodeForReview(version.fullPrompt);
    setReviewFeedback(version.feedback);
    setReviewedCode(version.userCode);
    if (version.reviewProfile) setReviewProfile(version.reviewProfile);
    if (version.customReviewProfile) setCustomReviewProfile(version.customReviewProfile);
    if (version.comparisonGoal) setComparisonGoal(version.comparisonGoal);
    if (version.contextFileIds) setContextFileIds(new Set(version.contextFileIds));

    // Restore chat-specific properties
    if (version.chatHistory && version.chatHistory.length > 0) {
        setChatHistory(version.chatHistory);
        setChatRevisions(version.chatRevisions || []);
        setChatFiles(version.chatFiles || []);
        setIsChatMode(true);
        setIsInputPanelVisible(true);
        setActivePanel('input');
    } else {
        // Not a chat, just a regular review/output
        setIsInputPanelVisible(false);
        setActivePanel('output');
    }

    setIsVersionHistoryModalOpen(false); // Close the modal after loading
  };

  const handleDeleteVersion = (versionId: string) => {
      setVersions(prev => prev.filter(v => v.id !== versionId));
      addToast("Version deleted.", "info");
  };

  const handleRenameVersion = (versionId: string, newName:string) => {
      setVersions(prev => prev.map(v => v.id === versionId ? { ...v, name: newName } : v));
      addToast("Version renamed.", "success");
  };

  const handleContextFileSelectionChange = (fileId: string, isSelected: boolean) => {
    setContextFileIds(prev => {
        const newSet = new Set(prev);
        if (isSelected) {
            newSet.add(fileId);
        } else {
            newSet.delete(fileId);
        }
        return newSet;
    });
  };

  const onSaveGeneratedFile = (filename: string, content: string) => {
      const newFile: ProjectFile = {
        id: `file_${Date.now()}`, name: filename, mimeType: 'text/markdown',
        timestamp: Date.now(), content: content,
      };
      setProjectFiles(prev => [...prev, newFile]);
      addToast(`Saved "${filename}" to project files.`, "success");
  };

  const handleGenerateTests = () => {
    const codeToTest = revisedCode || userOnlyCode;
    if (!codeToTest.trim()) {
      addToast("No code available to generate tests for.", "info");
      return;
    }
    const prompt = `${GENERATE_TESTS_INSTRUCTION}\n\n\`\`\`${LANGUAGE_TAG_MAP[language]}\n${codeToTest}\n\`\`\``;
    handleStreamingRequest('tests', prompt, SYSTEM_INSTRUCTION, GEMINI_MODELS.CORE_ANALYSIS, codeToTest, prompt);
  };
  
  const handleGenerateCommitMessage = async () => {
    if (!reviewedCode || !revisedCode) return;
    setLoadingAction('commit');
    setIsLoading(true);
    setOutputType('commit');
    setReviewFeedback('');
    try {
        const prompt = generateCommitMessageTemplate(reviewedCode, revisedCode);
        const result = await geminiService.generateJson({
            contents: prompt,
            systemInstruction: COMMIT_MESSAGE_SYSTEM_INSTRUCTION,
            model: GEMINI_MODELS.FAST_TASKS,
            schema: COMMIT_MESSAGE_SCHEMA,
        });
        const scope = result.scope ? `(${result.scope})` : '';
        const formattedMessage = `${result.type}${scope}: ${result.subject}\n\n${result.body}`;
        setReviewFeedback(`### Suggested Commit Message\n\n\`\`\`\n${formattedMessage}\n\`\`\``);
    } catch (apiError) {
        const message = apiError instanceof Error ? apiError.message : "An unexpected error occurred.";
        setError(`Failed to generate commit message: ${message}`);
    } finally {
        setIsLoading(false);
        setLoadingAction(null);
    }
  };

  const handleFinalizeComparison = () => {
    const summary: FinalizationSummary = { included: [], removed: [], revised: [] };
    featureMatrix?.forEach(feature => {
        const decision = featureDecisions[feature.name]?.decision;
        if (decision === 'include') summary.included.push(feature);
        else if (decision === 'remove') summary.removed.push(feature);
        else if (decision === 'discussed') summary.revised.push(feature);
    });
    setFinalizationSummary(summary);
    
    const prompt = generateFinalizationPrompt(userOnlyCode, codeB, summary, featureDecisions);
    handleStreamingRequest('finalization', prompt, COMPARISON_SYSTEM_INSTRUCTION, GEMINI_MODELS.CORE_ANALYSIS, `${userOnlyCode}\n\n${codeB}`, prompt);
  };

  const handleDownloadOutput = () => {
      if (!reviewFeedback) return;
      const blob = new Blob([reviewFeedback], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'documentation.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast("Documentation downloaded.", "success");
  };

  const handleAutoGenerateVersionName = async () => {
    setIsGeneratingName(true);
    try {
        const contentToSummarize = isSavingChat 
            ? chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')
            : reviewFeedback || reviewedCode || '';
        
        if (!contentToSummarize.trim()) {
            addToast("Not enough content to generate a name.", "info");
            return;
        }

        const prompt = generateVersionNamePrompt(contentToSummarize);
        const name = await geminiService.generateText({
            contents: prompt,
            systemInstruction: "You are a helpful assistant that creates concise titles.",
            model: GEMINI_MODELS.FAST_TASKS,
        });
        setVersionName(name.replace(/["']/g, '')); // Remove quotes from response
    } catch (apiError) {
        const message = apiError instanceof Error ? apiError.message : "An unexpected error occurred.";
        addToast(`Failed to generate name: ${message}`, "error");
    } finally {
        setIsGeneratingName(false);
    }
  };
    // --- Project File Handlers ---

  const fileToContent = (file: File): Promise<{ content: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            if (file.type.startsWith('image/')) {
                // Return base64 string without the data URI prefix
                resolve({ content: result.split(',')[1], mimeType: file.type });
            } else {
                resolve({ content: result, mimeType: file.type || 'text/plain' });
            }
        };
        reader.onerror = (error) => reject(error);
        
        if (file.type.startsWith('image/')) {
            reader.readAsDataURL(file);
        } else {
            reader.readAsText(file);
        }
    });
  };

  const handleAttachmentsChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    try {
        const newAttachments = await Promise.all(
            Array.from(files).map(async (file: File) => {
                const { content, mimeType } = await fileToContent(file);
                return { file, content, mimeType };
            })
        );
        setAttachments(prev => [...prev, ...newAttachments]);
        addToast(`${newAttachments.length} file(s) attached to chat.`, "info");
    } catch (error) {
        console.error("Failed to read attachments:", error);
        addToast("Failed to read one or more files.", "error");
    }
  };

  const handleUploadProjectFile = async (file: File) => {
    try {
        const { content, mimeType } = await fileToContent(file);
        const newProjectFile: ProjectFile = {
            id: `proj_${Date.now()}_${file.name}`,
            name: file.name,
            content: content,
            mimeType: mimeType,
            timestamp: Date.now(),
        };
        setProjectFiles(prev => [newProjectFile, ...prev]);
        addToast(`File "${file.name}" uploaded to project.`, "success");
    } catch (error) {
        console.error("Failed to upload project file:", error);
        addToast("Failed to upload file.", "error");
    }
  };

  const handleDeleteProjectFile = (fileId: string) => {
    setProjectFiles(prev => prev.filter(pf => pf.id !== fileId));
    addToast("Project file deleted.", "info");
  };

  const handleDownloadProjectFile = async (content: string, filename: string, mimeType: string) => {
    try {
        let blob: Blob;
        if (mimeType.startsWith('image/')) {
            const response = await fetch(`data:${mimeType};base64,${content}`);
            blob = await response.blob();
        } else {
            blob = new Blob([content], { type: mimeType });
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to download file:", error);
        addToast("Failed to download file.", "error");
    }
  };

  const handleAttachProjectFileToChat = async (projectFile: ProjectFile) => {
    try {
        let blob: Blob;
        if (projectFile.mimeType.startsWith('image/')) {
            const response = await fetch(`data:${projectFile.mimeType};base64,${projectFile.content}`);
            blob = await response.blob();
        } else {
            blob = new Blob([projectFile.content], { type: projectFile.mimeType });
        }
        const file = new File([blob], projectFile.name, { type: projectFile.mimeType });
        
        setAttachments(prev => [...prev, {
            file: file,
            content: projectFile.content,
            mimeType: projectFile.mimeType,
        }]);
        addToast(`Attached "${projectFile.name}" to chat.`, "success");
        setIsProjectFilesModalOpen(false); // Close modal after attaching
    } catch (error) {
        console.error("Failed to attach project file:", error);
        addToast("Failed to attach project file.", "error");
    }
  };

  const renderInputComponent = () => {
    const commonProps = {
      isLoading,
      isActive: activePanel === 'input',
      onStopGenerating: handleStopGenerating,
      contextFileIds,
      onContextFileSelectionChange: handleContextFileSelectionChange,
    };
    
    const chatAndTocProps = {
        isChatMode,
        isChatLoading,
        onFollowUpSubmit: handleChatSubmit,
        chatHistory,
        chatInputValue,
        setChatInputValue,
        onNewReview: () => resetAndSetMode(appMode),
        onSaveChatSession: handleSaveChatSession,
        originalReviewedCode: reviewedCode,
        revisedCode,
        chatRevisions,
        language,
        codeB,
        onCodeLineClick: (line: string) => setChatInputValue(prev => `${prev}\n> ${line}\n`),
        onClearChatRevisions: () => { setChatRevisions([]); addToast("Revisions cleared from chat.", "info"); },
        onRenameChatRevision: (id: string, newName: string) => setChatRevisions(revs => revs.map(r => r.id === id ? {...r, name: newName} : r)),
        onDeleteChatRevision: (id: string) => setChatRevisions(revs => revs.filter(r => r.id !== id)),
        chatFiles,
        onClearChatFiles: () => { setChatFiles([]); addToast("Files cleared from chat.", "info"); },
        onRenameChatFile: (id: string, newName: string) => setChatFiles(files => files.map(f => f.id === id ? {...f, name: newName} : f)),
        onDeleteChatFile: (id: string) => setChatFiles(files => files.filter(f => f.id !== id)),
        chatContext,
        activeFeatureForDiscussion,
        finalizationSummary,
        featureDecisions,
        attachments,
        onAttachFileClick: () => attachFileInputRef.current?.click(),
        onRemoveAttachment: (fileToRemove: File) => setAttachments(atts => atts.filter(att => att.file !== fileToRemove)),
        onOpenProjectFilesModal: () => setIsProjectFilesModalOpen(true),
        onSaveGeneratedFile,
        onFinalizeFeatureDiscussion: handleFinalizeFeatureDiscussion,
        onReturnToOutputView: handleReturnToOutputView,
    };

    switch(appMode) {
      case 'single':
      case 'debug':
        return <CodeInput 
          {...commonProps}
          {...chatAndTocProps}
          onSubmit={handleReviewSubmit} 
          loadingAction={loadingAction}
          onExplainSelection={handleExplainSelection}
          onReviewSelection={handleReviewSelection}
          onOpenSaveModal={() => setIsSaveModalOpen(true)}
        />;
      case 'comparison':
        return <ComparisonInput 
          {...commonProps}
          {...chatAndTocProps}
          onSubmit={handleCompareAndOptimize} 
          onCompareAndRevise={() => { addToast('Compare & Revise not implemented yet.', 'info') }} 
          loadingAction={loadingAction}
        />;
      case 'audit':
        return <AuditInput 
          {...commonProps}
          onSubmit={handleAuditSubmit} 
        />;
      default:
        return null;
    }
  }

  return (
    <div className="h-screen flex flex-col relative">
      <div className="fixed top-1/4 left-8 w-1/4 h-px bg-[var(--hud-color-darker)] opacity-50"></div>
      <div className="fixed bottom-1/4 right-8 w-1/4 h-px bg-[var(--hud-color-darker)] opacity-50"></div>
      <div className="fixed top-1/2 right-12 w-px h-1/4 bg-[var(--hud-color-darker)] opacity-50"></div>
      <div className="fixed bottom-1/3 left-12 w-px h-1/4 bg-[var(--hud-color-darker)] opacity-50"></div>

      <Header 
        isToolsEnabled={userOnlyCode.trim() !== '' && !isChatMode && (appMode === 'single' || appMode === 'debug')}
        isLoading={isLoading || isChatLoading}
        isInputPanelVisible={isInputPanelVisible}
        onToggleInputPanel={() => setIsInputPanelVisible(p => !p)}
        isFollowUpAvailable={reviewAvailable}
        onStartFollowUp={handleStartFollowUp}
        isChatMode={isChatMode}
        onEndChatSession={handleSaveChatSession}
        onGenerateTests={handleGenerateTests}
        onOpenDocsModal={() => setIsDocsModalOpen(true)}
        onOpenProjectFilesModal={() => setIsProjectFilesModalOpen(true)}
        onToggleVersionHistory={() => setIsVersionHistoryModalOpen(true)}
        onExportSession={handleExportSession}
        onImportClick={() => setIsSessionManagerModalOpen(true)}
        onShare={handleShareSession}
      />
      <ApiKeyBanner />
      <main className={`flex-grow container mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 ${isInputPanelVisible && showOutputPanel && !isChatMode ? 'md:grid-cols-2' : ''} gap-6 lg:gap-8 animate-fade-in overflow-hidden`}>
          {isInputPanelVisible && (
            <div className={`min-h-0 ${isChatMode ? 'md:col-span-2' : ''}`} onClick={() => !isChatMode && setActivePanel('input')}>
              {renderInputComponent()}
            </div>
          )}
          
          {showOutputPanel && !isChatMode && (
            <div className="min-h-0" onClick={() => setActivePanel('output')}>
                <ReviewOutput
                  feedback={reviewFeedback}
                  revisedCode={revisedCode}
                  isLoading={isLoading}
                  isChatLoading={isChatLoading}
                  loadingAction={loadingAction}
                  outputType={outputType}
                  error={error}
                  onSaveVersion={() => setIsSaveModalOpen(true)}
                  onShowDiff={() => setIsDiffModalOpen(true)}
                  canCompare={commitMessageAvailable}
                  isActive={activePanel === 'output'}
                  onStartFollowUp={handleStartFollowUp}
                  onGenerateCommitMessage={handleGenerateCommitMessage}
                  reviewAvailable={reviewAvailable}
                  featureMatrix={featureMatrix}
                  featureDecisions={featureDecisions}
                  onFeatureDecision={(feature, decision) => setFeatureDecisions(prev => ({ ...prev, [feature.name]: { decision } }))}
                  allFeaturesDecided={allFeaturesDecided}
                  onFinalize={handleFinalizeComparison}
                  onDownloadOutput={handleDownloadOutput}
                  onSaveGeneratedFile={onSaveGeneratedFile}
                  onAnalyzeRootCause={handleAnalyzeRootCause}
                  errorMessage={errorMessage}
                />
            </div>
          )}
      </main>
      <footer className="py-4 text-center">
          <div className="flex justify-center items-center space-x-6 text-xs text-[var(--hud-color-darker)]">
            <span>4ndr0⫌ebugger &copy; 2025</span>
          </div>
          <input type="file" ref={attachFileInputRef} style={{ display: 'none' }} multiple onChange={handleAttachmentsChange} />
      </footer>
      {isDiffModalOpen && reviewedCode && revisedCode && (
          <DiffViewer 
              oldCode={reviewedCode}
              newCode={revisedCode}
              language={language}
              onClose={() => setIsDiffModalOpen(false)}
          />
      )}
      {isSaveModalOpen && (
          <SaveVersionModal
              isOpen={isSaveModalOpen}
              onClose={() => setIsSaveModalOpen(false)}
              onSave={handleSaveVersion}
              versionName={versionName}
              setVersionName={setVersionName}
              onAutoGenerate={handleAutoGenerateVersionName}
              isGeneratingName={isGeneratingName}
              outputType={outputType}
              isSavingChat={isSavingChat}
          />
      )}
      <VersionHistoryModal 
        isOpen={isVersionHistoryModalOpen}
        onClose={() => setIsVersionHistoryModalOpen(false)}
        onLoadVersion={handleLoadVersion}
        onDeleteVersion={handleDeleteVersion}
        onRenameVersion={handleRenameVersion}
        onStartFollowUp={handleStartFollowUp}
      />
      <ProjectFilesModal
        isOpen={isProjectFilesModalOpen}
        onClose={() => setIsProjectFilesModalOpen(false)}
        onUploadFile={handleUploadProjectFile}
        onDeleteFile={handleDeleteProjectFile}
        onAttachFile={handleAttachProjectFileToChat}
        onDownloadFile={handleDownloadProjectFile}
      />
      <SessionManagerModal
        isOpen={isSessionManagerModalOpen}
        onClose={() => setIsSessionManagerModalOpen(false)}
        onImportFile={handleImportFile}
        onLoadSession={handleLoadSession}
        onDeleteSession={handleDeleteImportedSession}
      />
    </div>
  );
};

// The main App component now simply provides the context and renders the controller.
const App: React.FC = () => {
  const handleReset = () => {
    // This function is called by the context provider to reset AppController's state
    // For a full implementation, this would involve passing setters to the context or using a reducer.
    // This is called from resetAndSetMode in the context.
    console.log("Context requested a session reset.");
  };

  return (
    <AppContextProvider onReset={handleReset}>
      <AppController />
    </AppContextProvider>
  );
};

export default App;