import React, { createContext, useState, useContext, useMemo, useCallback, useRef, useEffect } from 'react';
import { Chat, Part } from "@google/genai";
import { SupportedLanguage, ChatMessage, Version, ReviewProfile, LoadingAction, AppMode, ChatRevision, Feature, FeatureDecision, ChatContext, FinalizationSummary, FeatureDecisionRecord, ProjectFile, ChatFile, UIActions } from '../types.ts';
import { GEMINI_MODELS, SYSTEM_INSTRUCTION, DEBUG_SYSTEM_INSTRUCTION, DOCS_SYSTEM_INSTRUCTION, PROFILE_SYSTEM_INSTRUCTIONS, GENERATE_TESTS_INSTRUCTION, EXPLAIN_CODE_INSTRUCTION, REVIEW_SELECTION_INSTRUCTION, COMMIT_MESSAGE_SYSTEM_INSTRUCTION, DOCS_INSTRUCTION, COMPARISON_SYSTEM_INSTRUCTION, COMPARISON_REVISION_SYSTEM_INSTRUCTION, FEATURE_MATRIX_SCHEMA, generateComparisonTemplate, LANGUAGE_TAG_MAP, generateAuditTemplate, AUDIT_SYSTEM_INSTRUCTION, ROOT_CAUSE_SYSTEM_INSTRUCTION, generateRootCauseTemplate, COMMIT_MESSAGE_SCHEMA, generateFinalizationPrompt, generateVersionNamePrompt, generateCommitMessageTemplate, ADVERSARIAL_REPORT_SYSTEM_INSTRUCTION, THREAT_VECTOR_SYSTEM_INSTRUCTION, generateThreatVectorPrompt, WORKBENCH_SYSTEM_INSTRUCTION, VERSION_NAME_SYSTEM_INSTRUCTION } from '../constants.ts';
import { geminiService } from '../services.ts';
import { useConfigContext, useInputContext, useToast } from '../AppContext.tsx';
import { extractFinalCodeBlock, extractGeneratedMarkdownFiles } from '../utils.ts';
import { usePersistenceContext } from './PersistenceContext.tsx';

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
  contextFileIds: Set<string>;
  setIsInputPanelVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setChatInputValue: React.Dispatch<React.SetStateAction<string>>;
  setChatContext: React.Dispatch<React.SetStateAction<ChatContext>>;
  setActiveFeatureForDiscussion: React.Dispatch<React.SetStateAction<Feature | null>>;
  setAttachments: React.Dispatch<React.SetStateAction<{ file: File; content: string; mimeType: string }[]>>;
}
const ChatStateContext = createContext<ChatStateContextType | undefined>(undefined);

// 4. Session Actions Context: For all action handlers.
interface SessionActionsContextType {
  setFeatureDecisions: React.Dispatch<React.SetStateAction<Record<string, FeatureDecisionRecord>>>;
  setAdversarialReportContent: React.Dispatch<React.SetStateAction<string | null>>;
  setThreatVectorReport: React.Dispatch<React.SetStateAction<string | null>>;
  handleContextFileSelectionChange: (fileId: string, isSelected: boolean) => void;
  resetForNewRequest: () => void;
  registerUiActions: (actions: UIActions) => void;
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
  featureDecisions: Record<string, FeatureDecisionRecord>; // Needs to be here for the setter
  allFeaturesDecided: boolean; // Derived state, but depends on decisions
}
const SessionActionsContext = createContext<SessionActionsContextType | undefined>(undefined);

// --- Main Provider ---

export const SessionProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const {
        appMode, language, reviewProfile, customReviewProfile, setLanguage,
        setReviewProfile, setCustomReviewProfile, setAppMode, setTargetHostname,
    } = useConfigContext();
    const {
        userOnlyCode, codeB, comparisonGoal, errorMessage, workbenchScript,
        setUserOnlyCode, setCodeB, setComparisonGoal, setErrorMessage, setWorkbenchScript
    } = useInputContext();

    const { addToast } = useToast();
    const { projectFiles, setProjectFiles, setVersions } = usePersistenceContext();

    // All state previously in SessionProvider
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
    const [chatInputValue, setChatInputValue] = useState<string>('');
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
    const [uiActions, setUiActions] = useState<UIActions>({} as UIActions);

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

    // This logic needs `handleStartFollowUp`, so it's initiated from the actions context consumer
    useEffect(() => {
        if (chatContext === 'feature_discussion' && activeFeatureForDiscussion) {
            // The action to start the chat is now handled by the component that sets this state
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
    }, [resetForNewRequest]);
    
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
            return newSet;
        });
    }, []);

    const onSaveGeneratedFile = useCallback((filename: string, content: string) => {
        const newFile: ChatFile = {
            id: `file_chat_${Date.now()}_${filename}`,
            name: filename,
            content: content,
        };
        setChatFiles(prev => [...prev, newFile]);
        addToast(`File "${filename}" saved to chat context.`, "success");
    }, [addToast]);
    
    const handleExitChatMode = useCallback(() => {
        setIsChatMode(false);
        setChatHistory([]);
        setChatRevisions([]);
        setChatFiles([]);
        setChatSession(null);
    }, []);

    const handleLoadRevisionIntoEditor = useCallback((code: string) => {
        setUserOnlyCode(code);
        addToast("Revision loaded into editor.", "success");
    }, [addToast, setUserOnlyCode]);

    const onClearChatRevisions = useCallback(() => setChatRevisions([]), []);
    const onRenameChatRevision = useCallback((id: string, newName: string) => {
        setChatRevisions(prev => prev.map(r => r.id === id ? { ...r, name: newName } : r));
    }, []);
    const onDeleteChatRevision = useCallback((id: string) => {
        setChatRevisions(prev => prev.filter(r => r.id !== id));
    }, []);
    const onClearChatFiles = useCallback(() => setChatFiles([]), []);
    const onRenameChatFile = useCallback((id: string, newName: string) => {
        setChatFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
    }, []);
    const onDeleteChatFile = useCallback((id: string) => {
        setChatFiles(prev => prev.filter(f => f.id !== id));
    }, []);

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
                systemInstruction: VERSION_NAME_SYSTEM_INSTRUCTION,
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
                systemInstruction: ADVERSARIAL_REPORT_SYSTEM_INSTRUCTION,
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
    }, [addToast]);

    const handleThreatVectorAnalysis = useCallback(async (targetUrl: string) => {
        setIsGeneratingThreatVector(true);
        setThreatVectorReport('');
        abortControllerRef.current = new AbortController();
        try {
            const prompt = generateThreatVectorPrompt(targetUrl);
            let fullResponse = "";
            await geminiService.streamRequest({
                contents: prompt,
                systemInstruction: THREAT_VECTOR_SYSTEM_INSTRUCTION,
                model: GEMINI_MODELS.CORE_ANALYSIS,
                abortSignal: abortControllerRef.current.signal,
                onChunk: (chunkText) => {
                    fullResponse += chunkText;
                    setThreatVectorReport(fullResponse);
                },
            });
        } catch(err) {
             if (err instanceof Error && err.message !== "STREAM_ABORTED") {
                addToast(`Threat analysis failed: ${err.message}`, "error");
            }
        } finally {
            setIsGeneratingThreatVector(false);
        }
    }, [addToast]);
    
    const handleExplainSelection = useCallback((selection: string) => {
        const prompt = `${EXPLAIN_CODE_INSTRUCTION}\n\n\`\`\`${LANGUAGE_TAG_MAP[language] || ''}\n${selection}\n\`\`\``;
        const selectedContextFiles = projectFiles.filter(pf => contextFileIds.has(pf.id));
        const contents = geminiService.buildPromptWithProjectFiles(prompt, selectedContextFiles);
        handleStreamingRequest('explain-selection', contents, getSystemInstructionForReview(), GEMINI_MODELS.FAST_TASKS, selection, prompt);
    }, [language, projectFiles, contextFileIds, getSystemInstructionForReview, handleStreamingRequest]);

    const handleReviewSelection = useCallback((selection: string) => {
        const prompt = `${REVIEW_SELECTION_INSTRUCTION}\n\n\`\`\`${LANGUAGE_TAG_MAP[language] || ''}\n${selection}\n\`\`\``;
        const selectedContextFiles = projectFiles.filter(pf => contextFileIds.has(pf.id));
        const contents = geminiService.buildPromptWithProjectFiles(prompt, selectedContextFiles);
        handleStreamingRequest('review-selection', contents, getSystemInstructionForReview(), GEMINI_MODELS.CORE_ANALYSIS, selection, prompt);
    }, [language, projectFiles, contextFileIds, getSystemInstructionForReview, handleStreamingRequest]);

    const handleGenerateTests = useCallback(() => {
        const prompt = `${GENERATE_TESTS_INSTRUCTION}\n\n\`\`\`${LANGUAGE_TAG_MAP[language]}\n${userOnlyCode}\n\`\`\``;
        const selectedContextFiles = projectFiles.filter(pf => contextFileIds.has(pf.id));
        const contents = geminiService.buildPromptWithProjectFiles(prompt, selectedContextFiles);
        handleStreamingRequest('tests', contents, SYSTEM_INSTRUCTION, GEMINI_MODELS.CORE_ANALYSIS, userOnlyCode, prompt);
    }, [language, userOnlyCode, projectFiles, contextFileIds, handleStreamingRequest]);

    const handleGenerateDocs = useCallback((codeToDocument: string) => {
        const prompt = `${DOCS_INSTRUCTION}\n\n\`\`\`${LANGUAGE_TAG_MAP[language]}\n${codeToDocument}\n\`\`\``;
        const selectedContextFiles = projectFiles.filter(pf => contextFileIds.has(pf.id));
        const contents = geminiService.buildPromptWithProjectFiles(prompt, selectedContextFiles);
        handleStreamingRequest('docs', contents, DOCS_SYSTEM_INSTRUCTION, GEMINI_MODELS.CORE_ANALYSIS, codeToDocument, prompt);
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
    }, [activeFeatureForDiscussion, chatHistory, handleExitChatMode, addToast]);
      
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
    }, [reviewedCode, revisedCode]);
    
    const handleAnalyzeRootCause = useCallback(() => {
        if (!reviewedCode || !reviewFeedback || !revisedCode) {
            addToast("Not enough context for root cause analysis.", "error");
            return;
        }
        const prompt = generateRootCauseTemplate(reviewedCode, errorMessage, reviewFeedback, revisedCode);
        const selectedContextFiles = projectFiles.filter(pf => contextFileIds.has(pf.id));
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
            if (message.trim()) {
                submissionParts.push({ text: message });
            }
            if (userMessage.attachments) {
                userMessage.attachments.forEach(att => {
                    submissionParts.push({
                        inlineData: { mimeType: att.mimeType, data: att.content }
                    });
                });
            }
    
            if (appMode === 'workbench' && workbenchScript.trim()) {
                const contextMessage = `## Current Script in Editor\n\nHere is the script I am working on. Use this as the primary context for my request.\n\n\`\`\`${LANGUAGE_TAG_MAP[language] || ''}\n${workbenchScript}\n\`\`\`\n\n## My Request\n\n${message}`;
                submissionParts = [{ text: contextMessage }, ...submissionParts.slice(1)];
            }
    
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
          chatRevisions.length, workbenchScript, language
        ]);

    const handleCompareAndRevise = useCallback(async () => {
        if (!geminiService.isConfigured()) {
            setError("ATTN: API KEY COMPROMISED OR MISSING. CORE PROTOCOL HALTED.");
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
    }, [language, comparisonGoal, userOnlyCode, codeB, projectFiles, contextFileIds, resetForNewRequest]);
      
    const handleStartFollowUp = useCallback(async (version?: Version) => {
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
                return `${SYSTEM_INSTRUCTION}\n\n${COMPARISON_SYSTEM_INSTRUCTION}\n\nThe user wants to discuss the following feature: "${activeFeatureForDiscussion.name}". Description: "${activeFeatureForDiscussion.description}". Source: ${activeFeatureForDiscussion.source}.`;
            }
            if (appMode === 'workbench') {
                return `${SYSTEM_INSTRUCTION}\n\n${WORKBENCH_SYSTEM_INSTRUCTION}`;
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
    
      }, [addToast, setLanguage, setUserOnlyCode, setReviewProfile, customReviewProfile, comparisonGoal, appMode, chatContext, activeFeatureForDiscussion, getSystemInstructionForReview, reviewFeedback, fullCodeForReview, setAppMode]);
      
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
          if (typeof sessionState.workbenchScript === 'string') setWorkbenchScript(sessionState.workbenchScript);
    
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
    
                if (mode === 'workbench') {
                    return `${SYSTEM_INSTRUCTION}\n\n${WORKBENCH_SYSTEM_INSTRUCTION}`;
                }
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
        resetForNewRequest, setAppMode, setLanguage, setReviewProfile, setCustomReviewProfile,
        setUserOnlyCode, setCodeB, setErrorMessage, setComparisonGoal, setVersions, setProjectFiles,
        setContextFileIds, setTargetHostname, setWorkbenchScript, addToast
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
        activeFeatureForDiscussion, attachments, contextFileIds
    ]);

    const sessionActionsValue = useMemo(() => ({
        setFeatureDecisions, setAdversarialReportContent, setThreatVectorReport, handleContextFileSelectionChange,
        resetForNewRequest, registerUiActions, handleStopGenerating, handleReviewSubmit, handleAuditSubmit,
        handleCompareAndOptimize, handleCompareAndRevise, handleAnalyzeRootCause, handleStartFollowUp,
        handleFinalizeFeatureDiscussion, handleGenerateTests, handleGenerateDocs, onSaveGeneratedFile, handleExitChatMode,
        handleGenerateCommitMessage, handleFinalizeComparison, handleDownloadOutput, handleAutoGenerateVersionName,
        handleGenerateAdversarialReport, handleThreatVectorAnalysis, handleExplainSelection, handleReviewSelection,
        handleChatSubmit, handleLoadRevisionIntoEditor, onClearChatRevisions, onRenameChatRevision, onDeleteChatRevision,
        onClearChatFiles, onRenameChatFile, onDeleteChatFile, handleLoadSession, featureDecisions, allFeaturesDecided
    }), [
        handleContextFileSelectionChange, resetForNewRequest, registerUiActions, handleStopGenerating,
        handleReviewSubmit, handleAuditSubmit, handleCompareAndOptimize, handleCompareAndRevise,
        handleAnalyzeRootCause, handleStartFollowUp, handleFinalizeFeatureDiscussion, handleGenerateTests,
        handleGenerateDocs, onSaveGeneratedFile, handleExitChatMode, handleGenerateCommitMessage,
        handleFinalizeComparison, handleDownloadOutput, handleAutoGenerateVersionName,
        handleGenerateAdversarialReport, handleThreatVectorAnalysis, handleExplainSelection,
        handleReviewSelection, handleChatSubmit, handleLoadRevisionIntoEditor, onClearChatRevisions,
        onRenameChatRevision, onDeleteChatRevision, onClearChatFiles, onRenameChatFile, onDeleteChatFile,
        handleLoadSession, featureDecisions, allFeaturesDecided
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