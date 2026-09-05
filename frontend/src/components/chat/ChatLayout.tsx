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
  streamMessage,
} from "@/lib/api";

import type {
  Conversation,
  Message,
} from "@/types/chat";


export function ChatLayout() {
  // ==========================================================
  // STATE
  // ==========================================================

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


  // ==========================================================
  // LOAD CONVERSATIONS FROM DJANGO
  // ==========================================================

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
            firstConversation.messages ??
              []
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


  // ==========================================================
  // CREATE NEW CHAT
  // ==========================================================

  async function handleNewChat() {
    if (isSending) {
      return;
    }

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
        conversation.messages ??
          []
      );

    } catch (error) {
      console.error(
        "Failed to create conversation:",
        error
      );
    }
  }


  // ==========================================================
  // SELECT CONVERSATION
  // ==========================================================

  function handleSelectConversation(
    id: number
  ) {
    if (isSending) {
      return;
    }

    setActiveConversationId(id);

    const conversation =
      conversations.find(
        (item) =>
          item.id === id
      );

    setMessages(
      conversation?.messages ??
        []
    );
  }


  // ==========================================================
  // SEND MESSAGE WITH STREAMING
  // ==========================================================

  async function handleSendMessage(
    content: string
  ) {
    if (
      !activeConversationId ||
      isSending
    ) {
      return;
    }

    // Temporary IDs are negative so they cannot
    // collide with Django database IDs.

    const tempUserId =
      -Date.now();

    const tempAssistantId =
      tempUserId - 1;


    const temporaryUserMessage: Message = {
      id: tempUserId,
      role: "user",
      content,
    };


    const temporaryAssistantMessage: Message = {
      id: tempAssistantId,
      role: "assistant",
      content: "",
    };


    // Show the user's message immediately
    // and create an empty AI message
    // where streamed tokens will appear.

    setMessages(
      (current) => [
        ...current,
        temporaryUserMessage,
        temporaryAssistantMessage,
      ]
    );


    try {
      setIsSending(true);


      await streamMessage(
        activeConversationId,
        content,
        {
          // ==================================================
          // STREAM START
          // ==================================================

          onStart: (
            conversation,
            userMessage
          ) => {
            console.log(
              "Streaming started:",
              conversation
            );


            // Replace temporary user message
            // with the real database message.

            setMessages(
              (current) =>
                current.map(
                  (message) =>
                    message.id ===
                    tempUserId
                      ? userMessage
                      : message
                )
            );


            // Update conversation title.
            // Django may change "New Chat"
            // to the first user message.

            setConversations(
              (current) =>
                current.map(
                  (item) =>
                    item.id ===
                    conversation.id
                      ? {
                          ...item,
                          title:
                            conversation.title,
                        }
                      : item
                )
            );
          },


          // ==================================================
          // TOKEN RECEIVED FROM OLLAMA
          // ==================================================

          onToken: (
            token
          ) => {
            setMessages(
              (current) =>
                current.map(
                  (message) =>
                    message.id ===
                    tempAssistantId
                      ? {
                          ...message,

                          content:
                            message.content +
                            token,
                        }
                      : message
                )
            );
          },


          // ==================================================
          // STREAM COMPLETE
          // ==================================================

          onDone: (
            response
          ) => {
            console.log(
              "Streaming complete:",
              response
            );


            // If serializer returned full message history,
            // use the authoritative Django data.

            if (
              response.conversation
                .messages
            ) {
              setMessages(
                response.conversation
                  .messages
              );
            } else {
              // Otherwise replace the temporary AI message
              // with the saved database message.

              setMessages(
                (current) =>
                  current.map(
                    (message) =>
                      message.id ===
                      tempAssistantId
                        ? response
                            .assistant_message
                        : message
                  )
              );
            }


            // Update sidebar conversation data.

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
          },


          // ==================================================
          // STREAM ERROR
          // ==================================================

          onError: (
            errorMessage
          ) => {
            console.error(
              "Ollama streaming error:",
              errorMessage
            );
          },
        }
      );

    } catch (error) {
      console.error(
        "Streaming failed:",
        error
      );


      // Replace empty AI message
      // with a visible error.

      setMessages(
        (current) =>
          current.map(
            (message) =>
              message.id ===
              tempAssistantId
                ? {
                    ...message,

                    content:
                      "Something went wrong while generating the response.",
                  }
                : message
          )
      );

    } finally {
      setIsSending(false);
    }
  }


  // ==========================================================
  // ACTIVE CONVERSATION
  // ==========================================================

  const activeConversation =
    conversations.find(
      (conversation) =>
        conversation.id ===
        activeConversationId
    );


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="flex h-dvh overflow-hidden bg-background">

      <ChatSidebar
        conversations={
          conversations
        }
        activeConversationId={
          activeConversationId
        }
        onSelectConversation={
          handleSelectConversation
        }
        onNewChat={
          handleNewChat
        }
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
            messages={
              messages
            }
          />
        </div>


        <ChatComposer
          onSendMessage={
            handleSendMessage
          }
          isSending={
            isSending
          }
        />

      </main>

    </div>
  );
}