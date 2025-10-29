import React, { useState, useId } from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const id = useId();
  const tooltipId = `tooltip-${id}`;

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {React.cloneElement(children, {
        // FIX: The 'aria-describedby' attribute must be camelCased to 'ariaDescribedby' when passed as a property in a JavaScript object to React.
        ariaDescribedby: isVisible && text ? tooltipId : undefined,
      })}
      {isVisible && text && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`absolute z-50 px-3 py-2 text-xs font-mono text-[var(--hud-color)] bg-black/90 border border-[var(--hud-color-darkest)] whitespace-nowrap animate-fade-in ${positionClasses[position]}`}
        >
          {text}
        </div>
      )}
    </div>
  );
};