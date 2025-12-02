import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// We keep the Live API references in the components for the Video Call feature, 
// but we remove the text/image chat "bots" to strictly enforce human-to-human messaging.

export const geminiService = {
  // Service placeholder if needed for future expansions.
  // Currently, the App uses LocalStorage for all text communication.
};