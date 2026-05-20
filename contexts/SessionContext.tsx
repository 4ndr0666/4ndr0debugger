import React, { createContext, useState, useContext, useMemo, useCallback, useRef, useEffect } from 'react';
import { Chat, Part } from "@google/genai";
import { SupportedLanguage, ChatMessage, Version, ReviewProfile, LoadingAction, AppMode, ChatRevision, Feature, FeatureDecision, ChatContext, FinalizationSummary, FeatureDecisionRecord, ProjectFile, ChatFile, UIActions, SessionActionsContextType } from '../types.ts';
import { GEMINI_MODELS, SYSTEM_INSTRUCTION, DEBUG_SYSTEM_INSTRUCTION, DOCS_SYSTEM_INSTRUCTION, PROFILE_SYSTEM_INSTRUCTIONS, GENERATE_TESTS_INSTRUCTION, EXPLAIN_CODE_INSTRUCTION, REVIEW_SELECTION_INSTRUCTION, COMMIT_MESSAGE_SYSTEM_INSTRUCTION, DOCS_INSTRUCTION, COMPARISON_SYSTEM_INSTRUCTION, COMPARISON_REVISION_SYSTEM_INSTRUCTION, FEATURE_MATRIX_SCHEMA, generateComparisonTemplate, LANGUAGE_TAG_MAP, generateRootCauseTemplate, ROOT_CAUSE_SYSTEM_INSTRUCTION, COMMIT_MESSAGE_SCHEMA, generateFinalizationPrompt, generateVersionNamePrompt, generateCommitMessageTemplate, ADVERSARIAL_REPORT_SYSTEM_INSTRUCTION, THREAT_VECTOR_SYSTEM_INSTRUCTION, generateThreatVectorPrompt, VERSION_NAME_SYSTEM_INSTRUCTION, generateReviewerTemplate, PLACEHOLDER_MARKER } from '../constants.ts';
import { geminiService } from '../services.ts';
import { useConfigContext, useInputContext, useToast } from '../AppContext.tsx';
import { extractFinalCodeBlock, extractGeneratedMarkdownFiles } from '../utils.ts';
import { usePersistentState, usePersistenceContext } from './PersistenceContext.tsx';

// --- New Context Definitions ---

// 1. Output Context: For primary AI-generated output.
interface OutputContextType {
  reviewFeedback: string | null;
  revisedCode: string | null;
  reviewedCode: string | null;
  outputType: LoadingAction;
  error: string | null;
  featureMatrix: Feature[] | null;
  rawFeatureMatrixJson: string | null;
  finalizationSummary: FinalizationSummary | null;
  finalizationBriefing: string | null;
  adversarialReportContent: string | null;
  threatVectorReport: string | null;
  reviewAvailable: boolean;
  commitMessageAvailable: boolean;
  showOutputPanel: boolean;
  fullCodeForReview: string;
}
const OutputContext = createContext<OutputContextType | undefined>(undefined);

// 2. Loading State Context: For all loading/in-progress states.
interface LoadingStateContextType {
  isLoading: boolean;
  isChatLoading: boolean;
  loadingAction: LoadingAction;
  isGeneratingReport: boolean;
  isGeneratingThreatVector: boolean;
}
const LoadingStateContext = createContext<LoadingStateContextType | undefined>(undefined);

// 3. Chat State Context: For all state related to the chat interface.
interface ChatStateContextType {
  isInputPanelVisible: boolean;
  isChatMode: boolean;
  chatHistory: ChatMessage[];
  chatInputValue: string;
  chatRevisions: ChatRevision[];
  chatFiles: ChatFile[];
  chatContext: ChatContext;
  activeFeatureForDiscussion: Feature | null;
  attachments: { file: File; content: string; mimeType: string }[];
  contextFileIds: string[];
  setIsInputPanelVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setChatInputValue: React.Dispatch<React.SetStateAction<string>>;
  setChatContext: React.Dispatch<React.SetStateAction<ChatContext>>;
  setActiveFeatureForDiscussion: React.Dispatch<React.SetStateAction<Feature | null>>;
  setAttachments: React.Dispatch<React.SetStateAction<{ file: File; content: string; mimeType: string }[]>>;
}
const ChatStateContext = createContext<ChatStateContextType | undefined>(undefined);

// 4. Session Actions Context: For all action handlers.
const SessionActionsContext = createContext<SessionActionsContextType | undefined>(undefined);

// --- Main Provider ---

export const SessionProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const {
        appMode, language, reviewProfile, customReviewProfile, setLanguage,
        setReviewProfile, setCustomReviewProfile, setAppMode, setTargetHostname,
    } = useConfigContext();
    const {
        userOnlyCode, codeB, comparisonGoal, errorMessage,
        setUserOnlyCode, setCodeB, setErrorMessage, setComparisonGoal
    } = useInputContext();

    const { addToast } = useToast();
    const { projectFiles, setProjectFiles, setVersions } = usePersistenceContext();

    // All state previously in SessionProvider
    const [reviewFeedback, setReviewFeedback] = usePersistentState<string | null>('session_reviewFeedback', null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
    const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
    const [outputType, setOutputType] = usePersistentState<LoadingAction>('session_outputType', null);
    const [error, setError] = useState<string | null>(null);
    const [reviewedCode, setReviewedCode] = usePersistentState<string | null>('session_reviewedCode', null);
    const [revisedCode, setRevisedCode] = usePersistentState<string | null>('session_revisedCode', null);
    const [fullCodeForReview, setFullCodeForReview] = usePersistentState<string>('session_fullCodeForReview', '');
    const [featureMatrix, setFeatureMatrix] = usePersistentState<Feature[] | null>('session_featureMatrix', null);
    const [rawFeatureMatrixJson, setRawFeatureMatrixJson] = usePersistentState<string | null>('session_rawFeatureMatrixJson', null);
    const [featureDecisions, setFeatureDecisions] = usePersistentState<Record<string, FeatureDecisionRecord>>('session_featureDecisions', {});
    const [allFeaturesDecided, setAllFeaturesDecided] = useState(false);
    const [finalizationSummary, setFinalizationSummary] = usePersistentState<FinalizationSummary | null>('session_finalizationSummary', null);
    const [finalizationBriefing, setFinalizationBriefing] = usePersistentState<string | null>('session_finalizationBriefing', null);
    const [isInputPanelVisible, setIsInputPanelVisible] = usePersistentState<boolean>('session_isInputPanelVisible', true);
    const [isChatMode, setIsChatMode] = usePersistentState<boolean>('session_isChatMode', false);
    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const [chatHistory, setChatHistory] = usePersistentState<ChatMessage[]>('session_chatHistory', []);
    const [chatInputValue, setChatInputValue] = usePersistentState<string>('session_chatInputValue', '');
    const [chatRevisions, setChatRevisions] = usePersistentState<ChatRevision[]>('session_chatRevisions', []);
    const [chatFiles, setChatFiles] = usePersistentState<ChatFile[]>('session_chatFiles', []);
    const [chatContext, setChatContext] = usePersistentState<ChatContext>('session_chatContext', 'general');
    const [activeFeatureForDiscussion, setActiveFeatureForDiscussion] = usePersistentState<Feature | null>('session_activeFeatureForDiscussion', null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [adversarialReportContent, setAdversarialReportContent] = usePersistentState<string | null>('session_adversarialReportContent', null);
    const [isGeneratingThreatVector, setIsGeneratingThreatVector] = useState(false);
    const [threatVectorReport, setThreatVectorReport] = usePersistentState<string | null>('session_threatVectorReport', null);
    const [attachments, setAttachments] = useState<{ file: File; content: string; mimeType: string }[]>([]);
    const [contextFileIds, setContextFileIds] = usePersistentState<string[]>('session_contextFileIds', []);
    const abortControllerRef = useRef<AbortController | null>(null);
    const [uiActions, setUiActions] = useState<UIActions>({} as UIActions);

    // Derived State
    const isReviewContextCurrent = reviewedCode !== null && (appMode === 'single' || appMode === 'debug' ? userOnlyCode === reviewedCode : true);
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
        setIsGeneratingThreatVector(false);
        setIsGeneratingReport(false);
    };

    const resetForNewRequest = useCallback(() => {
        setError(null);
        setReviewFeedback(null);
        setIsChatMode(false);
        setChatHistory([]);
        setChatSession(null);
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
        setAttachments([]);
        setContextFileIds([]);
    }, [setReviewFeedback, setIsChatMode, setChatHistory, setReviewedCode, setRevisedCode, setChatRevisions, setChatFiles, setFeatureMatrix, setFeatureDecisions, setChatContext, setActiveFeatureForDiscussion, setRawFeatureMatrixJson, setFinalizationSummary, setFinalizationBriefing, setContextFileIds]);
    
    const handleStreamingRequest = useCallback(async (
        action: LoadingAction,
        contents: string | { parts: any[] },
        systemInstruction: string,
        model: string,
        originalCode: string,
        fullPromptForSaving: string
    ) => {
        if (!geminiService.isConfigured()) {
            setError("ATTN: API KEY COMPROMISED OR MISSING. CORE PROTOCOL HALTED.");
            return;
        }
        
        setIsLoading(true);
        setLoadingAction(action);
        setOutputType(action);
        setIsInputPanelVisible(false);
        resetForNewRequest();

        setFullCodeForReview(fullPromptForSaving);
        setReviewedCode(originalCode);
        setReviewFeedback('');

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
    }, [resetForNewRequest, setOutputType, setFullCodeForReview, setReviewedCode, setReviewFeedback, setRevisedCode]);
    
    const handleStartFollowUp = useCallback(async (version?: Version) => {
        const ai = geminiService.getAiClient();
        if (!ai) {
            addToast("Gemini AI not configured. Cannot start chat.", "error");
            return;
        }

        if (version) {
            addToast(`Starting follow-up from "${version.name}"...`, "info");
            
            if (version.appMode) {
                setAppMode(version.appMode);
            }

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
            if (version.contextFileIds) setContextFileIds(version.contextFileIds);
    
        } else {
            // Check if we are resuming or starting fresh
            if (chatHistory.length === 0) {
                 addToast("Initializing fresh comms link...", "info");
            } else {
                 addToast("Resuming secure channel...", "info");
            }
        }
        
        setIsChatMode(true);
        setIsInputPanelVisible(true);
    
        const getChatSystemInstruction = () => {
            if (chatContext === 'feature_discussion' && activeFeatureForDiscussion) {
                return `${SYSTEM_INSTRUCTION}\n\n${COMPARISON_SYSTEM_INSTRUCTION}\n\nThe user wants to discuss the following feature: "${activeFeatureForDiscussion.name}". Description: "${activeFeatureForDiscussion.description}". Source: ${activeFeatureForDiscussion.source}.`;
            }
            switch(appMode) {
                case 'debug': return `${SYSTEM_INSTRUCTION}\n\n${DEBUG_SYSTEM_INSTRUCTION}`;
                case 'comparison': return `${SYSTEM_INSTRUCTION}\n\n${COMPARISON_SYSTEM_INSTRUCTION}`;
                default: return getSystemInstructionForReview();
            }
        };
    
        // Only create a NEW session if one doesn't exist or if we loaded a version (which implies context switch)
        if (!chatSession || version) {
            const initialHistoryForGemini: { role: 'user' | 'model', parts: Part[] }[] = [];
            
            // Pre-load context from the review/analysis if we are starting fresh or loading a version
            const sourceFeedback = version ? version.feedback : reviewFeedback;
            const sourcePrompt = version ? version.fullPrompt : fullCodeForReview;
            
            // Only add context if the chat history is empty (new session) OR we are loading a specific version
            if ((chatHistory.length === 0 || version) && sourcePrompt && sourceFeedback) {
                initialHistoryForGemini.push({ role: 'user', parts: [{ text: sourcePrompt }] });
                initialHistoryForGemini.push({ role: 'model', parts: [{ text: sourceFeedback }] });
            } else if (chatHistory.length > 0 && !version) {
                 // Resuming existing chat, reconstruct history for Gemini
                 chatHistory.forEach(msg => {
                     const parts: Part[] = [];
                     if (msg.content) parts.push({ text: msg.content });
                     msg.attachments?.forEach(att => {
                        parts.push({ inlineData: { mimeType: att.mimeType, data: att.content }});
                     });
                     initialHistoryForGemini.push({ role: msg.role, parts });
                 });
            }
        
            const newChat = ai.chats.create({
                model: GEMINI_MODELS.CORE_ANALYSIS,
                history: initialHistoryForGemini,
                config: {
                systemInstruction: getChatSystemInstruction(),
                }
            });
            setChatSession(newChat);
        }
    
      }, [addToast, setLanguage, setUserOnlyCode, setReviewProfile, customReviewProfile, setComparisonGoal, appMode, chatContext, activeFeatureForDiscussion, getSystemInstructionForReview, reviewFeedback, fullCodeForReview, setAppMode, setChatHistory, setChatRevisions, setChatFiles, setFullCodeForReview, setReviewFeedback, setReviewedCode, setRevisedCode, setCustomReviewProfile, comparisonGoal, setContextFileIds, setIsChatMode, setIsInputPanelVisible, chatHistory, chatSession]);

    const handleClearChatHistory = useCallback(() => {
        if (window.confirm('Are you sure you want to clear the entire chat history? This cannot be undone.')) {
            // Step 1: Wipe logical history
            setChatHistory([]);
            setChatRevisions([]);
            setChatFiles([]);

            // Step 2: Critical fix - Kill persistent AI session to prevent context bleed
            setChatSession(null);
            
            // Step 3: Re-initialize fresh session immediately
            handleStartFollowUp();

            addToast("Cognitive slate purged. Fresh session initialized.", "success");
        }
    }, [setChatHistory, setChatRevisions, setChatFiles, addToast, handleStartFollowUp]);

    const handleReviewSubmit = useCallback((fullCodeToSubmit: string) => {
        const systemInstruction = appMode === 'debug'
          ? `${SYSTEM_INSTRUCTION}\n\n${DEBUG_SYSTEM_INSTRUCTION}`
          : getSystemInstructionForReview();
        const selectedContextFiles = projectFiles.filter(pf => contextFileIds.includes(pf.id));
        const contents = geminiService.buildPromptWithProjectFiles(fullCodeToSubmit, selectedContextFiles);
        handleStreamingRequest('review', contents, systemInstruction, GEMINI_MODELS.CORE_ANALYSIS, userOnlyCode, fullCodeToSubmit);
    }, [appMode, getSystemInstructionForReview, projectFiles, contextFileIds, handleStreamingRequest, userOnlyCode]);

    const handleAuditSubmit = useCallback(() => {
        if (userOnlyCode.trim()) {
            const fullCodeToSubmit = generateReviewerTemplate(language).replace(PLACEHOLDER_MARKER, userOnlyCode);
            const auditSystemInstruction = `${SYSTEM_INSTRUCTION}\n\n## Special Focus: Security\n${PROFILE_SYSTEM_INSTRUCTIONS[ReviewProfile.SECURITY]}`;
            const selectedContextFiles = projectFiles.filter(pf => contextFileIds.includes(pf.id));
            const contents = geminiService.buildPromptWithProjectFiles(fullCodeToSubmit, selectedContextFiles);
            handleStreamingRequest('review', contents, auditSystemInstruction, GEMINI_MODELS.CORE_ANALYSIS, userOnlyCode, fullCodeToSubmit);
        }
    }, [userOnlyCode, language, projectFiles, contextFileIds, handleStreamingRequest]);

    const handleCompareAndOptimize = useCallback(() => {
        const prompt = generateComparisonTemplate(language, comparisonGoal, userOnlyCode, codeB);
        const selectedContextFiles = projectFiles.filter(pf => contextFileIds.includes(pf.id));
        const contents = geminiService.buildPromptWithProjectFiles(prompt, selectedContextFiles);
        handleStreamingRequest('comparison', contents, `${SYSTEM_INSTRUCTION}\n\n${COMPARISON_SYSTEM_INSTRUCTION}`, GEMINI_MODELS.CORE_ANALYSIS, userOnlyCode, prompt);
    }, [language, comparisonGoal, userOnlyCode, codeB, projectFiles, contextFileIds, handleStreamingRequest]);
    
    const registerUiActions = useCallback((actions: UIActions) => {
        setUiActions(actions);
    }, []);

    const handleContextFileSelectionChange = useCallback((fileId: string, isSelected: boolean) => {
        setContextFileIds(prev => {
            const newSet = new Set(prev);
            if (isSelected) {
                newSet.add(fileId);
            } else {
                newSet.delete(fileId);
            }
            return Array.from(newSet);
        });
    }, [setContextFileIds]);

    const onSaveGeneratedFile = useCallback((filename: string, content: string) => {
        const newFile: ChatFile = {
            id: `file_chat_${Date.now()}_${filename}`,
            name: filename,
            content: content,
        };
        setChatFiles(prev => [...prev, newFile]);
        addToast(`File "${filename}" saved to chat context.`, "success");
    }, [addToast, setChatFiles]);
    
    const handleExitChatMode = useCallback(() => {
        setIsChatMode(false);
        // CRITICAL: Do NOT clear history/session here. 
        // This allows the user to return to the chat state intact.
    }, [setIsChatMode]);

    const handleLoadRevisionIntoEditor = useCallback((code: string) => {
        setUserOnlyCode(code);
        addToast("Revision loaded into editor.", "success");
    }, [addToast, setUserOnlyCode]);

    const onClearChatRevisions = useCallback(() => setChatRevisions([]), [setChatRevisions]);
    const onRenameChatRevision = useCallback((id: string, newName: string) => {
        setChatRevisions(prev => prev.map(r => r.id === id ? { ...r, name: newName } : r));
    }, [setChatRevisions]);
    const onDeleteChatRevision = useCallback((id: string) => {
        setChatRevisions(prev => prev.filter(r => r.id !== id));
    }, [setChatRevisions]);
    const onClearChatFiles = useCallback(() => setChatFiles([]), [setChatFiles]);
    const onRenameChatFile = useCallback((id: string, newName: string) => {
        setChatFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
    }, [setChatFiles]);
    const onDeleteChatFile = useCallback((id: string) => {
        setChatFiles(prev => prev.filter(f => f.id !== id));
    }, [setChatFiles]);

    const handleAutoGenerateVersionName = useCallback(async (isSavingChat: boolean, onResult: (name: string) => void) => {
        const content = isSavingChat 
            ? chatHistory.map(m => `${m.role}: ${m.content}`).join('\n')
            : reviewFeedback || reviewedCode || userOnlyCode;
        if (!content) {
            addToast("Not enough context to generate a name.", "error");
            return;
        }
        try {
            const prompt = generateVersionNamePrompt(content);
            const name = await geminiService.generateText({
                contents: prompt,
                systemInstruction: `${SYSTEM_INSTRUCTION}\n\n${VERSION_NAME_SYSTEM_INSTRUCTION}`,
                model: GEMINI_MODELS.FAST_TASKS,
            });
            onResult(name.trim().replace(/["']/g, ''));
        } catch (err) {
            addToast("Failed to generate name.", "error");
        }
    }, [chatHistory, reviewFeedback, reviewedCode, userOnlyCode, addToast]);

    const handleGenerateAdversarialReport = useCallback(async (reconData: string, targetHostname: string) => {
        setIsGeneratingReport(true);
        setAdversarialReportContent('');
        abortControllerRef.current = new AbortController();
        try {
            const prompt = `## Adversarial Report Generation Task\n\n**Target:** \`${targetHostname}\`\n\n**Recon Data (JSON):**\n\`\`\`json\n${reconData}\n\`\`\``;
            let fullResponse = "";
            await geminiService.streamRequest({
                contents: prompt,
                systemInstruction: `${SYSTEM_INSTRUCTION}\n\n${ADVERSARIAL_REPORT_SYSTEM_INSTRUCTION}`,
                model: GEMINI_MODELS.CORE_ANALYSIS,
                abortSignal: abortControllerRef.current.signal,
                onChunk: (chunkText) => {
                    fullResponse += chunkText;
                    setAdversarialReportContent(fullResponse);
                },
            });
        } catch(err) {
            if (err instanceof Error && err.message !== "STREAM_ABORTED") {
                addToast(`Report generation failed: ${err.message}`, "error");
            }
        } finally {
            setIsGeneratingReport(false);
        }
    }, [addToast, setAdversarialReportContent]);

    const handleThreatVectorAnalysis = useCallback(async (targetUrl: string) => {
        setIsGeneratingThreatVector(true);
        setThreatVectorReport('');
        abortControllerRef.current = new AbortController();
        try {
            // New logic: Use Gemini with fetch
            const prompt = generateThreatVectorPrompt(targetUrl, undefined, "");
            
            let fullResponse = "";
            await geminiService.streamRequest({
                contents: prompt,
                systemInstruction: `${SYSTEM_INSTRUCTION}\n\n${THREAT_VECTOR_SYSTEM_INSTRUCTION}`,
                model: GEMINI_MODELS.CORE_ANALYSIS,
                abortSignal: abortControllerRef.current.signal,
                tools: [{ fetch: {} }], // Enable URL access
                onChunk: (chunkText) => {
                    fullResponse += chunkText;
                    setThreatVectorReport(fullResponse);
                },
            });

        } catch(err) {
             if (err instanceof Error && err.message !== "STREAM_ABORTED") {
                const errorMsg = err.message;
                setThreatVectorReport(`# Analysis Failed\n\n**Error:** ${errorMsg}\n\nPlease verify the URL and try again.`);
                addToast(`Threat analysis failed: ${errorMsg}`, "error");
            }
        } finally {
            setIsGeneratingThreatVector(false);
        }
    }, [addToast, setThreatVectorReport]);
    
    const handleExplainSelection = useCallback((selection: string) => {
        const prompt = `${EXPLAIN_CODE_INSTRUCTION}\n\n\`\`\`${LANGUAGE_TAG_MAP[language] || ''}\n${selection}\n\`\`\``;
        const selectedContextFiles = projectFiles.filter(pf => contextFileIds.includes(pf.id));
        const contents = geminiService.buildPromptWithProjectFiles(prompt, selectedContextFiles);
        handleStreamingRequest('explain-selection', contents, getSystemInstructionForReview(), GEMINI_MODELS.FAST_TASKS, selection, prompt);
    }, [language, projectFiles, contextFileIds, getSystemInstructionForReview, handleStreamingRequest]);

    const handleReviewSelection = useCallback((selection: string) => {
        const prompt = `${REVIEW_SELECTION_INSTRUCTION}\n\n\`\`\`${LANGUAGE_TAG_MAP[language] || ''}\n${selection}\n\`\`\``;
        const selectedContextFiles = projectFiles.filter(pf => contextFileIds.includes(pf.id));
        const contents = geminiService.buildPromptWithProjectFiles(prompt, selectedContextFiles);
        handleStreamingRequest('review-selection', contents, getSystemInstructionForReview(), GEMINI_MODELS.CORE_ANALYSIS, selection, prompt);
    }, [language, projectFiles, contextFileIds, getSystemInstructionForReview, handleStreamingRequest]);

    const handleGenerateTests = useCallback(() => {
        const prompt = `${GENERATE_TESTS_INSTRUCTION}\n\n\`\`\`${LANGUAGE_TAG_MAP[language]}\n${userOnlyCode}\n\`\`\``;
        const selectedContextFiles = projectFiles.filter(pf => contextFileIds.includes(pf.id));
        const contents = geminiService.buildPromptWithProjectFiles(prompt, selectedContextFiles);
        handleStreamingRequest('tests', contents, SYSTEM_INSTRUCTION, GEMINI_MODELS.CORE_ANALYSIS, userOnlyCode, prompt);
    }, [language, userOnlyCode, projectFiles, contextFileIds, handleStreamingRequest]);

    const handleGenerateDocs = useCallback((codeToDocument: string) => {
        const prompt = `${DOCS_INSTRUCTION}\n\n\`\`\`${LANGUAGE_TAG_MAP[language]}\n${codeToDocument}\n\`\`\``;
        const selectedContextFiles = projectFiles.filter(pf => contextFileIds.includes(pf.id));
        const contents = geminiService.buildPromptWithProjectFiles(prompt, selectedContextFiles);
        handleStreamingRequest('docs', contents, `${SYSTEM_INSTRUCTION}\n\n${DOCS_SYSTEM_INSTRUCTION}`, GEMINI_MODELS.CORE_ANALYSIS, codeToDocument, prompt);
    }, [language, projectFiles, contextFileIds, handleStreamingRequest]);

    const handleFinalizeFeatureDiscussion = useCallback(() => {
        if (!activeFeatureForDiscussion) return;
        
        const finalHistory = [...chatHistory];
        if (finalHistory[finalHistory.length - 1]?.role !== 'model') {
            finalHistory.push({ id: 'placeholder', role: 'model', content: 'Discussion concluded.' });
        }

        setFeatureDecisions(prev => ({
            ...prev,
            [activeFeatureForDiscussion.name]: {
                decision: 'discussed',
                history: finalHistory,
            }
        }));
        setChatContext('general');
        setActiveFeatureForDiscussion(null);
        handleExitChatMode();
        addToast(`Discussion for "${activeFeatureForDiscussion.name}" finalized.`, "success");
    }, [activeFeatureForDiscussion, chatHistory, handleExitChatMode, addToast, setFeatureDecisions, setChatContext, setActiveFeatureForDiscussion]);
      
    const handleGenerateCommitMessage = useCallback(async () => {
        if (!reviewedCode || !revisedCode) return;
        setLoadingAction('commit');
        setIsLoading(true);
        setOutputType('commit');
        setReviewFeedback('');
        try {
            const prompt = generateCommitMessageTemplate(reviewedCode, revisedCode);
            const result = await geminiService.generateJson({
                contents: prompt,
                systemInstruction: `${SYSTEM_INSTRUCTION}\n\n${COMMIT_MESSAGE_SYSTEM_INSTRUCTION}`,
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
    }, [reviewedCode, revisedCode, setOutputType, setReviewFeedback]);
    
    const handleAnalyzeRootCause = useCallback(() => {
        if (!reviewedCode || !reviewFeedback || !revisedCode) {
            addToast("Not enough context for root cause analysis.", "error");
            return;
        }
        const prompt = generateRootCauseTemplate(reviewedCode, errorMessage, reviewFeedback, revisedCode);
        const selectedContextFiles = projectFiles.filter(pf => contextFileIds.includes(pf.id));
        const contents = geminiService.buildPromptWithProjectFiles(prompt, selectedContextFiles);
        handleStreamingRequest('root-cause', contents, `${SYSTEM_INSTRUCTION}\n\n${ROOT_CAUSE_SYSTEM_INSTRUCTION}`, GEMINI_MODELS.CORE_ANALYSIS, reviewedCode, prompt);
    }, [reviewedCode, reviewFeedback, revisedCode, errorMessage, projectFiles, contextFileIds, addToast, handleStreamingRequest]);
    
    const handleFinalizeComparison = useCallback(() => {
        const summary: FinalizationSummary = { included: [], removed: [], revised: [] };
        featureMatrix?.forEach(feature => {
            const decision = featureDecisions[feature.name]?.decision;
            if (decision === 'include') summary.included.push(feature);
            else if (decision === 'remove') summary.removed.push(feature);
            else if (decision === 'discussed') summary.revised.push(feature);
        });
        setFinalizationSummary(summary);
        
        const prompt = generateFinalizationPrompt(userOnlyCode, codeB, summary, featureDecisions);
        handleStreamingRequest('finalization', prompt, `${SYSTEM_INSTRUCTION}\n\n${COMPARISON_SYSTEM_INSTRUCTION}`, GEMINI_MODELS.CORE_ANALYSIS, `${userOnlyCode}\n\n${codeB}`, prompt);
    }, [featureMatrix, featureDecisions, userOnlyCode, codeB, handleStreamingRequest, setFinalizationSummary]);

    const handleDownloadOutput = useCallback(() => {
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
    }, [reviewFeedback, addToast]);
      
    const handleChatSubmit = useCallback(async () => {
        const message = chatInputValue;
        if (isChatLoading || !chatSession) {
            if (!chatSession) addToast("Chat Session Not Initialized.", "error");
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
                content: att.content
            })),
        };
    
        setChatHistory(prev => [...prev, userMessage]);
        setAttachments([]);
        setChatInputValue('');
    
        try {
            const modelResponseContent: ChatMessage = {
                id: `msg_${Date.now() + 1}`,
                role: 'model',
                content: '',
            };
    
            let submissionParts: Part[] = [];
            let finalPromptText = message.trim();
            const finalImageParts: Part[] = [];

            if (userMessage.attachments) {
                userMessage.attachments.forEach(att => {
                    if (att.mimeType.startsWith('image/')) {
                        finalImageParts.push({
                            inlineData: { mimeType: att.mimeType, data: att.content }
                        });
                    } else {
                        finalPromptText += `\n\n--- Attached File: ${att.name} ---\n\`\`\`\n${att.content}\n\`\`\`\n--- End of File ---`;
                    }
                });
            }

            if (finalPromptText) {
                submissionParts.push({ text: finalPromptText });
            }
            submissionParts.push(...finalImageParts);
    
            const responseStream = await chatSession.sendMessageStream({ message: submissionParts });
            
            setChatHistory(prev => [...prev, modelResponseContent]);
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
            console.error("Chat submit error:", apiError);
            setChatHistory(prev => [...prev, {
                id: `err_${Date.now()}`,
                role: 'model',
                content: `**Error:** ${message}`
            }]);
        } finally {
            setIsChatLoading(false);
        }
      }, [
          chatInputValue, isChatLoading, chatSession, attachments, addToast, appMode,
          chatRevisions.length, language, setChatHistory, setAttachments,
          setChatInputValue, setChatRevisions, setChatFiles
        ]);

    const handleCompareAndRevise = useCallback(async () => {
        if (!geminiService.isConfigured()) {
            setError("ATTN: API KEY COMPROMISED OR MISSING. CORE PROTOCOL HALTED.");
            return;
        }
        
        const prompt = generateComparisonTemplate(language, comparisonGoal, userOnlyCode, codeB);
        const selectedContextFiles = projectFiles.filter(pf => contextFileIds.includes(pf.id));
        const contents = geminiService.buildPromptWithProjectFiles(prompt, selectedContextFiles);
        
        setIsLoading(true);
        setLoadingAction('revise');
        setOutputType('revise');
        setIsInputPanelVisible(false);
        resetForNewRequest();
    
        setFullCodeForReview(prompt);
        setReviewedCode(userOnlyCode);
        setReviewFeedback("Generating feature matrix...");
    
        try {
            const result = await geminiService.generateJson({
                contents,
                systemInstruction: `${SYSTEM_INSTRUCTION}\n\n${COMPARISON_REVISION_SYSTEM_INSTRUCTION}`,
                model: GEMINI_MODELS.CORE_ANALYSIS,
                schema: FEATURE_MATRIX_SCHEMA,
            });
            
            setFeatureMatrix(result.features);
            setRawFeatureMatrixJson(JSON.stringify(result, null, 2));
            setReviewFeedback("## Feature Matrix\n\nPlease review the identified features and make a decision for each to proceed with the final revision.");
        } catch (apiError) {
            const message = apiError instanceof Error ? apiError.message : "An unexpected error occurred.";
            setError(`Failed to get feature matrix: ${message}`);
            setReviewFeedback(null);
        } finally {
            setIsLoading(false);
            setLoadingAction(null);
        }
    }, [language, comparisonGoal, userOnlyCode, codeB, projectFiles, contextFileIds, resetForNewRequest, setOutputType, setFullCodeForReview, setReviewedCode, setReviewFeedback, setFeatureMatrix, setRawFeatureMatrixJson]);
      
    const handleLoadSession = useCallback((sessionState: any) => {
        try {
          resetForNewRequest();
      
          // Global Config State
          if (sessionState.appMode) setAppMode(sessionState.appMode);
          if (sessionState.language) setLanguage(sessionState.language);
          if (sessionState.reviewProfile) setReviewProfile(sessionState.reviewProfile);
          if (sessionState.customReviewProfile) setCustomReviewProfile(sessionState.customReviewProfile);
          if (typeof sessionState.userOnlyCode === 'string') setUserOnlyCode(sessionState.userOnlyCode);
          if (typeof sessionState.codeB === 'string') setCodeB(sessionState.codeB);
          if (typeof sessionState.errorMessage === 'string') setErrorMessage(sessionState.errorMessage);
          if (typeof sessionState.comparisonGoal === 'string') setComparisonGoal(sessionState.comparisonGoal);
          if (Array.isArray(sessionState.versions)) setVersions(sessionState.versions);
          if (Array.isArray(sessionState.projectFiles)) setProjectFiles(sessionState.projectFiles);
          if (Array.isArray(sessionState.contextFileIds)) setContextFileIds(sessionState.contextFileIds);
          if (typeof sessionState.targetHostname === 'string') setTargetHostname(sessionState.targetHostname);
    
          // Operational Session State
          if (typeof sessionState.reviewFeedback === 'string') setReviewFeedback(sessionState.reviewFeedback);
          if (typeof sessionState.revisedCode === 'string') setRevisedCode(sessionState.revisedCode);
          if (typeof sessionState.reviewedCode === 'string') setReviewedCode(sessionState.reviewedCode);
          const chatHistoryToLoad = Array.isArray(sessionState.chatHistory) ? sessionState.chatHistory : [];
          setChatHistory(chatHistoryToLoad);
          if (Array.isArray(sessionState.chatRevisions)) setChatRevisions(sessionState.chatRevisions);
          if (Array.isArray(sessionState.chatFiles)) setChatFiles(sessionState.chatFiles);
          if (sessionState.featureMatrix) setFeatureMatrix(sessionState.featureMatrix);
          if (sessionState.rawFeatureMatrixJson) setRawFeatureMatrixJson(sessionState.rawFeatureMatrixJson);
          if (sessionState.featureDecisions) setFeatureDecisions(sessionState.featureDecisions);
          if (sessionState.finalizationSummary) setFinalizationSummary(sessionState.finalizationSummary);
          if (sessionState.finalizationBriefing) setFinalizationBriefing(sessionState.finalizationBriefing);
    
          const hasChat = chatHistoryToLoad.length > 0;
          const hasFeedback = typeof sessionState.reviewFeedback === 'string' && sessionState.reviewFeedback.length > 0;
    
          if (hasChat) {
            setIsChatMode(true);
            setIsInputPanelVisible(true);
    
            const ai = geminiService.getAiClient();
            if (!ai) {
                addToast("Gemini AI not configured. Cannot restore chat.", "error");
                return;
            }
    
            const getChatSystemInstruction = () => {
                const mode = sessionState.appMode || 'debug';
                const profile = sessionState.reviewProfile;
                const customProfile = sessionState.customReviewProfile;
    
                switch(mode) {
                    case 'debug': return `${SYSTEM_INSTRUCTION}\n\n${DEBUG_SYSTEM_INSTRUCTION}`;
                    case 'comparison': return `${SYSTEM_INSTRUCTION}\n\n${COMPARISON_SYSTEM_INSTRUCTION}`;
                    default: 
                        let instruction = SYSTEM_INSTRUCTION;
                        if (profile && profile !== 'none' && profile !== ReviewProfile.CUSTOM && PROFILE_SYSTEM_INSTRUCTIONS[profile]) {
                            instruction += `\n\n## Special Focus: ${profile}\n${PROFILE_SYSTEM_INSTRUCTIONS[profile]}`;
                        } else if (profile === ReviewProfile.CUSTOM && customProfile && customProfile.trim()) {
                            instruction += `\n\n## Custom Review Instructions:\n${customProfile.trim()}`;
                        }
                        return instruction;
                }
            };
    
            const geminiHistory = chatHistoryToLoad.map((msg: ChatMessage) => {
                const parts: Part[] = [];
                if (msg.content) {
                    parts.push({ text: msg.content });
                }
                msg.attachments?.forEach(att => {
                    parts.push({
                        inlineData: {
                            mimeType: att.mimeType,
                            data: att.content
                        }
                    });
                });
                return { role: msg.role, parts: parts };
            });
    
            const newChat = ai.chats.create({
                model: GEMINI_MODELS.CORE_ANALYSIS,
                history: geminiHistory,
                config: {
                    systemInstruction: getChatSystemInstruction(),
                }
            });
            setChatSession(newChat);
      
          } else {
            setIsChatMode(false);
            setIsInputPanelVisible(!hasFeedback);
          }
      
          addToast("Session loaded successfully!", "success");
      
        } catch (err) {
          const message = err instanceof Error ? err.message : "An unexpected error occurred.";
          console.error("Failed to load session state:", err);
          addToast(`Failed to load session: ${message}`, "error");
        }
    }, [
        resetForNewRequest, setAppMode, setLanguage, setReviewProfile, setCustomReviewProfile,
        setUserOnlyCode, setCodeB, setErrorMessage, setComparisonGoal, setVersions, setProjectFiles,
        setContextFileIds, setTargetHostname, addToast, setReviewFeedback, setRevisedCode,
        setReviewedCode, setChatHistory, setChatRevisions, setChatFiles, setFeatureMatrix,
        setRawFeatureMatrixJson, setFeatureDecisions, setFinalizationSummary, setFinalizationBriefing,
        setIsChatMode, setIsInputPanelVisible, handleStartFollowUp
    ]);


    const outputValue = useMemo(() => ({
        reviewFeedback, revisedCode, reviewedCode, outputType, error, featureMatrix, rawFeatureMatrixJson,
        finalizationSummary, finalizationBriefing, adversarialReportContent, threatVectorReport, reviewAvailable,
        commitMessageAvailable, showOutputPanel, fullCodeForReview
    }), [
        reviewFeedback, revisedCode, reviewedCode, outputType, error, featureMatrix, rawFeatureMatrixJson,
        finalizationSummary, finalizationBriefing, adversarialReportContent, threatVectorReport, reviewAvailable,
        commitMessageAvailable, showOutputPanel, fullCodeForReview
    ]);

    const loadingStateValue = useMemo(() => ({
        isLoading, isChatLoading, loadingAction, isGeneratingReport, isGeneratingThreatVector
    }), [isLoading, isChatLoading, loadingAction, isGeneratingReport, isGeneratingThreatVector]);

    const chatStateValue = useMemo(() => ({
        isInputPanelVisible, isChatMode, chatHistory, chatInputValue, chatRevisions, chatFiles, chatContext,
        activeFeatureForDiscussion, attachments, contextFileIds, setIsInputPanelVisible, setChatInputValue,
        setChatContext, setActiveFeatureForDiscussion, setAttachments
    }), [
        isInputPanelVisible, isChatMode, chatHistory, chatInputValue, chatRevisions, chatFiles, chatContext,
        activeFeatureForDiscussion, attachments, contextFileIds, setIsInputPanelVisible, setChatInputValue,
        setChatContext, setActiveFeatureForDiscussion, setAttachments
    ]);

    const sessionActionsValue: SessionActionsContextType = useMemo(() => ({
        setFeatureDecisions, setAdversarialReportContent, setThreatVectorReport, handleContextFileSelectionChange,
        resetForNewRequest, registerUiActions, handleStopGenerating, handleReviewSubmit, handleAuditSubmit,
        handleCompareAndOptimize, handleCompareAndRevise, handleAnalyzeRootCause, handleStartFollowUp,
        handleFinalizeFeatureDiscussion, handleGenerateTests, handleGenerateDocs, onSaveGeneratedFile, handleExitChatMode,
        handleGenerateCommitMessage, handleFinalizeComparison, handleDownloadOutput, handleAutoGenerateVersionName,
        handleGenerateAdversarialReport, handleThreatVectorAnalysis, handleExplainSelection, handleReviewSelection,
        handleChatSubmit, handleLoadRevisionIntoEditor, onClearChatRevisions, onRenameChatRevision, onDeleteChatRevision,
        onClearChatFiles, onRenameChatFile, onDeleteChatFile, handleClearChatHistory, handleLoadSession, 
        featureDecisions, allFeaturesDecided
    }), [
        setFeatureDecisions, setAdversarialReportContent, setThreatVectorReport, handleContextFileSelectionChange, resetForNewRequest, registerUiActions, handleStopGenerating,
        handleReviewSubmit, handleAuditSubmit, handleCompareAndOptimize, handleCompareAndRevise,
        handleAnalyzeRootCause, handleStartFollowUp, handleFinalizeFeatureDiscussion, handleGenerateTests,
        handleGenerateDocs, onSaveGeneratedFile, handleExitChatMode, handleGenerateCommitMessage,
        handleFinalizeComparison, handleDownloadOutput, handleAutoGenerateVersionName,
        handleGenerateAdversarialReport, handleThreatVectorAnalysis, handleExplainSelection,
        handleReviewSelection, handleChatSubmit, handleLoadRevisionIntoEditor, onClearChatRevisions,
        onRenameChatRevision, onDeleteChatRevision, onClearChatFiles, onRenameChatFile, onDeleteChatFile,
        handleClearChatHistory, handleLoadSession,
        featureDecisions, allFeaturesDecided
    ]);
    
    return (
        <SessionActionsContext.Provider value={sessionActionsValue}>
            <ChatStateContext.Provider value={chatStateValue}>
                <LoadingStateContext.Provider value={loadingStateValue}>
                    <OutputContext.Provider value={outputValue}>
                        {children}
                    </OutputContext.Provider>
                </LoadingStateContext.Provider>
            </ChatStateContext.Provider>
        </SessionActionsContext.Provider>
    );
};

// --- Custom Hooks for Consumption ---

export const useOutputContext = (): OutputContextType => {
    const context = useContext(OutputContext);
    if (context === undefined) throw new Error('useOutputContext must be used within a SessionProvider');
    return context;
};

export const useLoadingStateContext = (): LoadingStateContextType => {
    const context = useContext(LoadingStateContext);
    if (context === undefined) throw new Error('useLoadingStateContext must be used within a SessionProvider');
    return context;
};

export const useChatStateContext = (): ChatStateContextType => {
    const context = useContext(ChatStateContext);
    if (context === undefined) throw new Error('useChatStateContext must be used within a SessionProvider');
    return context;
};

export const useSessionActionsContext = (): SessionActionsContextType => {
    const context = useContext(SessionActionsContext);
    if (context === undefined) throw new Error('useSessionActionsContext must be used within a SessionProvider');
    return context;
};