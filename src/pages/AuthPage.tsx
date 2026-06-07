import { useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { auth as apiAuth, setToken } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

type AuthView = 'login' | 'register' | 'forgot';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string;

export default function AuthPage() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Laden...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const resetCaptcha = () => {
    setCaptchaToken(null);
    turnstileRef.current?.reset();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setError('Bitte warten – Captcha wird geladen.');
      return;
    }

    setSubmitting(true);
    try {
      const { token } = await apiAuth.signup(email, password, captchaToken);
      setToken(token);
      // Reload to trigger AuthProvider to pick up the new token
      window.location.href = '/';
    } catch (err: unknown) {
      resetCaptcha();
      const apiErr = err as { status?: number };
      if (apiErr.status === 409) {
        setError('Diese E-Mail ist bereits registriert.');
      } else {
        setError('Registrierung fehlgeschlagen. Bitte versuche es erneut.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setError('Bitte warten – Captcha wird geladen.');
      return;
    }

    setSubmitting(true);
    try {
      const { token } = await apiAuth.signin(email, password, captchaToken);
      resetCaptcha();
      setToken(token);
      window.location.href = '/';
    } catch {
      resetCaptcha();
      setError('E-Mail oder Passwort ist falsch.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setView('login');
    setInfo(
      'Passwort-Reset ist in der Self-Hosted-Version noch nicht verfügbar. Bitte kontaktiere den Administrator.'
    );
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500';

  const buttonClass =
    'w-full rounded-lg bg-purple-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50';

  const linkClass = 'text-purple-500 hover:text-purple-400 cursor-pointer text-sm';

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

        {info && (
          <div className="mb-4 rounded-lg border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            {info}
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
              placeholder="Passwort (mind. 8 Zeichen)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className={inputClass}
            />
            {TURNSTILE_SITE_KEY && (
              <Turnstile
                ref={turnstileRef}
                siteKey={TURNSTILE_SITE_KEY}
                onSuccess={setCaptchaToken}
                onError={() => setCaptchaToken(null)}
                onExpire={() => setCaptchaToken(null)}
                options={{ size: 'invisible' }}
              />
            )}
            <button type="submit" disabled={submitting} className={buttonClass}>
              {submitting ? 'Registrieren…' : 'Registrieren'}
            </button>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Bereits ein Konto?{' '}
              <button
                type="button"
                onClick={() => {
                  setView('login');
                  setError('');
                  setInfo('');
                }}
                className={linkClass}
              >
                Anmelden
              </button>
            </p>
          </form>
        )}

        {/* --- Login --- */}
        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Anmelden</h2>
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
            {TURNSTILE_SITE_KEY && (
              <Turnstile
                ref={turnstileRef}
                siteKey={TURNSTILE_SITE_KEY}
                onSuccess={setCaptchaToken}
                onError={() => setCaptchaToken(null)}
                onExpire={() => setCaptchaToken(null)}
                options={{ size: 'invisible' }}
              />
            )}
            <button type="submit" disabled={submitting} className={buttonClass}>
              {submitting ? 'Anmelden…' : 'Anmelden'}
            </button>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setView('forgot');
                  setError('');
                  setInfo('');
                }}
                className={linkClass}
              >
                Passwort vergessen?
              </button>
              <button
                type="button"
                onClick={() => {
                  setView('register');
                  setError('');
                  setInfo('');
                }}
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
            <button type="submit" className={buttonClass}>
              Administrator kontaktieren
            </button>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              <button
                type="button"
                onClick={() => {
                  setView('login');
                  setError('');
                  setInfo('');
                }}
                className={linkClass}
              >
                Zurück zur Anmeldung
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
