import { useState } from 'react';
import { t, languages, type Language } from '../../i18n/translations';

interface Props {
  lang: Language;
  prefix: string;
  langUrls: Record<string, string>;
}

export default function MobileNav({ lang, prefix, langUrls }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const tr = t(lang);
  const homeHref = prefix || '/';

  const navItems = [
    { href: homeHref, label: tr.nav.home },
    { href: `${prefix}/services`, label: tr.nav.services },
    { href: `${prefix}/gallery`, label: tr.nav.gallery },
    { href: `${prefix}/about`, label: tr.nav.about },
    { href: `${prefix}/contact`, label: tr.nav.contact },
  ];

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-50 w-10 h-10 flex items-center justify-center rounded-lg bg-white/[0.03] border border-white/[0.06] active:scale-95 transition-transform"
        aria-label="Menu"
      >
        <div className="flex flex-col gap-1.5 w-5">
          <span
            className="block h-0.5 bg-[#EDEDEF] origin-center transition-transform duration-300"
            style={isOpen ? { transform: 'rotate(45deg) translate(3.5px, 3.5px)' } : {}}
          />
          <span
            className="block h-0.5 bg-[#EDEDEF] transition-all duration-200"
            style={isOpen ? { opacity: 0, transform: 'scaleX(0)' } : {}}
          />
          <span
            className="block h-0.5 bg-[#EDEDEF] origin-center transition-transform duration-300"
            style={isOpen ? { transform: 'rotate(-45deg) translate(3.5px, -3.5px)' } : {}}
          />
        </div>
      </button>

      {/* Fullscreen overlay — pure CSS transitions */}
      <div
        className="fixed inset-0 z-40 flex flex-col items-center justify-center transition-all duration-300"
        style={{
          background: 'rgba(5,5,6,0.98)',
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
              className="text-[#EDEDEF] text-2xl font-display font-medium py-3 px-6 hover:text-[#C8A55A] transition-all duration-300"
              style={{
                transform: isOpen ? 'translateY(0)' : 'translateY(16px)',
                opacity: isOpen ? 1 : 0,
                transitionDelay: isOpen ? `${i * 40}ms` : '0ms',
              }}
              onClick={() => setIsOpen(false)}
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
            className="bg-gradient-to-r from-[#C8A55A] to-[#B8953A] text-[#050506] font-semibold text-lg px-8 py-3 rounded-full shadow-lg shadow-[#C8A55A]/20 active:scale-95 transition-transform"
            onClick={() => setIsOpen(false)}
          >
            {tr.nav.booking}
          </a>
          <a
            href={`${prefix}/login`}
            className="text-[#8A8F98] hover:text-[#EDEDEF] text-sm transition-colors duration-300"
            onClick={() => setIsOpen(false)}
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
          {Object.entries(languages).map(([code]) => (
            <a
              key={code}
              href={langUrls[code]}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-all duration-300 ${
                code === lang
                  ? 'text-[#C8A55A] bg-[#C8A55A]/10 border-[#C8A55A]/20'
                  : 'text-[#8A8F98] border-white/[0.06] hover:text-[#EDEDEF] hover:border-white/[0.12]'
              }`}
            >
              {code.toUpperCase()}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
