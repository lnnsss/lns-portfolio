"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useMotionValueEvent } from "framer-motion";
import ProjectModal from "./ProjectModal";
import SmartImage from "./SmartImage";
import styles from "./WorkList.module.css";

export default function WorkList({ projects }) {
  const [activeProject, setActiveProject] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const viewportRef = useRef(null);
  const carouselRef = useRef(null);
  const [maxOffset, setMaxOffset] = useState(0);
  const dragX = useMotionValue(0);
  const smoothX = useSpring(dragX, { stiffness: 180, damping: 28 });

  useEffect(() => {
    const media = window.matchMedia("(max-width: 620px)");
    const updateMode = () => {
      setIsMobile(media.matches);
      if (media.matches) dragX.set(0);
    };

    updateMode();
    media.addEventListener("change", updateMode);
    return () => media.removeEventListener("change", updateMode);
  }, [dragX]);

  useEffect(() => {
    function updateMaxOffset() {
      const viewport = viewportRef.current;
      const carousel = carouselRef.current;
      if (!viewport || !carousel) return;

      const viewportRect = viewport.getBoundingClientRect();
      const cards = Array.from(carousel.querySelectorAll("button"));
      const lastCard = cards.at(-1);
      if (!lastCard) return;

      const lastRect = lastCard.getBoundingClientRect();
      const carouselRect = carousel.getBoundingClientRect();
      const trailingSpace = Math.max(24, window.innerWidth * 0.06);
      const contentRight = lastRect.right - carouselRect.left;
      const nextMax = Math.max(0, contentRight - viewportRect.width + trailingSpace);

      setMaxOffset(nextMax);
      dragX.set(Math.max(-nextMax, Math.min(0, dragX.get())));
    }

    updateMaxOffset();
    const observer = new ResizeObserver(updateMaxOffset);
    if (viewportRef.current) observer.observe(viewportRef.current);
    if (carouselRef.current) observer.observe(carouselRef.current);
    window.addEventListener("resize", updateMaxOffset);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateMaxOffset);
    };
  }, [dragX]);

  useMotionValueEvent(dragX, "change", (value) => {
    if (!maxOffset) return;
    if (value > 0) dragX.set(0);
    if (value < -maxOffset) dragX.set(-maxOffset);
    setScrollProgress(Math.round((Math.abs(Math.max(-maxOffset, Math.min(0, value))) / maxOffset) * 1000) / 10);
  });

  function handleScrub(event) {
    const nextProgress = Number(event.target.value);
    setScrollProgress(nextProgress);
    dragX.set(maxOffset ? -(maxOffset * nextProgress) / 100 : 0);
  }

  return (
    <section id="work" className={styles.work}>
      <div className={styles.heading}>
        <span className="section-kicker">кейсы</span>
        <p>От пикселей и строчек кода до магазинов и стадионов.</p>
      </div>

      <div ref={viewportRef} className={styles.viewport} aria-label="Карусель проектов">
        <motion.div
          ref={carouselRef}
          className={styles.carousel}
          style={isMobile ? undefined : { x: smoothX }}
          onPointerLeave={() => setActiveIndex(null)}
          onMouseLeave={() => setActiveIndex(null)}
        >
          {projects.map((project, index) => (
            <button
              key={project.id}
              className={`${styles.cardHit} ${activeIndex === index ? styles.cardHitActive : ""}`}
              style={{
                "--z": projects.length - index,
                "--lift": `${index % 3 === 0 ? 9 : index % 3 === 1 ? -2 : 5}px`,
                "--depth": `${index * -8}px`,
                "--hover-shift": activeIndex === null || isMobile ? "0px" : index < activeIndex ? "clamp(-108px, -6.4vw, -54px)" : index > activeIndex ? "clamp(54px, 6.4vw, 108px)" : "0px"
              }}
              onPointerEnter={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onBlur={() => setActiveIndex(null)}
              onClick={() => setActiveProject(project)}
            >
              <span className={styles.card}>
                <SmartImage src={project.image} alt={`${project.title} - обложка проекта`} width={760} height={950} />
                <span className={styles.cardShade} />
                <span className={styles.cardTitle}>{project.title}</span>
                <span className={styles.cardMeta}>
                  {project.category} / {project.year}
                </span>
              </span>
            </button>
          ))}
        </motion.div>
      </div>

      {!isMobile ? (
        <div className={styles.scrubber} aria-label="Навигация по кейсам">
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={scrollProgress}
            onChange={handleScrub}
            onInput={handleScrub}
            disabled={!maxOffset}
            aria-label="Переместиться по кейсам"
          />
        </div>
      ) : null}

      <ProjectModal project={activeProject} onClose={() => setActiveProject(null)} />
    </section>
  );
}
