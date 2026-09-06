import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "Local AI Chatbot",
  description:
    "Private local AI assistant powered by Next.js, Django and Ollama",
};


export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="flex min-h-full flex-col">
        {children}
      </body>
    </html>
  );
}