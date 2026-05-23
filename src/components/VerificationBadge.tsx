import { Shield, ShieldCheck } from "lucide-react";

interface VerificationBadgeProps {
    tier?: "self_listed" | "agent_verified" | "rentra_verified";
    size?: "sm" | "md";
}

const VerificationBadge = ({ tier, size = "sm" }: VerificationBadgeProps) => {
    const isSmall = size === "sm";

    if (!tier || tier === "self_listed") return (
        <span className={`flex items-center gap-1 ${isSmall ? "text-xs" : "text-sm"} text-muted-foreground`}>
            <Shield className={isSmall ? "h-3 w-3" : "h-4 w-4"} />
            Self Listed
        </span>
    );

    if (tier === "agent_verified") return (
        <span className={`flex items-center gap-1 ${isSmall ? "text-xs" : "text-sm"} text-blue-600 font-medium`}>
            <ShieldCheck className={isSmall ? "h-3 w-3" : "h-4 w-4"} />
            Agent Verified
        </span>
    );

    return (
        <span className={`flex items-center gap-1 ${isSmall ? "text-xs" : "text-sm"} text-green-600 font-medium`}>
            <ShieldCheck className={isSmall ? "h-3 w-3" : "h-4 w-4"} />
            Rentra Verified ✓
        </span>
    );
};

export default VerificationBadge;