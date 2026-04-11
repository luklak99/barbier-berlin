import { motion } from 'framer-motion';

const testimonials = [
  {
    name: 'Marco S.',
    text: 'Bester Barbershop in ganz Berlin! Mohammed nimmt sich immer Zeit und das Ergebnis ist jedes Mal perfekt.',
    rating: 5,
  },
  {
    name: 'Ahmet K.',
    text: 'Seit Jahren mein Stammfriseur. Faire Preise, top Qualität und immer eine angenehme Atmosphäre.',
    rating: 5,
  },
  {
    name: 'Jonas W.',
    text: 'Die Nassrasur ist ein Erlebnis! Dazu Tee und nette Unterhaltung — besser geht es nicht.',
    rating: 5,
  },
  {
    name: 'David M.',
    text: 'Professionell, freundlich und präzise. Kann ich jedem nur empfehlen, der Wert auf guten Style legt.',
    rating: 5,
  },
  {
    name: 'Kemal Y.',
    text: 'Hervorragendes Preis-Leistungsverhältnis. Die Bartpflege hier ist die beste, die ich je hatte.',
    rating: 5,
  },
  {
    name: 'Stefan R.',
    text: 'Kreuzbergs Geheimtipp! Komme extra aus Charlottenburg hierher. Das Ergebnis spricht für sich.',
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-surface-950 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-gold-400 font-medium text-sm uppercase tracking-widest">Bewertungen</span>
          <h2 className="mt-3 text-4xl sm:text-5xl font-display font-bold text-white">
            Was unsere Kunden sagen
          </h2>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-white font-semibold text-lg">4.8</span>
            <span className="text-white/40 text-sm">/ 5 — über 1.400 Bewertungen</span>
          </div>
        </motion.div>

        {/* Scrolling testimonials */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-surface-950 to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-surface-950 to-transparent z-10" />

          <motion.div
            animate={{ x: [0, -1200] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="flex gap-6"
          >
            {[...testimonials, ...testimonials].map((review, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-80 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/5"
              >
                <div className="flex gap-1 mb-3">
                  {[...Array(review.rating)].map((_, j) => (
                    <svg key={j} className="w-4 h-4 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-white/70 text-sm leading-relaxed">{review.text}</p>
                <p className="mt-4 text-gold-400 text-sm font-medium">{review.name}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
