
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="py-6 px-4 sm:px-6 lg:px-8 bg-[#101827] shadow-[0_4px_15px_rgba(21,250,250,0.2)] border-b-2 border-[#15fafa]">
      <div className="max-w-7xl mx-auto flex items-center justify-center space-x-3">
        <svg 
          className="w-10 h-10 text-[#15fafa]" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9.172 9.172a4 4 0 015.656 0"></path>
        </svg>
        <h1 className="text-3xl font-bold">
           <span style={{
            background: 'linear-gradient(to right, #15fafa, #15adad, #157d7d)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}>
            4ndr0⫌ebugger
          </span>
        </h1>
      </div>
    </header>
  );
};