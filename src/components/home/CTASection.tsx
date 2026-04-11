import { motion } from 'framer-motion';

export default function CTASection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-surface-950">
            Bereit für einen
            <span className="bg-gradient-to-r from-gold-500 to-gold-600 bg-clip-text text-transparent"> neuen Look</span>?
          </h2>
          <p className="mt-4 text-lg text-surface-200">
            Buchen Sie Ihren Termin in wenigen Sekunden — online, einfach und bequem.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/booking"
              className="inline-flex items-center gap-2 bg-surface-950 text-white font-semibold px-8 py-4 rounded-full hover:bg-surface-800 transition-colors"
            >
              Termin buchen
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <a
              href="tel:+493025926500"
              className="inline-flex items-center gap-2 text-surface-800 font-medium hover:text-surface-950 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              030 259 265 00
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
