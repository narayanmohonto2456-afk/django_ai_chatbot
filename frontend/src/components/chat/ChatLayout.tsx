"use client";

import {
  useEffect,
  useState,
} from "react";

import { ChatComposer } from "./ChatComposer";
import { ChatHeader } from "./ChatHeader";
import { ChatSidebar } from "./ChatSidebar";
import { MessageList } from "./MessageList";

import {
  createConversation,
  getConversations,
  sendMessage,
} from "@/lib/api";

import type {
  Conversation,
  Message,
} from "@/types/chat";

export function ChatLayout() {
  const [
    conversations,
    setConversations,
  ] = useState<Conversation[]>([]);

  const [
    activeConversationId,
    setActiveConversationId,
  ] = useState<number | null>(null);

  const [
  messages,
  setMessages,
] = useState<Message[]>([]);

  const [
  isSending,
  setIsSending,
] = useState(false);

  // ==========================================
  // LOAD CONVERSATIONS FROM DJANGO
  // ==========================================

  useEffect(() => {
    async function loadConversations() {
      try {
        const data =
          await getConversations();

        console.log(
          "Django conversations:",
          data
        );

        setConversations(data);

if (data.length > 0) {
  const firstConversation =
    data[0];

  setActiveConversationId(
    firstConversation.id
  );

  setMessages(
    firstConversation.messages ?? []
  );
}
      } catch (error) {
        console.error(
          "Failed to load conversations:",
          error
        );
      }
    }

    loadConversations();
  }, []);

  // ==========================================
  // NEW CHAT
  // ==========================================

  async function handleNewChat() {
  try {
    const conversation =
      await createConversation();

    console.log(
      "Conversation created:",
      conversation
    );

    setConversations(
      (current) => [
        conversation,
        ...current,
      ]
    );

    setActiveConversationId(
      conversation.id
    );

    setMessages(
      conversation.messages ?? []
    );
  } catch (error) {
    console.error(
      "Failed to create conversation:",
      error
    );
  }
}

  // ==========================================
  // SELECT CHAT
  // ==========================================

  function handleSelectConversation(
  id: number
) {
  setActiveConversationId(id);

  const conversation =
    conversations.find(
      (conversation) =>
        conversation.id === id
    );

  setMessages(
    conversation?.messages ?? []
  );
}

  // ==========================================
  // SEND MESSAGE
  // ==========================================

  async function handleSendMessage(
  content: string
) {
  if (
    !activeConversationId ||
    isSending
  ) {
    return;
  }

  try {
    setIsSending(true);

    const response =
      await sendMessage(
        activeConversationId,
        content
      );

    console.log(
      "Django AI response:",
      response
    );

    setMessages(
      response.conversation.messages ??
        [
          response.user_message,
          response.assistant_message,
        ]
    );

    setConversations(
      (current) =>
        current.map(
          (conversation) =>
            conversation.id ===
            response.conversation.id
              ? response.conversation
              : conversation
        )
    );
  } catch (error) {
    console.error(
      "Failed to send message:",
      error
    );
  } finally {
    setIsSending(false);
  }
}


  // ==========================================
  // ACTIVE CONVERSATION
  // ==========================================

  const activeConversation =
    conversations.find(
      (conversation) =>
        conversation.id ===
        activeConversationId
    );

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <ChatSidebar
        conversations={conversations}
        activeConversationId={
          activeConversationId
        }
        onSelectConversation={
          handleSelectConversation
        }
        onNewChat={handleNewChat}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <ChatHeader
          title={
            activeConversation?.title ??
            "New Chat"
          }
        />

        <div className="min-h-0 flex-1 overflow-y-auto">
          <MessageList
            messages={messages}
          />
        </div>

        <ChatComposer
  onSendMessage={
    handleSendMessage
  }
  isSending={isSending}
/>
      </main>
    </div>
  );
}