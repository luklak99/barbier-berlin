import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Review {
  id: string;
  rating: number;
  text: string | null;
  userName: string;
  createdAt: string;
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

// Fallback static reviews (shown when no API reviews exist)
const fallbackReviews = [
  { id: 'f1', rating: 5, text: 'Bester Barbershop in ganz Berlin! Mohammed nimmt sich immer Zeit und das Ergebnis ist jedes Mal perfekt.', userName: 'Marco S.', createdAt: '' },
  { id: 'f2', rating: 5, text: 'Seit Jahren mein Stammfriseur. Faire Preise, top Qualität und immer eine angenehme Atmosphäre.', userName: 'Ahmet K.', createdAt: '' },
  { id: 'f3', rating: 5, text: 'Die Nassrasur ist ein Erlebnis! Dazu Tee und nette Unterhaltung — besser geht es nicht.', userName: 'Jonas W.', createdAt: '' },
  { id: 'f4', rating: 5, text: 'Professionell, freundlich und präzise. Kann ich jedem nur empfehlen.', userName: 'David M.', createdAt: '' },
  { id: 'f5', rating: 5, text: 'Hervorragendes Preis-Leistungsverhältnis. Die Bartpflege hier ist die beste.', userName: 'Kemal Y.', createdAt: '' },
  { id: 'f6', rating: 5, text: 'Kreuzbergs Geheimtipp! Komme extra aus Charlottenburg hierher.', userName: 'Stefan R.', createdAt: '' },
];

export default function LiveReviews() {
  const [reviews, setReviews] = useState<Review[]>(fallbackReviews);

  useEffect(() => {
    fetch('/api/reviews/list')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.reviews?.length > 0) {
          setReviews(data.reviews);
        }
      })
      .catch(() => {}); // Keep fallback on error
  }, []);

  const allReviews = [...reviews, ...reviews, ...reviews]; // Triple for seamless scroll

  return (
    <section
      className="relative py-24 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #050506 0%, #0a0a0c 50%, #050506 100%)' }}
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          className="text-center mb-16"
        >
          <span className="text-sm uppercase tracking-widest font-medium" style={{ color: '#C8A55A' }}>
            Bewertungen
          </span>
          <h2 className="mt-3 text-4xl sm:text-5xl font-display font-bold" style={{ color: '#EDEDEF' }}>
            Was unsere Kunden sagen
          </h2>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="flex" style={{ color: '#C8A55A' }}>
              {[...Array(5)].map((_, i) => <StarIcon key={i} className="w-5 h-5" />)}
            </div>
            <span className="font-semibold text-lg" style={{ color: '#C8A55A' }}>4.8</span>
            <span className="text-sm" style={{ color: '#8A8F98' }}>/ 5 — über 1.400 Bewertungen</span>
          </div>
        </motion.div>

        {/* Scrolling reviews */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, #0a0a0c, transparent)' }} />
          <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, #0a0a0c, transparent)' }} />

          <div className="overflow-hidden">
            <div className="flex gap-6" style={{ animation: 'scroll-testimonials 40s linear infinite', width: 'max-content' }}>
              {allReviews.map((review, i) => (
                <div
                  key={`${review.id}-${i}`}
                  className="flex-shrink-0 w-80 rounded-2xl p-6"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05)',
                  }}
                >
                  <div className="flex gap-1 mb-3" style={{ color: '#C8A55A' }}>
                    {[...Array(review.rating)].map((_, j) => <StarIcon key={j} className="w-4 h-4" />)}
                  </div>
                  {review.text && (
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(237,237,239,0.7)' }}>{review.text}</p>
                  )}
                  <p className="mt-4 text-sm font-medium" style={{ color: '#C8A55A' }}>{review.userName}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scroll-testimonials {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-344px * ${reviews.length})); }
        }
      `}</style>
    </section>
  );
}
