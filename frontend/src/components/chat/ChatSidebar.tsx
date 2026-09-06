"use client";

import { useMemo, useState } from "react";
import {
  MessageSquare,
  MoreHorizontal,
  PanelLeftClose,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import type { Conversation } from "@/types/chat";


type ChatSidebarProps = {
  conversations: Conversation[];

  activeConversationId: number | null;

  onSelectConversation: (
    id: number
  ) => void;

  onNewChat: () => void;

  onRenameConversation: (
    id: number
  ) => void;

  onDeleteConversation: (
    id: number
  ) => void;

  onCloseSidebar: () => void;

  mobile?: boolean;
};



export function ChatSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
  onCloseSidebar,
  mobile = false,
}: ChatSidebarProps) {
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");


  // ==========================================================
  // FILTER CONVERSATIONS
  // ==========================================================

  const filteredConversations =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      if (!query) {
        return conversations;
      }

      return conversations.filter(
        (conversation) =>
          conversation.title
            .toLowerCase()
            .includes(query)
      );
    }, [
      conversations,
      searchQuery,
    ]);


  return (
    <aside
  className={
    mobile
      ? "flex h-full w-full flex-col bg-neutral-950 text-neutral-100"
      : "hidden h-screen w-[280px] shrink-0 border-r bg-neutral-950 text-neutral-100 md:flex md:flex-col"
  }
>

      {/* =====================================================
          LOGO / HEADER
      ====================================================== */}

      <div className="flex h-16 items-center justify-between px-4">

        <div className="flex items-center gap-2">

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black">
            <MessageSquare className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-semibold">
              Local AI
            </p>

            <p className="text-xs text-neutral-500">
              Ollama Assistant
            </p>
          </div>

        </div>


        <Button
  type="button"
  variant="ghost"
  size="icon"
  onClick={onCloseSidebar}
  className="text-neutral-400 hover:bg-neutral-900 hover:text-white"
  aria-label="Close sidebar"
>
  <PanelLeftClose className="h-4 w-4" />
</Button>

      </div>


      {/* =====================================================
          NEW CHAT
      ====================================================== */}

      <div className="px-3">

        <Button
          type="button"
          onClick={onNewChat}
          className="w-full justify-start gap-2 rounded-xl bg-neutral-100 text-neutral-950 hover:bg-white"
        >
          <Plus className="h-4 w-4" />

          New chat
        </Button>

      </div>


      {/* =====================================================
          SEARCH
      ====================================================== */}

      <div className="px-3 pt-3">

        <div className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/70 px-3 py-2">

          <Search className="h-4 w-4 shrink-0 text-neutral-500" />

          <input
            type="text"
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(
                event.target.value
              )
            }
            placeholder="Search chats"
            className="w-full bg-transparent text-sm text-neutral-200 outline-none placeholder:text-neutral-600"
          />

        </div>

      </div>


      {/* =====================================================
          RECENT TITLE
      ====================================================== */}

      <div className="px-4 pb-2 pt-5">

        <p className="text-xs font-medium uppercase tracking-wider text-neutral-600">
          Recent
        </p>

      </div>


      {/* =====================================================
          CONVERSATION LIST
      ====================================================== */}

      <ScrollArea className="flex-1 px-2">

        <div className="space-y-1 pb-4">

          {filteredConversations.map(
            (conversation) => {
              const active =
                conversation.id ===
                activeConversationId;


              return (
                <div
                  key={conversation.id}
                  className={`group flex items-center rounded-xl transition ${
                    active
                      ? "bg-neutral-800 text-white"
                      : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                  }`}
                >

                  {/* SELECT CHAT */}

                  <button
                    type="button"
                    onClick={() =>
                      onSelectConversation(
                        conversation.id
                      )
                    }
                    className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left text-sm"
                  >

                    <MessageSquare className="h-4 w-4 shrink-0" />

                    <span className="flex-1 truncate">
                      {conversation.title}
                    </span>

                  </button>


                  {/* THREE DOT MENU */}

                  <DropdownMenu>

                    <DropdownMenuTrigger
  render={
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={`mr-1 h-8 w-8 shrink-0 text-neutral-400 hover:bg-neutral-700 hover:text-white ${
        active
          ? "opacity-100"
          : "opacity-0 group-hover:opacity-100"
      }`}
      aria-label="Conversation options"
    />
  }
>
  <MoreHorizontal className="h-4 w-4" />
</DropdownMenuTrigger>


                    <DropdownMenuContent
                      align="end"
                      side="right"
                      className="w-40"
                    >

                      <DropdownMenuItem
  onClick={() =>
    onRenameConversation(
      conversation.id
    )
  }
  className="gap-2"
>
  <Pencil className="h-4 w-4" />

  Rename
</DropdownMenuItem>


                      <DropdownMenuItem
  onClick={() =>
    onDeleteConversation(
      conversation.id
    )
  }
  variant="destructive"
  className="gap-2"
>
  <Trash2 className="h-4 w-4" />

  Delete
</DropdownMenuItem>

                    </DropdownMenuContent>

                  </DropdownMenu>

                </div>
              );
            }
          )}


          {/* =================================================
              EMPTY SEARCH RESULT
          ================================================== */}

          {filteredConversations.length ===
            0 && (
            <div className="px-3 py-8 text-center">

              <MessageSquare className="mx-auto mb-3 h-5 w-5 text-neutral-700" />

              <p className="text-sm text-neutral-500">
                {searchQuery
                  ? "No chats found"
                  : "No conversations yet"}
              </p>

            </div>
          )}

        </div>

      </ScrollArea>


      {/* =====================================================
          ACCOUNT
      ====================================================== */}

      <Separator className="bg-neutral-800" />


      <div className="p-3">

        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-neutral-900"
        >

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800 text-sm font-medium">
            N
          </div>


          <div className="min-w-0 flex-1">

            <p className="truncate text-sm font-medium">
              Narayan
            </p>

            <p className="truncate text-xs text-neutral-500">
              Local account
            </p>

          </div>

        </button>

      </div>

    </aside>
  );
}