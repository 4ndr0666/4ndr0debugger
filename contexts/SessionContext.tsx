import React, { createContext, useState, useContext, useMemo, useCallback, useRef, useEffect } from 'react';
import { Chat, Part } from "@google/genai";
import { SupportedLanguage, ChatMessage, Version, ReviewProfile, LoadingAction, AppMode, ChatRevision, Feature, FeatureDecision, ChatContext, FinalizationSummary, FeatureDecisionRecord, ProjectFile, ChatFile, ImportedSession } from '../types.ts';
import { GEMINI_MODELS, SYSTEM_INSTRUCTION, DEBUG_SYSTEM_INSTRUCTION, DOCS_SYSTEM_INSTRUCTION, PROFILE_SYSTEM_INSTRUCTIONS, GENERATE_TESTS_INSTRUCTION, EXPLAIN_CODE_INSTRUCTION, REVIEW_SELECTION_INSTRUCTION, COMMIT_MESSAGE_SYSTEM_INSTRUCTION, DOCS_INSTRUCTION, COMPARISON_SYSTEM_INSTRUCTION, COMPARISON_REVISION_SYSTEM_INSTRUCTION, FEATURE_MATRIX_SCHEMA, generateComparisonTemplate, LANGUAGE_TAG_MAP, generateAuditTemplate, AUDIT_SYSTEM_INSTRUCTION, ROOT_CAUSE_SYSTEM_INSTRUCTION, generateRootCauseTemplate, COMMIT_MESSAGE_SCHEMA, generateFinalizationPrompt, generateVersionNamePrompt, generateCommitMessageTemplate, ADVERSARIAL_REPORT_SYSTEM_INSTRUCTION, THREAT_VECTOR_SYSTEM_INSTRUCTION, generateThreatVectorPrompt } from '../constants.ts';
import { geminiService } from '../services.ts';
import { useAppContext, useToast } from '../AppContext.tsx';
import { extractFinalCodeBlock, extractGeneratedMarkdownFiles } from '../utils.ts';

interface SessionContextType {
  // --- Session/Output State ---
  reviewFeedback: string | null;
  isLoading: boolean;
  isChatLoading: boolean;
  loadingAction: LoadingAction;
  outputType: LoadingAction;
  error: string | null;
  reviewedCode: string | null;
  revisedCode: string | null;
  fullCodeForReview: string;

  // --- Comparison Mode State ---
  featureMatrix: Feature[] | null;
  rawFeatureMatrixJson: string | null;
  featureDecisions: Record<string, FeatureDecisionRecord>;
  allFeaturesDecided: boolean;
  finalizationSummary: FinalizationSummary | null;
  finalizationBriefing: string | null;

  // --- View & Chat State ---
  isInputPanelVisible: boolean;
  isChatMode: boolean;
  chatHistory: ChatMessage[];
  chatInputValue: string;
  chatRevisions: ChatRevision[];
  chatFiles: ChatFile[];
  chatContext: ChatContext;
  activeFeatureForDiscussion: Feature | null;

  // --- Adversarial Report State ---
  isGeneratingReport: boolean;
  adversarialReportContent: string | null;

  // --- Threat Vector State ---
  isGeneratingThreatVector: boolean;
  threatVectorReport: string | null;

  // --- File Attachment & Context State ---
  attachments: { file: File; content: string; mimeType: string }[];
  contextFileIds: Set<string>;

  // --- Derived State ---
  reviewAvailable: boolean;
  commitMessageAvailable: boolean;
  showOutputPanel: boolean;

  // --- Setters / Actions ---
  setFeatureDecisions: React.Dispatch<React.SetStateAction<Record<string, FeatureDecisionRecord>>>;
  setIsInputPanelVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setChatInputValue: React.Dispatch<React.SetStateAction<string>>;
  setChatContext: React.Dispatch<React.SetStateAction<ChatContext>>;
  setActiveFeatureForDiscussion: React.Dispatch<React.SetStateAction<Feature | null>>;
  setAdversarialReportContent: React.Dispatch<React.SetStateAction<string | null>>;
  setThreatVectorReport: React.Dispatch<React.SetStateAction<string | null>>;
  setAttachments: React.Dispatch<React.SetStateAction<{ file: File; content: string; mimeType: string }[]>>;
  handleContextFileSelectionChange: (fileId: string, isSelected: boolean) => void;
  resetForNewRequest: () => void;
  
  handleStopGenerating: () => void;
  handleReviewSubmit: (fullCodeToSubmit: string) => void;
  handleAuditSubmit: () => void;
  handleCompareAndOptimize: () => void;
  handleCompareAndRevise: () => void;
  handleAnalyzeRootCause: () => void;
  handleStartFollowUp: (version?: Version) => Promise<void>;
  handleFinalizeFeatureDiscussion: () => void;
  handleGenerateTests: () => void;
  handleGenerateDocs: (codeToDocument: string) => void;
  onSaveGeneratedFile: (filename: string, content: string) => void;
  handleExitChatMode: () => void;
  handleGenerateCommitMessage: () => Promise<void>;
  handleFinalizeComparison: () => void;
  handleDownloadOutput: () => void;
  handleAutoGenerateVersionName: (isSavingChat: boolean, onResult: (name: string) => void) => Promise<void>;
  handleGenerateAdversarialReport: (reconData: string, targetHostname: string) => Promise<void>;
  handleThreatVectorAnalysis: (targetUrl: string) => Promise<void>;
  handleExplainSelection: (selection: string) => void;
  handleReviewSelection: (selection: string) => void;
  handleChatSubmit: () => Promise<void>;
  handleLoadRevisionIntoEditor: (code: string) => void;
  onClearChatRevisions: () => void;
  onRenameChatRevision: (id: string, newName: string) => void;
  onDeleteChatRevision: (id: string) => void;
  onClearChatFiles: () => void;
  onRenameChatFile: (id: string, newName: string) => void;
  onDeleteChatFile: (id: string) => void;
  handleLoadSession: (sessionState: any) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const {
        appMode, language, reviewProfile, customReviewProfile, userOnlyCode, codeB,
        comparisonGoal, projectFiles, errorMessage, setUserOnlyCode, setCodeB,
        setLanguage, setProjectFiles, setAppMode, setComparisonGoal, setCustomReviewProfile,
        setErrorMessage, setReviewProfile, setVersions, setImportedSessions, setTargetHostname,
    } = useAppContext();
    const { addToast } = useToast();

    // All state previously in AppController
    const [reviewFeedback, setReviewFeedback] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
    const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
    const [outputType, setOutputType] = useState<LoadingAction>(null);
    const [error, setError] = useState<string | null>(null);
    const [reviewedCode, setReviewedCode] = useState<string | null>(null);
    const [revisedCode, setRevisedCode] = useState<string | null>(null);
    const [fullCodeForReview, setFullCodeForReview] = useState<string>('');
    const [featureMatrix, setFeatureMatrix] = useState<Feature[] | null>(null);
    const [rawFeatureMatrixJson, setRawFeatureMatrixJson] = useState<string | null>(null);
    const [featureDecisions, setFeatureDecisions] = useState<Record<string, FeatureDecisionRecord>>({});
    const [allFeaturesDecided, setAllFeaturesDecided] = useState(false);
    const [finalizationSummary, setFinalizationSummary] = useState<FinalizationSummary | null>(null);
    const [finalizationBriefing, setFinalizationBriefing] = useState<string | null>(null);
    const [isInputPanelVisible, setIsInputPanelVisible] = useState(true);
    const [isChatMode, setIsChatMode] = useState<boolean>(false);
    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chatInputValue, setChatInputValue] = useState('');
    const [chatRevisions, setChatRevisions] = useState<ChatRevision[]>([]);
    const [chatFiles, setChatFiles] = useState<ChatFile[]>([]);
    const [chatContext, setChatContext] = useState<ChatContext>('general');
    const [activeFeatureForDiscussion, setActiveFeatureForDiscussion] = useState<Feature | null>(null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [adversarialReportContent, setAdversarialReportContent] = useState<string | null>(null);
    const [isGeneratingThreatVector, setIsGeneratingThreatVector] = useState(false);
    const [threatVectorReport, setThreatVectorReport] = useState<string | null>(null);
    const [attachments, setAttachments] = useState<{ file: File; content: string; mimeType: string }[]>([]);
    const [contextFileIds, setContextFileIds] = useState<Set<string>>(new Set());
    const abortControllerRef = useRef<AbortController | null>(null);

    // Derived State
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
        setContextFileIds(new Set());
    }, []);

    const handleStreamingRequest = useCallback(async (
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
    }, [resetForNewRequest]);
    
    // All handlers moved from App.tsx
    // These now use state and setters from the SessionProvider's scope.
    
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
                content: att.content // base64 for images, raw text for others
            })),
        };
    
        setChatHistory(prev => [...prev, userMessage]);
        setAttachments([]); // Clear attachments after sending
        setChatInputValue('');
    
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
      }, [chatInputValue, isChatLoading, chatSession, attachments, addToast, chatRevisions.length]);

    const handleReviewSubmit = useCallback((fullCodeToSubmit: string) => {
        const systemInstruction = appMode === 'debug'
          ? `${SYSTEM_INSTRUCTION}\n\n${DEBUG_SYSTEM_INSTRUCTION}`
          : getSystemInstructionForReview();
        const selectedContextFiles = projectFiles.filter(pf => contextFileIds.has(pf.id));
        const contents = geminiService.buildPromptWithProjectFiles(fullCodeToSubmit, selectedContextFiles);
        handleStreamingRequest('review', contents, systemInstruction, GEMINI_MODELS.CORE_ANALYSIS, userOnlyCode, fullCodeToSubmit);
    }, [appMode, getSystemInstructionForReview, projectFiles, contextFileIds, handleStreamingRequest, userOnlyCode]);

    const handleAuditSubmit = useCallback(() => {
        const fullCodeToSubmit = generateAuditTemplate(language, userOnlyCode);
        const selectedContextFiles = projectFiles.filter(pf => contextFileIds.has(pf.id));
        const contents = geminiService.buildPromptWithProjectFiles(fullCodeToSubmit, selectedContextFiles);
        handleStreamingRequest('audit', contents, `${SYSTEM_INSTRUCTION}\n\n${AUDIT_SYSTEM_INSTRUCTION}`, GEMINI_MODELS.CORE_ANALYSIS, userOnlyCode, fullCodeToSubmit);
    }, [language, userOnlyCode, projectFiles, contextFileIds, handleStreamingRequest]);

    const handleCompareAndOptimize = useCallback(() => {
        const prompt = generateComparisonTemplate(language, comparisonGoal, userOnlyCode, codeB);
        const selectedContextFiles = projectFiles.filter(pf => contextFileIds.has(pf.id));
        const contents = geminiService.buildPromptWithProjectFiles(prompt, selectedContextFiles);
        handleStreamingRequest('comparison', contents, `${SYSTEM_INSTRUCTION}\n\n${COMPARISON_SYSTEM_INSTRUCTION}`, GEMINI_MODELS.CORE_ANALYSIS, userOnlyCode, prompt);
    }, [language, comparisonGoal, userOnlyCode, codeB, projectFiles, contextFileIds, handleStreamingRequest]);
      
    const handleCompareAndRevise = useCallback(async () => {
        if (!geminiService.isConfigured()) {
            setError("API Key not configured.");
            return;
        }
        
        const prompt = generateComparisonTemplate(language, comparisonGoal, userOnlyCode, codeB);
        const selectedContextFiles = projectFiles.filter(pf => contextFileIds.has(pf.id));
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
                systemInstruction: COMPARISON_REVISION_SYSTEM_INSTRUCTION,
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
    }, [language, comparisonGoal, userOnlyCode, codeB, projectFiles, contextFileIds, resetForNewRequest]);

    const handleAnalyzeRootCause = useCallback(() => {
        if (!reviewedCode || !reviewFeedback || !revisedCode) {
            addToast("Not enough context for root cause analysis.", "error");
            return;
        }
        const prompt = generateRootCauseTemplate(reviewedCode, errorMessage, reviewFeedback, revisedCode);
        const selectedContextFiles = projectFiles.filter(pf => contextFileIds.has(pf.id));
        const contents = geminiService.buildPromptWithProjectFiles(prompt, selectedContextFiles);
        handleStreamingRequest('root-cause', contents, ROOT_CAUSE_SYSTEM_INSTRUCTION, GEMINI_MODELS.CORE_ANALYSIS, reviewedCode, prompt);
    }, [reviewedCode, reviewFeedback, revisedCode, errorMessage, projectFiles, contextFileIds, addToast, handleStreamingRequest]);
      
    const handleStartFollowUp = useCallback(async (version?: Version) => {
        if (version) {
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
    
      }, [addToast, setLanguage, setUserOnlyCode, setReviewProfile, customReviewProfile, comparisonGoal, appMode, chatContext, activeFeatureForDiscussion, getSystemInstructionForReview, reviewFeedback, fullCodeForReview]);
      
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
          if (Array.isArray(sessionState.contextFileIds)) setContextFileIds(new Set(sessionState.contextFileIds));
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
                const mode = sessionState.appMode || appMode;
                const profile = sessionState.reviewProfile;
                const customProfile = sessionState.customReviewProfile;
    
                switch(mode) {
                    case 'debug': return `${SYSTEM_INSTRUCTION}\n\n${DEBUG_SYSTEM_INSTRUCTION}`;
                    case 'comparison': return `${SYSTEM_INSTRUCTION}\n\n${COMPARISON_SYSTEM_INSTRUCTION}`;
                    case 'audit': return `${SYSTEM_INSTRUCTION}\n\n${AUDIT_SYSTEM_INSTRUCTION}`;
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
        resetForNewRequest, addToast, setAppMode, setLanguage, setReviewProfile, 
        setCustomReviewProfile, setUserOnlyCode, setCodeB, setErrorMessage, 
        setComparisonGoal, setVersions, setProjectFiles, setTargetHostname, appMode
      ]);
    
    // ... other handlers ...
    const handleFinalizeFeatureDiscussion = useCallback(() => {
        addToast("Feature discussion finalized.", "info");
        setChatContext('general');
        setActiveFeatureForDiscussion(null);
    }, [addToast]);

    const handleGenerateDocs = useCallback((codeToDocument: string) => {
        if (!codeToDocument.trim()) {
            addToast("No code to generate docs for.", "info");
            return;
        }
        const prompt = `${DOCS_INSTRUCTION}\n\n\`\`\`${LANGUAGE_TAG_MAP[language]}\n${codeToDocument}\n\`\`\``;
        handleStreamingRequest('docs', prompt, DOCS_SYSTEM_INSTRUCTION, GEMINI_MODELS.FAST_TASKS, codeToDocument, prompt);
    }, [language, addToast, handleStreamingRequest]);

    const handleGenerateTests = useCallback(() => {
        const codeToTest = revisedCode || userOnlyCode;
        if (!codeToTest.trim()) {
          addToast("No code available to generate tests for.", "info");
          return;
        }
        const prompt = `${GENERATE_TESTS_INSTRUCTION}\n\n\`\`\`${LANGUAGE_TAG_MAP[language]}\n${codeToTest}\n\`\`\``;
        handleStreamingRequest('tests', prompt, SYSTEM_INSTRUCTION, GEMINI_MODELS.CORE_ANALYSIS, codeToTest, prompt);
    }, [revisedCode, userOnlyCode, language, addToast, handleStreamingRequest]);
      
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
    }, [reviewedCode, revisedCode]);
    
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
        handleStreamingRequest('finalization', prompt, COMPARISON_SYSTEM_INSTRUCTION, GEMINI_MODELS.CORE_ANALYSIS, `${userOnlyCode}\n\n${codeB}`, prompt);
    }, [featureMatrix, featureDecisions, userOnlyCode, codeB, handleStreamingRequest]);

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
    
    const handleAutoGenerateVersionName = useCallback(async (isSavingChat: boolean, onResult: (name: string) => void) => {
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
            onResult(name.replace(/["']/g, ''));
        } catch (apiError) {
            const message = apiError instanceof Error ? apiError.message : "An unexpected error occurred.";
            addToast(`Failed to generate name: ${message}`, "error");
        }
    }, [chatHistory, reviewFeedback, reviewedCode, addToast]);
    
    const handleGenerateAdversarialReport = useCallback(async (reconData: string, targetHostname: string) => {
        if (!geminiService.isConfigured()) {
            addToast("API Key not configured.", "error");
            return;
        }
        
        setIsGeneratingReport(true);
        setAdversarialReportContent('');
    
        const mainPrompt = `## Adversarial Report Generation Task...\n`; // Simplified for brevity
        const selectedContextFiles = projectFiles.filter(pf => contextFileIds.has(pf.id));
        const contents = geminiService.buildPromptWithProjectFiles(mainPrompt, selectedContextFiles);
        
        abortControllerRef.current = new AbortController();
        try {
            let fullResponse = "";
            await geminiService.streamRequest({
                contents: contents,
                systemInstruction: ADVERSARIAL_REPORT_SYSTEM_INSTRUCTION,
                model: GEMINI_MODELS.CORE_ANALYSIS,
                abortSignal: abortControllerRef.current.signal,
                onChunk: (chunkText) => {
                    fullResponse += chunkText;
                    setAdversarialReportContent(fullResponse);
                },
            });
        } catch (apiError) {
            const message = apiError instanceof Error ? apiError.message : "An unexpected error occurred.";
            if (message !== "STREAM_ABORTED") {
                addToast(`Report generation failed: ${message}`, "error");
                setAdversarialReportContent(`**Error:** Report generation failed.\n\n${message}`);
            }
        } finally {
            setIsGeneratingReport(false);
        }
    }, [projectFiles, contextFileIds, addToast]);

    const handleThreatVectorAnalysis = useCallback(async (targetUrl: string) => {
        if (!geminiService.isConfigured()) {
            addToast("API Key not configured.", "error");
            return;
        }
        
        setIsGeneratingThreatVector(true);
        setThreatVectorReport('');
    
        const prompt = generateThreatVectorPrompt(targetUrl);
        
        abortControllerRef.current = new AbortController();
        try {
            let fullResponse = "";
            await geminiService.streamRequest({
                contents: prompt,
                systemInstruction: THREAT_VECTOR_SYSTEM_INSTRUCTION,
                model: GEMINI_MODELS.FAST_TASKS,
                abortSignal: abortControllerRef.current.signal,
                onChunk: (chunkText) => {
                    fullResponse += chunkText;
                    setThreatVectorReport(fullResponse);
                },
            });
        } catch (apiError) {
            const message = apiError instanceof Error ? apiError.message : "An unexpected error occurred.";
            if (message !== "STREAM_ABORTED") {
                addToast(`Threat analysis failed: ${message}`, "error");
                setThreatVectorReport(`**Error:** Analysis failed.\n\n${message}`);
            }
        } finally {
            setIsGeneratingThreatVector(false);
        }
    }, [addToast]);
      
    const handleLoadRevisionIntoEditor = useCallback((code: string) => {
        setUserOnlyCode(code);
        setIsChatMode(false);
        setIsInputPanelVisible(true);
        addToast("Revision loaded into editor.", "info");
    }, [setUserOnlyCode, addToast]);

    const handleExplainSelection = useCallback((selection: string) => {
        const prompt = `${EXPLAIN_CODE_INSTRUCTION}\n\n\`\`\`${LANGUAGE_TAG_MAP[language]}\n${selection}\n\`\`\``;
        handleStreamingRequest('explain-selection', prompt, SYSTEM_INSTRUCTION, GEMINI_MODELS.FAST_TASKS, selection, prompt);
    }, [language, handleStreamingRequest]);

    const handleReviewSelection = useCallback((selection: string) => {
        const prompt = `${REVIEW_SELECTION_INSTRUCTION}\n\n\`\`\`${LANGUAGE_TAG_MAP[language]}\n${selection}\n\`\`\``;
        handleStreamingRequest('review-selection', prompt, getSystemInstructionForReview(), GEMINI_MODELS.CORE_ANALYSIS, selection, prompt);
    }, [language, getSystemInstructionForReview, handleStreamingRequest]);

    const handleContextFileSelectionChange = useCallback((fileId: string, isSelected: boolean) => {
        setContextFileIds(prev => {
            const newSet = new Set(prev);
            if (isSelected) newSet.add(fileId);
            else newSet.delete(fileId);
            return newSet;
        });
    }, []);

    const onSaveGeneratedFile = useCallback((filename: string, content: string) => {
        const newProjectFile: ProjectFile = {
            id: `proj_${Date.now()}_${filename}`,
            name: filename,
            content: content,
            mimeType: 'text/markdown',
            timestamp: Date.now()
        };
        setProjectFiles(prev => [newProjectFile, ...prev]);
        addToast(`File "${filename}" saved to Project Files.`, 'success');
    }, [setProjectFiles, addToast]);

    const handleExitChatMode = useCallback(() => {
        setIsChatMode(false);
        setIsInputPanelVisible(!reviewFeedback); // show input if there's no output
    }, [reviewFeedback]);

    const value = {
        reviewFeedback, isLoading, isChatLoading, loadingAction, outputType, error,
        reviewedCode, revisedCode, fullCodeForReview, featureMatrix, rawFeatureMatrixJson,
        featureDecisions, allFeaturesDecided, finalizationSummary, finalizationBriefing,
        isInputPanelVisible, isChatMode, chatHistory, chatInputValue, chatRevisions,
        chatFiles, chatContext, activeFeatureForDiscussion, isGeneratingReport,
        adversarialReportContent, attachments, contextFileIds,
        isGeneratingThreatVector, threatVectorReport,
        reviewAvailable, commitMessageAvailable, showOutputPanel,
        setFeatureDecisions, setIsInputPanelVisible, setChatInputValue, setChatContext,
        setActiveFeatureForDiscussion, setAdversarialReportContent, setAttachments,
        setThreatVectorReport,
        handleContextFileSelectionChange,
        resetForNewRequest,
        handleStopGenerating, handleReviewSubmit, handleAuditSubmit, handleCompareAndOptimize,
        handleCompareAndRevise, handleAnalyzeRootCause, handleStartFollowUp,
        handleFinalizeFeatureDiscussion, handleGenerateTests, handleGenerateCommitMessage,
        handleFinalizeComparison, handleDownloadOutput, handleAutoGenerateVersionName,
        handleGenerateAdversarialReport, handleThreatVectorAnalysis, handleExplainSelection, handleReviewSelection,
        handleChatSubmit, handleLoadRevisionIntoEditor,
        onClearChatRevisions: () => { setChatRevisions([]); addToast("Revisions cleared.", "info"); },
        onRenameChatRevision: (id: string, newName: string) => setChatRevisions(revs => revs.map(r => r.id === id ? {...r, name: newName} : r)),
        onDeleteChatRevision: (id: string) => setChatRevisions(revs => revs.filter(r => r.id !== id)),
        onClearChatFiles: () => { setChatFiles([]); addToast("Files cleared.", "info"); },
        onRenameChatFile: (id: string, newName: string) => setChatFiles(files => files.map(f => f.id === id ? {...f, name: newName} : f)),
        onDeleteChatFile: (id: string) => setChatFiles(files => files.filter(f => f.id !== id)),
        handleLoadSession,
        handleGenerateDocs,
        onSaveGeneratedFile,
        handleExitChatMode,
    };

    return (
        <SessionContext.Provider value={value}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSessionContext = (): SessionContextType => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSessionContext must be used within a SessionProvider');
    }
    return context;
};
