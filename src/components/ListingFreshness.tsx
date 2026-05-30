import { Clock, AlertCircle, CheckCircle2 } from "lucide-react";

interface ListingFreshnessProps {
    lastVerifiedAt?: string;
    createdAt: string;
    size?: "sm" | "md";
}

const ListingFreshness = ({ lastVerifiedAt, createdAt, size = "sm" }: ListingFreshnessProps) => {
    const date = lastVerifiedAt ?? createdAt;
    const daysSince = Math.floor(
        (new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
    );

    const formatted = new Date(date).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

    const isStale = daysSince > 30;
    const isRecent = daysSince <= 7;

    if (isStale) return (
        <span className={`flex items-center gap-1 ${size === "sm" ? "text-xs" : "text-sm"} text-yellow-600`}>
            <AlertCircle className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
            Listed {daysSince} days ago — verify availability
        </span>
    );

    if (isRecent) return (
        <span className={`flex items-center gap-1 ${size === "sm" ? "text-xs" : "text-sm"} text-green-600`}>
            <CheckCircle2 className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
            Recently listed — {formatted}
        </span>
    );

    return (
        <span className={`flex items-center gap-1 ${size === "sm" ? "text-xs" : "text-sm"} text-muted-foreground`}>
            <Clock className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
            Listed {formatted}
        </span>
    );
};

export default ListingFreshness;