import React, { useState } from 'react';
import { ChevronDownIcon } from './Icons.tsx';

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-[var(--hud-color-darkest)] bg-black/30">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-3 text-left text-lg text-[var(--hud-color)] hover:bg-[var(--hud-color)]/10 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-heading text-base">{title}</span>
        <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="p-3 border-t border-[var(--hud-color-darkest)] animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
};