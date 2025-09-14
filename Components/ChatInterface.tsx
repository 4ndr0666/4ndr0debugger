import React, { useEffect, useRef } from 'react';
import { ChatMessage, SupportedLanguage, ChatRevision, Feature, ChatContext as ChatContextType, FinalizationSummary } from '../types.ts';
import { Button } from './Button.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';
import { ChatContext } from './ChatContext.tsx';
import { DeleteIcon, FolderIcon, PaperclipIcon } from './Icons.tsx';

interface ChatInterfaceProps {
  onFinalizeFeatureDiscussion: () => void;
  onReturnToOutputView: () => void;
  chatHistory: ChatMessage[];
  onFollowUpSubmit: (message: string) => void;
  isChatLoading: boolean;
  chatInputValue: string;
  setChatInputValue: (value: string) => void;
  onNewReview: () => void;
  onOpenSaveModal: () => void;
  onLoadRevisionIntoEditor: () => void;
  // Context props
  originalReviewedCode: string | null;
  revisedCode: string | null;
  chatRevisions: ChatRevision[];
  appMode: 'single' | 'comparison' | 'debug';
  codeB: string | null;
  language: SupportedLanguage;
  onCodeLineClick: (line: string) => void;
  onClearChatRevisions: () => void;
  onRenameChatRevision: (id: string, newName: string) => void;
  onDeleteChatRevision: (id: string) => void;
  chatContext: ChatContextType;
  activeFeatureForDiscussion: Feature | null;
  finalizationSummary: FinalizationSummary | null;
  // Attachment props
  attachments: { file: File; content: string; mimeType: string }[];
  onAttachFileClick: () => void;
  onRemoveAttachment: (file: File) => void;
  onOpenProjectFilesModal: () => void;
}

const AttachmentPreview: React.FC<{ file: File; onRemove: () => void; }> = ({ file, onRemove }) => {
    const isImage = file.type.startsWith('image/');
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

    useEffect(() => {
        if (isImage) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [file, isImage]);

    return (
        <div className="bg-black/50 border border-[var(--hud-color-darkest)] flex items-center justify-between p-1 rounded-sm">
            <div className="flex items-center gap-2 overflow-hidden">
                {isImage && previewUrl && <img src={previewUrl} alt="Preview" className="w-8 h-8 object-cover border border-[var(--hud-color-darkest)]" />}
                <div className="text-xs text-[var(--hud-color-darker)] overflow-hidden">
                    <p className="truncate font-mono" title={file.name}>{file.name}</p>
                    <p>{(file.size / 1024).toFixed(1)} KB</p>
                </div>
            </div>
            <button onClick={onRemove} className="p-1 text-[var(--red-color)]/70 rounded-full hover:bg-red-500/30 hover:text-[var(--red-color)] flex-shrink-0" title="Remove file">
                <DeleteIcon className="w-4 h-4" />
            </button>
        </div>
    );
};


export const ChatInterface: React.FC<ChatInterfaceProps> = (props) => {
  const { 
    onFinalizeFeatureDiscussion, onReturnToOutputView, chatHistory, onFollowUpSubmit, isChatLoading,
    chatInputValue, setChatInputValue, onNewReview, onOpenSaveModal,
    onLoadRevisionIntoEditor,
    originalReviewedCode, appMode, codeB,
    language, onCodeLineClick, revisedCode,
    chatRevisions, onClearChatRevisions, onRenameChatRevision, onDeleteChatRevision,
    chatContext, activeFeatureForDiscussion, finalizationSummary,
    attachments, onAttachFileClick, onRemoveAttachment, onOpenProjectFilesModal,
  } = props;
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom on new message
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);
  
  useEffect(() => {
    // Auto-focus input when chat mode is entered
    if (chatContext !== 'finalizing' || !revisedCode) {
      inputRef.current?.focus();
    }
  }, [chatContext, revisedCode]);

  const handleSend = () => {
    if ((chatInputValue.trim() || attachments.length > 0) && !isChatLoading) {
      onFollowUpSubmit(chatInputValue);
      setChatInputValue('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const chatTitle = chatContext === 'feature_discussion' 
    ? `DISCUSSING: ${activeFeatureForDiscussion?.name}`.toUpperCase()
    : chatContext === 'finalizing'
    ? 'FINALIZING REVISION'
    : (appMode === 'debug' ? 'DEBUGGING SESSION' : 'FOLLOW-UP CHAT');
  
  const isGeneralChat = chatContext !== 'feature_discussion';
  const endButtonText = isGeneralChat ? 'Back to Output' : 'Finalize Discussion';
  const endButtonAction = isGeneralChat ? onReturnToOutputView : onFinalizeFeatureDiscussion;
  
  const generationComplete = !isChatLoading && chatContext === 'finalizing' && !!revisedCode;

  const renderAttachments = (attachments?: ChatMessage['attachments']) => {
    if (!attachments || attachments.length === 0) return null;
    return (
      <div className="mb-2 space-y-2">
        {attachments.map((att, index) => {
          const isImage = att.mimeType.startsWith('image/');
          return (
            <div key={index} className="border border-[var(--hud-color-darkest)] bg-black/30 p-2">
              {isImage ? (
                <img src={att.content} alt={att.name} className="max-w-xs max-h-48 object-contain" />
              ) : (
                <div className="text-xs text-[var(--hud-color-darker)]">
                  <p className="font-mono font-bold text-[var(--hud-color)]">{att.name}</p>
                  <p>Content included in prompt.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
        <div className="flex justify-between items-center flex-shrink-0">
            <h3 className="text-xl font-heading truncate pr-4" title={chatTitle}>{chatTitle}</h3>
            {chatContext !== 'finalizing' && (
              <Button onClick={endButtonAction} variant="secondary" className="py-1 px-3 text-xs">
                  {endButtonText}
              </Button>
            )}
        </div>

        {/* Main Content Area: A single pane with responsive sections for chat and history */}
        <div className="flex flex-col flex-grow min-h-0 mt-4">

            {/* Middle Section: Contains chat log and revision history */}
            <div className="flex flex-col md:flex-row flex-grow min-h-0 gap-6 md:gap-8">
                
                {/* Left Part: Chat History */}
                <div ref={chatContainerRef} className="w-full md:w-3/5 flex-grow min-h-0 overflow-y-auto overflow-x-hidden border border-[var(--hud-color-darkest)]">
                    <div className="p-3 space-y-4 flex flex-col">
                        {chatHistory.map((msg) => (
                            <div 
                            key={msg.id} 
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 text-sm ${msg.role === 'user' ? 'bg-transparent border border-[var(--hud-color-darker)] text-[var(--hud-color)]' : 'bg-[var(--hud-color-darkest)] text-[var(--hud-color-darker)]'}`}>
                                {msg.role === 'user' && renderAttachments(msg.attachments)}
                                <MarkdownRenderer markdown={msg.content} />
                            </div>
                            </div>
                        ))}
                        {isChatLoading && (
                            <div className="flex justify-start">
                                <div className="max-w-[80%] p-3 bg-[var(--hud-color-darkest)] text-[var(--hud-color)]">
                                <LoadingSpinner size="w-5 h-5" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Part: Revision History / Feature Context */}
                <div className="w-full md:w-2/5 flex flex-col min-h-0">
                    <ChatContext 
                        codeA={originalReviewedCode || ''}
                        codeB={appMode === 'comparison' ? (codeB || undefined) : undefined}
                        language={language}
                        onLineClick={onCodeLineClick}
                        revisedCode={revisedCode}
                        chatRevisions={chatRevisions}
                        onClearChatRevisions={onClearChatRevisions}
                        onRenameRevision={onRenameChatRevision}
                        onDeleteRevision={onDeleteChatRevision}
                        appMode={appMode}
                        chatContext={chatContext}
                        activeFeatureForDiscussion={activeFeatureForDiscussion}
                        finalizationSummary={finalizationSummary}
                    />
                </div>
            </div>

            {/* Footer Section: Chat Input */}
            <div className="flex items-end space-x-2 flex-shrink-0 mt-4">
               {generationComplete ? (
                    <div className="w-full flex flex-wrap justify-center gap-3 animate-fade-in">
                        <Button onClick={onNewReview} variant="secondary" className="post-review-button">Start New</Button>
                        <Button onClick={onOpenSaveModal} variant="primary" className="post-review-button">Save Final Revision</Button>
                        <Button onClick={onLoadRevisionIntoEditor} variant="primary" className="post-review-button">Load in Editor</Button>
                    </div>
                ) : (
                    <>
                    <div className="relative w-full">
                        {attachments.length > 0 && (
                           <div className="absolute bottom-full left-0 right-0 max-h-48 overflow-y-auto bg-black/80 border border-b-0 border-[var(--hud-color-darkest)] p-2 space-y-2 animate-fade-in">
                                {attachments.map(att => (
                                    <AttachmentPreview key={att.file.name + att.file.lastModified} file={att.file} onRemove={() => onRemoveAttachment(att.file)} />
                                ))}
                            </div>
                        )}
                        <textarea
                            ref={inputRef}
                            value={chatInputValue}
                            onChange={(e) => setChatInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={2}
                            className="block w-full p-2 pr-36 font-mono text-sm text-[var(--hud-color)] bg-black border border-[var(--hud-color-darker)] focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)] focus:border-[var(--hud-color)] resize-y placeholder:text-transparent"
                            placeholder={chatContext === 'finalizing' ? "Final instructions..." : " "}
                            disabled={isChatLoading}
                            aria-label="Follow-up message input"
                        />
                        {!chatInputValue && !isChatLoading && (
                            <span className="absolute left-[13px] top-[9px] pointer-events-none font-mono text-sm text-[var(--hud-color)]" aria-hidden="true">
                                <span className="blinking-prompt">❯ </span>
                                {chatContext === 'finalizing' ? 
                                <span className="text-[var(--hud-color-darker)]">Final instructions...</span>
                                : appMode === 'debug' ? 
                                <span className="text-[var(--hud-color-darker)]">Terminal Output...</span>
                                : <span className="text-[var(--hud-color-darker)]">Your message...</span> }
                            </span>
                        )}
                        {appMode === 'debug' && (chatInputValue.trim() || attachments.length > 0) && !isChatLoading && (
                            <button
                            onClick={handleSend}
                            className="absolute right-3 bottom-2 font-mono text-xs uppercase tracking-widest transition-all duration-200 hover:text-white focus:outline-none animate-fade-in text-[var(--hud-color)] border border-[var(--hud-color)] px-3 py-1.5 hover:bg-[var(--hud-color)]/20"
                            aria-label="Send Results"
                            title="Send Results"
                            >
                            Send Results
                            </button>
                        )}
                    </div>
                    {chatContext !== 'finalizing' && (
                      <div className="flex items-center space-x-2">
                         <button
                           onClick={onOpenProjectFilesModal}
                           disabled={isChatLoading}
                           className="p-3 border border-[var(--hud-color-darker)] text-[var(--hud-color-darker)] hover:text-[var(--hud-color)] hover:border-[var(--hud-color)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                           title="Attach from Project Files"
                           aria-label="Attach from Project Files"
                         >
                           <FolderIcon className="w-5 h-5" />
                         </button>
                         <button
                           onClick={onAttachFileClick}
                           disabled={isChatLoading}
                           className="p-3 border border-[var(--hud-color-darker)] text-[var(--hud-color-darker)] hover:text-[var(--hud-color)] hover:border-[var(--hud-color)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                           title="Attach new file"
                           aria-label="Attach new file"
                         >
                           <PaperclipIcon className="w-5 h-5" />
                         </button>
                      </div>
                    )}
                    {appMode !== 'debug' && chatContext !== 'finalizing' && (
                        <Button onClick={handleSend} isLoading={isChatLoading} disabled={isChatLoading || (!chatInputValue.trim() && attachments.length === 0)}>
                            Send
                        </Button>
                    )}
                    {chatContext === 'finalizing' && (
                        <Button onClick={handleSend} isLoading={isChatLoading} disabled={isChatLoading}>
                            Generate Revision
                        </Button>
                    )}
                    </>
                )}
            </div>
        </div>
    </div>
  );
};