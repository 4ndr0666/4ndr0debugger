import React, { useState, useRef, useEffect, useCallback } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  label?: string;
  id?: string;
  className?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  'aria-label'?: string;
}

export const Select = ({
  options,
  label,
  id,
  className,
  value,
  onChange,
  disabled = false,
  'aria-label': ariaLabel,
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  
  const selectedOption = options.find(o => o.value === value);

  const toggleOpen = useCallback(() => {
    if (!disabled) {
      setIsOpen(prev => !prev);
    }
  }, [disabled]);

  const handleSelectOption = useCallback((option: SelectOption) => {
    if (!disabled) {
      onChange(option.value);
      setIsOpen(false);
      containerRef.current?.querySelector('button')?.focus();
    }
  }, [disabled, onChange]);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      const currentIndex = options.findIndex(o => o.value === value);
      setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleClickOutside, options, value]);

  useEffect(() => {
    if (isOpen && listRef.current && highlightedIndex >= 0) {
      const optionElement = listRef.current.children[highlightedIndex] as HTMLLIElement;
      if (optionElement) {
        optionElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen, highlightedIndex]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;
    
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          handleSelectOption(options[highlightedIndex]);
        } else {
          setIsOpen(true);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => (prev > 0 ? prev - 1 : options.length - 1));
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => (prev < options.length - 1 ? prev + 1 : 0));
        }
        break;
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        containerRef.current?.querySelector('button')?.focus();
        break;
      case 'Tab':
        if(isOpen) setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className || ''}`} onKeyDown={handleKeyDown}>
      {label && (
        <label
          onClick={toggleOpen}
          id={id ? `${id}-label` : undefined}
          className="block text-sm uppercase tracking-wider text-[var(--hud-color-darker)] mb-1 cursor-pointer"
        >
          {label}
        </label>
      )}
      <button
        type="button"
        id={id}
        className={`
          relative w-full pl-3 pr-10 py-2.5 text-left border border-[var(--hud-color-darker)] bg-black text-[var(--hud-color)] sm:text-sm 
          cursor-pointer transition-all duration-150
          shadow-[0_0_8px_var(--shadow-cyan-light)] 
          hover:border-[var(--bright-cyan)] hover:shadow-[0_0_15px_var(--shadow-cyan-heavy)]
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--bright-cyan)]
          ${disabled ? 'opacity-50 cursor-not-allowed shadow-none' : ''}
        `}
        onClick={toggleOpen}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={label && id ? `${id}-label` : undefined}
        aria-label={!label ? ariaLabel : undefined}
      >
        <span className="block truncate">{selectedOption?.label || 'Select an option'}</span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 transition-transform duration-200 text-[var(--hud-color)] ${isOpen ? 'rotate-180' : ''}`}>
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <ul
          ref={listRef}
          className="absolute z-10 w-full mt-1 bg-black/80 backdrop-blur-md border border-[var(--hud-color)] max-h-60 overflow-auto focus:outline-none text-base sm:text-sm p-1"
          role="listbox"
          aria-activedescendant={id && highlightedIndex >= 0 ? `${id}-option-${highlightedIndex}` : undefined}
          tabIndex={-1}
        >
          {options.map((option, index) => {
            const isHighlighted = highlightedIndex === index;
            return (
              <li
                key={option.value}
                id={id ? `${id}-option-${index}` : undefined}
                className={`cursor-pointer select-none relative p-2 transition-all duration-150 ${
                  isHighlighted ? 'bg-[var(--hud-color)]/20' : 'bg-transparent'
                }`}
                role="option"
                aria-selected={value === option.value}
                onClick={() => handleSelectOption(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span className={`block truncate ${value === option.value ? 'font-semibold text-[var(--primary-text)]' : 'font-normal text-[var(--secondary-text)]'}`}>
                  {option.label}
                </span>
                {value === option.value && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--hud-color)]">
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};