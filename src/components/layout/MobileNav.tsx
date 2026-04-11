import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { t, languages, type Language } from '../../i18n/translations';

interface Props {
  lang: Language;
}

export default function MobileNav({ lang }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const tr = t(lang);

  const navItems = [
    { href: '/', label: tr.nav.home },
    { href: '/services', label: tr.nav.services },
    { href: '/gallery', label: tr.nav.gallery },
    { href: '/about', label: tr.nav.about },
    { href: '/contact', label: tr.nav.contact },
  ];

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-50 w-10 h-10 flex items-center justify-center"
        aria-label="Menu"
      >
        <div className="flex flex-col gap-1.5">
          <motion.span
            animate={isOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
            className="block w-6 h-0.5 bg-white origin-center"
          />
          <motion.span
            animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
            className="block w-6 h-0.5 bg-white"
          />
          <motion.span
            animate={isOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
            className="block w-6 h-0.5 bg-white origin-center"
          />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-surface-950/98 backdrop-blur-xl"
          >
            <div className="flex flex-col items-center justify-center h-full gap-2">
              {navItems.map((item, i) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="text-white text-2xl font-display font-medium py-3 px-6 hover:text-gold-400 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </motion.a>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col items-center gap-4 mt-8"
              >
                <a
                  href="/booking"
                  className="bg-gradient-to-r from-gold-500 to-gold-600 text-surface-950 font-semibold text-lg px-8 py-3 rounded-full"
                  onClick={() => setIsOpen(false)}
                >
                  {tr.nav.booking}
                </a>
                <a
                  href="/login"
                  className="text-white/60 hover:text-white text-sm transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {tr.nav.login}
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex gap-4 mt-8"
              >
                {Object.entries(languages).map(([code, name]) => (
                  <a
                    key={code}
                    href={code === 'de' ? '/' : `/${code}`}
                    className={`text-sm px-3 py-1 rounded ${
                      code === lang
                        ? 'text-gold-400 bg-gold-400/10'
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    {code.toUpperCase()}
                  </a>
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
