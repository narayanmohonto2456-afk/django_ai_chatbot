"use client";

import {
  MessageSquare,
  MoreHorizontal,
  PanelLeftClose,
  Plus,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import type { Conversation } from "@/types/chat";

type ChatSidebarProps = {
  conversations: Conversation[];
  activeConversationId: number | null;
  onSelectConversation: (id: number) => void;
  onNewChat: () => void;
};

export function ChatSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
}: ChatSidebarProps) {
  return (
    <aside className="hidden h-screen w-[280px] shrink-0 border-r bg-neutral-950 text-neutral-100 md:flex md:flex-col">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black">
            <MessageSquare className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-semibold">Local AI</p>
            <p className="text-xs text-neutral-500">Ollama Assistant</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-neutral-400 hover:bg-neutral-900 hover:text-white"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      <div className="px-3">
        <Button
          onClick={onNewChat}
          className="w-full justify-start gap-2 rounded-xl bg-neutral-100 text-neutral-950 hover:bg-white"
        >
          <Plus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      <div className="px-3 pt-3">
        <div className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/70 px-3 py-2">
          <Search className="h-4 w-4 text-neutral-500" />

          <input
            placeholder="Search chats"
            className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-600"
          />
        </div>
      </div>

      <div className="px-4 pb-2 pt-5">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-600">
          Recent
        </p>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 pb-4">
          {conversations.map((conversation) => {
            const active =
              conversation.id === activeConversationId;

            return (
              <button
                key={conversation.id}
                onClick={() =>
                  onSelectConversation(conversation.id)
                }
                className={`group flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  active
                    ? "bg-neutral-800 text-white"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                }`}
              >
                <MessageSquare className="h-4 w-4 shrink-0" />

                <span className="flex-1 truncate">
                  {conversation.title}
                </span>

                <MoreHorizontal className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
              </button>
            );
          })}
        </div>
      </ScrollArea>

      <Separator className="bg-neutral-800" />

      <div className="p-3">
        <button className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-neutral-900">
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