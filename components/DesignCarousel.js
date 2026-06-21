"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SmartImage from "./SmartImage";
import styles from "./DesignCarousel.module.css";

export default function DesignCarousel({ items }) {
  const images = [...items, ...items, ...items];
  const [progress, setProgress] = useState(0);
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    let frame;
    let previous = performance.now();

    function tick(now) {
      const delta = now - previous;
      previous = now;
      setProgress((value) => (value + delta * 0.000025) % 1);
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <section id="designs" className={styles.designs}>
      <div className={styles.copy}>
        <span className="section-kicker">Дизайн-архив</span>
        <p>То, что остаётся между кейсами</p>
      </div>
      <div className={styles.viewport} aria-label="Карусель дизайн-работ">
        <div className={styles.rail} style={{ transform: `translateX(${-progress * 33.333}%)` }}>
          {images.map((project, index) => (
            <button
              key={`${project.id}-${index}`}
              className={styles.frame}
              style={{ "--accent": project.accent }}
              onClick={() => setActiveImage(project)}
            >
              <SmartImage src={project.image} alt={`${project.title} - дизайн-фрагмент`} width={680} height={500} />
              <span>{project.title}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {activeImage ? (
          <motion.div
            className={styles.imageOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveImage(null)}
          >
            <button className={styles.close} aria-label="Закрыть просмотр изображения">
              Закрыть
            </button>
            <motion.div
              className={styles.imageModal}
              initial={{ scale: 0.96, y: 22 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.97, y: 16 }}
              transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            >
              <SmartImage src={activeImage.image} alt={activeImage.title} width={1600} height={1100} />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
