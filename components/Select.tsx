import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  label?: string;
}

export const Select: React.FC<SelectProps> = ({ options, label, id, className, ...props }) => {
  const customArrow = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23a0f0f0'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd' /%3E%3C/svg%3E")`;

  return (
    <div>
      {label && <label htmlFor={id} className="block text-sm font-medium text-[#a0f0f0] mb-1">{label}</label>}
      <div className="relative">
        <select
          id={id}
          className={`block w-full pl-3 pr-10 py-2.5 text-base border-[#58AEAE] bg-[#101827] text-[#e0ffff] focus:outline-none focus:ring-2 focus:ring-[#58AEAE] focus:border-[#58AEAE] sm:text-sm rounded-md shadow-sm appearance-none ${className || ''}`}
          style={{
            backgroundImage: customArrow,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.75rem center',
            backgroundSize: '1.25em 1.25em',
          }}
          {...props}
        >
          {options.map(option => (
            <option key={option.value} value={option.value} className="bg-[#0A0F1A] text-[#e0ffff]">
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};