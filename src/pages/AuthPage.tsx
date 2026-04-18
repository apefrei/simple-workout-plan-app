import { useState, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

type AuthView = 'login' | 'register' | 'verify' | 'forgot'

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string

export default function AuthPage() {
  const { session, loading } = useAuth()
  const [view, setView] = useState<AuthView>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otpLeft, setOtpLeft] = useState('')
  const [otpRight, setOtpRight] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileInstance>(null)
  const otpRightRef = useRef<HTMLInputElement>(null)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Laden...</p>
      </div>
    )
  }

  if (session) {
    return <Navigate to="/" replace />
  }

  const resetCaptcha = () => {
    setCaptchaToken(null)
    turnstileRef.current?.reset()
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!captchaToken) {
      setError('Bitte warten – Captcha wird geladen.')
      return
    }

    setSubmitting(true)
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { captchaToken },
      })

      resetCaptcha()

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      setView('verify')
    } catch {
      setError('Ein Fehler ist aufgetreten.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const token = (otpLeft + otpRight).trim()
    if (token.length !== 8) {
      setError('Bitte den vollständigen Code eingeben (8 Zeichen).')
      return
    }

    setSubmitting(true)
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      })

      if (verifyError) {
        setError(verifyError.message)
        return
      }
      // Session is set automatically via onAuthStateChange
    } catch {
      setError('Ein Fehler ist aufgetreten.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!captchaToken) {
      setError('Bitte warten – Captcha wird geladen.')
      return
    }

    setSubmitting(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: { captchaToken },
      })

      resetCaptcha()

      if (signInError) {
        if (signInError.message === 'Email not confirmed') {
          setError('E-Mail noch nicht bestätigt. Bitte gib den Code aus deiner E-Mail ein.')
          setView('verify')
          return
        }
        setError(signInError.message)
        return
      }
    } catch {
      setError('Ein Fehler ist aufgetreten.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!captchaToken) {
      setError('Bitte warten – Captcha wird geladen.')
      return
    }

    setSubmitting(true)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { captchaToken },
      )

      resetCaptcha()

      if (resetError) {
        setError(resetError.message)
        return
      }
      setError('')
      alert('Falls ein Konto existiert, wurde eine E-Mail zum Zurücksetzen gesendet.')
      setView('login')
    } catch {
      setError('Ein Fehler ist aufgetreten.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOtpLeftChange = (value: string) => {
    const clean = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4)
    setOtpLeft(clean)
    if (clean.length === 4) {
      otpRightRef.current?.focus()
    }
  }

  const handleOtpRightChange = (value: string) => {
    const clean = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4)
    setOtpRight(clean)
  }

  const handleOtpRightKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && otpRight === '') {
      e.preventDefault()
      setOtpLeft((prev) => prev.slice(0, -1))
      // Focus stays but logically we're editing the left part
    }
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500'

  const buttonClass =
    'w-full rounded-lg bg-purple-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50'

  const linkClass = 'text-purple-500 hover:text-purple-400 cursor-pointer text-sm'

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow dark:bg-gray-800">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-800 dark:text-gray-100">
          Workout Planner
        </h1>

        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {/* --- Register --- */}
        {view === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              Konto erstellen
            </h2>
            <input
              type="email"
              placeholder="E-Mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
            />
            <input
              type="password"
              placeholder="Passwort (mind. 6 Zeichen)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className={inputClass}
            />
            <Turnstile
              ref={turnstileRef}
              siteKey={TURNSTILE_SITE_KEY}
              onSuccess={setCaptchaToken}
              onError={() => setCaptchaToken(null)}
              onExpire={() => setCaptchaToken(null)}
              options={{ size: 'invisible' }}
            />
            <button type="submit" disabled={submitting} className={buttonClass}>
              {submitting ? 'Registrieren…' : 'Registrieren'}
            </button>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Bereits ein Konto?{' '}
              <button type="button" onClick={() => { setView('login'); setError('') }} className={linkClass}>
                Anmelden
              </button>
            </p>
          </form>
        )}

        {/* --- Verify OTP --- */}
        {view === 'verify' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              E-Mail bestätigen
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Wir haben einen Code an <strong>{email}</strong> gesendet.
            </p>
            <div className="flex items-center justify-center gap-2">
              <input
                type="text"
                inputMode="text"
                autoComplete="one-time-code"
                value={otpLeft}
                onChange={(e) => handleOtpLeftChange(e.target.value)}
                placeholder="XXXX"
                maxLength={4}
                className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-3 text-center text-xl font-mono tracking-widest text-gray-800 placeholder-gray-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-600"
              />
              <span className="text-2xl font-bold text-gray-400 dark:text-gray-500">–</span>
              <input
                ref={otpRightRef}
                type="text"
                inputMode="text"
                value={otpRight}
                onChange={(e) => handleOtpRightChange(e.target.value)}
                onKeyDown={handleOtpRightKeyDown}
                placeholder="XXXX"
                maxLength={4}
                className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-3 text-center text-xl font-mono tracking-widest text-gray-800 placeholder-gray-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-600"
              />
            </div>
            <button type="submit" disabled={submitting} className={buttonClass}>
              {submitting ? 'Bestätigen…' : 'Bestätigen'}
            </button>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              <button
                type="button"
                onClick={() => { setView('login'); setError('') }}
                className={linkClass}
              >
                Zurück zur Anmeldung
              </button>
            </p>
          </form>
        )}

        {/* --- Login --- */}
        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              Anmelden
            </h2>
            <input
              type="email"
              placeholder="E-Mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
            />
            <input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputClass}
            />
            <Turnstile
              ref={turnstileRef}
              siteKey={TURNSTILE_SITE_KEY}
              onSuccess={setCaptchaToken}
              onError={() => setCaptchaToken(null)}
              onExpire={() => setCaptchaToken(null)}
              options={{ size: 'invisible' }}
            />
            <button type="submit" disabled={submitting} className={buttonClass}>
              {submitting ? 'Anmelden…' : 'Anmelden'}
            </button>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => { setView('forgot'); setError('') }}
                className={linkClass}
              >
                Passwort vergessen?
              </button>
              <button
                type="button"
                onClick={() => { setView('register'); setError('') }}
                className={linkClass}
              >
                Konto erstellen
              </button>
            </div>
          </form>
        )}

        {/* --- Forgot Password --- */}
        {view === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              Passwort zurücksetzen
            </h2>
            <input
              type="email"
              placeholder="E-Mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
            />
            <Turnstile
              ref={turnstileRef}
              siteKey={TURNSTILE_SITE_KEY}
              onSuccess={setCaptchaToken}
              onError={() => setCaptchaToken(null)}
              onExpire={() => setCaptchaToken(null)}
              options={{ size: 'invisible' }}
            />
            <button type="submit" disabled={submitting} className={buttonClass}>
              {submitting ? 'Senden…' : 'Link senden'}
            </button>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              <button
                type="button"
                onClick={() => { setView('login'); setError('') }}
                className={linkClass}
              >
                Zurück zur Anmeldung
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
