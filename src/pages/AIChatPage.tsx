import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useChatHistory, type StoredChatMessage } from '../hooks/useChatHistory';
import { useRoutines } from '../hooks/useRoutines';
import { createProvider } from '../lib/ai/factory';
import { getApiKey, getActiveProvider } from '../lib/ai/keyStorage';
import { compressImage } from '../lib/ai/imageCompression';
import ImportRoutineDialog, { extractPlan, type AIPlan } from '../components/ImportRoutineDialog';
import { useToast } from '../components/Toast';
import { hasStoredKey } from '../lib/ai/keyStorage';
import type { ChatMessage, AIError, ContentPart } from '../lib/ai/types';
import type { MuscleGroup } from '../types/database';

const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'legs',
  'glutes',
  'abs',
  'forearms',
  'calves',
  'full_body',
];

function buildSystemPrompt(
  routines: { name: string; exercises: { name: string; muscle_group: string }[] }[]
): string {
  const routineContext = routines.length
    ? routines
        .map(
          (r) =>
            `- ${r.name}: ${r.exercises.map((e) => `${e.name} (${e.muscle_group})`).join(', ')}`
        )
        .join('\n')
    : 'No routines yet.';

  return `You are a fitness and workout planning assistant. Be concise and helpful.

The user has the following routines:
${routineContext}

Available muscle groups: ${MUSCLE_GROUPS.join(', ')}

When the user asks you to generate a training plan, respond with a JSON block matching this schema:
\`\`\`json
{
  "routineName": "string",
  "exercises": [
    {
      "name": "string",
      "muscleGroup": "chest|back|shoulders|biceps|triceps|legs|glutes|abs|forearms|calves|full_body",
      "sets": "3x10",
      "weight": 50
    }
  ]
}
\`\`\`
You may include additional explanation text around the JSON block. Ask clarifying questions if needed (goals, experience level, equipment available, etc.).

When the user sends a photo of a handwritten training plan, extract all exercises, sets, reps, and weights. Return structured JSON matching the schema above. If something is illegible, indicate low confidence and your best guess.`;
}

export default function AIChatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const userId = user?.id ?? '';
  const { messages, addMessage, clearAll } = useChatHistory();
  const { routines, createRoutine, addExercise } = useRoutines();

  const isConfigured =
    userId && getActiveProvider(userId) && hasStoredKey(userId, getActiveProvider(userId)!);

  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<{ base64: string; mimeType: string } | null>(
    null
  );
  const [isCompressing, setIsCompressing] = useState(false);
  const [importPlan, setImportPlan] = useState<AIPlan | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getProviderAndKey = async () => {
    const providerName = getActiveProvider(userId);
    if (!providerName) {
      setError('No AI provider configured. Go to Settings to add an API key.');
      return null;
    }
    const apiKey = await getApiKey(userId, providerName);
    if (!apiKey) {
      setError('API key not found. Please reconfigure in Settings.');
      return null;
    }
    return { providerName, apiKey };
  };

  const sendToAI = async (userContent: string | ContentPart[]) => {
    const config = await getProviderAndKey();
    if (!config) return;

    const { providerName, apiKey } = config;
    const provider = createProvider(providerName, apiKey);

    const systemPrompt = buildSystemPrompt(
      routines.map((r) => ({
        name: r.name,
        exercises: r.exercises.map((e) => ({ name: e.name, muscle_group: e.muscle_group })),
      }))
    );

    const chatMessages: ChatMessage[] = [
      ...messages
        .filter((m) => m.role !== 'system')
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: userContent },
    ];

    const response = await provider.chat(chatMessages, { systemPrompt });

    const assistantMessage: Omit<StoredChatMessage, 'userId'> = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: response.content,
      timestamp: Date.now(),
      provider: providerName,
    };

    addMessage.mutate(assistantMessage);
  };

  const handleSend = async () => {
    const text = input.trim();
    const hasImage = pendingImage !== null;
    if ((!text && !hasImage) || isSending || !userId) return;

    setError(null);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    let userContent: string | ContentPart[];
    if (hasImage) {
      const parts: ContentPart[] = [];
      if (text) {
        parts.push({ type: 'text', text });
      } else {
        parts.push({
          type: 'text',
          text: 'Extract the training plan from this image and return structured JSON.',
        });
      }
      parts.push({
        type: 'image',
        imageData: pendingImage.base64,
        mimeType: pendingImage.mimeType,
      });
      userContent = parts;
      setPendingImage(null);
    } else {
      userContent = text;
    }

    const userMessage: Omit<StoredChatMessage, 'userId'> = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userContent,
      timestamp: Date.now(),
    };

    addMessage.mutate(userMessage);
    setIsSending(true);

    try {
      await sendToAI(userContent);
    } catch (err: unknown) {
      const aiError = err as AIError;
      setError(aiError.message ?? 'Something went wrong. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-selected
    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    setError(null);
    setIsCompressing(true);

    try {
      const compressed = await compressImage(file);
      setPendingImage({ base64: compressed.base64, mimeType: compressed.mimeType });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleImport = async (
    plan: AIPlan & {
      exercises: { name: string; muscleGroup: MuscleGroup; sets?: string; weight?: number }[];
    }
  ) => {
    setIsImporting(true);
    try {
      const routine = await createRoutine(plan.routineName);
      if (!routine) {
        setError('Failed to create routine.');
        return;
      }
      for (const ex of plan.exercises) {
        await addExercise(routine.id, {
          name: ex.name,
          muscle_group: ex.muscleGroup,
          target_sets_reps: ex.sets ?? '3x10',
        });
      }
      setImportPlan(null);
      toast(`Routine '${plan.routineName}' imported`, 'success');
      navigate(`/routines/${routine.id}`);
    } catch {
      setError('Failed to import routine.');
      toast('Failed to import routine', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-lg flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5"
          >
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <h2 className="flex-1 text-lg font-semibold">AI Workout Assistant</h2>
        {messages.length > 0 && (
          <button
            onClick={() => clearAll.mutate()}
            className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400"
          >
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {!isConfigured && messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-sm text-gray-400 dark:text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <p className="mt-3 font-medium text-gray-600 dark:text-gray-300">
                AI Assistant Not Configured
              </p>
              <p className="mt-1">Add your API key in Settings to start chatting.</p>
              <button
                onClick={() => navigate('/settings')}
                className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Go to Settings
              </button>
            </div>
          </div>
        )}

        {isConfigured && messages.length === 0 && !isSending && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-sm text-gray-400 dark:text-gray-500">
              <p className="text-2xl">💪</p>
              <p className="mt-2 font-medium">Ask me to create a workout plan</p>
              <p className="mt-1">I can help with routines, exercises, and training schedules.</p>
              <p className="mt-1">You can also upload a photo of a handwritten plan.</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} onImport={setImportPlan} />
        ))}

        {isSending && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-gray-200 px-4 py-2 dark:bg-gray-700">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Image preview */}
      {pendingImage && (
        <div className="mx-4 mb-2 flex items-center gap-2">
          <img
            src={`data:${pendingImage.mimeType};base64,${pendingImage.base64}`}
            alt="Upload preview"
            className="h-16 w-16 rounded-lg object-cover"
          />
          <button
            onClick={() => setPendingImage(null)}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Remove
          </button>
        </div>
      )}

      {/* Compressing indicator */}
      {isCompressing && <div className="mx-4 mb-2 text-sm text-gray-500">Compressing image...</div>}

      {/* Input */}
      <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
        <div className="flex items-end gap-2">
          {/* Camera/upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || isCompressing}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 active:scale-95 disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path
                fillRule="evenodd"
                d="M1 8a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 018.07 3h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0016.07 6H17a2 2 0 012 2v7a2 2 0 01-2 2H3a2 2 0 01-2-2V8zm13.5 3a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM10 14a3 3 0 100-6 3 3 0 000 6z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onInput={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder={
              pendingImage ? 'Add a message or send the image...' : 'Ask about workouts...'
            }
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
          />
          <button
            onClick={handleSend}
            disabled={(!input.trim() && !pendingImage) || isSending}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Import dialog */}
      {importPlan && (
        <ImportRoutineDialog
          plan={importPlan}
          onImport={handleImport}
          onCancel={() => setImportPlan(null)}
          isImporting={isImporting}
        />
      )}
    </div>
  );
}

function MessageBubble({
  message,
  onImport,
}: {
  message: StoredChatMessage;
  onImport: (plan: AIPlan) => void;
}) {
  const isUser = message.role === 'user';
  const [fullImage, setFullImage] = useState<string | null>(null);

  if (typeof message.content !== 'string') {
    // Multimodal message
    const parts = message.content;
    const textParts = parts.filter((p) => p.type === 'text');
    const imageParts = parts.filter((p) => p.type === 'image');

    return (
      <>
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`max-w-[85%] space-y-2 rounded-2xl px-4 py-2 text-sm ${
              isUser
                ? 'rounded-br-md bg-blue-600 text-white'
                : 'rounded-bl-md bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            {imageParts.map((img, i) => (
              <button
                key={i}
                onClick={() => setFullImage(`data:${img.mimeType};base64,${img.imageData}`)}
              >
                <img
                  src={`data:${img.mimeType};base64,${img.imageData}`}
                  alt="Uploaded"
                  className="max-h-48 rounded-lg"
                />
              </button>
            ))}
            {textParts.map((t, i) => (
              <p key={i} className="whitespace-pre-wrap">
                {t.text}
              </p>
            ))}
          </div>
        </div>

        {/* Full-size image modal */}
        {fullImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setFullImage(null)}
          >
            <img src={fullImage} alt="Full size" className="max-h-[90vh] max-w-full rounded-lg" />
          </div>
        )}
      </>
    );
  }

  const plan = !isUser && typeof message.content === 'string' ? extractPlan(message.content) : null;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[85%]">
        <div
          className={`rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
            isUser
              ? 'rounded-br-md bg-blue-600 text-white'
              : 'rounded-bl-md bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
          }`}
        >
          {message.content as string}
        </div>
        {plan && (
          <button
            onClick={() => onImport(plan)}
            className="mt-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 active:scale-95"
          >
            Import as Routine
          </button>
        )}
      </div>
    </div>
  );
}
