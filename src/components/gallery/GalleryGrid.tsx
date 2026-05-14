import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Image {
  src: string;
  alt: string;
}

interface Props {
  images: Image[];
}

export default function GalleryGrid({ images }: Props) {
  const [selected, setSelected] = useState<Image | null>(null);

  return (
    <>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
        {images.map((img, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, type: "spring", damping: 20, stiffness: 90 }}
            className="break-inside-avoid cursor-pointer group"
            onClick={() => setSelected(img)}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative overflow-hidden rounded-xl border border-[var(--border)]">
              <motion.img
                src={img.src}
                alt={img.alt}
                className="w-full object-cover"
                loading="lazy"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", damping: 20, stiffness: 90 }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[color-mix(in_oklab,var(--bg)_80%,transparent)] via-[#C8A55A]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-[var(--text)] font-medium text-sm">{img.alt}</p>
                  <div className="mt-1.5 h-0.5 w-8 bg-gradient-to-r from-[#C8A55A] to-transparent rounded-full"></div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_oklab,var(--bg)_90%,transparent)] backdrop-blur-2xl p-4"
            onClick={() => setSelected(null)}
          >
            {/* Glassmorphism card behind image */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 90 }}
              className="relative bg-[var(--glass)] backdrop-blur-xl border border-[var(--border)] rounded-2xl p-2 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selected.src}
                alt={selected.alt}
                className="max-w-full max-h-[80vh] object-contain rounded-xl"
              />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-[color-mix(in_oklab,var(--bg)_60%,transparent)] backdrop-blur-sm rounded-lg px-4 py-2 border border-[var(--border)]">
                  <p className="text-[var(--text)] text-sm font-medium">{selected.alt}</p>
                </div>
              </div>
            </motion.div>

            <button
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[var(--glass-strong)] backdrop-blur-sm border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--glass-strong)] transition-all duration-300"
              onClick={() => setSelected(null)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
