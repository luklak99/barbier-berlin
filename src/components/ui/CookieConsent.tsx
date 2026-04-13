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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0c]/95 backdrop-blur-xl border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[#8A8F98] text-sm text-center sm:text-left">
          {message}
        </p>
        <button
          onClick={handleAccept}
          className="shrink-0 px-6 py-2 rounded-full bg-[#C8A55A] text-[#050506] text-sm font-semibold hover:bg-[#E8D48B] transition-colors duration-300"
        >
          {button}
        </button>
      </div>
    </div>
  );
}
