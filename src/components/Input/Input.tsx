import React, { useState } from "react";
import "./input.css";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export function Input({
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    className = "",
    id,
    ...rest
}: InputProps) {
    const [focused, setFocused] = useState(false);
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const wrapperClasses = [
        "sc-input-wrapper",
        focused && "sc-input-wrapper--focused",
        error && "sc-input-wrapper--error",
        rest.disabled && "sc-input-wrapper--disabled",
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div className="sc-input-container">
            {label && (
                <label htmlFor={inputId} className="sc-input-label">
                    {label}
                    {rest.required && <span className="sc-input-required">*</span>}
                </label>
            )}
            <div className={wrapperClasses}>
                {leftIcon && <span className="sc-input-icon sc-input-icon--left">{leftIcon}</span>}
                <input
                    id={inputId}
                    className={`sc-input ${leftIcon ? "sc-input--with-left-icon" : ""} ${rightIcon ? "sc-input--with-right-icon" : ""}`}
                    onFocus={(e) => {
                        setFocused(true);
                        rest.onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        setFocused(false);
                        rest.onBlur?.(e);
                    }}
                    {...rest}
                />
                {rightIcon && <span className="sc-input-icon sc-input-icon--right">{rightIcon}</span>}
            </div>
            {(error || hint) && (
                <span className={`sc-input-message ${error ? "sc-input-message--error" : ""}`}>
                    {error || hint}
                </span>
            )}
        </div>
    );
}
