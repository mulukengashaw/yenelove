

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
  image?: string; // base64 string
  audio?: string; // base64 string for voice note
  senderId?: string;
  senderName?: string;
  isStreaming?: boolean;
  reactions?: Reaction[];
  chat_id?: string; // Added field to support history view
}

export interface Reaction {
  emoji: string;
  userId: string;
}

export interface User {
  id: string;
  name: string;
  email?: string; // Added for Admin Search
  avatar: string;
  status: 'online' | 'offline' | 'busy';
  gender: 'male' | 'female';
  age: number;
  location: string;
  bio?: string;
  voice?: string; // For the AI video call persona
  music?: string; // Cultural preference
  tradition?: string; // Cultural preference
  stories?: string[]; // Array of image URLs for stories
  gifts?: string[]; // Array of received gifts (emojis)
  
  // New fields for limits
  isPremium?: boolean;
  storiesCountToday?: number;
  lastStoryDate?: string; // ISO Date string (YYYY-MM-DD)
  
  // Message Limits
  messagesCountToday?: number;
  lastMessageDate?: string; // ISO Date string (YYYY-MM-DD)
}

export interface ChatSession {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: Date;
  unread: number;
}

export interface PremiumRequest {
  id: number;
  user_id: string;
  receipt_image: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  // Joined fields
  name?: string;
  email?: string;
  avatar?: string;
}

export enum LiveConnectionState {
  DISCONNECTED,
  CONNECTING,
  CONNECTED,
  ERROR
}
