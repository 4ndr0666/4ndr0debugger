import React, { useState, useRef, useEffect } from 'react';

interface EditableTitleProps {
    initialTitle: string;
    onSave: (newTitle: string) => void;
    className?: string;
    inputClassName?: string;
    disabled?: boolean;
}

export const EditableTitle: React.FC<EditableTitleProps> = ({ initialTitle, onSave, className, inputClassName, disabled = false }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(initialTitle);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);
    
    useEffect(() => {
        // Reset local state if the prop changes from outside
        setTitle(initialTitle);
    }, [initialTitle]);

    const handleSave = () => {
        if (title.trim() && title.trim() !== initialTitle) {
            onSave(title.trim());
        } else {
            setTitle(initialTitle); // Revert if empty or unchanged
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        }
        if (e.key === 'Escape') {
            setTitle(initialTitle);
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className={inputClassName || "bg-transparent text-[var(--hud-color)] w-full outline-none border-b border-b-[var(--hud-color-darker)]"}
                disabled={disabled}
            />
        );
    }

    return (
        <span
            onClick={() => !disabled && setIsEditing(true)}
            className={className || "cursor-pointer"}
            title={disabled ? undefined : "Click to rename"}
        >
            {title}
        </span>
    );
};