import { useState, useEffect } from 'react';
import { getUser, clearUserCache, type User } from '../../lib/api';

export default function AuthAwareNav() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getUser().then((u) => {
      if (!cancelled) {
        setUser(u);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
    } catch {
      // Logout-Fehler ignorieren, trotzdem weiterleiten
    }
    clearUserCache();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-20 h-8 bg-[var(--glass)] rounded-full animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <a
        href="/login"
        className="text-[var(--text-muted)] hover:text-[var(--text)] text-sm transition-colors"
      >
        Anmelden
      </a>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {user.role === 'admin' && (
        <a
          href="/admin"
          className="text-gold-400 hover:text-gold-300 text-sm font-medium transition-colors"
        >
          Admin
        </a>
      )}
      <a
        href="/dashboard"
        className="text-[var(--text-muted)] hover:text-[var(--text)] text-sm transition-colors"
      >
        Mein Bereich
      </a>
      <button
        onClick={handleLogout}
        className="text-[var(--text-muted)] hover:text-red-400 text-sm transition-colors"
      >
        Abmelden
      </button>
    </div>
  );
}
