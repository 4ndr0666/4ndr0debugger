import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useConfigContext, useInputContext, useActionsContext, useToast } from './AppContext.tsx';
import { usePersistenceContext } from './contexts/PersistenceContext.tsx';
import { useOutputContext, useLoadingStateContext, useChatStateContext, useSessionActionsContext } from './contexts/SessionContext.tsx';
import { Header } from './Components/Header.tsx';
import { CodeInput } from './Components/CodeInput.tsx';
import { ReviewOutput } from './Components/ReviewOutput.tsx';
import { Version, UIActions, ProjectFile, ImportedSession } from './types.ts';
import { DiffViewer } from './Components/DiffViewer.tsx';
import { ComparisonInput } from './Components/ComparisonInput.tsx';
import { VersionHistoryModal } from './Components/VersionHistoryModal.tsx';
import { SaveVersionModal } from './Components/SaveVersionModal.tsx';
import { ApiKeyBanner } from './Components/ApiKeyBanner.tsx';
import { DocumentationCenterModal } from './Components/DocumentationCenterModal.tsx';
import { ProjectFilesModal } from './Components/ProjectFilesModal.tsx';
import { SessionManagerModal } from './Components/SessionManagerModal.tsx';
import { AdversarialReportGenerator } from './Components/AdversarialReportGenerator.tsx';
import { SegmentedControl } from './Components/SegmentedControl.tsx';
import { LiveReconModal } from './Components/LiveReconModal.tsx';
import { PayloadCraftingModal } from './Components/PayloadCraftingModal.tsx';
import { ThreatVectorModal } from './Components/ThreatVectorModal.tsx';
import { DebugInput } from './Components/DebugInput.tsx';
import { CURRENT_SESSION_VERSION } from './constants.ts';
import { HelpModal } from './Components/HelpModal.tsx';
import { b64EncodeUnicode, b64DecodeUnicode } from './utils.ts';

const App: React.FC = () => {
  const { 
    appMode, language, reviewProfile, customReviewProfile,
    targetHostname, setLanguage, setReviewProfile, setCustomReviewProfile, setTargetHostname,
  } = useConfigContext();
  const {
    userOnlyCode, setUserOnlyCode, codeB, errorMessage,
    comparisonGoal, setCodeB, setErrorMessage, setComparisonGoal,
  } = useInputContext();
  const { resetAndSetMode } = useActionsContext();
  const { versions, projectFiles, setProjectFiles, setVersions, setImportedSessions } = usePersistenceContext();
  
  const { isLoading, isChatLoading, isGeneratingReport } = useLoadingStateContext();
  const { isInputPanelVisible, isChatMode, chatHistory, chatRevisions, chatFiles, contextFileIds, setAttachments, setIsInputPanelVisible } = useChatStateContext();
  const { 
    showOutputPanel, reviewFeedback, revisedCode, reviewedCode, featureMatrix, rawFeatureMatrixJson, 
    finalizationSummary, finalizationBriefing, adversarialReportContent, fullCodeForReview, outputType,
    reviewAvailable
  } = useOutputContext();
  const { 
    handleStartFollowUp, handleGenerateTests, handleGenerateAdversarialReport,
    handleLoadSession, registerUiActions, resetForNewRequest, handleAutoGenerateVersionName,
    featureDecisions, setAdversarialReportContent
  } = useSessionActionsContext();

  const { addToast } = useToast();
  
  const [activePanel, setActivePanel] = useState<'input' | 'output'>('input');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isVersionHistoryModalOpen, setIsVersionHistoryModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [isProjectFilesModalOpen, setIsProjectFilesModalOpen] = useState(false);
  const [isSessionManagerModalOpen, setIsSessionManagerModalOpen] = useState(false);
  const [isReportGeneratorModalOpen, setIsReportGeneratorModalOpen] = useState(false);
  const [isReconModalOpen, setIsReconModalOpen] = useState(false);
  const [isPayloadCraftingModalOpen, setIsPayloadCraftingModalOpen] = useState(false);
  const [isThreatVectorModalOpen, setIsThreatVectorModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [isSavingChat, setIsSavingChat] = useState(false);
  const [isGeneratingName, setIsGeneratingName] = useState<boolean>(false);

  const attachFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
        try {
            const decodedState = JSON.parse(b64DecodeUnicode(hash));
            if (decodedState.appMode) resetAndSetMode(decodedState.appMode);
            if (decodedState.language) setLanguage(decodedState.language);
            if (decodedState.reviewProfile) setReviewProfile(decodedState.reviewProfile);
            if (decodedState.customReviewProfile) setCustomReviewProfile(decodedState.customReviewProfile);
            if (decodedState.targetHostname) setTargetHostname(decodedState.targetHostname);
            if (decodedState.userOnlyCode) setUserOnlyCode(decodedState.userOnlyCode);
            if (decodedState.codeB) setCodeB(decodedState.codeB);
            if (decodedState.errorMessage) setErrorMessage(decodedState.errorMessage);
            if (decodedState.comparisonGoal) setComparisonGoal(decodedState.comparisonGoal);

            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            addToast("Session loaded from URL", "info");
        } catch (e) {
            console.error("Failed to load state from URL hash:", e);
            addToast("Failed to load session from URL", "error");
        }
    }
  }, []);

  useEffect(() => {
    if (registerUiActions) {
        const actions: UIActions = {
            openThreatVectorModal: () => setIsThreatVectorModalOpen(true),
            openReconModal: () => setIsReconModalOpen(true),
            openPayloadCraftingModal: () => setIsPayloadCraftingModalOpen(true),
            openReportGenerator: () => setIsReportGeneratorModalOpen(true),
            generateTests: handleGenerateTests,
            openDocsModal: () => setIsDocsModalOpen(true),
            openVersionHistory: () => setIsVersionHistoryModalOpen(true),
            openProjectFilesModal: () => setIsProjectFilesModalOpen(true),
            openSessionManagerModal: () => setIsSessionManagerModalOpen(true),
            openHelpModal: () => setIsHelpModalOpen(true),
            openSaveModal: (isChat: boolean) => {
                setIsSavingChat(isChat);
                setIsSaveModalOpen(true);
            },
            openDiffViewer: () => setIsDiffModalOpen(true),
        };
        registerUiActions(actions);
    }
  }, [registerUiActions, handleGenerateTests]);


  const handleExportSession = useCallback(() => {
    try {
        const sessionState = {
            version: CURRENT_SESSION_VERSION,
            appMode, language, reviewProfile, customReviewProfile, userOnlyCode, codeB, 
            errorMessage, comparisonGoal, versions, projectFiles, targetHostname,
            reviewFeedback, revisedCode, reviewedCode, chatHistory, chatRevisions, chatFiles,
            featureMatrix, rawFeatureMatrixJson, featureDecisions,
            finalizationSummary, finalizationBriefing,
            contextFileIds: contextFileIds,
        };
        const sessionString = JSON.stringify(sessionState, null, 2);
        const encodedData = b64EncodeUnicode(sessionString); // Hardened Unicode Serialization
        const blob = new Blob([encodedData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `4ndr0debug_session_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast("Session exported with Unicode integrity.", "success");
    } catch (err) {
        console.error("Failed to export session:", err);
        addToast("Failed to export session.", "error");
    }
  }, [
    appMode, language, reviewProfile, customReviewProfile, userOnlyCode, codeB, 
    errorMessage, comparisonGoal, versions, projectFiles, targetHostname, 
    reviewFeedback, revisedCode, reviewedCode, chatHistory, chatRevisions,
    chatFiles, featureMatrix, rawFeatureMatrixJson, featureDecisions, finalizationSummary,
    finalizationBriefing, contextFileIds, addToast
  ]);

  const processImportedSessionFile = (fileContent: string, fileName: string) => {
    try {
        let decodedContent = fileContent;
        // Check for Base64 (HUD standard for versions >= 4.14.0)
        if (!fileContent.trim().startsWith('{') && !fileContent.trim().startsWith('[')) {
            try {
                decodedContent = b64DecodeUnicode(fileContent);
            } catch (e) {
                console.warn("Could not decode content as Unicode-Safe Base64, treating as legacy raw string.", e);
                decodedContent = fileContent;
            }
        }
        
        const importedState = JSON.parse(decodedContent);

        if (typeof importedState.appMode !== 'string' || typeof importedState.language !== 'string') {
            throw new Error("Invalid session file format.");
        }
        
        if (importedState.version !== CURRENT_SESSION_VERSION) {
            addToast(`Warning: Session version (${importedState.version || '1.0.0'}) differs from current app version (${CURRENT_SESSION_VERSION}).`, 'info');
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

  const handleDeleteImportedSession = (sessionId: string) => {
    setImportedSessions(prev => prev.filter(s => s.id !== sessionId));
    addToast("Imported session removed from list.", "info");
  };

  const handleShareSession = () => {
    try {
        const shareableState = { appMode, language, userOnlyCode, codeB, errorMessage, comparisonGoal, reviewProfile, customReviewProfile };
        const base64State = b64EncodeUnicode(JSON.stringify(shareableState));
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
        appMode: appMode,
        type: 'review',
        rawFeatureMatrixJson: rawFeatureMatrixJson,
        reviewProfile: reviewProfile,
        customReviewProfile: customReviewProfile,
        comparisonGoal: comparisonGoal,
        contextFileIds: contextFileIds,
    };

    if (isSavingChat) {
        newVersion.chatHistory = chatHistory;
        newVersion.feedback = chatHistory.map(msg => `**${msg.role}**: ${msg.content}`).join('\n\n---\n\n');
        newVersion.chatRevisions = chatRevisions;
        newVersion.chatFiles = chatFiles;
    } else if (outputType) {
        const typeMap = { 'docs': 'docs', 'tests': 'tests', 'commit': 'commit', 'finalization': 'finalization', 'root-cause': 'root-cause' };
        if (typeMap[outputType]) newVersion.type = typeMap[outputType] as Version['type'];
    }
    
    setVersions(prev => [newVersion, ...prev]);
    addToast(`Version "${versionName.trim()}" saved!`, "success");
    setIsSaveModalOpen(false);
    setVersionName('');
    
    if (isSavingChat) {
        setIsSavingChat(false);
        resetForNewRequest();
    }
  }, [versionName, isSavingChat, language, addToast, setVersions, userOnlyCode, reviewedCode, reviewProfile, customReviewProfile, comparisonGoal, appMode, fullCodeForReview, reviewFeedback, rawFeatureMatrixJson, contextFileIds, chatHistory, chatRevisions, chatFiles, outputType, resetForNewRequest]);
  
  const handleLoadVersion = (version: Version) => {
    addToast(`Loading version "${version.name}"...`, "info");
    handleLoadSession(version);
    setIsVersionHistoryModalOpen(false);
  };

  const handleDeleteVersion = (versionId: string) => {
      setVersions(prev => prev.filter(v => v.id !== versionId));
      addToast("Version deleted.", "info");
  };

  const handleRenameVersion = (versionId: string, newName: string) => {
      setVersions(prev => prev.map(v => v.id === versionId ? { ...v, name: newName } : v));
      addToast("Version renamed.", "success");
  };

    const fileToContent = (file: File): Promise<{ content: string; mimeType: string }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                if (file.type.startsWith('image/')) {
                    resolve({ content: result.split(',')[1], mimeType: file.type });
                } else {
                    resolve({ content: result, mimeType: file.type || 'text/plain' });
                }
            };
            reader.onerror = (error) => reject(error);
            if (file.type.startsWith('image/')) reader.readAsDataURL(file);
            else reader.readAsText(file);
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
  
    const handleUploadProjectFiles = async (files: File[]) => {
        try {
            const processedFiles = await Promise.all(files.map(async (file) => {
                const { content, mimeType } = await fileToContent(file);
                return { 
                    id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${file.name}`, 
                    name: file.name, 
                    content, 
                    mimeType, 
                    timestamp: Date.now() 
                };
            }));
            
            setProjectFiles(prev => [...processedFiles, ...prev]);
            addToast(`${processedFiles.length} file(s) uploaded successfully.`, "success");
        } catch (error) {
            console.error("Failed to upload project files:", error);
            addToast("Failed to upload files.", "error");
        }
    };
  
    const handleDeleteProjectFile = (fileId: string) => {
        setProjectFiles(prev => prev.filter(pf => pf.id !== fileId));
        addToast("Project file deleted.", "info");
    };

    const handleDeleteAllProjectFiles = () => {
        setProjectFiles([]);
        addToast("All project files deleted.", "info");
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
            setAttachments(prev => [...prev, { file: file, content: projectFile.content, mimeType: projectFile.mimeType }]);
            addToast(`Attached "${projectFile.name}" to chat.`, "success");
            setIsProjectFilesModalOpen(false);
        } catch (error) {
            console.error("Failed to attach project file:", error);
            addToast("Failed to attach project file.", "error");
        }
    };
      
    const handleDownloadFile = (content: string, filename: string) => {
        if (!content) return;
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast(`Downloaded "${filename}".`, "success");
    };

  const renderInputComponent = () => {
    const commonProps = {
      isActive: activePanel === 'input',
    };

    const chatHandlers = {
      onAttachFileClick: () => attachFileInputRef.current?.click(),
      onOpenProjectFilesModal: () => setIsProjectFilesModalOpen(true),
    };

    switch(appMode) {
      case 'single':
        return <CodeInput {...commonProps} {...chatHandlers} onOpenSaveModal={() => setIsSaveModalOpen(true)} onSaveChatSession={handleSaveChatSession} />;
      case 'debug':
        return <DebugInput {...commonProps} {...chatHandlers} onOpenSaveModal={() => setIsSaveModalOpen(true)} onSaveChatSession={handleSaveChatSession} />;
      case 'comparison':
        return <ComparisonInput {...commonProps} {...chatHandlers} />;
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
        onOpenDocsModal={() => setIsDocsModalOpen(true)}
        onOpenProjectFilesModal={() => setIsProjectFilesModalOpen(true)}
        onToggleVersionHistory={() => setIsVersionHistoryModalOpen(true)}
        onOpenReportGenerator={() => setIsReportGeneratorModalOpen(true)}
        onOpenReconModal={() => setIsReconModalOpen(true)}
        onOpenPayloadCraftingModal={() => setIsPayloadCraftingModalOpen(true)}
        onOpenThreatVectorModal={() => setIsThreatVectorModalOpen(true)}
        onExportSession={handleExportSession}
        onImportClick={() => setIsSessionManagerModalOpen(true)}
        onShare={handleShareSession}
        onEndChatSession={handleSaveChatSession}
        onOpenHelpModal={() => setIsHelpModalOpen(true)}
        isInputPanelVisible={isInputPanelVisible}
        setIsInputPanelVisible={setIsInputPanelVisible}
        isChatMode={isChatMode}
        reviewAvailable={reviewAvailable}
        handleStartFollowUp={handleStartFollowUp}
        handleGenerateTests={handleGenerateTests}
      />
      <ApiKeyBanner />
      <SegmentedControl
        currentMode={appMode}
        onModeChange={resetAndSetMode}
        disabled={isLoading || isChatLoading}
      />
      <main className={`flex-grow min-h-0 container mx-auto px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8 grid grid-cols-1 ${isInputPanelVisible && showOutputPanel && !isChatMode ? 'md:grid-cols-[2fr_3fr]' : ''} gap-6 lg:gap-8 animate-fade-in`}>
          {isInputPanelVisible && (
            <div className={`flex flex-col min-h-0 ${isChatMode ? 'md:col-span-2' : ''}`} onClick={() => !isChatMode && setActivePanel('input')}>
              {renderInputComponent()}
            </div>
          )}
          
          {showOutputPanel && !isChatMode && (
            <div className="flex flex-col min-h-0" onClick={() => setActivePanel('output')}>
                <ReviewOutput
                  onSaveVersion={() => setIsSaveModalOpen(true)}
                  onShowDiff={() => setIsDiffModalOpen(true)}
                  isActive={activePanel === 'output'}
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
              onAutoGenerate={async () => {
                setIsGeneratingName(true);
                await handleAutoGenerateVersionName(isSavingChat, setVersionName);
                setIsGeneratingName(false);
              }}
              isGeneratingName={isGeneratingName}
              outputType={outputType}
              isSavingChat={isSavingChat}
              disabled={isLoading}
          />
      )}
      <VersionHistoryModal 
        isOpen={isVersionHistoryModalOpen}
        onClose={() => setIsVersionHistoryModalOpen(false)}
        onLoadVersion={handleLoadVersion}
        onDeleteVersion={handleDeleteVersion}
        onRenameVersion={handleRenameVersion}
        onStartFollowUp={(v) => { handleStartFollowUp(v); setIsVersionHistoryModalOpen(false); }}
        isLoading={isLoading}
      />
       <DocumentationCenterModal
        isOpen={isDocsModalOpen}
        onClose={() => setIsDocsModalOpen(false)}
        onLoadVersion={handleLoadVersion}
        onDeleteVersion={handleDeleteVersion}
        onDownload={handleDownloadFile}
        isLoading={isLoading}
      />
      <ProjectFilesModal
        isOpen={isProjectFilesModalOpen}
        onClose={() => setIsProjectFilesModalOpen(false)}
        onUploadFiles={handleUploadProjectFiles}
        onDeleteFile={handleDeleteProjectFile}
        onDeleteAllFiles={handleDeleteAllProjectFiles}
        onAttachFile={handleAttachProjectFileToChat}
        onDownloadFile={handleDownloadProjectFile}
        isLoading={isLoading}
      />
      <SessionManagerModal
        isOpen={isSessionManagerModalOpen}
        onClose={() => setIsSessionManagerModalOpen(false)}
        onImportFile={handleImportFile}
        onLoadSession={(state) => { handleLoadSession(state); setIsSessionManagerModalOpen(false); }}
        onDeleteSession={handleDeleteImportedSession}
        isLoading={isLoading}
      />
      <AdversarialReportGenerator
        isOpen={isReportGeneratorModalOpen}
        onClose={() => {
            setIsReportGeneratorModalOpen(false);
            setAdversarialReportContent(null);
        }}
        onGenerate={handleGenerateAdversarialReport}
        isLoading={isGeneratingReport || isLoading}
        reportContent={adversarialReportContent}
      />
      <LiveReconModal
        isOpen={isReconModalOpen}
        onClose={() => setIsReconModalOpen(false)}
      />
      <PayloadCraftingModal
        isOpen={isPayloadCraftingModalOpen}
        onClose={() => setIsPayloadCraftingModalOpen(false)}
      />
      <ThreatVectorModal
        isOpen={isThreatVectorModalOpen}
        onClose={() => setIsThreatVectorModalOpen(false)}
      />
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
};

export default App;