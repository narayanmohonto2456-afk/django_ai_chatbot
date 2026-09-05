import {
  ChevronDown,
  Menu,
  Settings2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type ChatHeaderProps = {
  title: string;
};

export function ChatHeader({
  title,
}: ChatHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-xl md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold">
            {title}
          </h1>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            llama3.2:3b
            <ChevronDown className="h-3 w-3" />
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
      >
        <Settings2 className="h-4 w-4" />
      </Button>
    </header>
  );
}