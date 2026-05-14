import { useState, useEffect } from 'react';
import type { Language } from '../../i18n/translations';

const STORAGE_KEY = 'cookie-consent-accepted';

interface Props {
  lang?: Language;
}

const texts: Record<Language, { message: string; button: string }> = {
  de: {
    message: 'Diese Website verwendet nur technisch notwendige Cookies.',
    button: 'Verstanden',
  },
  en: {
    message: 'This website uses only technically necessary cookies.',
    button: 'Got it',
  },
  tr: {
    message: 'Bu web sitesi yalnızca teknik olarak gerekli çerezleri kullanmaktadır.',
    button: 'Anladım',
  },
  ar: {
    message: 'يستخدم هذا الموقع ملفات تعريف الارتباط الضرورية تقنيًا فقط.',
    button: 'فهمت',
  },
};

export default function CookieConsent({ lang = 'de' }: Props) {
  const [visible, setVisible] = useState(false);
  const { message, button } = texts[lang];

  useEffect(() => {
    try {
      const accepted = localStorage.getItem(STORAGE_KEY);
      if (!accepted) {
        setVisible(true);
      }
    } catch {
      // localStorage nicht verfuegbar — Banner nicht anzeigen
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Ignorieren falls localStorage blockiert
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl"
      style={{
        background: 'var(--header-bg)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[var(--text-muted)] text-sm text-center sm:text-left">
          {message}
        </p>
        <button
          onClick={handleAccept}
          className="shrink-0 px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-300"
          style={{ background: 'var(--gold)', color: '#050506' }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'var(--gold-light)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'var(--gold)')}
        >
          {button}
        </button>
      </div>
    </div>
  );
}
