import React, { useState, useEffect } from 'react';

interface LoadingSpinnerProps {
  size?: string; // e.g., 'w-8 h-8'
  color?: string; // e.g., 'text-[#15fafa]'
  className?: string; // Allow passing additional classes
}

const spinnerChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export const LoadingSpinner = ({ size = 'w-8 h-8', color = 'text-[#15fafa]', className = '' }: LoadingSpinnerProps) => {
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCharIndex(prevIndex => (prevIndex + 1) % spinnerChars.length);
    }, 80);

    return () => clearInterval(intervalId);
  }, []);

  const getFontSizeClass = () => {
    if (size.includes('12')) return 'text-5xl';
    if (size.includes('10')) return 'text-4xl';
    if (size.includes('8')) return 'text-3xl';
    if (size.includes('6')) return 'text-2xl';
    if (size.includes('5')) return 'text-xl';
    return 'text-lg'; // default for smaller sizes
  }

  return (
    <div 
      className={`flex items-center justify-center ${size} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className={`${color} ${getFontSizeClass()} leading-none`}>
        {spinnerChars[charIndex]}
      </span>
    </div>
  );
};