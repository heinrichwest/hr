
type Variant = "standard" | "reversed";

interface SpecconLogoProps {
    variant?: Variant;
    alt?: string;
    className?: string;
}

export function SpecconLogo({ variant = "standard", alt = "SpecCon", className }: SpecconLogoProps) {
    const src = variant === "reversed"
        ? "/assets/brand/SpecCon2.png" // Using same logo for now as only one was provided
        : "/assets/brand/SpecCon2.png";

    return <img src={src} alt={alt} className={className} style={{ display: "block", height: className ? undefined : 32, width: "auto" }} />;
}
