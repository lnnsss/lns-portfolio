"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SmartImage from "./SmartImage";
import styles from "./About.module.css";

const slideDuration = 4600;

export default function About({ content }) {
  const aboutSlides = content.slides.length ? content.slides : [];
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (aboutSlides.length < 2) return undefined;

    const timer = window.setTimeout(() => {
      setActiveSlide((index) => (index + 1) % aboutSlides.length);
    }, slideDuration);

    return () => window.clearTimeout(timer);
  }, [activeSlide, aboutSlides.length]);

  function goToSlide(index) {
    setActiveSlide(index);
  }

  function showNextSlide() {
    if (!aboutSlides.length) return;
    setActiveSlide((index) => (index + 1) % aboutSlides.length);
  }

  return (
    <section id="about" className={styles.about}>
      <motion.div
        className={styles.media}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.75 }}
      >
        <div className={styles.imageFrame}>
          {aboutSlides.map((slide, index) => (
            <SmartImage
              key={slide.src}
              className={`${styles.image} ${index === activeSlide ? styles.imageActive : ""}`}
              src={slide.src}
              alt={slide.alt}
              width={900}
              height={900}
              priority={index === 0}
            />
          ))}
          <button className={styles.nextSlide} type="button" onClick={showNextSlide} aria-label="Показать следующее изображение" />
          <span className={styles.progress} style={{ "--slide-count": aboutSlides.length }}>
            {aboutSlides.map((slide, index) => (
              <button
                key={slide.src}
                className={`${styles.progressItem} ${index < activeSlide ? styles.progressDone : ""} ${
                  index === activeSlide ? styles.progressActive : ""
                }`}
                type="button"
                aria-label={`Показать изображение ${index + 1}`}
                style={{ "--duration": `${slideDuration}ms` }}
                onClick={(event) => {
                  event.stopPropagation();
                  goToSlide(index);
                }}
              >
                <span />
              </button>
            ))}
          </span>
        </div>
      </motion.div>
      <motion.div
        className={styles.content}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.75, delay: 0.08 }}
      >
        <span className="section-kicker">{content.kicker}</span>
        <h2>{content.title}</h2>
        <div className={styles.text}>
          {content.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
