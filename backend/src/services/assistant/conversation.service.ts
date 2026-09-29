import { Conversation, ChatMessage } from "./assistant.types";
import { ApiError } from "../../utils/apiError";

export class ConversationService {
  private static instance: ConversationService;
  private conversations: Map<string, Conversation> = new Map();
  private readonly maxMessagesPerConversation = 20;
  private readonly maxConversationsPerUser = 50;

  private constructor() {}

  public static getInstance(): ConversationService {
    if (!ConversationService.instance) {
      ConversationService.instance = new ConversationService();
    }
    return ConversationService.instance;
  }

  public createConversation(userId: string, stationContext = "MAITRI", title?: string): Conversation {
    const id = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const conversation: Conversation = {
      id,
      userId,
      title: title || `Operations Briefing • ${stationContext}`,
      stationContext,
      messages: [],
      createdAt: now,
      updatedAt: now
    };

    // User limit hygiene
    const userConvs = this.listConversations(userId);
    if (userConvs.length >= this.maxConversationsPerUser) {
      const oldest = userConvs[userConvs.length - 1];
      this.conversations.delete(oldest.id);
    }

    this.conversations.set(id, conversation);
    return conversation;
  }

  public getConversation(id: string, userId: string): Conversation {
    const conversation = this.conversations.get(id);
    if (!conversation) {
      throw ApiError.notFound(`Conversation '${id}' was not found`, "CONVERSATION_NOT_FOUND");
    }

    if (conversation.userId !== userId) {
      throw ApiError.forbidden("Access denied: You do not own this conversation", "FORBIDDEN_CONVERSATION_ACCESS");
    }

    return conversation;
  }

  public listConversations(userId: string): Conversation[] {
    return Array.from(this.conversations.values())
      .filter((c) => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public deleteConversation(id: string, userId: string): boolean {
    const conversation = this.getConversation(id, userId);
    return this.conversations.delete(conversation.id);
  }

  public appendMessage(id: string, userId: string, message: ChatMessage): Conversation {
    const conversation = this.getConversation(id, userId);

    // Auto-title from first user message if title is default
    if (conversation.messages.length === 0 && message.role === "user") {
      conversation.title = message.content.slice(0, 36) + (message.content.length > 36 ? "..." : "");
    }

    conversation.messages.push(message);

    // Keep bounded history (last 20 messages)
    if (conversation.messages.length > this.maxMessagesPerConversation) {
      conversation.messages = conversation.messages.slice(-this.maxMessagesPerConversation);
    }

    conversation.updatedAt = new Date().toISOString();
    return conversation;
  }

  public clearAll(): void {
    this.conversations.clear();
  }
}

export const conversationService = ConversationService.getInstance();
