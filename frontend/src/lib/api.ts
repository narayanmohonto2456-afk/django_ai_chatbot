import type {
  Conversation,
  SendMessageResponse,
} from "@/types/chat";;

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";


function getCookie(
  name: string
): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookies =
    document.cookie.split(";");

  for (const cookie of cookies) {
    const trimmed =
      cookie.trim();

    if (
      trimmed.startsWith(
        `${name}=`
      )
    ) {
      return decodeURIComponent(
        trimmed.substring(
          name.length + 1
        )
      );
    }
  }

  return null;
}


async function ensureCsrfToken() {
  await fetch(
    `${API_URL}/api/csrf/`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  return getCookie("csrftoken");
}


// ==========================================
// GET ALL CONVERSATIONS
// ==========================================

export async function getConversations(): Promise<
  Conversation[]
> {
  const response = await fetch(
    `${API_URL}/api/chats/`,
    {
      method: "GET",

      credentials: "include",

      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load conversations: ${response.status}`
    );
  }

  const data =
    await response.json();

  if (Array.isArray(data)) {
    return data;
  }

  if (
    data &&
    Array.isArray(data.results)
  ) {
    return data.results;
  }

  return [];
}


// ==========================================
// CREATE CONVERSATION
// ==========================================

export async function createConversation(): Promise<
  Conversation
> {
  const csrfToken =
    await ensureCsrfToken();

  if (!csrfToken) {
    throw new Error(
      "Unable to get CSRF token."
    );
  }

  const response = await fetch(
    `${API_URL}/api/chats/`,
    {
      method: "POST",

      credentials: "include",

      headers: {
        Accept: "application/json",
        "Content-Type":
          "application/json",

        "X-CSRFToken":
          csrfToken,
      },

      body: JSON.stringify({
        title: "New Chat",
      }),
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    throw new Error(
      `Failed to create conversation: ${response.status} ${errorText}`
    );
  }

  return response.json();
}

// ==========================================
// SEND MESSAGE
// ==========================================

export async function sendMessage(
  conversationId: number,
  message: string
): Promise<SendMessageResponse> {
  const csrfToken =
    await ensureCsrfToken();

  if (!csrfToken) {
    throw new Error(
      "Unable to get CSRF token."
    );
  }

  const response = await fetch(
    `${API_URL}/api/chats/${conversationId}/messages/`,
    {
      method: "POST",

      credentials: "include",

      headers: {
        Accept: "application/json",
        "Content-Type":
          "application/json",

        "X-CSRFToken":
          csrfToken,
      },

      body: JSON.stringify({
        message,
      }),
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    throw new Error(
      `Failed to send message: ${response.status} ${errorText}`
    );
  }

  return response.json();
}