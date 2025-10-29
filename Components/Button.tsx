import React from 'react';
import { LoadingSpinner } from './LoadingSpinner.tsx';

type ButtonProps = React.ComponentPropsWithoutRef<'button'> & {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
  children: React.ReactNode;
};

export const Button = ({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  className, 
  disabled,
  ...props 
}: ButtonProps) => {
  const baseStyle = `
    px-6 py-2.5 font-semibold text-sm uppercase tracking-wider flex items-center justify-center 
    border transition-all duration-150 transform
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--bright-cyan)]
    disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none
    active:scale-[0.97]
  `.trim().replace(/\s+/g, ' ');
  
  const variantStyles = {
    primary: `
      bg-transparent border-[var(--hud-color)] text-[var(--hud-color)]
      shadow-[0_0_8px_var(--shadow-cyan-light)] 
      hover:bg-[var(--hud-color)]/25 hover:shadow-[0_0_15px_var(--shadow-cyan-heavy)] hover:border-[var(--bright-cyan)] hover:-translate-y-px
      active:bg-[var(--hud-color)]/30 active:brightness-150
      disabled:border-[var(--hud-color-darker)] disabled:text-[var(--hud-color-darker)] disabled:bg-transparent
    `,
    secondary: `
      bg-[var(--hud-color-darkest)] border-[var(--hud-color-darker)] text-[var(--hud-color-darker)]
      shadow-[0_0_5px_rgba(0,0,0,0.5)]
      hover:bg-[var(--hud-color)]/10 hover:border-[var(--hud-color)] hover:text-[var(--hud-color)] hover:shadow-[0_0_12px_var(--shadow-cyan-heavy)] hover:-translate-y-px
      active:bg-[var(--hud-color)]/20 active:brightness-125
      disabled:border-[var(--hud-color-darker)] disabled:text-[var(--hud-color-darker)] disabled:bg-[var(--hud-color-darkest)]
    `,
    danger: `
      bg-transparent border-[var(--red-color)] text-[var(--red-color)]
      shadow-[0_0_8px_var(--red-glow-color)]
      hover:shadow-[0_0_15px_var(--red-glow-color)] hover:bg-[var(--red-color)]/20 hover:-translate-y-px
      active:bg-[var(--red-color)]/30 active:brightness-125
      disabled:border-[var(--red-color)] disabled:opacity-50
    `,
  };

  return (
    <button
      type="button"
      className={`${baseStyle} ${variantStyles[variant]} ${className || ''}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && (
        <LoadingSpinner size="w-5 h-5" color="text-current" className="-ml-1 mr-3" />
      )}
      {children}
    </button>
  );
};
