
import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { Header } from './components/Header';
import { CodeInput } from './components/CodeInput';
import { ReviewOutput } from './components/ReviewOutput';
import { ApiKeyBanner } from './components/ApiKeyBanner';
import { generateContent } from './services/geminiService';
import { SupportedLanguage, ChatMessage, Version } from './types';
import { SUPPORTED_LANGUAGES, GEMINI_MODEL_NAME, SYSTEM_INSTRUCTION, DOCS_SYSTEM_INSTRUCTION } from './constants';

type CodeInputTab = 'editor' | 'chat' | 'history';
type LoadingAction = 'review' | 'docs' | null;

const App: React.FC = () => {
  // --- Working State ---
  const [userOnlyCode, setUserOnlyCode] = useState<string>('');
  const [language, setLanguage] = useState<SupportedLanguage>(SUPPORTED_LANGUAGES[0].value);
  const [fullCodeForReview, setFullCodeForReview] = useState<string>('');
  const [reviewFeedback, setReviewFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
  const [error, setError] = useState<string | null>(null);

  // --- View & Chat State ---
  const [activeCodeInputTab, setActiveCodeInputTab] = useState<CodeInputTab>('editor');
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  // --- Versioning State ---
  const [versions, setVersions] = useState<Version[]>([]);
  
  const [ai] = useState(() => process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null);

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


  const handleReviewSubmit = useCallback(async (fullCodeToSubmit: string) => {
    setIsLoading(true);
    setLoadingAction('review');
    setError(null);
    setReviewFeedback(null);
    setActiveCodeInputTab('editor');
    setChatHistory([]);
    setChatSession(null);
    setFullCodeForReview(fullCodeToSubmit);

    try {
      const feedback = await generateContent(fullCodeToSubmit, SYSTEM_INSTRUCTION);
      if (feedback && feedback.toLowerCase().startsWith("error:")) {
        setError(feedback);
        setReviewFeedback(null);
      } else {
        setReviewFeedback(feedback);
      }
    } catch (apiError) {
      console.error("API Error:", apiError);
      const message = apiError instanceof Error ? apiError.message : "An unexpected error occurred.";
      setError(`Failed to get review: ${message}`);
      setReviewFeedback(null);
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  }, [ai]);

  const handleGenerateDocs = useCallback(async (fullCodeToSubmit: string) => {
    setIsLoading(true);
    setLoadingAction('docs');
    setError(null);
    setReviewFeedback(null);
    setActiveCodeInputTab('editor');
    setChatHistory([]);
    setChatSession(null);
    setFullCodeForReview(fullCodeToSubmit);

    try {
      const feedback = await generateContent(fullCodeToSubmit, DOCS_SYSTEM_INSTRUCTION);
      if (feedback && feedback.toLowerCase().startsWith("error:")) {
        setError(feedback);
        setReviewFeedback(null);
      } else {
        setReviewFeedback(feedback);
      }
    } catch (apiError) {
      console.error("API Error:", apiError);
      const message = apiError instanceof Error ? apiError.message : "An unexpected error occurred.";
      setError(`Failed to get documentation: ${message}`);
      setReviewFeedback(null);
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  }, [ai]);


  const handleStartFollowUp = useCallback((version?: Version) => {
    const contextFeedback = version ? version.feedback : reviewFeedback;
    const contextCode = version ? version.fullPrompt : fullCodeForReview;
    
    if (!contextFeedback || !contextCode || !ai) return;

    let selectionText = '';
    if (!version) { // Selection only makes sense for the current, visible review
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
    } else {
        historyForUI.push({ role: 'model', content: contextFeedback });
    }
    
    if (selectionText) {
      const followUpContext = `My follow-up question is about this specific part of your code revision:\n\n\`\`\`\n${selectionText}\n\`\`\``;
      historyForAPI.push({ role: 'user' as const, parts: [{ text: followUpContext }] });
      const uiConfirmation = `Okay, let's talk about this snippet:\n\n\`\`\`\n${selectionText}\n\`\`\``;
      historyForUI.push({ role: 'model', content: uiConfirmation });
    } else if (!version) {
      historyForUI.push({ role: 'model', content: "What would you like to ask about the review?" });
    }

    const newChat = ai.chats.create({ 
      model: GEMINI_MODEL_NAME, 
      history: historyForAPI,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    setChatSession(newChat);
    setChatHistory(historyForUI);
    setActiveCodeInputTab('chat');
  }, [reviewFeedback, fullCodeForReview, ai]);

  const handleFollowUpSubmit = useCallback(async (message: string) => {
    if (!chatSession) return;
    setIsChatLoading(true);
    setError(null);
    setChatHistory(prev => [...prev, { role: 'user', content: message }]);

    try {
      const response = await chatSession.sendMessage({ message });
      const feedback = response.text;
      if (feedback) {
        setChatHistory(prev => [...prev, { role: 'model', content: feedback }]);
        setReviewFeedback(feedback); // Update right panel with latest response
      } else {
        setError("Received an empty response from the AI.");
      }
    } catch (apiError) {
      console.error("Chat API Error:", apiError);
      const message = apiError instanceof Error ? apiError.message : "An unexpected error occurred.";
      setError(`Failed to get response: ${message}`);
    } finally {
      setIsChatLoading(false);
    }
  }, [chatSession]);

  const handleNewReview = useCallback(() => {
    setActiveCodeInputTab('editor');
    setReviewFeedback(null);
    setError(null);
    setChatSession(null);
    setChatHistory([]);
    setUserOnlyCode('');
  }, []);

  const handleSaveVersion = useCallback(() => {
    if (!reviewFeedback || !fullCodeForReview) return;
    const name = prompt("Enter a name for this version:", `Result ${new Date().toLocaleString()}`);
    if (name) {
      const newVersion: Version = {
        id: `v_${Date.now()}`,
        name,
        userCode: userOnlyCode,
        fullPrompt: fullCodeForReview,
        feedback: reviewFeedback,
        language,
        timestamp: Date.now(),
      };
      setVersions(prev => [newVersion, ...prev]);
    }
  }, [reviewFeedback, fullCodeForReview, userOnlyCode, language]);
  
  const handleLoadVersion = useCallback((version: Version) => {
    setUserOnlyCode(version.userCode);
    setLanguage(version.language);
    setFullCodeForReview(version.fullPrompt);
    setReviewFeedback(version.feedback);
    setError(null);
    setChatSession(null);
    setChatHistory([]);
    setActiveCodeInputTab('editor');
  }, []);

  const handleDeleteVersion = useCallback((versionId: string) => {
    if (window.confirm("Are you sure you want to delete this version?")) {
      setVersions(prev => prev.filter(v => v.id !== versionId));
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <ApiKeyBanner /> 
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <CodeInput
            userCode={userOnlyCode}
            setUserCode={setUserOnlyCode}
            language={language}
            setLanguage={setLanguage}
            onSubmit={handleReviewSubmit}
            onGenerateDocs={handleGenerateDocs}
            isLoading={isLoading}
            isChatLoading={isChatLoading}
            loadingAction={loadingAction}
            reviewAvailable={!!reviewFeedback}
            activeTab={activeCodeInputTab}
            setActiveTab={setActiveCodeInputTab}
            onStartFollowUp={handleStartFollowUp}
            onNewReview={handleNewReview}
            onFollowUpSubmit={handleFollowUpSubmit}
            chatHistory={chatHistory}
            versions={versions}
            onLoadVersion={handleLoadVersion}
            onDeleteVersion={handleDeleteVersion}
          />
          <ReviewOutput
            feedback={reviewFeedback}
            isLoading={isLoading}
            isChatLoading={isChatLoading}
            loadingAction={loadingAction}
            error={error}
            onSaveVersion={handleSaveVersion}
          />
        </div>
      </main>
      <footer className="text-center py-4 text-sm text-[#70c0c0] border-t border-[#157d7d]/50">
        Powered by Gemini API & React.
      </footer>
    </div>
  );
};

export default App;
