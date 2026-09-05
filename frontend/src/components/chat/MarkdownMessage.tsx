"use client";

import {
  Children,
  isValidElement,
  ReactNode,
  useState,
} from "react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

import {
  Check,
  Copy,
} from "lucide-react";

import { Button } from "@/components/ui/button";


type MarkdownMessageProps = {
  content: string;
};


type CodeBlockProps = {
  language: string;
  code: string;
};


function CodeBlock({
  language,
  code,
}: CodeBlockProps) {
  const [
    copied,
    setCopied,
  ] = useState(false);


  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(
        code
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);

    } catch (error) {
      console.error(
        "Unable to copy code:",
        error
      );
    }
  }


  return (
    <div className="my-5 overflow-hidden rounded-2xl border border-neutral-800 bg-[#0d1117]">

      {/* CODE HEADER */}

      <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950 px-4 py-2">

        <span className="text-xs font-medium text-neutral-400">
          {language || "code"}
        </span>


        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 gap-1.5 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-white"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />

              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />

              Copy
            </>
          )}
        </Button>

      </div>


      {/* CODE */}

      <div className="overflow-x-auto">

        <SyntaxHighlighter
          language={
            language || "text"
          }
          style={oneDark}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: "1rem",
            background: "transparent",
            fontSize: "0.875rem",
            lineHeight: "1.7",
          }}
          codeTagProps={{
            style: {
              fontFamily:
                "var(--font-geist-mono), monospace",
            },
          }}
        >
          {code}
        </SyntaxHighlighter>

      </div>

    </div>
  );
}


export function MarkdownMessage({
  content,
}: MarkdownMessageProps) {
  return (
    <div className="markdown-message text-sm leading-7">

      <ReactMarkdown
        remarkPlugins={[
          remarkGfm,
        ]}
        components={{

          // ================================================
          // PARAGRAPHS
          // ================================================

          p({
            children,
          }) {
            return (
              <p className="mb-4 last:mb-0">
                {children}
              </p>
            );
          },


          // ================================================
          // HEADINGS
          // ================================================

          h1({
            children,
          }) {
            return (
              <h1 className="mb-4 mt-6 text-2xl font-bold tracking-tight first:mt-0">
                {children}
              </h1>
            );
          },


          h2({
            children,
          }) {
            return (
              <h2 className="mb-3 mt-6 text-xl font-semibold tracking-tight first:mt-0">
                {children}
              </h2>
            );
          },


          h3({
            children,
          }) {
            return (
              <h3 className="mb-2 mt-5 text-lg font-semibold first:mt-0">
                {children}
              </h3>
            );
          },


          // ================================================
          // LISTS
          // ================================================

          ul({
            children,
          }) {
            return (
              <ul className="mb-4 ml-6 list-disc space-y-1">
                {children}
              </ul>
            );
          },


          ol({
            children,
          }) {
            return (
              <ol className="mb-4 ml-6 list-decimal space-y-1">
                {children}
              </ol>
            );
          },


          li({
            children,
          }) {
            return (
              <li className="pl-1">
                {children}
              </li>
            );
          },


          // ================================================
          // LINKS
          // ================================================

          a({
            href,
            children,
          }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-4"
              >
                {children}
              </a>
            );
          },


          // ================================================
          // BLOCK QUOTE
          // ================================================

          blockquote({
            children,
          }) {
            return (
              <blockquote className="my-4 border-l-4 border-neutral-400 pl-4 italic text-muted-foreground">
                {children}
              </blockquote>
            );
          },


          // ================================================
          // HORIZONTAL LINE
          // ================================================

          hr() {
            return (
              <hr className="my-6 border-border" />
            );
          },


          // ================================================
          // TABLE
          // ================================================

          table({
            children,
          }) {
            return (
              <div className="my-5 overflow-x-auto">

                <table className="w-full border-collapse text-sm">
                  {children}
                </table>

              </div>
            );
          },


          thead({
            children,
          }) {
            return (
              <thead className="bg-muted">
                {children}
              </thead>
            );
          },


          th({
            children,
          }) {
            return (
              <th className="border px-3 py-2 text-left font-semibold">
                {children}
              </th>
            );
          },


          td({
            children,
          }) {
            return (
              <td className="border px-3 py-2 align-top">
                {children}
              </td>
            );
          },


          // ================================================
          // CODE
          // ================================================

          code({
            className,
            children,
            ...props
          }) {
            const match =
              /language-(\w+)/.exec(
                className || ""
              );

            const code =
              String(children)
                .replace(/\n$/, "");

            const isBlock =
              Boolean(match) ||
              code.includes("\n");


            if (isBlock) {
              return (
                <CodeBlock
                  language={
                    match?.[1] ?? ""
                  }
                  code={code}
                />
              );
            }


            return (
              <code
                className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em]"
                {...props}
              >
                {children}
              </code>
            );
          },


          // ReactMarkdown normally wraps fenced code in <pre>.
          // CodeBlock already provides its own container.

          pre({
            children,
          }) {
            return (
              <>
                {children}
              </>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>

    </div>
  );
}