"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  ChevronDown,
  Menu,
  PanelLeftOpen,
  Settings2,
} from "lucide-react";

import { Button } from "@/components/ui/button";


type ChatHeaderProps = {
  title: string;

  isSidebarOpen: boolean;

  onOpenSidebar: () => void;

  onOpenMobileSidebar: () => void;
};


export function ChatHeader({
  title,
  isSidebarOpen,
  onOpenSidebar,
  onOpenMobileSidebar,
}: ChatHeaderProps) {
  const [
    isMobile,
    setIsMobile,
  ] = useState(false);


  // ==========================================================
  // DETECT MOBILE SCREEN
  // ==========================================================

  useEffect(() => {
    const mediaQuery =
      window.matchMedia(
        "(max-width: 767px)"
      );


    function updateScreenSize() {
      setIsMobile(
        mediaQuery.matches
      );
    }


    updateScreenSize();

    mediaQuery.addEventListener(
      "change",
      updateScreenSize
    );


    return () => {
      mediaQuery.removeEventListener(
        "change",
        updateScreenSize
      );
    };
  }, []);


  // ==========================================================
  // SIDEBAR BUTTON
  // ==========================================================

  const showSidebarButton =
    isMobile ||
    !isSidebarOpen;


  function handleSidebarButton() {
    if (isMobile) {
      onOpenMobileSidebar();

      return;
    }

    onOpenSidebar();
  }


  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-xl md:px-6">

      {/* =====================================================
          LEFT SIDE
      ====================================================== */}

      <div className="flex min-w-0 items-center gap-3">

        {/* =================================================
            ONE SIDEBAR BUTTON ONLY
        ================================================== */}

        {showSidebarButton && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={
              handleSidebarButton
            }
            aria-label={
              isMobile
                ? "Open conversations"
                : "Open sidebar"
            }
          >
            {isMobile ? (
              <Menu className="h-5 w-5" />
            ) : (
              <PanelLeftOpen className="h-5 w-5" />
            )}
          </Button>
        )}


        {/* =================================================
            TITLE + MODEL
        ================================================== */}

        <div className="min-w-0">

          <h1 className="truncate text-sm font-semibold">
            {title}
          </h1>


          <button
            type="button"
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Current AI model"
          >
            <span>
              llama3.2:3b
            </span>

            <ChevronDown className="h-3 w-3" />
          </button>

        </div>

      </div>


      {/* =====================================================
          RIGHT SIDE
      ====================================================== */}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Settings"
      >
        <Settings2 className="h-4 w-4" />
      </Button>

    </header>
  );
}