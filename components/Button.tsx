
import React from 'react';
import { LoadingSpinner } from './LoadingSpinner'; // Assuming LoadingSpinner might be used here

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  className, 
  ...props 
}) => {
  const baseStyle = "px-6 py-2.5 rounded-md font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 flex items-center justify-center";
  
  const variantStyles = {
    primary: "bg-[#101827] text-[#e0ffff] border border-[#15adad]/60 shadow-xl shadow-[#156464]/30 hover:border-[#15fafa]/80 hover:shadow-lg hover:shadow-[#15fafa]/50 focus:ring-[#15adad] focus:ring-offset-[#0A0F1A] animate-pulse-glow",
    secondary: "bg-[#157d7d] hover:bg-[#159a9a] text-[#e0ffff] focus:ring-[#157d7d] focus:ring-offset-[#0A0F1A] shadow-[#157d7d]/30 hover:shadow-lg hover:shadow-[#157d7d]/50",
  };

  const disabledStyles = "opacity-60 cursor-not-allowed";

  return (
    <button
      type="button"
      className={`${baseStyle} ${variantStyles[variant]} ${isLoading || props.disabled ? disabledStyles : ''} ${className || ''}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <LoadingSpinner size="w-5 h-5" color={variant === 'primary' ? 'text-[#e0ffff]' : 'text-[#e0ffff]'} className="-ml-1 mr-3" />
      )}
      {children}
    </button>
  );
};
