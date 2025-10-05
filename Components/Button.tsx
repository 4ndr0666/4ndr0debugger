

import React from 'react';
import { LoadingSpinner } from './LoadingSpinner.tsx';

// Changed to a type alias with an intersection. This correctly merges
// custom props with all standard button attributes, fixing numerous type errors
// where props like `onClick` and `disabled` were not being recognized.
type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
  children: React.ReactNode;
} & React.ComponentPropsWithoutRef<'button'>;

export const Button = ({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  className, 
  disabled, // Destructure disabled prop for direct use.
  ...props 
}: ButtonProps) => {
  const baseStyle = "px-6 py-2.5 font-semibold text-sm uppercase tracking-wider focus:outline-none transition-all duration-150 flex items-center justify-center border";
  
  const variantStyles = {
    primary: "bg-transparent border-[var(--hud-color)] text-[var(--hud-color)] hover:bg-[var(--hud-color)] hover:text-[var(--hud-bg-color)] focus:bg-[var(--hud-color)] focus:text-[var(--hud-bg-color)]",
    secondary: "bg-[var(--hud-color-darkest)] border-[var(--hud-color-darker)] text-[var(--hud-color-darker)] hover:border-[var(--hud-color)] hover:text-[var(--hud-color)] focus:border-[var(--hud-color)] focus:text-[var(--hud-color)]",
    danger: "bg-transparent border-[var(--red-color)] text-[var(--red-color)] hover:bg-[var(--red-color)] hover:text-[var(--hud-bg-color)] focus:bg-[var(--red-color)] focus:text-[var(--hud-bg-color)]",
  };

  const disabledStyles = "opacity-50 cursor-not-allowed border-[var(--hud-color-darker)] text-[var(--hud-color-darker)] hover:bg-transparent hover:text-[var(--hud-color-darker)]";

  return (
    <button
      type="button"
      className={`${baseStyle} ${variantStyles[variant]} ${isLoading || disabled ? disabledStyles : ''} ${className || ''}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && (
        <LoadingSpinner size="w-5 h-5" color={variant === 'primary' ? 'text-[var(--hud-color)]' : 'text-current'} className="-ml-1 mr-3" />
      )}
      {children}
    </button>
  );
};