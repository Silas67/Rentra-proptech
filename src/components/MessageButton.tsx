import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { messagingService } from "@/services/messagingService";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MessageButtonProps {
  propertyId: string;
  landlordId: string;
  agentId?: string;
  agentPhone?: string;
  className?: string;
}

const MessageButton = ({ propertyId, landlordId, agentId, agentPhone, className }: MessageButtonProps) => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const openWhatsApp = (phone: string, message: string) => {
    const cleaned = phone.replace(/\D/g, "");
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${cleaned}?text=${encoded}`, "_blank");
  };

  const handleMessage = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

   
    let recipientId: string;

    if (role === "tenant") {
      recipientId = agentId ?? landlordId;
    } else if (role === "agent") {
      recipientId = landlordId;
    } else {
      // landlord — shouldn't really message from here but handle gracefully
      recipientId = agentId ?? "";
      if (!recipientId) {
        toast({ title: "No agent assigned to this property", variant: "destructive" });
        return;
      }
    }

    if (recipientId === user.id) {
      toast({ title: "You can't message yourself", variant: "destructive" });
      return;
    }

    setLoading(true);

    const conversation = await messagingService.getOrCreateConversation(
      propertyId,
      user.id,
      recipientId
    );

    setLoading(false);

    if (!conversation) {
      toast({ title: "Failed to start conversation", variant: "destructive" });
      return;
    }

    navigate(`/messages?conversation=${conversation.id}`);
  };

  // Don't show for landlords viewing their own property
  if (role === "landlord" && !agentId) return null;

  return (
    <div className="space-y-2">
      {/* In-app message */}
      <Button
        variant="outline"
        className={`w-full flex items-center gap-2 ${className}`}
        onClick={handleMessage}
        disabled={loading}
      >
        {loading
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <MessageSquare className="h-4 w-4" />
        }
        {role === "tenant"
          ? agentId ? "Message Agent" : "Message Landlord"
          : role === "agent" ? "Message Landlord" : "Message Agent"
        }
      </Button>

      {/* WhatsApp button — only shows if agent has a phone number */}
      {agentPhone && (
        <Button
          variant="outline"
          className="w-full flex items-center gap-2 border-green-500 text-green-600 hover:bg-green-50"
          onClick={() => openWhatsApp(
            agentPhone,
            `Hi, I found your property listing on Rentra and I'm interested. Can we talk?`
          )}
        >
          <Phone className="h-4 w-4" />
          WhatsApp Agent
        </Button>
      )}
    </div>
  );
};

export default MessageButton;
