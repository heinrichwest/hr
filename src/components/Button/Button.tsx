import React from "react";
import "./button.css";

type Variant = "primary" | "secondary" | "accent" | "ghost" | "danger" | "tertiary";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    fullWidth?: boolean;
    iconOnly?: boolean;
}

export function Button({
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    iconOnly = false,
    className = "",
    disabled,
    children,
    ...rest
}: ButtonProps) {
    const classes = [
        "sc-btn",
        `sc-btn--${variant}`,
        size !== "md" && `sc-btn--${size}`,
        loading && "sc-btn--loading",
        fullWidth && "sc-btn--full",
        iconOnly && "sc-btn--icon",
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <button
            className={classes}
            disabled={disabled || loading}
            {...rest}
        >
            {children}
        </button>
    );
}
