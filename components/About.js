"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import styles from "./About.module.css";

const slideDuration = 4600;

const aboutSlides = [
  {
    src: "/aboutMe/1.png",
    alt: "Портрет Тимура"
  },
  {
    src: "/aboutMe/2.png",
    alt: "Тимур в рабочей визуальной среде"
  },
  {
    src: "/aboutMe/3.png",
    alt: "Тимур, фото для блока обо мне"
  }
];

export default function About() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setActiveSlide((index) => (index + 1) % aboutSlides.length);
    }, slideDuration);

    return () => window.clearTimeout(timer);
  }, [activeSlide]);

  function goToSlide(index) {
    setActiveSlide(index);
  }

  function showNextSlide() {
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
            <Image
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
        <span className="section-kicker">Обо мне</span>
        <h2>Я Тимур - графический дизайнер и веб-разработчик</h2>
        <div className={styles.text}>
          <p>
            Мне 20 лет, живу в Казани. Работаю на стыке дизайна и разработки,
            создавая визуальные проекты, в которых важны не только внешний вид,
            но и сильная идея.
          </p>
          <p>
            Я умею брать ответственность за результат, быстро погружаться в новые
            задачи и находить решения там, где другие видят сложности. Люблю
            нестандартно мыслить, экспериментировать и искать свежий взгляд, но
            всегда довожу идеи до понятного и качественного результата.
          </p>
          <p>
            Для меня хороший проект - это сочетание сильной идеи, продуманного
            исполнения и смелых решений, которые остаются актуальными и спустя
            время.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
