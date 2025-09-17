// File: /src/components/ui/Badge.js
export default function Badge({ children, className = "", tone = "neutral", variant = "solid", ...rest }) {
    const tones = {
        neutral: {
            solid: "bg-zinc-900 text-white",
            soft: "bg-zinc-100 text-zinc-800",
            outline: "border border-zinc-300 text-zinc-700",
        },
        wine: {
            solid: "bg-[#4e0a26] text-white",
            soft: "bg-[#4e0a26]/10 text-[#4e0a26]",
            outline: "border border-[#4e0a26] text-[#4e0a26]",
        },
    };
    const styles = tones[tone]?.[variant] ?? tones.neutral.solid;
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${styles} ${className}`} {...rest}>
            {children}
        </span>
    );
}ß