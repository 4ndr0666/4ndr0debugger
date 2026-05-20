import {
    SaveIcon, ImportIcon, BoltIcon, ChatIcon, HistoryIcon, EyeIcon, EyeOffIcon,
    DocsIcon, FolderIcon, ReportIcon, TargetIcon, PayloadIcon, CrosshairsIcon,
} from './Components/Icons.tsx';
import { ArsenalTool } from './types.ts';

export const TOOL_CATEGORIES = {
    VIEW: 'View',
    TOOLS: 'Tools',
    SESSION: 'Session',
};

export const ARSENAL: ArsenalTool[] = [
    // VIEW
    { id: 'toggle_panel', category: TOOL_CATEGORIES.VIEW, label: 'Toggle Panel', description: 'Toggle visibility of the input panel.', icon: EyeIcon },
    
    // TOOLS
    { id: 'threat_vector', category: TOOL_CATEGORIES.TOOLS, label: 'Threat Vector', description: 'Analyze a URL for potential attack surfaces.', icon: CrosshairsIcon },
    { id: 'live_recon', category: TOOL_CATEGORIES.TOOLS, label: 'Live Recon', description: 'Generate a userscript to capture network traffic.', icon: TargetIcon },
    { id: 'payload_crafting', category: TOOL_CATEGORIES.TOOLS, label: 'Payload Crafting', description: 'Craft custom JS payloads for vulnerability testing.', icon: PayloadIcon },
    { id: 'adv_report', category: TOOL_CATEGORIES.TOOLS, label: 'Adv. Report', description: 'Generate a bug bounty report from captured recon data.', icon: ReportIcon },
    { id: 'gen_tests', category: TOOL_CATEGORIES.TOOLS, label: 'Gen. Tests', description: 'Generate unit tests for the code in the editor.', icon: BoltIcon },
    { id: 'gen_docs', category: TOOL_CATEGORIES.TOOLS, label: 'Gen. Docs', description: 'Generate documentation for the code in the editor.', icon: DocsIcon },
    { id: 'follow_up', category: TOOL_CATEGORIES.TOOLS, label: 'Follow-up', description: 'Start a chat session about the current review.', icon: ChatIcon },

    // SESSION
    { id: 'end_save_chat', category: TOOL_CATEGORIES.SESSION, label: 'End & Save', description: 'End the current chat and save it as a new version.', icon: SaveIcon },
    { id: 'history', category: TOOL_CATEGORIES.SESSION, label: 'History', description: 'View and manage saved versions.', icon: HistoryIcon },
    { id: 'project_files', category: TOOL_CATEGORIES.SESSION, label: 'Project Files', description: 'Manage uploaded files for context.', icon: FolderIcon },
    { id: 'session_mgr', category: TOOL_CATEGORIES.SESSION, label: 'Session Mgr.', description: 'Import and load saved sessions.', icon: ImportIcon },
];
