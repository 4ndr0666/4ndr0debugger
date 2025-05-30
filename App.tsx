
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { CodeInput } from './components/CodeInput';
import { ReviewOutput } from './components/ReviewOutput';
import { ApiKeyBanner } from './components/ApiKeyBanner';
import { reviewCode } from './services/geminiService';
import { SupportedLanguage } from './types';
import { SUPPORTED_LANGUAGES } from './constants';

const App: React.FC = () => {
  const [userOnlyCode, setUserOnlyCode] = useState<string>(''); // Stores only the user's raw code
  const [language, setLanguage] = useState<SupportedLanguage>(SUPPORTED_LANGUAGES[0].value);
  const [reviewFeedback, setReviewFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleReviewSubmit = useCallback(async (fullCodeToSubmit: string) => {
    // The fullCodeToSubmit already has the user's code embedded in the template
    // The button in CodeInput is disabled if userOnlyCode is empty,
    // so no need for an additional check for empty userOnlyCode here.
    
    setIsLoading(true);
    setError(null);
    setReviewFeedback(null); // Clear previous feedback

    try {
      // Pass the fully templated code to the review service
      const feedback = await reviewCode(fullCodeToSubmit, language);
      setReviewFeedback(feedback);
      // Check if feedback itself is an error message from the service
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
  }, [language]); // userOnlyCode is not needed in dependency array as fullCodeToSubmit is passed in

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