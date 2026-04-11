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
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-50 w-10 h-10 flex items-center justify-center rounded-lg bg-white/[0.03] border border-white/[0.06]"
        aria-label="Menu"
        whileTap={{ scale: 0.95 }}
      >
        <div className="flex flex-col gap-1.5">
          <motion.span
            animate={isOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
            className="block w-5 h-0.5 bg-[#EDEDEF] origin-center"
            transition={{ type: "spring", damping: 20, stiffness: 90 }}
          />
          <motion.span
            animate={isOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
            className="block w-5 h-0.5 bg-[#EDEDEF]"
          />
          <motion.span
            animate={isOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
            className="block w-5 h-0.5 bg-[#EDEDEF] origin-center"
            transition={{ type: "spring", damping: 20, stiffness: 90 }}
          />
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-[#050506]/98 backdrop-blur-2xl"
          >
            <div className="flex flex-col items-center justify-center h-full gap-2">
              {navItems.map((item, i) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, type: "spring", damping: 20, stiffness: 90 }}
                  className="relative text-[#EDEDEF] text-2xl font-display font-medium py-3 px-6 hover:text-[#C8A55A] transition-colors duration-300"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </motion.a>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, type: "spring", damping: 20, stiffness: 90 }}
                className="flex flex-col items-center gap-4 mt-8"
              >
                <motion.a
                  href="/booking"
                  className="bg-gradient-to-r from-[#C8A55A] to-[#B8953A] text-[#050506] font-semibold text-lg px-8 py-3 rounded-full shadow-lg shadow-[#C8A55A]/20"
                  onClick={() => setIsOpen(false)}
                  whileTap={{ scale: 0.97 }}
                >
                  {tr.nav.booking}
                </motion.a>
                <a
                  href="/login"
                  className="text-[#8A8F98] hover:text-[#EDEDEF] text-sm transition-colors duration-300"
                  onClick={() => setIsOpen(false)}
                >
                  {tr.nav.login}
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex gap-3 mt-8"
              >
                {Object.entries(languages).map(([code, name]) => (
                  <a
                    key={code}
                    href={code === 'de' ? '/' : `/${code}`}
                    className={`text-sm px-3 py-1.5 rounded-lg border transition-all duration-300 ${
                      code === lang
                        ? 'text-[#C8A55A] bg-[#C8A55A]/10 border-[#C8A55A]/20'
                        : 'text-[#8A8F98] border-white/[0.06] hover:text-[#EDEDEF] hover:border-white/[0.12]'
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
