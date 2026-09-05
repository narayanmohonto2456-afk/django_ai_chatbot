export type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
};

export type Conversation = {
  id: number;
  title: string;
  created_at?: string;
  updated_at?: string;
  messages?: Message[];
};

export type SendMessageResponse = {
  conversation: Conversation;
  user_message: Message;
  assistant_message: Message;
};