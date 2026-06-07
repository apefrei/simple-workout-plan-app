import { createContext, useContext, useEffect, useState } from 'react';
import { auth as apiAuth, getToken, setToken } from '../lib/api';
import { clearAllKeys } from '../lib/ai/keyStorage';

export interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      // No token: nothing to restore, just leave the loading state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    apiAuth
      .me()
      .then(({ user: u, token: fresh }) => {
        setToken(fresh);
        setUser(u);
      })
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signOut = async () => {
    if (user?.id) clearAllKeys(user.id);
    try {
      await apiAuth.signout();
    } catch {
      /* ignore */
    }
    setToken(null);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
