import React, { useEffect, useState } from 'react';
import { Toast } from '../types.ts';
import { ToastErrorIcon, ToastInfoIcon, ToastSuccessIcon } from './Icons.tsx';

interface ToastProps {
  toast: Toast;
  onDismiss: (id: number) => void;
}

const toastConfig = {
  success: {
    Icon: ToastSuccessIcon,
    iconClass: 'text-green-400',
  },
  error: {
    Icon: ToastErrorIcon,
    iconClass: 'text-[var(--red-color)]',
  },
  info: {
    Icon: ToastInfoIcon,
    iconClass: 'text-[var(--hud-color)]',
  },
};

export const ToastComponent: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const [isShown, setIsShown] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Animate in on mount
  useEffect(() => {
    const enterTimeout = setTimeout(() => setIsShown(true), 10); // small delay to trigger transition
    return () => clearTimeout(enterTimeout);
  }, []);

  // Animate out after a delay
  useEffect(() => {
    const exitTimeout = setTimeout(() => {
      handleDismiss();
    }, 2000); // 2 seconds visible

    return () => clearTimeout(exitTimeout);
  }, [toast.id, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true); // Mark that we are using the exit animation
    setIsShown(false); // Trigger the transition
    setTimeout(() => onDismiss(toast.id), 300); // Remove from DOM after animation
  };
  
  const { Icon, iconClass } = toastConfig[toast.type];

  let animationClasses = '';
  if (!isShown && !isExiting) {
    // Initial state before entering (slide in from right)
    animationClasses = 'opacity-0 translate-x-full';
  } else if (isShown && !isExiting) {
    // Entered state
    animationClasses = 'opacity-100 translate-x-0';
  } else if (!isShown && isExiting) {
    // Exiting state (zap out)
    animationClasses = 'opacity-0 scale-x-0 transform-origin-right';
  }


  return (
    <div
      className={`relative w-full max-w-sm bg-[rgba(0,30,30,0.3)] backdrop-blur-md border border-[var(--hud-color-darkest)] transition-all duration-300 font-mono transform-gpu ${animationClasses}`}
      role="alert"
    >
      <div className="hud-corner corner-top-left"></div>
      <div className="hud-corner corner-top-right"></div>
      <div className="hud-corner corner-bottom-left"></div>
      <div className="hud-corner corner-bottom-right"></div>

      <div className="p-3 flex items-center space-x-4">
        <div className="flex-shrink-0">
          <Icon className={`w-6 h-6 ${iconClass}`} />
        </div>
        <div className="flex-grow text-sm text-[var(--hud-color)] uppercase tracking-wider">{toast.message}</div>
        <div className="flex-shrink-0">
          <button
            onClick={handleDismiss}
            className="p-1 -m-1 rounded-full text-[var(--hud-color-darker)] hover:text-white hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-white"
            aria-label="Dismiss"
          >
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};