"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./ProjectModal.module.css";

export default function ProjectModal({ project, onClose }) {
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    if (!project) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        if (activeImage) setActiveImage(null);
        else onClose();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeImage, project, onClose]);

  useEffect(() => {
    setActiveImage(null);
  }, [project]);

  return (
    <AnimatePresence>
      {project ? (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <motion.article
            className={styles.modal}
            initial={{ y: "8%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "5%", opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${project.id}-title`}
          >
            <button className={styles.close} onClick={onClose} aria-label="Закрыть проект">
              Закрыть
            </button>

            <div className={styles.top}>
              <span className="section-kicker">{project.category} / {project.year}</span>
              <h2 id={`${project.id}-title`}>{project.title}</h2>
            </div>

            <div className={styles.overview}>
              <button className={styles.heroImage} onClick={() => setActiveImage(project.image)}>
                <Image src={project.image} alt={project.title} width={1200} height={760} priority />
              </button>
              <dl>
                <div>
                  <dt>Роль</dt>
                  <dd>{project.role}</dd>
                </div>
                <div>
                  <dt>Инструменты</dt>
                  <dd>{project.technologies.join(" · ")}</dd>
                </div>
                <div>
                  <dt>Ссылка</dt>
                  <dd>
                    <a href={project.liveUrl} target="_blank" rel="noreferrer">
                      Открыть проект
                    </a>
                  </dd>
                </div>
              </dl>
            </div>

            <div className={styles.details}>
              <p>{project.summary}</p>
            </div>

            <div className={styles.gallery} aria-label="Галерея проекта">
              {project.gallery.map((image, index) => (
                <button key={`${project.id}-${image}-${index}`} onClick={() => setActiveImage(image)}>
                  <Image src={image} alt={`${project.title} - изображение ${index + 1}`} width={720} height={520} />
                </button>
              ))}
            </div>
          </motion.article>

          <AnimatePresence>
            {activeImage ? (
              <motion.div
                className={styles.imageOverlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onMouseDown={(event) => {
                  event.stopPropagation();
                  setActiveImage(null);
                }}
              >
                <button className={styles.closeImage} aria-label="Закрыть просмотр изображения">
                  Закрыть
                </button>
                <motion.div
                  className={styles.imageModal}
                  initial={{ scale: 0.96, y: 18 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.97, y: 16 }}
                  transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Image src={activeImage} alt={`${project.title} - крупный просмотр`} width={1500} height={1100} />
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
