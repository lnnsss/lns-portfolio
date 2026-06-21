"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useMotionValueEvent } from "framer-motion";
import ProjectModal from "./ProjectModal";
import SmartImage from "./SmartImage";
import styles from "./WorkList.module.css";

export default function WorkList({ projects }) {
  const [activeProject, setActiveProject] = useState(null);
  const [didDrag, setDidDrag] = useState(false);
  const viewportRef = useRef(null);
  const carouselRef = useRef(null);
  const [maxOffset, setMaxOffset] = useState(0);
  const dragX = useMotionValue(0);
  const smoothX = useSpring(dragX, { stiffness: 180, damping: 28 });

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
  });

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
          style={{ x: smoothX }}
          drag="x"
          dragConstraints={{ left: -maxOffset, right: 0 }}
          dragElastic={0.04}
          onDragStart={() => setDidDrag(true)}
          onDragEnd={() => window.setTimeout(() => setDidDrag(false), 80)}
        >
          {projects.map((project, index) => (
            <button
              key={project.id}
              className={styles.cardHit}
              style={{
                "--z": projects.length - index,
                "--lift": `${index % 3 === 0 ? 9 : index % 3 === 1 ? -2 : 5}px`,
                "--depth": `${index * -8}px`
              }}
              onClick={() => {
                if (!didDrag) setActiveProject(project);
              }}
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

      <ProjectModal project={activeProject} onClose={() => setActiveProject(null)} />
    </section>
  );
}
