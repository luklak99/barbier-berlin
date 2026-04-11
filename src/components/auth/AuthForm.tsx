import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  mode: 'login' | 'register';
}

export default function AuthForm({ mode }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [showMfa, setShowMfa] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein.');
      setLoading(false);
      return;
    }

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login'
        ? { email, password, mfaCode: showMfa ? mfaCode : undefined }
        : { email, password, name, phone };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requireMfa) {
          setShowMfa(true);
          setLoading(false);
          return;
        }
        setError(data.error || 'Ein Fehler ist aufgetreten.');
        setLoading(false);
        return;
      }

      window.location.href = data.redirect || '/dashboard';
    } catch {
      setError('Verbindungsfehler. Bitte versuchen Sie es erneut.');
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {mode === 'register' && (
        <>
          <div>
            <label className="block text-white/60 text-sm mb-1.5">Vollständiger Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-gold-500 transition-colors"
              placeholder="Max Mustermann"
            />
          </div>
          <div>
            <label className="block text-white/60 text-sm mb-1.5">Telefonnummer</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-gold-500 transition-colors"
              placeholder="+49 170 1234567"
            />
          </div>
        </>
      )}

      <div>
        <label className="block text-white/60 text-sm mb-1.5">E-Mail-Adresse</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-gold-500 transition-colors"
          placeholder="ihre@email.de"
        />
      </div>

      <div>
        <label className="block text-white/60 text-sm mb-1.5">Passwort</label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-gold-500 transition-colors"
          placeholder="Mindestens 8 Zeichen"
        />
      </div>

      {mode === 'register' && (
        <div>
          <label className="block text-white/60 text-sm mb-1.5">Passwort bestätigen</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-gold-500 transition-colors"
            placeholder="Passwort wiederholen"
          />
        </div>
      )}

      {showMfa && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <label className="block text-white/60 text-sm mb-1.5">2FA-Code</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-[0.5em] font-mono placeholder-white/25 focus:outline-none focus:border-gold-500 transition-colors"
            placeholder="000000"
          />
        </motion.div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-full bg-gradient-to-r from-gold-500 to-gold-600 text-surface-950 font-semibold hover:from-gold-400 hover:to-gold-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Laden...' : mode === 'login' ? 'Anmelden' : 'Konto erstellen'}
      </button>

      {mode === 'login' ? (
        <p className="text-center text-white/40 text-sm">
          Noch kein Konto?{' '}
          <a href="/register" className="text-gold-400 hover:text-gold-300 transition-colors">
            Jetzt registrieren
          </a>
        </p>
      ) : (
        <p className="text-center text-white/40 text-sm">
          Bereits ein Konto?{' '}
          <a href="/login" className="text-gold-400 hover:text-gold-300 transition-colors">
            Anmelden
          </a>
        </p>
      )}
    </motion.form>
  );
}
