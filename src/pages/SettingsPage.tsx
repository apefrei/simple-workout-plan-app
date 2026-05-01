import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { createProvider } from '../lib/ai/factory'
import {
  saveApiKey,
  getApiKey,
  removeApiKey,
  getActiveProvider,
  setActiveProvider,
  hasStoredKey,
} from '../lib/ai/keyStorage'
import type { ProviderName, AIError } from '../lib/ai/types'
import { useToast } from '../components/Toast'

const PROVIDERS: { value: ProviderName; label: string; placeholder: string }[] = [
  { value: 'claude', label: 'Claude (Anthropic)', placeholder: 'sk-ant-...' },
  { value: 'gpt', label: 'GPT (OpenAI)', placeholder: 'sk-...' },
  { value: 'gemini', label: 'Gemini (Google)', placeholder: 'AI...' },
]

type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const userId = user?.id ?? ''

  const [selectedProvider, setSelectedProvider] = useState<ProviderName>('claude')
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [hasKey, setHasKey] = useState(false)

  const checkExistingKey = useCallback(
    async (provider: ProviderName) => {
      if (!userId) return
      const stored = hasStoredKey(userId, provider)
      setHasKey(stored)
      if (stored) {
        const key = await getApiKey(userId, provider)
        setValidationStatus(key ? 'valid' : 'idle')
        setStatusMessage(key ? `Connected to ${PROVIDERS.find((p) => p.value === provider)?.label}` : '')
      } else {
        setValidationStatus('idle')
        setStatusMessage('')
      }
    },
    [userId],
  )

  useEffect(() => {
    if (!userId) return
    const active = getActiveProvider(userId)
    if (active) setSelectedProvider(active)
  }, [userId])

  useEffect(() => {
    checkExistingKey(selectedProvider)
    setApiKey('')
    setShowKey(false)
  }, [selectedProvider, checkExistingKey])

  const handleProviderChange = (provider: ProviderName) => {
    setSelectedProvider(provider)
    setApiKey('')
    setShowKey(false)
  }

  const handleValidateAndSave = async () => {
    if (!apiKey.trim() || !userId) return
    setValidationStatus('validating')
    setStatusMessage('')

    try {
      const provider = createProvider(selectedProvider, apiKey.trim())
      const isValid = await provider.validateKey(apiKey.trim())

      if (isValid) {
        await saveApiKey(userId, selectedProvider, apiKey.trim())
        setActiveProvider(userId, selectedProvider)
        setValidationStatus('valid')
        setStatusMessage(`Connected to ${PROVIDERS.find((p) => p.value === selectedProvider)?.label}`)
        setHasKey(true)
        setApiKey('')
        setShowKey(false)
        toast('API key validated and saved', 'success')
      } else {
        setValidationStatus('invalid')
        setStatusMessage('Invalid API key. Please check and try again.')
        toast('Invalid API key', 'error')
      }
    } catch (err: unknown) {
      setValidationStatus('invalid')
      const aiError = err as AIError
      setStatusMessage(aiError.message ?? 'Validation failed. Please try again.')
      toast(aiError.message ?? 'Validation failed', 'error')
    }
  }

  const handleRemoveKey = () => {
    if (!userId) return
    removeApiKey(userId, selectedProvider)
    setHasKey(false)
    setValidationStatus('idle')
    toast('API key removed', 'info')
    setStatusMessage('')
    setApiKey('')
  }

  return (
    <div className="mx-auto max-w-lg p-4">
      <h2 className="text-xl font-bold">Settings</h2>

      <div className="mt-6 space-y-4">
        {/* Account section */}
        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-base font-semibold text-gray-600 dark:text-gray-300">Account</h3>
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Email</span>
              <span className="text-sm font-medium">{user?.email}</span>
            </div>
          </div>
        </section>

        {/* AI Assistant section */}
        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-base font-semibold text-gray-600 dark:text-gray-300">AI Assistant</h3>

          <div className="mt-3 space-y-4">
            {/* Provider selector */}
            <div className="space-y-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Provider</span>
              <div className="space-y-2">
                {PROVIDERS.map((p) => (
                  <label
                    key={p.value}
                    className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <input
                      type="radio"
                      name="ai-provider"
                      value={p.value}
                      checked={selectedProvider === p.value}
                      onChange={() => handleProviderChange(p.value)}
                      className="h-4 w-4 accent-blue-600"
                    />
                    <span className="text-sm font-medium">{p.label}</span>
                    {hasStoredKey(userId, p.value) && (
                      <span className="ml-auto text-xs text-green-600 dark:text-green-400">configured</span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* API key input */}
            <div className="space-y-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">API Key</span>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={PROVIDERS.find((p) => p.value === selectedProvider)?.placeholder}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showKey ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path
                        fillRule="evenodd"
                        d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.092 1.092a4 4 0 00-5.558-5.558z"
                        clipRule="evenodd"
                      />
                      <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                      <path
                        fillRule="evenodd"
                        d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Status indicator */}
            {(validationStatus !== 'idle' || statusMessage) && (
              <div
                className={`flex items-center gap-2 text-sm ${
                  validationStatus === 'valid'
                    ? 'text-green-600 dark:text-green-400'
                    : validationStatus === 'invalid'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {validationStatus === 'validating' && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {validationStatus === 'valid' && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {validationStatus === 'invalid' && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <span>{validationStatus === 'validating' ? 'Validating...' : statusMessage}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleValidateAndSave}
                disabled={!apiKey.trim() || validationStatus === 'validating'}
                className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {validationStatus === 'validating' ? 'Validating...' : 'Validate & Save'}
              </button>
              {hasKey && (
                <button
                  onClick={handleRemoveKey}
                  className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </section>

        {/* About section */}
        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-base font-semibold text-gray-600 dark:text-gray-300">About</h3>
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Version</span>
              <span className="text-sm font-medium">0.1.0</span>
            </div>
          </div>
        </section>

        {/* Sign out */}
        <button
          onClick={signOut}
          className="w-full rounded-xl bg-red-600 py-3 text-base font-semibold text-white transition hover:bg-red-700 active:scale-[0.98]"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
