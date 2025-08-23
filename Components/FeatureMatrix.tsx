


import React from 'react';
import { Feature, FeatureDecision, FeatureDecisionRecord } from '../types.ts';
import { AccordionItem } from './AccordionItem.tsx';

interface FeatureMatrixProps {
  features: Feature[];
  decisions: Record<string, FeatureDecisionRecord>;
  onDecision: (feature: Feature, decision: FeatureDecision) => void;
}

const getSourceChipColor = (source: Feature['source']) => {
  switch (source) {
    case 'Unique to A':
      return 'border-sky-400 text-sky-400';
    case 'Unique to B':
      return 'border-purple-400 text-purple-400';
    case 'Common':
      return 'border-green-400 text-green-400';
    default:
      return 'border-[var(--hud-color-darker)] text-[var(--hud-color-darker)]';
  }
};

const ActionButton: React.FC<{ onClick: () => void; children: React.ReactNode; }> = ({ onClick, children }) => (
    <button
        onClick={onClick}
        className="px-2 py-1 font-mono text-xs uppercase tracking-wider border border-[var(--hud-color-darkest)] text-[var(--hud-color-darker)] transition-all duration-150 hover:border-[var(--hud-color)] hover:text-[var(--hud-color)] hover:bg-[var(--hud-color)]/10"
    >
        {children}
    </button>
);

const DecisionBadge: React.FC<{ decision: FeatureDecision }> = ({ decision }) => {
    const styles = {
        include: 'text-green-400 border-green-400/50',
        remove: 'text-red-400 border-red-400/50',
        discussed: 'text-sky-400 border-sky-400/50',
    };
    const text = {
        include: 'Marked for Inclusion ✔️',
        remove: 'Marked for Removal ❌',
        discussed: 'Discussion Complete 💬',
    };

    return (
        <div className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider border ${styles[decision]} bg-black/30 animate-fade-in`}>
            {text[decision]}
        </div>
    );
};

export const FeatureMatrix: React.FC<FeatureMatrixProps> = ({ features, decisions, onDecision }) => {
  if (!features || features.length === 0) {
    return (
      <div className="p-4 text-center text-[var(--hud-color-darker)]">
        <p>No features were identified in the comparison.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {features.map((feature, index) => {
        const decisionRecord = decisions[feature.name];
        const decision = decisionRecord?.decision;
        
        return (
        <AccordionItem
          key={index}
          title={
            <div className="flex items-center justify-between w-full pr-2">
              <span className="font-heading text-base truncate" title={feature.name}>{feature.name}</span>
              <span className={`text-xs font-mono border rounded-full px-2 py-0.5 ${getSourceChipColor(feature.source)}`}>
                {feature.source}
              </span>
            </div>
          }
          defaultOpen={false}
        >
          <div className="space-y-3">
            <p className="text-sm text-[var(--hud-color-darker)]">{feature.description}</p>
            <div className="flex items-center space-x-2 pt-2 border-t border-[var(--hud-color-darkest)]">
                {decision ? (
                    <DecisionBadge decision={decision} />
                ) : (
                    <>
                        <ActionButton onClick={() => onDecision(feature, 'include')}>Include</ActionButton>
                        <ActionButton onClick={() => onDecision(feature, 'remove')}>Remove</ActionButton>
                        <ActionButton onClick={() => onDecision(feature, 'discussed')}>Discuss</ActionButton>
                    </>
                )}
            </div>
          </div>
        </AccordionItem>
      )})}
    </div>
  );
};
