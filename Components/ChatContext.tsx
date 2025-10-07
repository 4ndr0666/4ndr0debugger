


import React from 'react';
import { Feature } from '../types.ts';
import { ChatTableOfContents } from './ChatTableOfContents.tsx';
import { useSessionContext } from '../contexts/SessionContext.tsx';

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

const FeatureDiscussionContext: React.FC<{ feature: Feature }> = ({ feature }) => {
    return (
        <div className="flex flex-col h-full">
            <h2 className="text-xl text-center font-heading flex-shrink-0 mb-4">
                FEATURE CONTEXT
            </h2>
            <div className="overflow-y-auto pr-2 flex-grow flex flex-col gap-3 min-h-0 border border-[var(--hud-color-darkest)] p-3 bg-black/30">
                <div className="flex items-center justify-between w-full">
                    <h3 className="font-heading text-base truncate text-[var(--hud-color)]" title={feature.name}>{feature.name}</h3>
                    <span className={`text-xs font-mono border rounded-full px-2 py-0.5 ${getSourceChipColor(feature.source)}`}>
                        {feature.source}
                    </span>
                </div>
                <p className="text-sm text-[var(--hud-color-darker)]">{feature.description}</p>
            </div>
        </div>
    );
};

const FinalizationContext: React.FC = () => {
    const { finalizationSummary, featureDecisions } = useSessionContext();
    if (!finalizationSummary) return null;

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-xl text-center font-heading flex-shrink-0 mb-4">
                FINALIZATION PLAN
            </h2>
            <div className="overflow-y-auto pr-2 flex-grow flex flex-col gap-4 min-h-0 border border-[var(--hud-color-darkest)] p-3 bg-black/30">
                {finalizationSummary.included.length > 0 && (
                    <div className="animate-fade-in">
                        <h3 className="text-green-400 font-bold uppercase text-sm tracking-wider mb-2">Included Features</h3>
                        <ul className="space-y-2 text-xs text-[var(--hud-color-darker)]">
                            {finalizationSummary.included.map(f => <li key={f.name}><strong className="text-green-300 font-normal">{f.name}</strong>: {f.description}</li>)}
                        </ul>
                    </div>
                )}
                 {finalizationSummary.revised.length > 0 && (
                    <div className="animate-fade-in">
                        <h3 className="text-sky-400 font-bold uppercase text-sm tracking-wider mb-2">Revised Features</h3>
                        <ul className="space-y-2 text-xs text-[var(--hud-color-darker)]">
                            {finalizationSummary.revised.map(f => {
                                const decision = featureDecisions[f.name];
                                const lastUserMessage = decision?.history?.filter(m => m.role === 'user').pop();
                                const summaryText = lastUserMessage
                                    ? `User specified "${lastUserMessage.content.substring(0, 40)}..."`
                                    : 'Discussion context provided to AI.';
                                return (
                                    <li key={f.name}>
                                        <strong className="text-sky-300 font-normal">{f.name}</strong>: {summaryText}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
                {finalizationSummary.removed.length > 0 && (
                     <div className="animate-fade-in">
                        <h3 className="text-red-400 font-bold uppercase text-sm tracking-wider mb-2">Removed Features</h3>
                        <ul className="space-y-2 text-xs text-[var(--hud-color-darker)]">
                            {finalizationSummary.removed.map(f => <li key={f.name}><strong className="text-red-300 font-normal">{f.name}</strong>: {f.description}</li>)}
                        </ul>
                    </div>
                )}
                 {finalizationSummary.included.length === 0 && finalizationSummary.removed.length === 0 && finalizationSummary.revised.length === 0 && (
                    <p className="text-center text-xs text-[var(--hud-color-darker)]">No specific features were marked for inclusion or removal. The AI will perform a general merge.</p>
                 )}
            </div>
        </div>
    );
};

export const ChatContext = () => {
    const { chatContext, activeFeatureForDiscussion } = useSessionContext();

  if (chatContext === 'feature_discussion' && activeFeatureForDiscussion) {
      return <FeatureDiscussionContext feature={activeFeatureForDiscussion} />;
  }

  if (chatContext === 'finalization') {
      return <FinalizationContext />;
  }

  return (
    <div className="flex flex-col h-full">
        <h2 className="text-xl text-center font-heading flex-shrink-0 mb-4">
            Session Table of Contents
        </h2>
        <ChatTableOfContents />
    </div>
  );
};