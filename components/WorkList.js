"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useMotionValue, useSpring, useMotionValueEvent } from "framer-motion";
import { getProjectFilters } from "@/lib/project-filters";
import WorkFilters from "./WorkFilters";
import ProjectModal from "./ProjectModal";
import SmartImage from "./SmartImage";
import styles from "./WorkList.module.css";

export default function WorkList({ projects }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const filterId = useId();
  const reduceMotion = useReducedMotion();
  const visibleProjects = projects.filter((project) => activeFilter === "all" || getProjectFilters(project).includes(activeFilter));
  const [activeProject, setActiveProject] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const viewportRef = useRef(null);
  const [carouselNode, setCarouselNode] = useState(null);
  const [maxOffset, setMaxOffset] = useState(0);
  const dragX = useMotionValue(0);
  const smoothX = useSpring(dragX, { stiffness: 180, damping: 28 });

  useEffect(() => {
    const media = window.matchMedia("(max-width: 620px)");
    const updateMode = () => {
      setIsMobile(media.matches);
      dragX.set(0);
      smoothX.jump(0);
      setScrollProgress(0);
      if (viewportRef.current) viewportRef.current.scrollLeft = 0;
    };

    updateMode();
    media.addEventListener("change", updateMode);
    return () => media.removeEventListener("change", updateMode);
  }, [dragX, smoothX]);

  useEffect(() => {
    function updateMaxOffset() {
      const viewport = viewportRef.current;
      const carousel = carouselNode;
      if (!viewport || !carousel) return;

      // Layout widths exclude hover/entrance transforms and include both gutters.
      const nextMax = Math.max(0, carousel.offsetWidth - viewport.clientWidth);

      setMaxOffset(nextMax);
      dragX.set(Math.max(-nextMax, Math.min(0, dragX.get())));
    }

    updateMaxOffset();
    const observer = new ResizeObserver(updateMaxOffset);
    if (viewportRef.current) observer.observe(viewportRef.current);
    if (carouselNode) observer.observe(carouselNode);
    window.addEventListener("resize", updateMaxOffset);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateMaxOffset);
    };
  }, [dragX, carouselNode, projects]);

  useMotionValueEvent(dragX, "change", (value) => {
    if (isMobile || !maxOffset) return;
    if (value > 0) dragX.set(0);
    if (value < -maxOffset) dragX.set(-maxOffset);
    setScrollProgress(Math.round((Math.abs(Math.max(-maxOffset, Math.min(0, value))) / maxOffset) * 1000) / 10);
  });

  function selectFilter(value) {
    if (value === activeFilter) return;
    setActiveFilter(value);
    setActiveIndex(null);
    setScrollProgress(0);
    dragX.set(0);
    smoothX.jump(0);
    if (viewportRef.current) viewportRef.current.scrollLeft = 0;
  }

  function handleScrub(event) {
    const nextProgress = Number(event.target.value);
    setScrollProgress(nextProgress);
    if (isMobile && viewportRef.current) {
      const viewport = viewportRef.current;
      viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) * nextProgress / 100;
    } else {
      dragX.set(maxOffset ? -(maxOffset * nextProgress) / 100 : 0);
    }
  }

  return (
    <section id="work" className={styles.work} aria-labelledby="work-title">
      <div className={styles.heading}>
        <span className="section-kicker">кейсы</span>
        <div className={styles.headingContent}>
          <h2 id="work-title" className="section-title">От пикселей и строчек кода<br /> до магазинов и стадионов</h2>
          <WorkFilters value={activeFilter} onChange={selectFilter} controls={`${filterId}-results`} />
        </div>
      </div>

      <div id={`${filterId}-results`} ref={viewportRef} className={styles.viewport} aria-label="Карусель проектов"
        onScroll={(event) => {
          if (!isMobile) return;
          const viewport = event.currentTarget;
          const distance = viewport.scrollWidth - viewport.clientWidth;
          setScrollProgress(distance > 0 ? viewport.scrollLeft / distance * 100 : 0);
        }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeFilter}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              hidden: { opacity: reduceMotion ? 1 : 0, transition: { duration: reduceMotion ? 0 : 0.18 } },
              visible: { opacity: 1, transition: { duration: reduceMotion ? 0 : 0.2, staggerChildren: reduceMotion ? 0 : 0.14 } }
            }}
            ref={setCarouselNode}
            className={styles.carousel}
            style={isMobile ? undefined : { x: smoothX }}
            onPointerLeave={() => setActiveIndex(null)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {visibleProjects.map((project, index) => (
              <button
                key={project.id}
                className={`${styles.cardHit} ${activeIndex === index ? styles.cardHitActive : ""}`}
                style={{
                  "--z": visibleProjects.length - index,
                  "--hover-shift": activeIndex === null || isMobile ? "0px" : index < activeIndex ? "clamp(-108px, -6.4vw, -54px)" : index > activeIndex ? "clamp(54px, 6.4vw, 108px)" : "0px"
                }}
                onPointerEnter={() => setActiveIndex(index)}
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                onBlur={() => setActiveIndex(null)}
                onClick={() => setActiveProject(project)}
              >
                <motion.span className={styles.card}
                  variants={{
                    hidden: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 32, transition: { duration: reduceMotion ? 0 : 0.16 } },
                    visible: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.65, ease: [0.22, 1, 0.36, 1] } }
                  }}>
                  <SmartImage src={project.image} alt={`${project.title} - обложка проекта`} width={760} height={950} />
                  <span className={styles.cardShade} />
                  <span className={styles.cardTitle}>{project.title}</span>
                  <span className={styles.cardMeta}>
                    {project.category} / {project.year}
                  </span>
                </motion.span>
              </button>
            ))}
            {visibleProjects.length === 0 && <p className={styles.emptyState}>В этой категории пока нет кейсов.</p>}
          </motion.div>
        </AnimatePresence>
      </div>
      <span className={styles.resultStatus} role="status">Кейсов: {visibleProjects.length}</span>

      {(isMobile ? visibleProjects.length > 1 : maxOffset > 1) ? (
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
