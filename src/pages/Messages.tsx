import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { messagingService, Conversation, Message } from "@/services/messagingService";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageSquare, Send, Loader2, ArrowLeft,
  Home, ChevronLeft
} from "lucide-react";

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeConvRef = useRef<Conversation | null>(null);

  // Keep ref in sync with state (needed for real-time callback)
  useEffect(() => {
    activeConvRef.current = activeConversation;
  }, [activeConversation]);

  // Fetch conversations
  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoadingConversations(true);
      const data = await messagingService.getUserConversations(user.id);
      setConversations(data);
      setLoadingConversations(false);

      const convId = searchParams.get("conversation");
      if (convId) {
        const conv = data.find((c) => c.id === convId);
        if (conv) openConversation(conv);
      }
    };
    fetch();
  }, [user]);

  // ✅ Real-time subscription for new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const newMsg = payload.new as any;

          // Only handle messages not sent by me
          if (newMsg.sender_id === user.id) return;

          // If the message is in the currently open conversation, add it
          if (activeConvRef.current?.id === newMsg.conversation_id) {
            const mapped = {
              id: newMsg.id,
              conversationId: newMsg.conversation_id,
              senderId: newMsg.sender_id,
              content: newMsg.content,
              read: newMsg.read,
              createdAt: newMsg.created_at,
            };
            setMessages((prev) => [...prev, mapped]);

            // Mark as read immediately since user is looking at it
            await messagingService.markAsRead(newMsg.conversation_id, user.id);
          }

          // Update unread count and last message in conversation list
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== newMsg.conversation_id) return c;
              const isActive = activeConvRef.current?.id === c.id;
              return {
                ...c,
                lastMessage: newMsg.content,
                lastMessageAt: newMsg.created_at,
                unreadCount: isActive ? 0 : (c.unreadCount ?? 0) + 1,
              };
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openConversation = async (conversation: Conversation) => {
    setActiveConversation(conversation);
    setSearchParams({ conversation: conversation.id });
    setLoadingMessages(true);

    const data = await messagingService.getMessages(conversation.id);
    setMessages(data);
    setLoadingMessages(false);

    if (user) {
      await messagingService.markAsRead(conversation.id, user.id);
      setConversations((prev) =>
        prev.map((c) => c.id === conversation.id ? { ...c, unreadCount: 0 } : c)
      );
    }

    inputRef.current?.focus();
  };

  const handleSend = async () => {
    if (!user || !activeConversation || !newMessage.trim()) return;

    setSending(true);
    const message = await messagingService.sendMessage(
      activeConversation.id,
      user.id,
      newMessage.trim()
    );
    setSending(false);

    if (message) {
      setMessages((prev) => [...prev, message]);
      setNewMessage("");
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? { ...c, lastMessage: message.content, lastMessageAt: message.createdAt }
            : c
        )
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBack = () => {
    setActiveConversation(null);
    setMessages([]);
    setSearchParams({});
  };

  // ✅ Go back to the right dashboard based on role
  const handleGoToDashboard = () => {
    const { role } = user as any;
    if (role === "agent") navigate("/agent-dashboard");
    else if (role === "landlord") navigate("/landlord-dashboard");
    else navigate("/tenant-dashboard");
  };

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);

  return (
    <div className="min-h-screen pt-24 pb-6">
      <div className="container">

        {/* Header with back button */}
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleGoToDashboard}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Dashboard
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              Messages
              {totalUnread > 0 && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-bold">
                  {totalUnread}
                </span>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">Your property conversations</p>
          </div>
        </div>

        <div
          className="grid gap-0 overflow-hidden rounded-xl border bg-card shadow-sm lg:grid-cols-3"
          style={{ minHeight: "600px" }}
        >

          {/* Conversation List */}
          <div className={`border-r ${activeConversation ? "hidden lg:block" : "block"}`}>
            <div className="border-b px-4 py-3">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Conversations ({conversations.length})
              </p>
            </div>

            {loadingConversations ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground px-4">
                <MessageSquare className="mb-3 h-10 w-10 opacity-30" />
                <p className="font-medium">No conversations yet</p>
                <p className="text-sm mt-1">Start a conversation from a property listing</p>
              </div>
            ) : (
              <div className="divide-y">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => openConversation(conv)}
                    className={`w-full px-4 py-3 text-left transition-colors hover:bg-muted ${
                      activeConversation?.id === conv.id ? "bg-muted" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {conv.otherParticipantName?.[0]?.toUpperCase() ?? "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm truncate">{conv.otherParticipantName}</p>
                          <p className="text-xs text-muted-foreground shrink-0">
                            {formatTime(conv.lastMessageAt)}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                          <Home className="h-3 w-3 shrink-0" />
                          {conv.propertyTitle}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <p className={`text-xs truncate ${(conv.unreadCount ?? 0) > 0 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                            {conv.lastMessage || "No messages yet"}
                          </p>
                          {(conv.unreadCount ?? 0) > 0 && (
                            <span className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-bold">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chat Thread */}
          <div className={`flex flex-col lg:col-span-2 ${activeConversation ? "flex" : "hidden lg:flex"}`}>
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 border-b px-4 py-3">
                  <button
                    onClick={handleBack}
                    className="lg:hidden text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                    {activeConversation.otherParticipantName?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{activeConversation.otherParticipantName}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Home className="h-3 w-3" />
                      {activeConversation.propertyTitle}
                    </p>
                  </div>
                  {/* ✅ Real-time indicator */}
                  <div className="flex items-center gap-1.5 text-xs text-green-600">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    Live
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: "480px" }}>
                  {loadingMessages ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                      <MessageSquare className="mb-3 h-10 w-10 opacity-30" />
                      <p className="font-medium">No messages yet</p>
                      <p className="text-sm">Send a message to start the conversation</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg) => {
                        const isMe = msg.senderId === user?.id;
                        return (
                          <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                              isMe
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-muted text-foreground rounded-bl-sm"
                            }`}>
                              <p>{msg.content}</p>
                              <p className={`mt-1 text-xs ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                {formatTime(msg.createdAt)}
                                {isMe && <span className="ml-1">{msg.read ? "✓✓" : "✓"}</span>}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Input */}
                <div className="border-t p-3 flex items-center gap-2">
                  <Input
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message... (Enter to send)"
                    disabled={sending}
                    className="flex-1"
                  />
                  <Button size="icon" onClick={handleSend} disabled={sending || !newMessage.trim()}>
                    {sending
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Send className="h-4 w-4" />
                    }
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center text-muted-foreground">
                <MessageSquare className="mb-3 h-14 w-14 opacity-20" />
                <p className="font-medium">Select a conversation</p>
                <p className="text-sm mt-1">Choose a conversation from the left to start messaging now.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;