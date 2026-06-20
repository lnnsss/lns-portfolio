"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import styles from "./Hero.module.css";

const rotatingWords = [
  ["идей", "var(--hover-1)"],
  ["проектов", "var(--hover-2)"],
  ["мечтаний", "var(--hover-5)"],
  ["целей", "var(--hover-3)"],
  ["креативов", "var(--hover-4)"],
  ["амбиций", "var(--hover-1)"],
  ["смыслов", "var(--hover-2)"]
];

export default function Hero() {
  const heroRef = useRef(null);
  const starRef = useRef(null);
  const positionRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0.12, y: 0.08 });
  const dragRef = useRef(null);
  const [starPosition, setStarPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let frame;
    let previous = performance.now();

    function getBounds() {
      const hero = heroRef.current;
      const star = starRef.current;
      if (!hero || !star) return null;

      const heroRect = hero.getBoundingClientRect();
      const starSize = star.offsetWidth || 360;

      return {
        minX: 0,
        minY: 0,
        maxX: Math.max(0, heroRect.width - starSize),
        maxY: Math.max(0, heroRect.height - starSize)
      };
    }

    function clampPosition(position, bounds) {
      return {
        x: Math.min(bounds.maxX, Math.max(bounds.minX, position.x)),
        y: Math.min(bounds.maxY, Math.max(bounds.minY, position.y))
      };
    }

    function placeStar() {
      const bounds = getBounds();
      const hero = heroRef.current;
      if (!bounds || !hero) return;

      const next = clampPosition(
        {
          x: hero.clientWidth * 0.64,
          y: hero.clientHeight * 0.06
        },
        bounds
      );

      positionRef.current = next;
      setStarPosition(next);
    }

    function tick(now) {
      const delta = Math.min(34, now - previous);
      previous = now;

      if (!dragRef.current) {
        const bounds = getBounds();
        if (bounds) {
          const velocity = velocityRef.current;
          const next = {
            x: positionRef.current.x + velocity.x * delta,
            y: positionRef.current.y + velocity.y * delta
          };

          if (next.x <= bounds.minX || next.x >= bounds.maxX) {
            velocity.x *= -1;
            next.x = Math.min(bounds.maxX, Math.max(bounds.minX, next.x));
          }

          if (next.y <= bounds.minY || next.y >= bounds.maxY) {
            velocity.y *= -1;
            next.y = Math.min(bounds.maxY, Math.max(bounds.minY, next.y));
          }

          positionRef.current = next;
          setStarPosition(next);
        }
      }

      frame = requestAnimationFrame(tick);
    }

    function handleResize() {
      const bounds = getBounds();
      if (!bounds) return;
      const next = clampPosition(positionRef.current, bounds);
      positionRef.current = next;
      setStarPosition(next);
    }

    placeStar();
    window.addEventListener("resize", handleResize);
    frame = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frame);
    };
  }, []);

  function handleStarPointerDown(event) {
    const bounds = (() => {
      const hero = heroRef.current;
      const star = starRef.current;
      if (!hero || !star) return null;
      const heroRect = hero.getBoundingClientRect();
      const starSize = star.offsetWidth || 360;
      return {
        heroRect,
        minX: 0,
        minY: 0,
        maxX: Math.max(0, heroRect.width - starSize),
        maxY: Math.max(0, heroRect.height - starSize)
      };
    })();

    if (!bounds) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - bounds.heroRect.left - positionRef.current.x,
      offsetY: event.clientY - bounds.heroRect.top - positionRef.current.y,
      lastX: event.clientX,
      lastY: event.clientY,
      lastTime: performance.now(),
      bounds
    };
  }

  function handleStarPointerMove(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const now = performance.now();
    const delta = Math.max(1, now - drag.lastTime);
    const next = {
      x: Math.min(drag.bounds.maxX, Math.max(drag.bounds.minX, event.clientX - drag.bounds.heroRect.left - drag.offsetX)),
      y: Math.min(drag.bounds.maxY, Math.max(drag.bounds.minY, event.clientY - drag.bounds.heroRect.top - drag.offsetY))
    };

    velocityRef.current = {
      x: ((event.clientX - drag.lastX) / delta) * 5,
      y: ((event.clientY - drag.lastY) / delta) * 5
    };

    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.lastTime = now;
    positionRef.current = next;
    setStarPosition(next);
  }

  function handleStarPointerUp(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    event.currentTarget.releasePointerCapture(event.pointerId);
    const velocity = velocityRef.current;
    const fallbackX = velocity.x || 0.12;
    const fallbackY = velocity.y || 0.08;
    velocityRef.current = {
      x: Math.max(-0.34, Math.min(0.34, fallbackX)),
      y: Math.max(-0.28, Math.min(0.28, fallbackY))
    };
    dragRef.current = null;
  }

  return (
    <section id="top" className={styles.hero} ref={heroRef}>
      <motion.div
        ref={starRef}
        className={styles.star}
        style={{ x: starPosition.x, y: starPosition.y }}
        initial={{ opacity: 0, scale: 0.82, rotate: -10 }}
        animate={{ opacity: 0.9, scale: 1, rotate: 0 }}
        transition={{ duration: 0.9, delay: 1.35, ease: [0.22, 1, 0.36, 1] }}
        onPointerDown={handleStarPointerDown}
        onPointerMove={handleStarPointerMove}
        onPointerUp={handleStarPointerUp}
        onPointerCancel={handleStarPointerUp}
        aria-hidden="true"
      >
        <Image src="/heroStar.png" alt="" width={1456} height={1456} priority />
      </motion.div>
      <div className={styles.copy}>
        <h1 aria-label="Креатор для твоих идей, проектов, мечтаний, целей, креативов, амбиций и смыслов">
          <span className={styles.line}>
            <motion.span
              initial={{ y: "112%", rotate: 2 }}
              animate={{ y: 0, rotate: 0 }}
              transition={{ duration: 0.96, delay: 1.86, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className={styles.heroWord}>Креатор</span>
              <span className={styles.heroWord}>для</span>
            </motion.span>
          </span>
          <span className={styles.line}>
            <motion.span
              className={styles.rotatingLine}
              initial={{ y: "112%", rotate: 2 }}
              animate={{ y: 0, rotate: 0 }}
              transition={{ duration: 0.96, delay: 1.99, ease: [0.22, 1, 0.36, 1] }}
            >
              <span>твоих</span>
              <span className={styles.wordMask} aria-hidden="true">
                <span className={styles.wordStack}>
                  {[...rotatingWords, rotatingWords[0]].map(([word, color], index) => (
                    <span key={`${word}-${index}`} style={{ color }}>
                      {word}
                    </span>
                  ))}
                </span>
              </span>
            </motion.span>
          </span>
        </h1>
      </div>
      <motion.a
        className={styles.mobileAboutAnchor}
        href="#about"
        aria-label="Перейти к блоку обо мне"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 2.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <span />
      </motion.a>
    </section>
  );
}
