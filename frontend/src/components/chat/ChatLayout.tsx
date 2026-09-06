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
  deleteConversation,
  getConversations,
  renameConversation,
  streamMessage,
} from "@/lib/api";

import type {
  Conversation,
  Message,
} from "@/types/chat";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";


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

  const [
  renameConversationId,
  setRenameConversationId,
] = useState<number | null>(null);

const [
  renameTitle,
  setRenameTitle,
] = useState("");

const [
  deleteConversationId,
  setDeleteConversationId,
] = useState<number | null>(null);

const [
  isManagingConversation,
  setIsManagingConversation,
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
// OPEN RENAME DIALOG
// ==========================================================

function handleRenameConversation(
  id: number
) {
  if (
    isSending ||
    isManagingConversation
  ) {
    return;
  }

  const conversation =
    conversations.find(
      (item) => item.id === id
    );

  if (!conversation) {
    return;
  }

  setRenameConversationId(id);
  setRenameTitle(
    conversation.title
  );
}


// ==========================================================
// CONFIRM RENAME
// ==========================================================

async function handleConfirmRename() {
  if (
    renameConversationId === null ||
    isManagingConversation
  ) {
    return;
  }

  const trimmedTitle =
    renameTitle.trim();

  if (!trimmedTitle) {
    return;
  }

  const currentConversation =
    conversations.find(
      (item) =>
        item.id ===
        renameConversationId
    );

  if (!currentConversation) {
    return;
  }

  if (
    trimmedTitle ===
    currentConversation.title
  ) {
    setRenameConversationId(null);
    setRenameTitle("");
    return;
  }

  try {
    setIsManagingConversation(true);

    const updatedConversation =
      await renameConversation(
        renameConversationId,
        trimmedTitle
      );

    setConversations(
      (current) =>
        current.map(
          (item) =>
            item.id ===
            updatedConversation.id
              ? updatedConversation
              : item
        )
    );

    setRenameConversationId(null);
    setRenameTitle("");

  } catch (error) {
    console.error(
      "Failed to rename conversation:",
      error
    );

  } finally {
    setIsManagingConversation(false);
  }
}


// ==========================================================
// OPEN DELETE DIALOG
// ==========================================================

function handleDeleteConversation(
  id: number
) {
  if (
    isSending ||
    isManagingConversation
  ) {
    return;
  }

  const conversation =
    conversations.find(
      (item) => item.id === id
    );

  if (!conversation) {
    return;
  }

  setDeleteConversationId(id);
}


// ==========================================================
// CONFIRM DELETE
// ==========================================================

async function handleConfirmDelete() {
  if (
    deleteConversationId === null ||
    isManagingConversation
  ) {
    return;
  }

  const id =
    deleteConversationId;

  try {
    setIsManagingConversation(true);

    await deleteConversation(id);

    const remainingConversations =
      conversations.filter(
        (item) =>
          item.id !== id
      );

    setConversations(
      remainingConversations
    );

    if (
      id === activeConversationId
    ) {
      const nextConversation =
        remainingConversations[0];

      if (nextConversation) {
        setActiveConversationId(
          nextConversation.id
        );

        setMessages(
          nextConversation.messages ??
            []
        );
      } else {
        setActiveConversationId(
          null
        );

        setMessages([]);
      }
    }

    setDeleteConversationId(null);

  } catch (error) {
    console.error(
      "Failed to delete conversation:",
      error
    );

  } finally {
    setIsManagingConversation(false);
  }
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

  const conversationToDelete =
  conversations.find(
    (conversation) =>
      conversation.id ===
      deleteConversationId
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
  onRenameConversation={
    handleRenameConversation
  }
  onDeleteConversation={
    handleDeleteConversation
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

      <Dialog
  open={
    renameConversationId !== null
  }
  onOpenChange={(open) => {
    if (
      !open &&
      !isManagingConversation
    ) {
      setRenameConversationId(null);
      setRenameTitle("");
    }
  }}
>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>
        Rename conversation
      </DialogTitle>

      <DialogDescription>
        Give this conversation a new
        name.
      </DialogDescription>
    </DialogHeader>


    <form
      onSubmit={(event) => {
        event.preventDefault();
        void handleConfirmRename();
      }}
      className="space-y-4"
    >
      <input
        type="text"
        value={renameTitle}
        onChange={(event) =>
          setRenameTitle(
            event.target.value
          )
        }
        autoFocus
        maxLength={100}
        disabled={
          isManagingConversation
        }
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
        placeholder="Conversation title"
      />


      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={
            isManagingConversation
          }
          onClick={() => {
            setRenameConversationId(
              null
            );
            setRenameTitle("");
          }}
        >
          Cancel
        </Button>


        <Button
          type="submit"
          disabled={
            !renameTitle.trim() ||
            isManagingConversation
          }
        >
          {isManagingConversation
            ? "Saving..."
            : "Save"}
        </Button>
      </DialogFooter>

    </form>
  </DialogContent>
</Dialog>
<AlertDialog
  open={
    deleteConversationId !== null
  }
  onOpenChange={(open) => {
    if (
      !open &&
      !isManagingConversation
    ) {
      setDeleteConversationId(
        null
      );
    }
  }}
>
  <AlertDialogContent>

    <AlertDialogHeader>

      <AlertDialogTitle>
        Delete conversation?
      </AlertDialogTitle>


      <AlertDialogDescription>
        This will permanently delete{" "}
        <span className="font-medium text-foreground">
          {conversationToDelete?.title ??
            "this conversation"}
        </span>{" "}
        and all of its messages.
        This action cannot be undone.
      </AlertDialogDescription>

    </AlertDialogHeader>


    <AlertDialogFooter>

      <Button
        type="button"
        variant="outline"
        disabled={
          isManagingConversation
        }
        onClick={() =>
          setDeleteConversationId(
            null
          )
        }
      >
        Cancel
      </Button>


      <Button
        type="button"
        variant="destructive"
        disabled={
          isManagingConversation
        }
        onClick={() =>
          void handleConfirmDelete()
        }
      >
        {isManagingConversation
          ? "Deleting..."
          : "Delete"}
      </Button>

    </AlertDialogFooter>

  </AlertDialogContent>
</AlertDialog>

    </div>
  );
}