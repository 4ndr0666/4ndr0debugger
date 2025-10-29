import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner.tsx';

interface AnalysisProgressProps {
    steps: string[];
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ steps }) => {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (steps.length === 0) return;
        const interval = setInterval(() => {
            setCurrentStep(prev => (prev + 1) % steps.length);
        }, 1500);
        return () => clearInterval(interval);
    }, [steps]);

    if (steps.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <LoadingSpinner size="w-10 h-10" />
                <p className="mt-4 text-sm uppercase tracking-wider">Processing...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full">
            <LoadingSpinner size="w-10 h-10" />
            <p className="mt-4 text-sm uppercase tracking-wider animate-pulse">{steps[currentStep]}</p>
        </div>
    );
};
