import { supabase } from "@/lib/supabase";

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: string;
};

export type Conversation = {
  id: string;
  propertyId: string;
  participantOne: string;
  participantTwo: string;
  createdAt: string;
  lastMessageAt: string;
  // Joined fields
  propertyTitle?: string;
  otherParticipantName?: string;
  otherParticipantId?: string;
  lastMessage?: string;
  unreadCount?: number;
};

const mapMessage = (m: Record<string, any>): Message => ({
  id: m.id,
  conversationId: m.conversation_id,
  senderId: m.sender_id,
  content: m.content,
  read: m.read,
  createdAt: m.created_at,
});

export const messagingService = {

  // 🔍 Get or create a conversation between two users about a property
  async getOrCreateConversation(
    propertyId: string,
    participantOne: string,
    participantTwo: string
  ): Promise<Conversation | null> {
    // Check if conversation already exists
    const { data: existing } = await supabase
      .from("conversations")
      .select("*")
      .eq("property_id", propertyId)
      .or(
        `and(participant_one.eq.${participantOne},participant_two.eq.${participantTwo}),and(participant_one.eq.${participantTwo},participant_two.eq.${participantOne})`
      )
      .maybeSingle();

    if (existing) {
      return {
        id: existing.id,
        propertyId: existing.property_id,
        participantOne: existing.participant_one,
        participantTwo: existing.participant_two,
        createdAt: existing.created_at,
        lastMessageAt: existing.last_message_at,
      };
    }

    // Create new conversation
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        property_id: propertyId,
        participant_one: participantOne,
        participant_two: participantTwo,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("getOrCreateConversation error:", error);
      return null;
    }

    return {
      id: data.id,
      propertyId: data.property_id,
      participantOne: data.participant_one,
      participantTwo: data.participant_two,
      createdAt: data.created_at,
      lastMessageAt: data.last_message_at,
    };
  },

  // 📋 Get all conversations for a user with last message and unread count
  async getUserConversations(userId: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from("conversations")
      .select(`
        *,
        properties(title),
        messages(content, read, sender_id, created_at)
      `)
      .or(`participant_one.eq.${userId},participant_two.eq.${userId}`)
      .order("last_message_at", { ascending: false });

    if (error) {
      console.error("getUserConversations error:", error);
      return [];
    }

    // Get other participant names
    const conversations = await Promise.all(
      (data ?? []).map(async (c: any) => {
        const otherParticipantId =
          c.participant_one === userId ? c.participant_two : c.participant_one;

        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", otherParticipantId)
          .maybeSingle();

        const messages = c.messages ?? [];
        const lastMsg = messages.sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        const unreadCount = messages.filter(
          (m: any) => !m.read && m.sender_id !== userId
        ).length;

        return {
          id: c.id,
          propertyId: c.property_id,
          participantOne: c.participant_one,
          participantTwo: c.participant_two,
          createdAt: c.created_at,
          lastMessageAt: c.last_message_at,
          propertyTitle: c.properties?.title ?? "Property",
          otherParticipantName: profile?.name ?? "User",
          otherParticipantId,
          lastMessage: lastMsg?.content ?? "",
          unreadCount,
        };
      })
    );

    return conversations;
  },

  // 💬 Get all messages in a conversation
  async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("getMessages error:", error);
      return [];
    }

    return (data ?? []).map(mapMessage);
  },

  // ✉️ Send a message
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string
  ): Promise<Message | null> {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: content.trim(),
      })
      .select()
      .single();

    if (error || !data) {
      console.error("sendMessage error:", error);
      return null;
    }

    // Update last_message_at on conversation
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);

    return mapMessage(data);
  },

  // ✅ Mark all messages in a conversation as read
  async markAsRead(conversationId: string, userId: string): Promise<void> {
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId)
      .eq("read", false);
  },

  // 🔢 Get total unread count for a user
  async getUnreadCount(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from("conversations")
      .select("id")
      .or(`participant_one.eq.${userId},participant_two.eq.${userId}`);

    if (error || !data) return 0;

    const conversationIds = data.map((c: any) => c.id);
    if (!conversationIds.length) return 0;

    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact" })
      .in("conversation_id", conversationIds)
      .neq("sender_id", userId)
      .eq("read", false);

    return count ?? 0;
  },
};
