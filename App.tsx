
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { CodeInput } from './components/CodeInput';
import { ReviewOutput } from './components/ReviewOutput';
import { ApiKeyBanner } from './components/ApiKeyBanner';
import { reviewCode } from './services/geminiService';
import { SupportedLanguage } from './types';
import { SUPPORTED_LANGUAGES } from './constants';

const App: React.FC = () => {
  const [userOnlyCode, setUserOnlyCode] = useState<string>('');
  const [language, setLanguage] = useState<SupportedLanguage>(SUPPORTED_LANGUAGES[0].value);
  const [reviewFeedback, setReviewFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleReviewSubmit = useCallback(async (fullCodeToSubmit: string) => {
    setIsLoading(true);
    setError(null);
    setReviewFeedback(null);

    try {
      // The 'language' argument is no longer needed for reviewCode
      const feedback = await reviewCode(fullCodeToSubmit);
      setReviewFeedback(feedback);
      if (feedback.toLowerCase().startsWith("error:")) {
        setError(feedback);
        setReviewFeedback(null);
      }
    } catch (apiError) {
      console.error("API Error:", apiError);
      const message = apiError instanceof Error ? apiError.message : "An unexpected error occurred.";
      setError(`Failed to get review: ${message}`);
      setReviewFeedback(null);
    } finally {
      setIsLoading(false);
    }
  }, []); // language is removed from dependency array as it's not directly used by reviewCode anymore.
           // fullCodeToSubmit encapsulates language-specific templating.

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
            isLoading={isLoading}
          />
          <ReviewOutput
            feedback={reviewFeedback}
            isLoading={isLoading}
            error={error}
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
