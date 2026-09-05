import type {
  Conversation,
  Message,
  SendMessageResponse,
} from "@/types/chat";


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";


// ============================================================
// COOKIE HELPER
// ============================================================

function getCookie(
  name: string
): string | null {
  if (
    typeof document === "undefined"
  ) {
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


// ============================================================
// GET CSRF TOKEN
// ============================================================

async function ensureCsrfToken(): Promise<
  string | null
> {
  const response = await fetch(
    `${API_URL}/api/csrf/`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to get CSRF token: ${response.status}`
    );
  }

  return getCookie(
    "csrftoken"
  );
}


// ============================================================
// GET ALL CONVERSATIONS
// ============================================================

export async function getConversations(): Promise<
  Conversation[]
> {
  const response = await fetch(
    `${API_URL}/api/chats/`,
    {
      method: "GET",

      credentials: "include",

      headers: {
        Accept:
          "application/json",
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

  // Normal DRF response
  if (Array.isArray(data)) {
    return data;
  }

  // Paginated DRF response
  if (
    data &&
    Array.isArray(
      data.results
    )
  ) {
    return data.results;
  }

  return [];
}


// ============================================================
// GET SINGLE CONVERSATION
// ============================================================

export async function getConversation(
  conversationId: number
): Promise<Conversation> {
  const response = await fetch(
    `${API_URL}/api/chats/${conversationId}/`,
    {
      method: "GET",

      credentials: "include",

      headers: {
        Accept:
          "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load conversation: ${response.status}`
    );
  }

  return response.json();
}


// ============================================================
// CREATE CONVERSATION
// ============================================================

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
        Accept:
          "application/json",

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


// ============================================================
// NORMAL / NON-STREAMING MESSAGE
// ============================================================

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
        Accept:
          "application/json",

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


// ============================================================
// STREAM TYPES
// ============================================================

type StreamCallbacks = {
  onStart?: (
    conversation: Conversation,
    userMessage: Message
  ) => void;

  onToken?: (
    token: string
  ) => void;

  onDone?: (
    response: SendMessageResponse
  ) => void;

  onError?: (
    error: string
  ) => void;
};


// ============================================================
// STREAM MESSAGE
// ============================================================

export async function streamMessage(
  conversationId: number,
  message: string,
  callbacks: StreamCallbacks
): Promise<void> {
  const csrfToken =
    await ensureCsrfToken();

  if (!csrfToken) {
    throw new Error(
      "Unable to get CSRF token."
    );
  }

  const response = await fetch(
  `${API_URL}/api/chats/${conversationId}/stream/`,
  {
    method: "POST",

    credentials: "include",

    headers: {
      Accept: "*/*",

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
      `Streaming failed: ${response.status} ${errorText}`
    );
  }


  // Browser streaming support check

  if (!response.body) {
    throw new Error(
      "Streaming response body is unavailable."
    );
  }


  const reader =
    response.body.getReader();

  const decoder =
    new TextDecoder();

  let buffer = "";


  // ==========================================================
  // READ STREAM
  // ==========================================================

  while (true) {
    const {
      value,
      done,
    } = await reader.read();


    if (done) {
      break;
    }


    buffer += decoder.decode(
      value,
      {
        stream: true,
      }
    );


    // Django sends one JSON object
    // per line.
    const lines =
      buffer.split("\n");


    // Keep unfinished JSON chunk
    // for the next iteration.
    buffer =
      lines.pop() ?? "";


    for (const line of lines) {
      const clean =
        line.trim();


      if (!clean) {
        continue;
      }


      let event;

      try {
        event =
          JSON.parse(clean);
      } catch (error) {
        console.error(
          "Invalid streaming JSON:",
          clean,
          error
        );

        continue;
      }


      // ------------------------------------------------------
      // STREAM START
      // ------------------------------------------------------

      if (
        event.type ===
        "start"
      ) {
        callbacks.onStart?.(
          event.conversation,
          event.user_message
        );

        continue;
      }


      // ------------------------------------------------------
      // TOKEN RECEIVED
      // ------------------------------------------------------

      if (
        event.type ===
        "token"
      ) {
        callbacks.onToken?.(
          event.content
        );

        continue;
      }


      // ------------------------------------------------------
      // STREAM COMPLETE
      // ------------------------------------------------------

      if (
        event.type ===
        "done"
      ) {
        callbacks.onDone?.(
          {
            conversation:
              event.conversation,

            user_message:
              event.user_message,

            assistant_message:
              event.assistant_message,
          }
        );

        continue;
      }


      // ------------------------------------------------------
      // STREAM ERROR
      // ------------------------------------------------------

      if (
        event.type ===
        "error"
      ) {
        const errorMessage =
          event.error ??
          "Unknown streaming error.";

        callbacks.onError?.(
          errorMessage
        );

        throw new Error(
          errorMessage
        );
      }
    }
  }


  // ==========================================================
  // PROCESS FINAL BUFFER
  // ==========================================================

  const finalChunk =
    buffer.trim();

  if (finalChunk) {
    try {
      const event =
        JSON.parse(
          finalChunk
        );

      if (
        event.type ===
        "token"
      ) {
        callbacks.onToken?.(
          event.content
        );
      }

      if (
        event.type ===
        "done"
      ) {
        callbacks.onDone?.(
          {
            conversation:
              event.conversation,

            user_message:
              event.user_message,

            assistant_message:
              event.assistant_message,
          }
        );
      }

      if (
        event.type ===
        "error"
      ) {
        throw new Error(
          event.error
        );
      }

    } catch (error) {
      console.error(
        "Failed to process final streaming chunk:",
        error
      );
    }
  }
}