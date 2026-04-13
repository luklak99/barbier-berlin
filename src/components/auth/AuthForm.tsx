import { useState } from 'react';
import { motion } from 'framer-motion';
import { t, type Language } from '../../i18n/translations';

interface Props {
  mode: 'login' | 'register';
  lang?: Language;
}

const namePlaceholders: Record<Language, string> = {
  de: 'Max Mustermann',
  en: 'John Doe',
  tr: 'Ahmet Yılmaz',
  ar: 'محمد العلي',
};

const passwordPlaceholders: Record<Language, string> = {
  de: 'Mindestens 8 Zeichen',
  en: 'At least 8 characters',
  tr: 'En az 8 karakter',
  ar: '8 أحرف على الأقل',
};

const passwordRepeatPlaceholders: Record<Language, string> = {
  de: 'Passwort wiederholen',
  en: 'Repeat password',
  tr: 'Şifreyi tekrarlayın',
  ar: 'أعد كلمة المرور',
};

const passwordMismatchErrors: Record<Language, string> = {
  de: 'Passwörter stimmen nicht überein.',
  en: 'Passwords do not match.',
  tr: 'Şifreler eşleşmiyor.',
  ar: 'كلمتا المرور غير متطابقتين.',
};

const connectionErrors: Record<Language, string> = {
  de: 'Verbindungsfehler. Bitte versuchen Sie es erneut.',
  en: 'Connection error. Please try again.',
  tr: 'Bağlantı hatası. Lütfen tekrar deneyin.',
  ar: 'خطأ في الاتصال. يرجى المحاولة مرة أخرى.',
};

export default function AuthForm({ mode, lang = 'de' }: Props) {
  const tr = t(lang);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [showMfa, setShowMfa] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const registerHref = lang === 'de' ? '/register' : '/' + lang + '/register';
  const loginHref = lang === 'de' ? '/login' : '/' + lang + '/login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'register' && password !== confirmPassword) {
      setError(passwordMismatchErrors[lang]);
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
        setError(data.error || tr.common.error);
        setLoading(false);
        return;
      }

      window.location.href = data.redirect || (lang === 'de' ? '/dashboard' : `/${lang}/dashboard`);
    } catch {
      setError(connectionErrors[lang]);
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
            <label className="block text-white/60 text-sm mb-1.5">{tr.auth.name}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-gold-500 transition-colors"
              placeholder={namePlaceholders[lang]}
            />
          </div>
          <div>
            <label className="block text-white/60 text-sm mb-1.5">{tr.auth.phone}</label>
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
        <label className="block text-white/60 text-sm mb-1.5">{tr.auth.email}</label>
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
        <label className="block text-white/60 text-sm mb-1.5">{tr.auth.password}</label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-gold-500 transition-colors"
          placeholder={passwordPlaceholders[lang]}
        />
      </div>

      {mode === 'register' && (
        <div>
          <label className="block text-white/60 text-sm mb-1.5">{tr.auth.confirmPassword}</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-gold-500 transition-colors"
            placeholder={passwordRepeatPlaceholders[lang]}
          />
        </div>
      )}

      {showMfa && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <label className="block text-white/60 text-sm mb-1.5">{tr.auth.mfaCode}</label>
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
        {loading ? tr.common.loading : mode === 'login' ? tr.auth.login : tr.auth.register}
      </button>

      {mode === 'login' ? (
        <p className="text-center text-white/40 text-sm">
          {tr.auth.noAccount}{' '}
          <a href={registerHref} className="text-gold-400 hover:text-gold-300 transition-colors">
            {tr.auth.register}
          </a>
        </p>
      ) : (
        <p className="text-center text-white/40 text-sm">
          {tr.auth.hasAccount}{' '}
          <a href={loginHref} className="text-gold-400 hover:text-gold-300 transition-colors">
            {tr.auth.login}
          </a>
        </p>
      )}
    </motion.form>
  );
}
