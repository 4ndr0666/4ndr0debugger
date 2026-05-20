import React from 'react';
import { AppMode } from '../types.ts';
// FIX: Removed import for non-existent 'ShieldIcon'.
import { BugIcon, CodeIcon, CompareIconSvg } from './Icons.tsx';
import { Tooltip } from './Tooltip.tsx';

interface ModeOption {
  value: AppMode;
  label: string;
  Icon: React.FC<{ className?: string }>;
  description: string;
}

const MODES: ModeOption[] = [
  { value: 'debug', label: 'Debug', Icon: BugIcon, description: "Diagnose and fix code based on an error message." },
  { value: 'single', label: 'Single Review', Icon: CodeIcon, description: "Submit a single piece of code for a comprehensive analysis." },
  { value: 'comparison', label: 'Compare', Icon: CompareIconSvg, description: "Compare two codebases to merge and optimize them." },
];

interface SegmentedControlProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  disabled?: boolean;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({ currentMode, onModeChange, disabled }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 animate-fade-in">
      <div className="flex items-center justify-center p-1 bg-black/30 backdrop-blur-md border border-[var(--hud-color-darkest)] space-x-1" role="tablist" aria-label="Application Modes">
        {MODES.map((mode) => {
          const isActive = currentMode === mode.value;
          return (
            <Tooltip key={mode.value} text={mode.description}>
              <button
                id={`tab-${mode.value}`}
                onClick={() => onModeChange(mode.value)}
                disabled={disabled}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-heading uppercase tracking-wider transition-all duration-200 border border-transparent
                  ${isActive
                    ? 'bg-[var(--hud-color)]/10 border-[var(--hud-color-darker)] text-[var(--hud-color)] animate-cyan-pulse'
                    : 'text-[var(--hud-color-darker)] hover:bg-[var(--hud-color)]/5 hover:text-[var(--hud-color)]'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${mode.value}`}
              >
                <mode.Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{mode.label}</span>
              </button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};