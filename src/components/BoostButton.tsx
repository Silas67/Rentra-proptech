import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { boostService, BOOST_AMOUNT, BOOST_DAYS } from "@/services/boostService";
import { Button } from "@/components/ui/button";
import { Zap, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";

// Paystack inline type
declare const PaystackPop: {
    setup: (config: {
        key: string;
        email: string;
        amount: number;
        currency: string;
        ref: string;
        onSuccess: (transaction: { reference: string }) => void;
        onCancel: () => void;
    }) => { openIframe: () => void };
};

interface BoostButtonProps {
    propertyId: string;
    isBoosted?: boolean;
    onBoosted?: () => void;
    size?: "sm" | "default";
}

const BoostButton = ({ propertyId, isBoosted = false, onBoosted, size = "sm" }: BoostButtonProps) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleBoost = () => {
        if (!user?.email) return;
        setLoading(true);

        const handler = PaystackPop.setup({
            key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
            email: user.email,
            amount: BOOST_AMOUNT * 100, // kobo
            currency: "NGN",
            ref: `rentra_boost_${Date.now()}`,
            onSuccess: async (transaction) => {
                const success = await boostService.createBoost({
                    propertyId,
                    agentId: user.id,
                    paystackReference: transaction.reference,
                });

                setLoading(false);

                if (success) {
                    toast.success(`Listing boosted for ${BOOST_DAYS} days! 🚀`);
                    onBoosted?.();
                } else {
                    toast.error("Payment received but boost failed. Contact support.");
                }
            },
            onCancel: () => {
                setLoading(false);
                toast.error("Boost cancelled");
            },
        });

        handler.openIframe();
    };

    if (isBoosted) return (
        <span className="flex items-center gap-1 rounded-full bg-yellow-50 border border-yellow-200 px-2 py-1 text-xs font-medium text-yellow-600">
            <Zap className="h-3 w-3" /> Boosted
        </span>
    );

    return (
        <Button
            size={size}
            variant="outline"
            onClick={handleBoost}
            disabled={loading}
            className="flex items-center gap-1.5 border-yellow-300 text-yellow-600 hover:bg-yellow-50"
        >
            {loading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Zap className="h-3.5 w-3.5" />
            }
            Boost ₦{BOOST_AMOUNT.toLocaleString()}
        </Button>
    );
};

export default BoostButton;