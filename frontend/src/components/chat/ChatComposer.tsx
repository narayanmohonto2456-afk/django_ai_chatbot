"use client";

import {
  ArrowUp,
  Paperclip,
  Sparkles,
} from "lucide-react";

import {
  FormEvent,
  KeyboardEvent,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ChatComposerProps = {
  onSendMessage: (
    message: string
  ) => void;

  isSending?: boolean;
};

export function ChatComposer({
  onSendMessage,
  isSending = false,
}: ChatComposerProps) {
  const [message, setMessage] =
    useState("");

  function submitMessage() {
    if (isSending) {
  return;
}
    const cleaned =
      message.trim();

    if (!cleaned) {
      return;
    }

    onSendMessage(cleaned);

    setMessage("");
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    submitMessage();
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      submitMessage();
    }
  }

  return (
    <div className="w-full px-4 pb-5 md:px-6">
      <div className="mx-auto max-w-3xl">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border bg-background p-2 shadow-lg shadow-black/5"
        >
          <Textarea
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder="Message your local AI..."
            rows={1}
            className="min-h-14 max-h-40 resize-none border-0 bg-transparent px-3 py-3 shadow-none focus-visible:ring-0"
          />

          <div className="flex items-center justify-between px-1 pb-1">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full"
              >
                <Paperclip className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="rounded-full text-xs text-muted-foreground"
              >
                <Sparkles className="mr-1 h-4 w-4" />
                Tools
              </Button>
            </div>

            <Button
  type="submit"
  size="icon"
  disabled={
    !message.trim() ||
    isSending
  }
  className="rounded-full"
>
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </form>

        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          AI can make mistakes. Check important information.
        </p>
      </div>
    </div>
  );
}