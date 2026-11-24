import { createContext, useContext, useEffect, useState } from 'react';
import { api, tokenStore, setUnauthorizedHandler } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // If a token is saved, we must check it with the server before showing pages
  const [checking, setChecking] = useState(() => Boolean(tokenStore.get()));

  function logout() {
    tokenStore.clear();
    setUser(null);
  }

  useEffect(() => {
    setUnauthorizedHandler(logout);

    if (!tokenStore.get()) return;
    // Page refresh: ask the server "is this token still valid? who am I?"
    api('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => logout())
      .finally(() => setChecking(false));
  }, []);

  async function login(email, password) {
    const data = await api('/auth/login', { method: 'POST', body: { email, password } });
    tokenStore.set(data.token);
    setUser(data.user);
  }

  return (
    <AuthContext.Provider value={{ user, checking, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Any component can call useAuth() to get { user, login, logout, checking }
// (Keeping the hook next to its provider is a common pattern; this rule only affects
// hot-reload during development, so we switch it off for this one line.)
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}