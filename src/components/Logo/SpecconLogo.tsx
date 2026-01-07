
type Variant = "standard" | "reversed";

export function SpecconLogo({ variant = "standard", alt = "SpecCon" }: { variant?: Variant; alt?: string }) {
    const src = variant === "reversed"
        ? "/assets/brand/SpecCon2.png" // Using same logo for now as only one was provided
        : "/assets/brand/SpecCon2.png";

    return <img src={src} alt={alt} style={{ display: "block", height: 32, width: "auto" }} />;
}
