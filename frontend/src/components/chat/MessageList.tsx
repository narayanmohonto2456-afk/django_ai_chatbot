import {
  Bot,
  Copy,
  RefreshCcw,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import type { Message } from "@/types/chat";

type MessageListProps = {
  messages: Message[];
};

export function MessageList({
  messages,
}: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="max-w-xl text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border bg-muted/40">
            <Bot className="h-7 w-7" />
          </div>

          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            How can I help you today?
          </h2>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Your private local AI assistant powered by
            Django, Next.js and Ollama.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6">
      <div className="space-y-8">
        {messages.map((message) => {
          const isUser =
            message.role === "user";

          if (isUser) {
            return (
              <div
                key={message.id}
                className="flex justify-end"
              >
                <div className="max-w-[85%] rounded-3xl rounded-br-lg bg-neutral-900 px-4 py-3 text-sm leading-6 text-white dark:bg-neutral-100 dark:text-neutral-950 md:max-w-[75%]">
                  {message.content}
                </div>
              </div>
            );
          }

          return (
            <div
              key={message.id}
              className="group flex gap-4"
            >
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background">
                <Bot className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="whitespace-pre-wrap text-sm leading-7">
                  {message.content}
                </div>

                <div className="mt-2 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <RefreshCcw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}