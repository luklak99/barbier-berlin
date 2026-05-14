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

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

// Duplicate testimonials for seamless infinite scroll
const allTestimonials = [...testimonials, ...testimonials, ...testimonials];

export default function Testimonials() {
  return (
    <section
      className="relative py-24 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, var(--bg) 0%, var(--bg-elevated) 50%, var(--bg) 100%)' }}
    >
      {/* Noise overlay */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ type: 'spring', damping: 20, stiffness: 90 }}
          className="text-center mb-16"
        >
          <span className="text-sm uppercase tracking-widest font-medium" style={{ color: '#C8A55A' }}>
            Bewertungen
          </span>
          <h2 className="mt-3 text-4xl sm:text-5xl font-display font-bold" style={{ color: 'var(--text)' }}>
            Was unsere Kunden sagen
          </h2>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className="w-5 h-5" />
              ))}
            </div>
            <span className="font-semibold text-lg" style={{ color: '#C8A55A' }}>4.8</span>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>/ 5 — über 1.400 Bewertungen</span>
          </div>
        </motion.div>

        {/* Infinite scroll testimonials */}
        <div className="relative">
          {/* Fade edges */}
          <div
            className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to right, var(--bg-elevated), transparent)' }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to left, var(--bg-elevated), transparent)' }}
          />

          {/* CSS-based infinite scroll for smooth seamless looping */}
          <div className="overflow-hidden">
            <div
              className="flex gap-6"
              style={{
                animation: 'scroll-testimonials 40s linear infinite',
                width: 'max-content',
              }}
            >
              {allTestimonials.map((review, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-80 rounded-2xl p-6 transition-all duration-300"
                  style={{
                    background: 'var(--glass)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid var(--border)',
                    boxShadow: 'inset 0 1px 0 0 var(--glass-strong)',
                  }}
                >
                  {/* Gold stars */}
                  <div className="flex gap-1 mb-3" style={{ color: '#C8A55A' }}>
                    {[...Array(review.rating)].map((_, j) => (
                      <StarIcon key={j} className="w-4 h-4" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-subtle)' }}>
                    {review.text}
                  </p>
                  <p className="mt-4 text-sm font-medium" style={{ color: '#C8A55A' }}>
                    {review.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Inline keyframes for CSS scroll animation */}
      <style>{`
        @keyframes scroll-testimonials {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-344px * ${testimonials.length})); }
        }
      `}</style>
    </section>
  );
}
