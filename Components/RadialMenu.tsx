import React, { useEffect, useMemo, useRef } from 'react';
import { useLoadingStateContext } from '../contexts/SessionContext.tsx';
import { SaveIcon, ImportIcon, BoltIcon, ChatIcon, HistoryIcon, EyeIcon, EyeOffIcon, DocsIcon, FolderIcon, ReportIcon, TargetIcon, SkullIcon, CrosshairsIcon, ToastInfoIcon as InfoIcon } from './Icons.tsx';

interface RadialMenuProps {
    isOpen: boolean;
    onClose: () => void;
    // Actions from HeaderProps
    onImportClick: () => void;
    onExportSession: () => void;
    onShare: () => void;
    onOpenDocsModal: () => void;
    onOpenProjectFilesModal: () => void;
    onToggleVersionHistory: () => void;
    onOpenReportGenerator: () => void;
    onOpenReconModal: () => void;
    onOpenExploitStagerModal: () => void;
    onOpenThreatVectorModal: () => void;
    onOpenHelpModal: () => void;
    isToolsEnabled: boolean;
    onEndChatSession: () => void;
    // State from SessionContext
    isInputPanelVisible: boolean;
    setIsInputPanelVisible: React.Dispatch<React.SetStateAction<boolean>>;
    reviewAvailable: boolean;
    handleStartFollowUp: () => void;
    isChatMode: boolean;
    handleGenerateTests: () => void;
}

type MenuItem = {
    type: 'item';
    label: string;
    description: string;
    icon: React.ReactNode;
    action: () => void;
    disabled?: boolean;
} | {
    type: 'divider';
    label: string;
};

export const RadialMenu: React.FC<RadialMenuProps> = (props) => {
    const { isOpen, onClose, isToolsEnabled } = props;
    const { isLoading, isChatLoading } = useLoadingStateContext();
    const menuRef = useRef<HTMLDivElement>(null);
    const anyLoading = isLoading || isChatLoading;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    const handleAction = (action: () => void) => {
        action();
        onClose();
    };

    const menuItems: MenuItem[] = useMemo(() => [
        { type: 'item', label: props.isInputPanelVisible ? 'Hide Panel' : 'Show Panel', description: 'Toggle visibility of the input panel.', icon: props.isInputPanelVisible ? <EyeOffIcon /> : <EyeIcon />, action: () => props.setIsInputPanelVisible(p => !p) },
        { type: 'divider', label: 'View' },
        { type: 'item', label: 'Threat Vector', description: 'Analyze a URL for potential attack surfaces.', icon: <CrosshairsIcon />, action: props.onOpenThreatVectorModal, disabled: anyLoading },
        { type: 'item', label: 'Live Recon', description: 'Generate a script to capture network traffic on a target page.', icon: <TargetIcon />, action: props.onOpenReconModal, disabled: anyLoading },
        { type: 'item', label: 'Exploit Stager', description: 'Generate payload delivery commands for a known vulnerability.', icon: <SkullIcon />, action: props.onOpenExploitStagerModal, disabled: anyLoading },
        { type: 'item', label: 'Adv. Report', description: 'Generate a bug bounty report from captured recon data.', icon: <ReportIcon />, action: props.onOpenReportGenerator, disabled: anyLoading },
        { type: 'item', label: 'Gen. Tests', description: 'Generate unit tests for the code in the editor.', icon: <BoltIcon />, action: props.handleGenerateTests, disabled: !isToolsEnabled || anyLoading },
        { type: 'item', label: 'Gen. Docs', description: 'Generate documentation for the code in the editor.', icon: <DocsIcon />, action: props.onOpenDocsModal, disabled: !isToolsEnabled || anyLoading },
        ...(!props.isChatMode ? [{ type: 'item', label: 'Follow-up', description: 'Start a chat session about the current review.', icon: <ChatIcon />, action: props.handleStartFollowUp, disabled: !props.reviewAvailable || anyLoading }] : []) as MenuItem[],
        { type: 'divider', label: 'Tools' },
        ...(props.isChatMode ? [{ type: 'item', label: 'End & Save', description: 'End the current chat and save it as a new version.', icon: <SaveIcon />, action: props.onEndChatSession, disabled: anyLoading }] : []) as MenuItem[],
        { type: 'item', label: 'History', description: 'View and manage saved versions.', icon: <HistoryIcon />, action: props.onToggleVersionHistory, disabled: anyLoading },
        { type: 'item', label: 'Project Files', description: 'Manage uploaded files for context.', icon: <FolderIcon />, action: props.onOpenProjectFilesModal, disabled: anyLoading },
        { type: 'item', label: 'Session Mgr.', description: 'Import and load saved sessions.', icon: <ImportIcon />, action: props.onImportClick, disabled: anyLoading },
        { type: 'divider', label: 'Session' },
    ], [props, anyLoading, isToolsEnabled]);

    const radius = Math.min(window.innerWidth, window.innerHeight) / 3.2;
    const totalItems = menuItems.length;

    return (
        <div className={`radial-menu-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="radial-menu-title">
            <div className="radial-menu-container" ref={menuRef} onClick={e => e.stopPropagation()}>
                <button
                    className="radial-menu-center"
                    onClick={() => handleAction(props.onOpenHelpModal)}
                    aria-label="Open Help"
                    title="Open the system manual and doctrines."
                >
                    <InfoIcon className="w-8 h-8" />
                </button>
                {menuItems.map((item, index) => {
                    const angle = (index / totalItems) * 360 - 90; // Start at the top
                    
                    if (item.type === 'item') {
                        const style = {
                            '--angle': `${angle}deg`,
                            '--radius': `${radius}px`,
                            '--index': index,
                        } as React.CSSProperties;

                        return (
                            <div key={index} className="radial-menu-item-wrapper" style={style}>
                                <button
                                    className="radial-menu-item"
                                    onClick={() => handleAction(item.action)}
                                    disabled={item.disabled}
                                    title={item.description}
                                >
                                    <div className="radial-menu-item-icon">{item.icon}</div>
                                    <span className="radial-menu-item-label">{item.label}</span>
                                </button>
                            </div>
                        );
                    } else { // divider
                        const style = {
                            '--angle': `${angle}deg`,
                            '--radius': `${radius * 1.3}px`,
                            '--index': index,
                        } as React.CSSProperties;
                        return (
                             <div key={index} className="radial-menu-item-wrapper" style={style}>
                                <div className="radial-menu-divider">
                                    <span className="radial-menu-divider-label">{item.label}</span>
                                </div>
                            </div>
                        );
                    }
                })}
            </div>
        </div>
    );
};
