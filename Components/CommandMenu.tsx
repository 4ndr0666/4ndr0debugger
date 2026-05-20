import React, { useEffect, useMemo, useRef } from 'react';
import { useLoadingStateContext } from '../contexts/SessionContext.tsx';
import { EyeIcon, EyeOffIcon, ToastInfoIcon as InfoIcon } from './Icons.tsx';
import { ARSENAL, TOOL_CATEGORIES } from '../arsenal.ts';

interface CommandMenuProps {
    isOpen: boolean;
    onClose: () => void;
    // Actions from HeaderProps
    onImportClick: () => void;
    onOpenDocsModal: () => void;
    onOpenProjectFilesModal: () => void;
    onToggleVersionHistory: () => void;
    onOpenReportGenerator: () => void;
    onOpenReconModal: () => void;
    onOpenPayloadCraftingModal: () => void;
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

export const CommandMenu: React.FC<CommandMenuProps> = (props) => {
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

    const handleClickOutside = (e: React.MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    const handleAction = (action: () => void) => {
        action();
        onClose();
    };

    const menuItems: MenuItem[] = useMemo(() => {
        const actionMap: Record<string, () => void> = {
            'toggle_panel': () => props.setIsInputPanelVisible(p => !p),
            'threat_vector': props.onOpenThreatVectorModal,
            'live_recon': props.onOpenReconModal,
            'payload_crafting': props.onOpenPayloadCraftingModal,
            'adv_report': props.onOpenReportGenerator,
            'gen_tests': props.handleGenerateTests,
            'gen_docs': props.onOpenDocsModal,
            'follow_up': props.handleStartFollowUp,
            'end_save_chat': props.onEndChatSession,
            'history': props.onToggleVersionHistory,
            'project_files': props.onOpenProjectFilesModal,
            'session_mgr': props.onImportClick,
        };

        const generatedItems: (MenuItem | null)[] = [];
        const categories = [TOOL_CATEGORIES.VIEW, TOOL_CATEGORIES.TOOLS, TOOL_CATEGORIES.SESSION];
        
        categories.forEach(categoryName => {
            const categoryTools = ARSENAL.filter(tool => tool.category === categoryName)
                .filter(tool => { // Pre-filter conditional tools
                    if (tool.id === 'follow_up' && (props.isChatMode || !props.reviewAvailable)) return false;
                    if (tool.id === 'end_save_chat' && !props.isChatMode) return false;
                    return true;
                });

            if (categoryTools.length > 0) {
                generatedItems.push({ type: 'divider', label: categoryName });
                categoryTools.forEach(tool => {
                    let label = tool.label;
                    let icon = <tool.icon className="w-5 h-5" />;
                    if (tool.id === 'toggle_panel') {
                        label = props.isInputPanelVisible ? 'Hide Panel' : 'Show Panel';
                        icon = props.isInputPanelVisible ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />;
                    }

                    generatedItems.push({
                        type: 'item',
                        label: label,
                        description: tool.description,
                        icon: icon,
                        action: actionMap[tool.id],
                        disabled: anyLoading || ( (tool.id === 'gen_tests' || tool.id === 'gen_docs') ? !isToolsEnabled : false),
                    });
                });
            }
        });

        return generatedItems.filter((item): item is MenuItem => item !== null);

    }, [props, anyLoading, isToolsEnabled]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-start" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
            <div 
                ref={menuRef}
                className="relative top-16 left-4 w-72 bg-black/90 border border-[var(--hud-color-darker)] shadow-[0_0_20px_rgba(0,20,20,0.5)] animate-fade-in flex flex-col max-h-[calc(100vh-5rem)] overflow-hidden"
            >
                <div className="hud-corner corner-top-left"></div>
                <div className="hud-corner corner-top-right"></div>
                <div className="hud-corner corner-bottom-left"></div>
                <div className="hud-corner corner-bottom-right"></div>

                <div className="p-4 border-b border-[var(--hud-color-darkest)] flex justify-between items-center bg-[var(--hud-color)]/5">
                    <h3 className="font-heading text-lg text-[var(--hud-color)] tracking-wider">Command Palette</h3>
                    <button
                        onClick={() => handleAction(props.onOpenHelpModal)}
                        className="text-[var(--hud-color-darker)] hover:text-[var(--hud-color)] transition-colors"
                        title="System Help"
                    >
                        <InfoIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto p-2 space-y-1">
                    {menuItems.map((item, index) => {
                        if (item.type === 'divider') {
                            return (
                                <div key={index} className="px-2 py-1 mt-2 mb-1 text-xs font-mono font-bold text-[var(--hud-color-darkest)] uppercase tracking-widest border-b border-[var(--hud-color-darkest)]/50">
                                    {item.label}
                                </div>
                            );
                        }
                        return (
                            <button
                                key={index}
                                onClick={() => handleAction(item.action)}
                                disabled={item.disabled}
                                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[var(--hud-color)]/10 disabled:opacity-50 disabled:cursor-not-allowed group transition-colors duration-150"
                                title={item.description}
                            >
                                <span className="text-[var(--hud-color-darker)] group-hover:text-[var(--hud-color)] transition-colors">
                                    {item.icon}
                                </span>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-[var(--hud-color)] group-hover:text-[var(--bright-cyan)] tracking-wide font-heading">
                                        {item.label}
                                    </span>
                                    <span className="text-[10px] text-[var(--hud-color-darker)] uppercase tracking-wider truncate max-w-[180px]">
                                        {item.description}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};