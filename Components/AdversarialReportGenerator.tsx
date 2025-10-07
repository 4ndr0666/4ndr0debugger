import React, { useState, useCallback } from 'react';
import { Button } from './Button.tsx';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';
import { CheckIcon, CopyIcon, ImportIcon } from './Icons.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';

interface AdversarialReportGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (reconData: string, targetHostname: string) => void;
  isLoading: boolean;
  reportContent: string | null;
}

export const AdversarialReportGenerator: React.FC<AdversarialReportGeneratorProps> = ({
  isOpen,
  onClose,
  onGenerate,
  isLoading,
  reportContent,
}) => {
  const [reconData, setReconData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [targetHostname, setTargetHostname] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setError(null);
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setReconData(content);
        setFileName(file.name);
        try {
            const parsedData = JSON.parse(content);
            const inferredHostname = parsedData.origin || parsedData.host || parsedData.hostname;
            if (inferredHostname && typeof inferredHostname === 'string') {
                setTargetHostname(inferredHostname);
            }
        } catch (jsonError) {
            console.warn("Could not parse JSON for hostname inference.", jsonError);
        }
      };
      reader.onerror = () => {
        setError('Failed to read the file.');
      };
      reader.readAsText(file);
    } else {
      setError('Invalid file type. Please upload a JSON file.');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);
  
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
          handleFile(files[0]);
      }
  };

  const handleGenerateClick = () => {
    if (reconData && targetHostname) {
      onGenerate(reconData, targetHostname);
    } else {
      const errorMessages = [];
      if (!reconData) errorMessages.push("recon data");
      if (!targetHostname) errorMessages.push("a target hostname");
      setError(`Please provide ${errorMessages.join(' and ')} before generating a report.`);
    }
  };
  
  const handleCopy = () => {
    if (!reportContent) return;
    navigator.clipboard.writeText(reportContent).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
    });
  };

  const handleDownload = () => {
      if (!reportContent) return;
      const blob = new Blob([reportContent], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'adversarial_report.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };


  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-generator-title"
    >
      <div
        className="hud-container w-full max-w-3xl h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="hud-corner corner-top-left"></div>
        <div className="hud-corner corner-top-right"></div>
        <div className="hud-corner corner-bottom-left"></div>
        <div className="hud-corner corner-bottom-right"></div>
        
        <div className="flex justify-between items-center flex-shrink-0 relative">
            <h2 id="report-generator-title" className="text-xl">Adversarial Report Generator</h2>
            <button
                onClick={onClose}
                className="absolute -top-4 -right-4 p-1.5 rounded-full hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)]"
                aria-label="Close Report Generator"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <div className="flex-grow mt-4 flex flex-col min-h-0">
          {!reportContent && !isLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4 animate-fade-in">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                className={`w-full h-40 border-2 border-dashed ${dragOver ? 'border-[var(--hud-color)] bg-[var(--hud-color)]/10' : 'border-[var(--hud-color-darkest)]'} flex flex-col items-center justify-center text-center transition-colors`}
              >
                <input type="file" id="file-upload" className="hidden" accept=".json,application/json" onChange={handleFileInput} />
                <label htmlFor="file-upload" className="cursor-pointer">
                    <p className="text-lg text-[var(--hud-color-darker)]">Drop Exfiltrated Recon Data (JSON)</p>
                    <p className="text-sm text-[var(--hud-color-darker)]">or click to browse</p>
                </label>
              </div>
              {fileName && (
                <div className="w-full space-y-2 animate-fade-in text-left">
                    <p className="text-green-400 font-mono text-sm text-center">Loaded: {fileName}</p>
                    <div>
                        <label htmlFor="target-hostname" className="block text-sm uppercase tracking-wider text-[var(--hud-color-darker)] mb-1">
                            Target Hostname
                        </label>
                        <input
                            id="target-hostname"
                            type="text"
                            value={targetHostname}
                            onChange={(e) => setTargetHostname(e.target.value)}
                            className="block w-full p-2.5 font-mono text-sm text-[var(--hud-color)] bg-black border border-[var(--hud-color-darkest)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--bright-cyan)] placeholder:text-[var(--hud-color-darker)] transition-all duration-150"
                            placeholder="e.g., example.com (inferred or manual)"
                            disabled={isLoading}
                        />
                    </div>
                </div>
              )}
              {error && <p className="text-red-400 font-mono text-sm animate-fade-in">{error}</p>}
              <Button onClick={handleGenerateClick} disabled={!reconData || isLoading} isLoading={isLoading}>
                Generate Report
              </Button>
            </div>
          ) : (
            <div className="flex-grow flex flex-col min-h-0">
                <div className="flex-grow overflow-y-auto pr-2 border border-[var(--hud-color-darkest)] p-3 bg-black/30">
                    {isLoading && !reportContent ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <LoadingSpinner size="w-10 h-10" />
                            <p className="mt-4 text-sm uppercase tracking-wider">Generating Report...</p>
                        </div>
                    ) : (
                        <MarkdownRenderer markdown={reportContent || ''} />
                    )}
                </div>
                {!isLoading && reportContent && (
                    <div className="flex-shrink-0 mt-4 flex justify-end items-center gap-3 animate-fade-in">
                        <Button onClick={handleCopy} variant="secondary">
                            {isCopied ? <CheckIcon className="w-4 h-4 mr-2" /> : <CopyIcon className="w-4 h-4 mr-2" />}
                            {isCopied ? 'Copied' : 'Copy Markdown'}
                        </Button>
                        <Button onClick={handleDownload} variant="primary">
                            <ImportIcon className="w-4 h-4 mr-2" />
                            Download .md
                        </Button>
                    </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};