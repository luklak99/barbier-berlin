import { motion } from 'framer-motion';

export default function CTASection() {
  return (
    <section
      className="relative py-24 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #080809 0%, #0a0a0f 50%, #080809 100%)' }}
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

      {/* Ambient orbs */}
      <motion.div
        animate={{ x: [0, 60, 0], y: [0, -40, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
        className="absolute top-[20%] left-[30%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(200,165,90,0.08) 0%, transparent 70%)',
          filter: 'blur(100px)',
        }}
      />
      <motion.div
        animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        className="absolute bottom-[10%] right-[20%] w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(200,165,90,0.06) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Glassmorphism container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ type: 'spring', damping: 20, stiffness: 90 }}
          className="relative rounded-3xl px-8 py-16 sm:px-16 text-center overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05), 0 0 60px rgba(200,165,90,0.03)',
          }}
        >
          {/* Shimmer effect - top edge */}
          <div
            className="absolute top-0 left-0 right-0 h-[1px]"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(200,165,90,0.3) 50%, transparent 100%)',
            }}
          />

          {/* Shimmer animation overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(200,165,90,0.8) 45%, rgba(200,165,90,0.8) 55%, transparent 60%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer-cta 6s ease-in-out infinite',
            }}
          />

          <h2 className="text-4xl sm:text-5xl font-display font-bold" style={{ color: '#EDEDEF' }}>
            Bereit für einen
            <span
              className="inline"
              style={{
                background: 'linear-gradient(135deg, #d4b86a 0%, #C8A55A 40%, #b8943e 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            > neuen Look</span>?
          </h2>

          <p className="mt-4 text-lg" style={{ color: '#8A8F98' }}>
            Buchen Sie Ihren Termin in wenigen Sekunden — online, einfach und bequem.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.a
              href="/booking"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="relative inline-flex items-center gap-2 font-semibold px-8 py-4 rounded-full transition-all"
              style={{
                background: 'linear-gradient(135deg, #C8A55A 0%, #d4b86a 50%, #b8943e 100%)',
                color: '#050506',
                boxShadow: '0 0 30px rgba(200,165,90,0.15), 0 4px 20px rgba(200,165,90,0.2)',
              }}
            >
              Termin buchen
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </motion.a>

            <motion.a
              href="tel:+493025926500"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 font-medium transition-all px-6 py-4 rounded-full"
              style={{
                color: 'rgba(237,237,239,0.7)',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#C8A55A' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              030 259 265 00
            </motion.a>
          </div>
        </motion.div>
      </div>

      {/* Inline keyframes for shimmer */}
      <style>{`
        @keyframes shimmer-cta {
          0%, 100% { background-position: 200% 0; }
          50% { background-position: -200% 0; }
        }
      `}</style>
    </section>
  );
}
