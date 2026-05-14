import { useState, useEffect } from 'react';
import { t, languages, type Language } from '../../i18n/translations';

interface Props {
  lang: Language;
  prefix: string;
  langUrls: Record<string, string>;
}

const THEME_LABELS: Record<Language, string> = {
  de: 'Theme umschalten',
  en: 'Toggle theme',
  tr: 'Tema değiştir',
  ar: 'تبديل المظهر',
};

export default function MobileNav({ lang, prefix, langUrls }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setThemeState] = useState<'light' | 'dark'>('dark');
  const tr = t(lang);
  const homeHref = prefix || '/';

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme');
    setThemeState(current === 'light' ? 'light' : 'dark');
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<{ theme: 'light' | 'dark' }>).detail;
      if (detail?.theme) setThemeState(detail.theme);
    };
    document.addEventListener('themechange', onChange);
    return () => document.removeEventListener('themechange', onChange);
  }, []);

  const navItems = [
    { href: homeHref, label: tr.nav.home },
    { href: `${prefix}/services`, label: tr.nav.services },
    { href: `${prefix}/gallery`, label: tr.nav.gallery },
    { href: `${prefix}/about`, label: tr.nav.about },
    { href: `${prefix}/contact`, label: tr.nav.contact },
  ];

  const burgerLine: React.CSSProperties = {
    backgroundColor: 'var(--text)',
  };

  return (
    <div className="lg:hidden flex items-center gap-2">
      <button
        type="button"
        data-theme-toggle
        aria-label={THEME_LABELS[lang]}
        className="theme-toggle"
      >
        {theme === 'light' ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-50 w-10 h-10 flex items-center justify-center rounded-lg active:scale-95 transition-transform"
        style={{ background: 'var(--glass)', border: '1px solid var(--border)' }}
        aria-label="Menu"
      >
        <div className="flex flex-col gap-1.5 w-5">
          <span
            className="block h-0.5 origin-center transition-transform duration-300"
            style={isOpen ? { ...burgerLine, transform: 'rotate(45deg) translate(3.5px, 3.5px)' } : burgerLine}
          />
          <span
            className="block h-0.5 transition-all duration-200"
            style={isOpen ? { ...burgerLine, opacity: 0, transform: 'scaleX(0)' } : burgerLine}
          />
          <span
            className="block h-0.5 origin-center transition-transform duration-300"
            style={isOpen ? { ...burgerLine, transform: 'rotate(-45deg) translate(3.5px, -3.5px)' } : burgerLine}
          />
        </div>
      </button>

      {/* Fullscreen overlay — pure CSS transitions */}
      <div
        className="fixed inset-0 z-40 flex flex-col items-center justify-center transition-all duration-300"
        style={{
          background: 'color-mix(in oklab, var(--bg) 96%, transparent)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >
        <nav className="flex flex-col items-center gap-1">
          {navItems.map((item, i) => (
            <a
              key={item.href}
              href={item.href}
              className="text-2xl font-display font-medium py-3 px-6 transition-all duration-300"
              style={{
                color: 'var(--text)',
                transform: isOpen ? 'translateY(0)' : 'translateY(16px)',
                opacity: isOpen ? 1 : 0,
                transitionDelay: isOpen ? `${i * 40}ms` : '0ms',
              }}
              onClick={() => setIsOpen(false)}
              onMouseOver={(e) => (e.currentTarget.style.color = 'var(--gold)')}
              onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text)')}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div
          className="flex flex-col items-center gap-4 mt-8 transition-all duration-300"
          style={{
            transform: isOpen ? 'translateY(0)' : 'translateY(16px)',
            opacity: isOpen ? 1 : 0,
            transitionDelay: isOpen ? '200ms' : '0ms',
          }}
        >
          <a
            href={`${prefix}/booking`}
            className="font-semibold text-lg px-8 py-3 rounded-full active:scale-95 transition-transform"
            style={{
              background: 'linear-gradient(90deg, var(--gold), var(--gold-deep))',
              color: '#050506',
              boxShadow: '0 10px 30px rgba(200,165,90,0.25)',
            }}
            onClick={() => setIsOpen(false)}
          >
            {tr.nav.booking}
          </a>
          <a
            href={`${prefix}/login`}
            className="text-sm transition-colors duration-300"
            style={{ color: 'var(--text-muted)' }}
            onClick={() => setIsOpen(false)}
            onMouseOver={(e) => (e.currentTarget.style.color = 'var(--text)')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            {tr.nav.login}
          </a>
        </div>

        <div
          className="flex gap-3 mt-8 transition-all duration-300"
          style={{
            opacity: isOpen ? 1 : 0,
            transitionDelay: isOpen ? '250ms' : '0ms',
          }}
        >
          {Object.entries(languages).map(([code]) => {
            const active = code === lang;
            return (
              <a
                key={code}
                href={langUrls[code]}
                className="text-sm px-3 py-1.5 rounded-lg border transition-all duration-300"
                style={{
                  color: active ? 'var(--gold)' : 'var(--text-muted)',
                  background: active ? 'color-mix(in oklab, var(--gold) 12%, transparent)' : 'transparent',
                  borderColor: active ? 'var(--border-gold)' : 'var(--border)',
                }}
              >
                {code.toUpperCase()}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
