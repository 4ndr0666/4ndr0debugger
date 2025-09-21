

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat, Type } from "@google/genai";
import { Header } from './Components/Header.tsx';
import { CodeInput } from './Components/CodeInput.tsx';
import { ReviewOutput } from './Components/ReviewOutput.tsx';
import { SupportedLanguage, ChatMessage, Version, ReviewProfile, LoadingAction, Toast, AppMode, ChatRevision, Feature, FeatureDecision, ChatContext, FinalizationSummary, FeatureDecisionRecord, ProjectFile } from './types.ts';
import { SUPPORTED_LANGUAGES, GEMINI_MODELS, SYSTEM_INSTRUCTION, DEBUG_SYSTEM_INSTRUCTION, DOCS_SYSTEM_INSTRUCTION, PROFILE_SYSTEM_INSTRUCTIONS, GENERATE_TESTS_INSTRUCTION, EXPLAIN_CODE_INSTRUCTION, REVIEW_SELECTION_INSTRUCTION, COMMIT_MESSAGE_SYSTEM_INSTRUCTION, DOCS_INSTRUCTION, COMPARISON_SYSTEM_INSTRUCTION, COMPARISON_REVISION_SYSTEM_INSTRUCTION, FEATURE_MATRIX_SCHEMA, generateComparisonTemplate, LANGUAGE_TAG_MAP, PLACEHOLDER_MARKER, AUDIT_SYSTEM_INSTRUCTION, generateAuditTemplate } from './constants.ts';
import { DiffViewer } from './Components/DiffViewer.tsx';
import { ComparisonInput } from './Components/ComparisonInput.tsx';
import { VersionHistoryModal } from './Components/VersionHistoryModal.tsx';
import { SaveVersionModal } from './Components/SaveVersionModal.tsx';
import { ToastContainer } from './Components/ToastContainer.tsx';
import { ApiKeyBanner } from './Components/ApiKeyBanner.tsx';
import { DocumentationCenterModal } from './Components/DocumentationCenterModal.tsx';
import { ProjectFilesModal } from './Components/ProjectFilesModal.tsx';
import { AuditInput } from './Components/AuditInput.tsx';

type OutputType = LoadingAction;
type ActivePanel = 'input' | 'output';

// A custom hook to manage state with localStorage persistence.
const usePersistentState = <T,>(storageKey: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [state, setState] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(storageKey);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${storageKey}":`, error);
            return defaultValue;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(storageKey, JSON.stringify(state));
        } catch (error) {
            console.error(`Error setting localStorage key "${storageKey}":`, error);
        }
    }, [storageKey, state]);

    return [state, setState];
};


// A more lenient code block extractor for chat revisions.
const extractLastCodeBlock = (responseText: string): string | null => {
    const allCodeBlocksRegex = /`{3}(?:[a-zA-Z0-9-]*)?\n([\s\S]*?)\n`{3}/g;
    const matches = [...responseText.matchAll(allCodeBlocksRegex)];
    if (matches.length > 0) {
        return matches[matches.length - 1][1].trim();
    }
    return null;
};

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
  const [featureMatrix, setFeatureMatrix] = useState<Feature[] | null>(null);
  const [rawFeatureMatrixJson, setRawFeatureMatrixJson] = useState<string | null>(null);
  const [featureDecisions, setFeatureDecisions] = useState<Record<string, FeatureDecisionRecord>>({});
  const [allFeaturesDecided, setAllFeaturesDecided] = useState(false);
  const [finalizationSummary, setFinalizationSummary] = useState<FinalizationSummary | null>(null);
  const [finalizationBriefing, setFinalizationBriefing] = useState<string | null>(null);

  // --- Audit Mode State (No longer needs selected standards) ---

  // --- View & Chat State ---
  const [isInputPanelVisible, setIsInputPanelVisible] = useState(true);
  const [isChatMode, setIsChatMode] = useState<boolean>(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [activePanel, setActivePanel] = useState<ActivePanel>('input');
  const [chatInputValue, setChatInputValue] = useState('');
  const [chatRevisions, setChatRevisions] = useState<ChatRevision[]>([]);
  const [chatContext, setChatContext] = useState<ChatContext>('general');
  const [activeFeatureForDiscussion, setActiveFeatureForDiscussion] = useState<Feature | null>(null);
  
  // --- Versioning & Modal State ---
  const [versions, setVersions] = usePersistentState<Version[]>('codeReviewVersions', []);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isVersionHistoryModalOpen, setIsVersionHistoryModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [isProjectFilesModalOpen, setIsProjectFilesModalOpen] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [isSavingChat, setIsSavingChat] = useState(false);
  const [isGeneratingName, setIsGeneratingName] = useState<boolean>(false);


  // --- Toast State ---
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // --- File Attachment & Project Files State ---
  const [attachments, setAttachments] = useState<{ file: File; content: string; mimeType: string }[]>([]);
  const [projectFiles, setProjectFiles] = usePersistentState<ProjectFile[]>('projectFiles', []);


  const [ai] = useState(() => process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const attachFileInputRef = useRef<HTMLInputElement>(null);
  const abortStreamRef = useRef(false);

  const isReviewContextCurrent = reviewedCode !== null && (appMode === 'single' || appMode === 'debug' || appMode === 'audit' ? userOnlyCode === reviewedCode : true);
  const reviewAvailable = !!reviewFeedback && isReviewContextCurrent;
  const commitMessageAvailable = !!reviewedCode && !!revisedCode && reviewedCode !== revisedCode;
  const showOutputPanel = isLoading || !!reviewFeedback || !!error;

  // Check if all features have decisions
  useEffect(() => {
    if (featureMatrix && featureMatrix.length > 0) {
        const allDecided = featureMatrix.every(feature => !!featureDecisions[feature.name]);
        setAllFeaturesDecided(allDecided);
    } else {
        setAllFeaturesDecided(false);
    }
  }, [featureDecisions, featureMatrix]);

  // Effect to handle starting a feature discussion after state has updated
  useEffect(() => {
    if (chatContext === 'feature_discussion' && activeFeatureForDiscussion) {
      handleStartFollowUp();
    }
  }, [chatContext, activeFeatureForDiscussion]);

    // Effect to load state from URL hash on initial mount
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
        try {
            const decodedState = JSON.parse(atob(hash));
            
            // Validate and set state
            if (decodedState.appMode) setAppMode(decodedState.appMode);
            if (decodedState.language) setLanguage(decodedState.language);
            if (decodedState.userOnlyCode) setUserOnlyCode(decodedState.userOnlyCode);
            if (decodedState.codeB) setCodeB(decodedState.codeB);
            if (decodedState.errorMessage) setErrorMessage(decodedState.errorMessage);
            if (decodedState.comparisonGoal) setComparisonGoal(decodedState.comparisonGoal);
            if (decodedState.reviewProfile) setReviewProfile(decodedState.reviewProfile);
            if (decodedState.customReviewProfile) setCustomReviewProfile(decodedState.customReviewProfile);
            
            addToast('Shared session loaded from URL!', 'info');
            // Clear hash so a refresh doesn't reload it again if user makes changes
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        } catch (e) {
            console.error("Failed to load state from URL hash:", e);
            addToast('Could not load shared session from URL.', 'error');
        }
    }
  }, []); // Run only once on mount

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
    setFeatureMatrix(null);
    setFeatureDecisions({});
    setAllFeaturesDecided(false);
    setChatContext('general');
    setActiveFeatureForDiscussion(null);
    setRawFeatureMatrixJson(null);
    setFinalizationSummary(null);
    setFinalizationBriefing(null);
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
      ? `${SYSTEM_INSTRUCTION}\n\n${DEBUG_SYSTEM_INSTRUCTION}`
      : getSystemInstructionForReview();
    
    const fullResponse = await performStreamingRequest(fullCodeToSubmit, systemInstruction, GEMINI_MODELS.CORE_ANALYSIS);

    if (fullResponse) {
        setRevisedCode(extractFinalCodeBlock(fullResponse, true));
    }

    setIsLoading(false);
    setLoadingAction(null);
  }, [ai, getSystemInstructionForReview, userOnlyCode, language, appMode]);

  const handleAuditSubmit = useCallback(async () => {
    setIsLoading(true);
    setLoadingAction('audit');
    setOutputType('audit');
    setIsInputPanelVisible(false);
    resetForNewRequest();

    const fullCodeToSubmit = generateAuditTemplate(language, userOnlyCode);

    setFullCodeForReview(fullCodeToSubmit);
    setReviewedCode(userOnlyCode);

    const fullResponse = await performStreamingRequest(fullCodeToSubmit, `${SYSTEM_INSTRUCTION}\n\n${AUDIT_SYSTEM_INSTRUCTION}`, GEMINI_MODELS.CORE_ANALYSIS);

    if (fullResponse) {
        setRevisedCode(extractFinalCodeBlock(fullResponse, true));
    }

    setIsLoading(false);
    setLoadingAction(null);
  }, [ai, userOnlyCode, language]);

  const handleCompareAndOptimize = useCallback(async () => {
    setIsLoading(true);
    setLoadingAction('comparison');
    setOutputType('comparison');
    setIsInputPanelVisible(false); // Requirement #5: Collapse input panel on submit
    resetForNewRequest();

    const prompt = generateComparisonTemplate(language, comparisonGoal, userOnlyCode, codeB);
    setFullCodeForReview(prompt); // Save for versioning
    setReviewedCode(userOnlyCode); // Set Code A as the "before" for diffing

    const fullResponse = await performStreamingRequest(prompt, `${SYSTEM_INSTRUCTION}\n\n${COMPARISON_SYSTEM_INSTRUCTION}`, GEMINI_MODELS.CORE_ANALYSIS);
    
    if (fullResponse) {
        setRevisedCode(extractFinalCodeBlock(fullResponse, true));
    }
    
    setIsLoading(false);
    setLoadingAction(null);
  }, [ai, language, comparisonGoal, userOnlyCode, codeB]);

  const handleCompareAndRevise = useCallback(async () => {
    if (!ai) {
      const msg = "Error: API Key not configured.";
      setError(msg);
      addToast(msg, 'error');
      return;
    }
    setIsLoading(true);
    setLoadingAction('revise');
    setOutputType('revise');
    setIsInputPanelVisible(false);
    resetForNewRequest();

    const prompt = generateComparisonTemplate(language, comparisonGoal, userOnlyCode, codeB);
    setFullCodeForReview(prompt);
    setReviewedCode(userOnlyCode);

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODELS.CORE_ANALYSIS,
            contents: prompt,
            config: {
                systemInstruction: `${SYSTEM_INSTRUCTION}\n\n${COMPARISON_REVISION_SYSTEM_INSTRUCTION}`,
                responseMimeType: 'application/json',
                responseSchema: FEATURE_MATRIX_SCHEMA,
            }
        });
        
        const rawJsonResponse = response.text;
        const jsonResponse = JSON.parse(rawJsonResponse);
        if (jsonResponse && jsonResponse.features) {
            setFeatureMatrix(jsonResponse.features);
            setRawFeatureMatrixJson(rawJsonResponse);
            setReviewFeedback("Feature matrix generated. Please make a decision for each feature to proceed.");
        } else {
            throw new Error("Invalid feature matrix format received from API.");
        }

    } catch (apiError) {
        console.error("Comparative Revision API Error:", apiError);
        const message = apiError instanceof Error ? apiError.message : "An unexpected error occurred.";
        setError(`Failed to generate feature matrix: ${message}`);
        addToast(`API Error: ${message}`, 'error');
        setFeatureMatrix(null);
        setReviewFeedback(null);
    } finally {
        setIsLoading(false);
        setLoadingAction(null);
    }
  }, [ai, language, comparisonGoal, userOnlyCode, codeB]);

  const handleTriggerDocsGeneration = useCallback(async (codeToDocument: string) => {
    if (!codeToDocument.trim()) {
      addToast("Cannot generate documentation for empty code.", "error");
      return;
    }
    setIsDocsModalOpen(false); // Close modal before starting
    setIsLoading(true);
    setLoadingAction('docs');
    setOutputType('docs');
    setIsInputPanelVisible(false);
    resetForNewRequest();
    
    const prompt = `\`\`\`${LANGUAGE_TAG_MAP[language]}\n${codeToDocument}\n\`\`\``;

    setFullCodeForReview(prompt);
    setReviewedCode(codeToDocument); // Set the source code as "reviewed"
    
    const systemInstruction = `${SYSTEM_INSTRUCTION}\n\n${DOCS_SYSTEM_INSTRUCTION}\n\n${DOCS_INSTRUCTION}`;
    await performStreamingRequest(prompt, systemInstruction, GEMINI_MODELS.CORE_ANALYSIS);

    setIsLoading(false);
    setLoadingAction(null);
  }, [ai, language]);

  const handleGenerateTests = useCallback(async () => {
    if (appMode === 'comparison' || !userOnlyCode.trim() || isChatMode) return;
    setIsLoading(true);
    setLoadingAction('tests');
    setOutputType('tests');
    setIsInputPanelVisible(false);
    resetForNewRequest();
    setReviewedCode(userOnlyCode);

    const prompt = `\`\`\`${language}\n${userOnlyCode}\n\`\`\``;
    setFullCodeForReview(prompt);
    await performStreamingRequest(prompt, `${SYSTEM_INSTRUCTION}\n\n${GENERATE_TESTS_INSTRUCTION}`, GEMINI_MODELS.CORE_ANALYSIS);

    setIsLoading(false);
    setLoadingAction(null);
  }, [ai, userOnlyCode, language, appMode, isChatMode]);
  
  const handleStartFollowUp = useCallback(async (version?: Version, modeOverride?: AppMode) => {
    // If a chat session already exists and we're not loading a new version, just resume it.
    if (chatSession && !version) {
        setIsChatMode(true);
        setActivePanel('input');
        setIsInputPanelVisible(true);
        return;
    }

    if (chatContext === 'feature_discussion' && activeFeatureForDiscussion && ai) {
        // Set up UI for loading state
        setIsChatMode(true);
        setActivePanel('input');
        setIsInputPanelVisible(true);
        setIsChatLoading(true);
        setChatHistory([]); // Clear any previous history

        const systemInstruction = `${SYSTEM_INSTRUCTION}\n\nYou are a senior software architect. Your task is to initiate a discussion about a specific software feature, keeping a shared project goal in mind. You will be given a "Shared Goal", the "Name" of the feature, and its "Description". Your response MUST begin by referencing the shared goal and explaining how it relates to the feature. You should then provide your initial thoughts, suggestions, or questions to kickstart a productive conversation. Example starters: "To align with our shared goal of ${comparisonGoal || '...'}, I think we should approach the '${activeFeatureForDiscussion.name}' feature by..." or "Considering the goal is to ${comparisonGoal || '...'}, my initial recommendation for '${activeFeatureForDiscussion.name}' is...".`;
        
        const primerPrompt = `Shared Goal: "${comparisonGoal || 'create the best possible unified code'}"\n\nFeature Name: "${activeFeatureForDiscussion.name}"\nFeature Description: "${activeFeatureForDiscussion.description}"\n\nPlease start the discussion.`;

        try {
            const newChat = ai.chats.create({ 
                model: GEMINI_MODELS.CORE_ANALYSIS, 
                history: [], // Start fresh for this feature
                config: { systemInstruction }
            });
            setChatSession(newChat);

            const response = await newChat.sendMessage({ message: primerPrompt });
            const aiPrimerMessage = response.text;

            setChatHistory([{ id: `chat_initial_${Date.now()}`, role: 'model', content: aiPrimerMessage }]);
        } catch (apiError) {
            console.error("Feature discussion primer error:", apiError);
            const message = apiError instanceof Error ? apiError.message : "Failed to start discussion.";
            setChatHistory([{ id: `chat_error_${Date.now()}`, role: 'model', content: `Error: Could not start discussion. ${message}` }]);
        } finally {
            setIsChatLoading(false);
        }
        return;
    }

    const contextFeedback = version ? version.feedback : reviewFeedback;
    const contextCode = version ? version.fullPrompt : fullCodeForReview;
    const contextUserCode = version ? version.userCode : (appMode === 'comparison' ? userOnlyCode : reviewedCode);
    
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
    if (!version && chatInputValue.trim() === '') {
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
    
    if (!version && selectionText) {
      setChatInputValue(`Regarding this section:\n\n> ${selectionText.split('\n').join('\n> ')}\n\n`);
    } else if (chatInputValue.trim() === '' && chatContext !== 'feature_discussion') {
      setChatInputValue('');
    }
    
    const systemInstructionForChat = (modeOverride || appMode) === 'debug'
        ? `${SYSTEM_INSTRUCTION}\n\n${DEBUG_SYSTEM_INSTRUCTION}`
        : getSystemInstructionForReview();

    const newChat = ai.chats.create({ 
      model: GEMINI_MODELS.CORE_ANALYSIS, 
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
  }, [reviewFeedback, fullCodeForReview, ai, getSystemInstructionForReview, userOnlyCode, appMode, chatInputValue, reviewedCode, chatContext, activeFeatureForDiscussion, comparisonGoal, chatSession]);

  const handleExplainSelection = useCallback(async (selection: string) => {
    setIsLoading(true);
    setLoadingAction('explain-selection');
    setOutputType('explain-selection');
    setIsInputPanelVisible(false);
    resetForNewRequest();

    const prompt = `\`\`\`${language}\n${selection}\n\`\`\``;
    setFullCodeForReview(prompt);
    setReviewedCode(selection);

    const fullResponse = await performStreamingRequest(prompt, `${SYSTEM_INSTRUCTION}\n\n${EXPLAIN_CODE_INSTRUCTION}`, GEMINI_MODELS.FAST_TASKS);

    if (fullResponse && !abortStreamRef.current) {
        handleStartFollowUp();
    }

    setIsLoading(false);
    setLoadingAction(null);
  }, [ai, language, handleStartFollowUp]);
  
  const handleReviewSelection = useCallback(async (selection: string) => {
    setIsLoading(true);
    setLoadingAction('review-selection');
    setOutputType('review-selection');
    setIsInputPanelVisible(false);
    resetForNewRequest();

    const prompt = `\`\`\`${language}\n${selection}\n\`\`\``;
    setFullCodeForReview(prompt);
    setReviewedCode(selection);
    
    const systemInstruction = `${getSystemInstructionForReview()}\n\n${REVIEW_SELECTION_INSTRUCTION}`;
    const fullResponse = await performStreamingRequest(prompt, systemInstruction, GEMINI_MODELS.CORE_ANALYSIS);

    if (fullResponse && !abortStreamRef.current) {
        handleStartFollowUp();
    }

    setIsLoading(false);
    setLoadingAction(null);
  }, [ai, language, getSystemInstructionForReview, handleStartFollowUp]);

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
                  systemInstruction: `${SYSTEM_INSTRUCTION}\n\n${COMMIT_MESSAGE_SYSTEM_INSTRUCTION}`,
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


  const handleRemoveAttachment = (fileToRemove: File) => {
    setAttachments(prev => prev.filter(att => att.file !== fileToRemove));
  };

  const handleFollowUpSubmit = useCallback(async (message: string, session?: Chat | null) => {
    const currentSession = session || chatSession;
    if (!currentSession) return;

    setIsChatLoading(true);
    setError(null);
    
    const userMessageForUi: ChatMessage = {
        id: `chat_user_${Date.now()}`,
        role: 'user',
        content: message,
    };

    if (attachments.length > 0) {
        userMessageForUi.attachments = attachments.map(att => ({
            name: att.file.name,
            mimeType: att.mimeType,
            content: att.mimeType.startsWith('image/') ? `data:${att.mimeType};base64,${att.content}` : att.content,
        }));
    }

    setChatHistory(prev => [...prev, userMessageForUi]);
    setActivePanel('input');
    abortStreamRef.current = false;

    let messageToSend = message;

    // Special handling for the first message in the finalization context.
    if (chatContext === 'finalization' && chatHistory.length === 1) {
        if (!featureMatrix || !finalizationSummary) {
            const err = "Finalization context is missing. Cannot proceed.";
            setError(err);
            addToast(err, 'error');
            setIsChatLoading(false);
            return;
        }

        const { included, removed, revised } = finalizationSummary;
        
        let briefing = `## Canonical Action Map\n\n`;
        briefing += `You are a senior software architect tasked with unifying two codebases (Codebase A and Codebase B) into a single, production-ready file. You will be provided with a detailed 'Canonical Action Map' that you must follow precisely.\n\n`;
        briefing += `**Original Codebases:**\n${fullCodeForReview}\n\n---\n\n`;
        briefing += `**ACTION PLAN:**\n\n`;

        if (included.length > 0) {
            briefing += `### 1. Features to INTEGRATE AS-IS:\nThese features should be included in the final output, preferring the best implementation if common.\n${included.map(f => `- **${f.name}** (${f.source}): ${f.description}`).join('\n')}\n\n`;
        }
        if (removed.length > 0) {
            briefing += `### 2. Features to EXCLUDE:\nThese features must be omitted from the final codebase.\n${removed.map(f => `- **${f.name}** (${f.source}): ${f.description}`).join('\n')}\n\n`;
        }
        if (revised.length > 0) {
            briefing += `### 3. Features to REVISE AND INTEGRATE:\nFor each feature below, use the provided context and revised code snippets to inform the final implementation.\n\n`;
            revised.forEach(feature => {
                const decisionRecord = featureDecisions[feature.name];
                briefing += `#### Feature: "${feature.name}"\n`;
                briefing += `*Description:* ${feature.description}\n\n`;
                if (decisionRecord?.history && decisionRecord.history.length > 0) {
                    const transcript = decisionRecord.history.slice(1).map(msg => `[${msg.role.toUpperCase()}]: ${msg.content}`).join('\n\n');
                    briefing += `**Discussion Transcript for Context:**\n\`\`\`text\n${transcript}\n\`\`\`\n\n`;
                }
                if (decisionRecord?.revisedSnippet) {
                    briefing += `**CRITICAL INSTRUCTION:** For this feature, you MUST use the following revised code snippet exactly as provided in the final unified codebase:\n`;
                    briefing += `\`\`\`${LANGUAGE_TAG_MAP[language]}\n${decisionRecord.revisedSnippet}\n\`\`\`\n\n`;
                }
            });
        }
        briefing += `---\n\n### 4. Final User Instructions:\n${message}\n\n`;
        briefing += `Based on this complete Canonical Action Map, please provide the final, complete, and runnable unified codebase in a single markdown block under the heading '### Revised Code'. Ensure all integrated and revised features work together seamlessly.`;
        messageToSend = briefing;
        setFinalizationBriefing(messageToSend); // Save for versioning
    }

    type ApiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
    const apiParts: ApiPart[] = [{ text: messageToSend }];

    if (attachments.length > 0) {
        attachments.forEach(att => {
            if (att.mimeType.startsWith('image/')) {
                apiParts.push({ inlineData: { mimeType: att.mimeType, data: att.content } });
            } else {
                const firstPart = apiParts[0] as { text: string };
                firstPart.text += `\n\n--- Attached File: ${att.file.name} ---\n\n${att.content}`;
            }
        });
    }
    
    setAttachments([]); // Clear attachments after preparing the payload
    
    const modelMessageId = `chat_model_${Date.now()}`;
    
    try {
      setChatHistory(prev => [...prev, { id: modelMessageId, role: 'model', content: '' }]); // Add empty placeholder
      
      const responseStream = await currentSession.sendMessageStream({ message: apiParts });
      
      let currentResponse = "";
      for await (const chunk of responseStream) {
        if (abortStreamRef.current) break;
        const chunkText = chunk.text;
        currentResponse += chunkText;
        setChatHistory(prev => {
          const newHistory = [...prev];
          const lastMessageIndex = newHistory.findIndex(m => m.id === modelMessageId);
          if (lastMessageIndex !== -1) {
            newHistory[lastMessageIndex] = { ...newHistory[lastMessageIndex], content: currentResponse };
          }
          return newHistory;
        });
      }
      
      if (!abortStreamRef.current) {
        const newRevisionCode = extractLastCodeBlock(currentResponse);
        if (newRevisionCode) {
           setRevisedCode(newRevisionCode); // Update the main revised code for diffing in finalize context
           setReviewFeedback(currentResponse); // Update feedback to include the final generated code
          setChatRevisions(prev => {
            const lastRevisionCode = prev.length > 0 ? prev[prev.length - 1].code : revisedCode;
            if (lastRevisionCode !== newRevisionCode) {
              const newVersionName = `Chat Revision ${prev.length + 1}`;
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
        setChatHistory(prev => prev.filter(msg => msg.id !== modelMessageId && msg.role !== 'user' || msg.content !== message));
      }
    } finally {
      setIsChatLoading(false);
    }
  }, [chatSession, revisedCode, chatContext, chatHistory, finalizationSummary, featureMatrix, fullCodeForReview, featureDecisions, language, attachments]);

  const handleCodeLineClick = (line: string) => {
    setChatInputValue(`Can you explain this line for me?\n\`\`\`\n${line}\n\`\`\``);
    setActivePanel('input');
  };
  
  const handleFeatureDecision = (feature: Feature, decision: FeatureDecision) => {
    if (decision === 'discussed') {
        setActiveFeatureForDiscussion(feature);
        setChatContext('feature_discussion');
    } else {
        setFeatureDecisions(prev => ({ ...prev, [feature.name]: { decision } }));
        addToast(`Feature "${feature.name}" marked to '${decision}'.`, 'info');
    }
  };

  const handleFinalizeRevision = useCallback(() => {
    if (!featureMatrix || !ai) return;

    setLoadingAction('finalization');
    setOutputType('finalization');

    const included = featureMatrix.filter(f => featureDecisions[f.name]?.decision === 'include');
    const removed = featureMatrix.filter(f => featureDecisions[f.name]?.decision === 'remove');
    const revised = featureMatrix.filter(f => featureDecisions[f.name]?.decision === 'discussed');
    const summary = { included, removed, revised };
    setFinalizationSummary(summary);

    // Set up UI for finalization, but wait for user input.
    setChatContext('finalization');
    setIsChatMode(true);
    setActivePanel('input');
    setIsInputPanelVisible(true);
    setChatHistory([
        { 
            id: `chat_initial_${Date.now()}`, 
            role: 'model', 
            content: "Finalization plan constructed. Provide your final instructions for generating the unified codebase, then press send." 
        }
    ]);
    
    // Create a new, empty chat session. The context will be built and sent with the first user message.
    const newChat = ai.chats.create({
      model: GEMINI_MODELS.CORE_ANALYSIS,
      history: [], 
      config: {
        systemInstruction: `${SYSTEM_INSTRUCTION}\n\n${COMPARISON_SYSTEM_INSTRUCTION}`,
      }
    });
    setChatSession(newChat);

  }, [featureMatrix, featureDecisions, ai]);

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

  const handleDeleteChatRevision = (revisionId: string) => {
    setChatRevisions(prev => prev.filter(rev => rev.id !== revisionId));
    addToast("Revision removed.", "info");
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

  const handleFinalizeFeatureDiscussion = useCallback(() => {
    if (chatContext === 'feature_discussion' && activeFeatureForDiscussion) {
        const discussionHistory = chatHistory;
        
        // A more lenient code block extractor for snippets
        const extractSnippetCodeBlock = (responseText: string): string | null => {
            const allCodeBlocksRegex = /`{3}(?:[a-zA-Z0-9-]*)?\n([\s\S]*?)\n`{3}/g;
            const matches = [...responseText.matchAll(allCodeBlocksRegex)];
            if (matches.length > 0) {
                return matches[matches.length - 1][1].trim();
            }
            return null;
        };

        const lastAiResponse = discussionHistory.slice().reverse().find(m => m.role === 'model')?.content || '';
        const revisedSnippet = extractSnippetCodeBlock(lastAiResponse);

        setFeatureDecisions(prev => ({ 
            ...prev, 
            [activeFeatureForDiscussion.name as string]: {
                decision: 'discussed',
                history: discussionHistory,
                revisedSnippet: revisedSnippet || undefined
            } 
        }));
        addToast(`Discussion for "${activeFeatureForDiscussion.name}" complete.${revisedSnippet ? ' Snippet captured.' : ''}`, 'info');
        
        // Reset UI state to return to the feature matrix view.
        setIsChatMode(false);
        setChatContext('general');
        setActiveFeatureForDiscussion(null);
        setChatHistory([]);
        setChatSession(null);
        setChatInputValue('');
        setIsInputPanelVisible(false); // Return focus to the output panel
    }
  }, [chatContext, activeFeatureForDiscussion, chatHistory]);

  const handleEndGeneralChat = useCallback(() => {
    if (chatHistory.length > 1) {
      // Use the existing save modal for a consistent UX
      setIsSavingChat(true);
      setVersionName(`Chat Session - ${new Date().toLocaleString()}`);
      setIsSaveModalOpen(true);
    } else {
      // If there's no real chat history, just go back to the start.
      resetAndSetMode('debug');
    }
  }, [chatHistory]);


  const handleReturnToOutputView = () => {
    setIsChatMode(false);
    setIsInputPanelVisible(false);
    setActivePanel('output');
  };

  const handleOpenSaveModal = () => {
    const canSaveReview = !!reviewFeedback && !isChatMode && !isLoading && !error;
    const canSaveFinalization = chatContext === 'finalization' && !!revisedCode;
    if (!canSaveReview && !canSaveFinalization) return;
    setVersionName(`SYS_SAVE // ${new Date().toLocaleString()}`);
    setIsSaveModalOpen(true);
  };

  const handleCloseSaveModal = () => {
    // When a user cancels saving a chat, they should return to the chat, not have the app reset.
    // The reset to debug screen only happens on successful save.
    setIsSaveModalOpen(false);
    setIsSavingChat(false); // Always reset the flag
  };


  const handleConfirmSaveVersion = () => {
    if (!versionName.trim()) return;

    // Determine the feedback content based on whether we are saving a chat session
    let feedbackToSave = reviewFeedback!;
    if (isSavingChat) {
      const chatLog = chatHistory.slice(1) // Exclude initial review from log
        .map(msg => `**[${msg.role.toUpperCase()}]**\n\n${msg.content}`)
        .join('\n\n---\n\n');
      feedbackToSave = (reviewFeedback || '') + '\n\n---\n\n## Follow-up Chat History\n\n' + chatLog;
    }
    
    if (chatContext !== 'finalization' && (!feedbackToSave || !fullCodeForReview)) return;
    
    const isFinalizing = chatContext === 'finalization' || outputType === 'finalization';
    let versionType: Version['type'] = 'review';
    
    if (isFinalizing) {
        versionType = 'finalization';
    } else if (outputType === 'audit' || outputType === 'docs' || outputType === 'tests' || outputType === 'commit') {
        versionType = outputType;
    }

    const newVersion: Version = {
      id: `v_${Date.now()}`,
      name: versionName.trim(),
      userCode: reviewedCode || userOnlyCode, // The original code A before revision
      fullPrompt: isFinalizing && finalizationBriefing ? finalizationBriefing : fullCodeForReview,
      feedback: isFinalizing && revisedCode ? revisedCode : feedbackToSave,
      language,
      timestamp: Date.now(),
      type: versionType,
      chatRevisions: isFinalizing ? [] : chatRevisions,
      rawFeatureMatrixJson: isFinalizing ? rawFeatureMatrixJson : null,
    };

    setVersions(prevVersions => [newVersion, ...prevVersions]);
    setIsSaveModalOpen(false);
    setVersionName('');
    addToast('Version saved successfully!', 'success');
    
    if (isSavingChat) {
      resetAndSetMode('debug');
      setIsSavingChat(false);
    }
  };
  
  const handleGenerateVersionName = useCallback(async () => {
    if (!ai || !reviewedCode) {
        addToast("Cannot generate name without code context.", "error");
        return;
    }

    setIsGeneratingName(true);
    setLoadingAction('generate-name');

    const prompt = `Based on the following code and its review feedback (if available), generate a short, descriptive version name (under 50 characters). Respond with ONLY the name itself, with no extra formatting, quotes, or explanation.\n\n### Code:\n\`\`\`${language}\n${reviewedCode}\n\`\`\`\n\n### Review Feedback:\n${reviewFeedback || "No feedback provided."}`;
    
    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODELS.FAST_TASKS,
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION
            }
        });

        const generatedName = response.text.trim().replace(/["']/g, ''); // Clean up quotes
        setVersionName(generatedName);
        addToast("Version name generated.", "success");
    } catch (apiError) {
        console.error("Version Name Generation Error:", apiError);
        const message = apiError instanceof Error ? apiError.message : "An unexpected error occurred.";
        addToast(`Failed to generate name: ${message}`, 'error');
    } finally {
        setIsGeneratingName(false);
        setLoadingAction(null);
    }
  }, [ai, reviewedCode, reviewFeedback, language]);

  const handleLoadVersion = (version: Version) => {
    resetAndSetMode('single'); // Reset with a temporary mode

    setUserOnlyCode(version.userCode);
    setLanguage(version.language);
    setFullCodeForReview(version.fullPrompt);
    setReviewFeedback(version.feedback);
    setReviewedCode(version.userCode);
    setChatRevisions(version.chatRevisions || []);
    setRawFeatureMatrixJson(version.rawFeatureMatrixJson || null);
    
    const finalCodeInLoaded = extractFinalCodeBlock(version.feedback, true);
    setRevisedCode(finalCodeInLoaded);

    setActivePanel('output');
    setIsInputPanelVisible(false);
    
    if (version.type === 'audit') {
        setAppMode('audit');
    } else if (version.fullPrompt.includes('### Codebase B')) {
      setAppMode('comparison');
    } else if (version.fullPrompt.includes('### Error Message / Context')) {
      setAppMode('debug');
    } else {
      setAppMode('single');
    }

    if (version.type === 'docs' || version.fullPrompt.includes(DOCS_INSTRUCTION)) {
      setOutputType('docs');
    } else if (version.type === 'tests' || version.fullPrompt.includes(GENERATE_TESTS_INSTRUCTION)) {
      setOutputType('tests');
    } else if (version.type === 'commit') {
      setOutputType('commit');
    } else if (version.type === 'audit') {
      setOutputType('audit');
    } else if (version.type === 'finalization' || version.rawFeatureMatrixJson) {
      setOutputType('revise');
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
      projectFiles,
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
      rawFeatureMatrixJson,
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

        if (!Array.isArray(data.versions)) throw new Error("Invalid session file: 'versions' is missing or not an array.");
        
        // Perform a direct state load from the imported file.
        // This is more robust than chaining a reset function with setters.
        setVersions(data.versions ?? []);
        setProjectFiles(data.projectFiles ?? []);
        setAppMode(data.appMode ?? 'debug');
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
        setRawFeatureMatrixJson(data.rawFeatureMatrixJson ?? null);
        setCodeB(data.codeB ?? '');
        setComparisonGoal(data.comparisonGoal ?? '');
        
        const chatHistoryWithIds = (data.chatHistory ?? []).map((msg: Omit<ChatMessage, 'id'>, index: number) => ({
          ...msg,
          id: `imported_${Date.now()}_${index}`
        }));
        setChatHistory(chatHistoryWithIds);
        
        const wasInChat = chatHistoryWithIds.length > 0;
        setIsInputPanelVisible(!wasInChat);
        setIsChatMode(wasInChat);
        setActivePanel(wasInChat ? 'input' : 'output');

        setError(null);
        setOutputType(null);
        setChatSession(null);

        // Restore chat session with full history if applicable
        if (ai && wasInChat && data.fullCodeForReview && data.reviewFeedback) {
            const historyForAPI: {role: 'user' | 'model', parts: {text: string}[]}[] = [
                { role: 'user', parts: [{ text: data.fullCodeForReview }] },
                { role: 'model', parts: [{ text: data.reviewFeedback }] }
            ];

            const subsequentChatMessages = chatHistoryWithIds.slice(1);
            subsequentChatMessages.forEach((msg: ChatMessage) => {
                historyForAPI.push({ role: msg.role, parts: [{ text: msg.content }] });
            });

            const newChat = ai.chats.create({
                model: GEMINI_MODELS.CORE_ANALYSIS,
                history: historyForAPI,
                config: { systemInstruction: getSystemInstructionForReview() }
            });
            setChatSession(newChat);
        }
        
        addToast('Session imported successfully!', 'success');

      } catch (err) {
        const msg = err instanceof Error ? `Import failed: ${err.message}` : "Import failed: Invalid file.";
        console.error("Failed to import session:", err);
        setError(msg);
        addToast(msg, 'error');
      } finally {
        if(event.target) {
            event.target.value = '';
        }
      }
    };
    reader.onerror = () => {
        const msg = "Failed to read the selected file.";
        setError(msg);
        addToast(msg, 'error');
    }
    reader.readAsText(file);
  };
  
  const handleDownloadAsFile = (content: string, filename: string, mimeType: string = 'text/markdown;charset=utf-8') => {
    const isBase64 = !mimeType.startsWith('text/');
    const byteString = isBase64 ? atob(content) : content;
    const buffer = new ArrayBuffer(byteString.length);
    const intArray = new Uint8Array(buffer);
    for (let i = 0; i < byteString.length; i++) {
        intArray[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([buffer], { type: mimeType });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast(`${filename} downloaded.`, 'success');
  };

  const handleShare = () => {
    try {
        const stateToShare = {
            appMode,
            language,
            userOnlyCode,
            codeB,
            errorMessage,
            comparisonGoal,
            reviewProfile,
            customReviewProfile,
        };

        const jsonState = JSON.stringify(stateToShare);
        const base64State = btoa(jsonState);
        
        const url = new URL(window.location.href);
        url.hash = base64State;
        
        navigator.clipboard.writeText(url.href).then(() => {
            addToast('Shareable link copied to clipboard!', 'success');
        }, (err) => {
            console.error('Could not copy text: ', err);
            addToast('Failed to copy share link.', 'error');
        });

    } catch (e) {
        console.error("Failed to create share link:", e);
        addToast('Could not create share link.', 'error');
    }
  };

  const handleImportClick = () => {
    importFileInputRef.current?.click();
  };

  const handleAttachFileClick = () => {
    attachFileInputRef.current?.click();
  };

  const handleFileAttach = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const MAX_SIZE_MB = 10;
    const newAttachmentsPromises = Array.from(files).map(file => {
        return new Promise<{ file: File; content: string; mimeType: string }>((resolve, reject) => {
            if (file.size > MAX_SIZE_MB * 1024 * 1024) {
                return reject(new Error(`File "${file.name}" exceeds ${MAX_SIZE_MB}MB limit.`));
            }
            const isImage = file.type.startsWith('image/');
            const isText = file.type.startsWith('text/') || file.type.includes('json') || /\.(log|md|txt)$/i.test(file.name);
            if (!isImage && !isText) {
                return reject(new Error(`Unsupported file type for "${file.name}": ${file.type || 'unknown'}.`));
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                if (!result) return reject(new Error(`Failed to read file: ${file.name}`));
                
                const content = isImage ? result.split(',')[1] : result;
                resolve({ file, content, mimeType: file.type });
            };
            reader.onerror = () => reject(new Error(`Error reading file: ${file.name}`));

            if (isImage) {
                reader.readAsDataURL(file);
            } else {
                reader.readAsText(file);
            }
        });
    });

    Promise.all(newAttachmentsPromises)
        .then(newAttachments => {
            setAttachments(prev => [...prev, ...newAttachments]);
        })
        .catch(error => {
            addToast(error.message, 'error');
        });

    if (event.target) {
        event.target.value = ''; // Allow re-selecting the same file(s)
    }
  };

  const handleLoadRevisionIntoEditor = () => {
    if (!revisedCode) {
        addToast('No revised code available to load.', 'error');
        return;
    }
    const targetMode = appMode === 'comparison' ? 'single' : appMode;
    resetAndSetMode(targetMode);
    setUserOnlyCode(revisedCode);
    setReviewedCode(revisedCode); // Set it as reviewed to allow for another cycle
    setIsInputPanelVisible(true);
    setActivePanel('input');
    addToast('Revision loaded into editor.', 'success');
  };
  
  const handleSaveFileToProject = (file: File) => {
    const MAX_SIZE_MB = 10;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      addToast(`File size exceeds ${MAX_SIZE_MB}MB limit.`, 'error');
      return;
    }
    
    const isImage = file.type.startsWith('image/');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        addToast('Failed to read file content.', 'error');
        return;
      }
      const newFile: ProjectFile = {
        id: `file_${Date.now()}`,
        name: file.name,
        mimeType: file.type,
        timestamp: Date.now(),
        content: isImage ? result.split(',')[1] : result,
      };
      setProjectFiles(prev => [...prev, newFile]);
      addToast(`File "${file.name}" saved to project.`, 'success');
    };
    reader.onerror = () => addToast('Error reading file.', 'error');

    if (isImage) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleDeleteProjectFile = (fileId: string) => {
    setProjectFiles(prev => prev.filter(f => f.id !== fileId));
    addToast('Project file deleted.', 'info');
  };

  const handleAttachProjectFile = (file: ProjectFile) => {
    const mockFile = new File([file.content], file.name, { type: file.mimeType });
    setAttachments(prev => [...prev, {
        file: mockFile,
        content: file.content,
        mimeType: file.mimeType,
    }]);
    setIsProjectFilesModalOpen(false);
    addToast(`Attached "${file.name}" to message.`, 'info');
  };

  const renderInputComponent = () => {
    switch(appMode) {
      case 'single':
      case 'debug':
        return (
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
            onFinalizeFeatureDiscussion={handleFinalizeFeatureDiscussion}
            onReturnToOutputView={handleReturnToOutputView}
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
            revisedCode={revisedCode}
            chatRevisions={chatRevisions}
            onClearChatRevisions={handleClearChatRevisions}
            onRenameChatRevision={handleRenameChatRevision}
            onDeleteChatRevision={handleDeleteChatRevision}
            chatContext={chatContext}
            activeFeatureForDiscussion={activeFeatureForDiscussion}
            finalizationSummary={finalizationSummary}
            onOpenSaveModal={handleOpenSaveModal}
            onLoadRevisionIntoEditor={handleLoadRevisionIntoEditor}
            attachments={attachments}
            onAttachFileClick={handleAttachFileClick}
            onRemoveAttachment={handleRemoveAttachment}
            onOpenProjectFilesModal={() => setIsProjectFilesModalOpen(true)}
          />
        );
      case 'comparison':
        return (
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
            onCompareAndRevise={handleCompareAndRevise}
            isLoading={isLoading}
            isChatLoading={isChatLoading}
            loadingAction={loadingAction}
            isActive={activePanel === 'input'}
            onNewReview={() => resetAndSetMode('comparison')}
            onFinalizeFeatureDiscussion={handleFinalizeFeatureDiscussion}
            onReturnToOutputView={handleReturnToOutputView}
            isChatMode={isChatMode}
            onFollowUpSubmit={handleFollowUpSubmit}
            chatHistory={chatHistory}
            chatInputValue={chatInputValue}
            setChatInputValue={setChatInputValue}
            onStopGenerating={handleStopGenerating}
            originalReviewedCode={reviewedCode}
            appMode={appMode}
            onCodeLineClick={handleCodeLineClick}
            revisedCode={revisedCode}
            chatRevisions={chatRevisions}
            onClearChatRevisions={handleClearChatRevisions}
            onRenameChatRevision={handleRenameChatRevision}
            onDeleteChatRevision={handleDeleteChatRevision}
            chatContext={chatContext}
            activeFeatureForDiscussion={activeFeatureForDiscussion}
            finalizationSummary={finalizationSummary}
            onOpenSaveModal={handleOpenSaveModal}
            onLoadRevisionIntoEditor={handleLoadRevisionIntoEditor}
            attachments={attachments}
            onAttachFileClick={handleAttachFileClick}
            onRemoveAttachment={handleRemoveAttachment}
            onOpenProjectFilesModal={() => setIsProjectFilesModalOpen(true)}
          />
        );
      case 'audit':
        return (
          <AuditInput
            userCode={userOnlyCode}
            setUserCode={setUserOnlyCode}
            language={language}
            setLanguage={setLanguage}
            onSubmit={handleAuditSubmit}
            isLoading={isLoading}
            onStopGenerating={handleStopGenerating}
            isActive={activePanel === 'input'}
          />
        );
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
        onImportClick={handleImportClick}
        onExportSession={handleExportSession}
        onShare={handleShare}
        onGenerateTests={handleGenerateTests}
        onOpenDocsModal={() => setIsDocsModalOpen(true)}
        onOpenProjectFilesModal={() => setIsProjectFilesModalOpen(true)}
        onToggleVersionHistory={() => setIsVersionHistoryModalOpen(true)}
        isToolsEnabled={userOnlyCode.trim() !== '' && !isChatMode && (appMode === 'single' || appMode === 'debug')}
        isLoading={isLoading || isChatLoading}
        addToast={addToast}
        onStartDebug={() => resetAndSetMode('debug')}
        onStartSingleReview={() => resetAndSetMode('single')}
        onStartComparison={() => resetAndSetMode('comparison')}
        onStartAudit={() => resetAndSetMode('audit')}
        isInputPanelVisible={isInputPanelVisible}
        onToggleInputPanel={() => setIsInputPanelVisible(p => !p)}
        onNewReview={() => resetAndSetMode('debug')}
        isFollowUpAvailable={reviewAvailable}
        onStartFollowUp={handleStartFollowUp}
        isChatMode={isChatMode}
        onEndChatSession={handleEndGeneralChat}
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
                  featureMatrix={featureMatrix}
                  featureDecisions={featureDecisions}
                  onFeatureDecision={handleFeatureDecision}
                  allFeaturesDecided={allFeaturesDecided}
                  onFinalize={handleFinalizeRevision}
                  onDownloadOutput={() => handleDownloadAsFile(reviewFeedback!, 'documentation.md')}
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
            ref={importFileInputRef} 
            onChange={handleImportSession}
            style={{ display: 'none' }} 
            accept=".json,application/json" 
          />
          <input
            type="file"
            ref={attachFileInputRef}
            onChange={handleFileAttach}
            style={{ display: 'none' }}
            accept="image/png, image/jpeg, image/gif, image/webp, text/plain, .md, .log, .json, .txt, .js, .ts, .py, .java, .cs, .cpp, .go, .rb, .php, .html, .css, .sql, .sh"
            multiple
          />
          <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </footer>
       <SaveVersionModal
          isOpen={isSaveModalOpen}
          onClose={handleCloseSaveModal}
          onSave={handleConfirmSaveVersion}
          versionName={versionName}
          setVersionName={setVersionName}
          onAutoGenerate={handleGenerateVersionName}
          isGeneratingName={isGeneratingName}
          outputType={outputType}
          language={language}
          reviewProfile={reviewProfile}
          isSavingChat={isSavingChat}
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
      <DocumentationCenterModal
        isOpen={isDocsModalOpen}
        onClose={() => setIsDocsModalOpen(false)}
        versions={versions}
        currentUserCode={userOnlyCode}
        onGenerate={handleTriggerDocsGeneration}
        onLoadVersion={handleLoadVersion}
        onDeleteVersion={handleDeleteVersion}
        onDownload={(c, f) => handleDownloadAsFile(c, f)}
      />
      <ProjectFilesModal
        isOpen={isProjectFilesModalOpen}
        onClose={() => setIsProjectFilesModalOpen(false)}
        projectFiles={projectFiles}
        onUploadFile={handleSaveFileToProject}
        onDeleteFile={handleDeleteProjectFile}
        onAttachFile={handleAttachProjectFile}
        onDownloadFile={handleDownloadAsFile}
      />
    </div>
  );
};

export default App;