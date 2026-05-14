import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 2000;
          const startTime = performance.now();
          const step = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {count === 0 && !hasAnimated.current ? '0' : count}
      {suffix}
    </span>
  );
}

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const titleY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const subtitleY = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const statsY = useTransform(scrollYProgress, [0, 1], [0, -15]);
  const orbScale = useTransform(scrollYProgress, [0, 1], [1, 1.3]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(180deg, var(--bg) 0%, var(--bg-elevated-2) 50%, var(--bg) 100%)' }}
    >
      {/* Noise overlay */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none z-[1]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />

      {/* Animated ambient orbs */}
      <motion.div style={{ scale: orbScale }} className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{
            x: [0, 120, 40, 0],
            y: [0, -60, 30, 0],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
          className="absolute top-[15%] left-[20%] w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(200,165,90,0.10) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
        />
        <motion.div
          animate={{
            x: [0, -100, -20, 0],
            y: [0, 80, -40, 0],
          }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-[10%] right-[15%] w-[450px] h-[450px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(200,165,90,0.07) 0%, transparent 70%)',
            filter: 'blur(120px)',
          }}
        />
        <motion.div
          animate={{
            x: [0, 60, -30, 0],
            y: [0, -40, 60, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          className="absolute top-[50%] left-[55%] w-[350px] h-[350px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(200,165,90,0.05) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
      </motion.div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 90 }}
        >
          <span
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-medium"
            style={{
              background: 'var(--glass)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid var(--border)',
              color: '#C8A55A',
              boxShadow: 'inset 0 1px 0 0 var(--glass-strong)',
            }}
          >
            <span
              className="relative flex h-2 w-2"
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: '#C8A55A' }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: '#C8A55A' }} />
            </span>
            Premium Barbershop in Kreuzberg
          </span>
        </motion.div>

        {/* Title with parallax */}
        <motion.div style={{ y: titleY }}>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 90, delay: 0.15 }}
            className="mt-8 text-5xl sm:text-7xl lg:text-8xl font-display font-bold leading-[0.95]"
            style={{
              color: 'var(--text)',
              textShadow: '0 0 80px rgba(200,165,90,0.15), 0 0 40px rgba(200,165,90,0.05)',
            }}
          >
            Barbier
            <span
              className="block"
              style={{
                background: 'linear-gradient(135deg, #d4b86a 0%, #C8A55A 40%, #b8943e 70%, #d4b86a 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 30px rgba(200,165,90,0.3))',
              }}
            >
              Berlin
            </span>
          </motion.h1>
        </motion.div>

        {/* Subtitle with parallax */}
        <motion.div style={{ y: subtitleY }}>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 90, delay: 0.3 }}
            className="mt-6 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed"
            style={{ color: 'var(--text-muted)' }}
          >
            Erstklassige Haarschnitte, präzise Rasur und premium Pflege —
            seit 2020 Ihr Barbershop im Herzen von Berlin-Kreuzberg.
          </motion.p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 90, delay: 0.45 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.a
            href="/booking"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="group relative inline-flex items-center gap-2 font-semibold px-8 py-4 rounded-full transition-all"
            style={{
              background: 'linear-gradient(135deg, #C8A55A 0%, #d4b86a 50%, #b8943e 100%)',
              color: '#050506',
              boxShadow: '0 0 30px rgba(200,165,90,0.15), 0 4px 20px rgba(200,165,90,0.2)',
            }}
          >
            Jetzt Termin buchen
            <svg
              className="w-5 h-5 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </motion.a>
          <motion.a
            href="/services"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 font-medium px-6 py-4 rounded-full transition-all"
            style={{
              color: 'var(--text-subtle)',
              border: '1px solid var(--border-strong)',
              background: 'var(--glass)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            Unsere Services
          </motion.a>
        </motion.div>

        {/* Stats in glassmorphism cards */}
        <motion.div style={{ y: statsY }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 90, delay: 0.7 }}
            className="mt-20 grid grid-cols-3 gap-4 sm:gap-6 max-w-xl mx-auto"
          >
            {[
              { target: 48, display: '4.8', label: 'Bewertung', suffix: '' },
              { target: 1400, display: '1.400+', label: 'Bewertungen', suffix: '+' },
              { target: 5, display: '5+', label: 'Jahre Erfahrung', suffix: '+' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 90, delay: 0.8 + i * 0.05 }}
                className="text-center rounded-2xl px-4 py-5"
                style={{
                  background: 'var(--glass)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid var(--border)',
                  boxShadow: 'inset 0 1px 0 0 var(--glass-strong)',
                }}
              >
                <div className="text-2xl sm:text-3xl font-display font-bold" style={{ color: '#C8A55A' }}>
                  {stat.target === 48 ? (
                    <><CountUp target={48} /><span className="text-lg">/10</span></>
                  ) : stat.target === 1400 ? (
                    <><CountUp target={1400} suffix="+" /></>
                  ) : (
                    <><CountUp target={5} suffix="+" /></>
                  )}
                </div>
                <div className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-7 h-11 rounded-full flex items-start justify-center p-2"
          style={{
            border: '2px solid var(--border-strong)',
            background: 'var(--glass)',
          }}
        >
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4], y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-1.5 h-2.5 rounded-full"
            style={{ backgroundColor: '#C8A55A' }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
