import { motion } from 'framer-motion';
import { services, type ServiceCategory } from '../../data/services';

const categories: { key: ServiceCategory; icon: string; label: string }[] = [
  { key: 'haircut', icon: '✂️', label: 'Haarschnitte' },
  { key: 'beard', icon: '🪒', label: 'Bart & Rasur' },
  { key: 'face', icon: '✨', label: 'Gesicht & Pflege' },
  { key: 'color', icon: '🎨', label: 'Farbe & Styling' },
  { key: 'kids', icon: '👦', label: 'Kinder & Jugend' },
];

const featured = services.filter((s) =>
  ['herren-schneiden-styling', 'herren-haarschnitt-rasur', 'herren-waschen-schneiden', 'herren-bart-trimmen'].includes(s.id)
);

export default function ServicesPreview() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-gold-500 font-medium text-sm uppercase tracking-widest">Unsere Services</span>
          <h2 className="mt-3 text-4xl sm:text-5xl font-display font-bold text-surface-950">
            Erstklassige Pflege
          </h2>
          <p className="mt-4 text-surface-200 max-w-2xl mx-auto text-lg">
            Von präzisen Haarschnitten bis zur klassischen Nassrasur — wir bieten das volle Programm
            für den modernen Mann.
          </p>
        </motion.div>

        {/* Category Icons */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.key}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-surface-50 border border-surface-100 text-sm font-medium text-surface-800 hover:border-gold-300 hover:bg-gold-50 transition-colors cursor-default"
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Featured Services */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((service, i) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative bg-surface-950 rounded-2xl p-6 overflow-hidden hover:shadow-2xl hover:shadow-surface-950/20 transition-shadow"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gold-500/20 to-transparent rounded-bl-full" />
              <div className="relative">
                <div className="text-3xl font-display font-bold text-gold-400">
                  {service.price}€
                </div>
                <h3 className="mt-3 text-white font-semibold text-lg leading-tight">
                  {service.name.de}
                </h3>
                <p className="mt-2 text-white/40 text-sm">
                  ca. {service.duration} Min.
                </p>
                <a
                  href="/booking"
                  className="mt-4 inline-flex items-center gap-1 text-gold-400 text-sm font-medium group-hover:gap-2 transition-all"
                >
                  Jetzt buchen
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <a
            href="/services"
            className="inline-flex items-center gap-2 text-gold-600 hover:text-gold-700 font-semibold transition-colors"
          >
            Alle Services & Preise ansehen
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
