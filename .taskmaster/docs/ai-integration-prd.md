# AI-Powered Training Plan Generation (BYOK)

## Overview

Add AI integration to the workout plan app so users can generate training plans via a chat interface. Users bring their own API keys (BYOK) for Claude, Gemini, or GPT. The AI can also analyze photos of handwritten training plans and convert them into app routines.

## Architecture Constraints

- **BYOK only** — no server-side API keys, no proxy, no edge functions
- **Client-side AI calls** — direct from browser to provider APIs (all three support CORS or have client SDKs)
- **Keys stored locally** — encrypted in localStorage, scoped to the authenticated user
- **Existing stack** — React 19, TypeScript, Vite, TailwindCSS, Supabase Auth, React Query
- **Offline-first** — chat history cached in IndexedDB alongside existing React Query persistence
- **PWA compatible** — camera/photo upload must work on mobile browsers

## Feature 1: AI Provider Settings

### Requirements

- New section in SettingsPage for AI configuration
- User selects a provider: Claude (Anthropic), Gemini (Google), or GPT (OpenAI)
- User enters their API key for the selected provider
- Key validation: test the key with a minimal API call before saving
- Keys stored in localStorage (encrypted with a key derived from the user's Supabase session)
- Option to remove/change the key
- Show which provider is currently active

### UI

- Settings → "AI Assistant" section
- Provider selector (radio buttons or dropdown)
- API key input field (password type, with show/hide toggle)
- "Validate & Save" button
- Status indicator (valid/invalid/not configured)

## Feature 2: AI Chat Interface

### Requirements

- New page/route: `/ai-chat`
- Accessible from bottom navigation or main menu
- Chat-style UI with message bubbles (user messages right, AI responses left)
- Text input field with send button
- System prompt pre-configured to act as a fitness/workout planning assistant
- System prompt includes context about the user's existing routines and exercises (fetched from Supabase)
- AI responses that contain structured training plans should be parseable
- Chat history persisted locally (IndexedDB via React Query)
- Loading state while AI is responding (streaming if supported)
- Error handling for rate limits, invalid keys, network errors

### System Prompt Context

The system prompt should include:
- User's existing routines (names and exercises)
- Available muscle groups from the app's enum
- Instructions to output structured JSON when generating a plan
- The expected JSON schema for a routine (matching the app's data model)

## Feature 3: Photo-to-Plan (Vision)

### Requirements

- In the chat interface, add a camera/upload button
- User can take a photo (mobile camera) or select from gallery
- Photo is sent to the AI model alongside a prompt asking to extract the training plan
- Works with Claude (vision), GPT-4o (vision), and Gemini (vision) — all support image input
- Image is resized/compressed client-side before sending (max 1MB) to reduce token costs
- The AI extracts exercises, sets, reps, weights from the handwritten plan
- Response follows the same structured JSON format as text-based plan generation

### UI

- Camera/attach icon button next to the text input in chat
- Image preview before sending
- On mobile: option to use camera directly or pick from gallery
- Thumbnail of sent image shown in chat history

## Feature 4: Plan Import to App

### Requirements

- When the AI generates a structured training plan, show an "Import as Routine" button
- Clicking import creates a new routine with all exercises pre-filled
- Map AI-generated data to the app's data model:
  - Routine name → routines.name
  - Exercises → exercises (name, muscle_group, target_sets_reps, weight_kg, sort_order)
- Confirmation dialog before import showing what will be created
- After import, navigate to the new routine in RoutineEditorPage
- Handle partial matches (e.g., AI suggests a muscle group not in the enum → map to closest or let user choose)

## Feature 5: Provider Abstraction Layer

### Requirements

- Unified TypeScript interface for all three providers
- Each provider adapter handles:
  - API authentication (different header formats)
  - Message format conversion (each API has different request/response shapes)
  - Vision/image support
  - Streaming support (optional, nice-to-have)
  - Error normalization (rate limits, auth errors, etc.)
- Easy to add new providers in the future
- Provider interface:

```typescript
interface AIProvider {
  name: string;
  validateKey(key: string): Promise<boolean>;
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<AIResponse>;
  supportsVision: boolean;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ContentPart[];
}

interface ContentPart {
  type: 'text' | 'image';
  text?: string;
  imageData?: string; // base64
  mimeType?: string;
}

interface ChatOptions {
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

interface AIResponse {
  content: string;
  usage?: { inputTokens: number; outputTokens: number };
}
```

## Non-Goals

- No server-side key management
- No usage tracking/billing
- No fine-tuning or custom models
- No conversation branching or editing past messages
- No multi-turn tool use or function calling (keep it simple)

## Technical Notes

- Anthropic API: `https://api.anthropic.com/v1/messages` — requires `x-api-key` and `anthropic-version` headers. **CORS note**: Anthropic does not support CORS for direct browser calls. Need to either use their JS SDK which handles this, or route through a minimal CORS proxy. Evaluate during implementation.
- OpenAI API: `https://api.openai.com/v1/chat/completions` — Bearer token auth. Supports CORS.
- Google Gemini API: `https://generativelanguage.googleapis.com/v1beta/models` — API key as query param. Supports CORS.
- All three support vision/image inputs in their latest models
- Consider using the official SDKs (@anthropic-ai/sdk, openai, @google/generative-ai) for easier integration
