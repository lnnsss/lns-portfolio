"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import styles from "./Header.module.css";

const navItems = [
  ["Обо мне", "about"],
  ["Кейсы", "work"],
  ["Подход", "advantages"],
  ["Дизайн-архив", "designs"],
  ["Соцсети и связь", "social"]
];

export default function Header() {
  const [isScrolled, setScrolled] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 4);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      className={`${styles.header} ${isScrolled ? styles.scrolled : ""} ${isMenuOpen ? styles.menuOpen : ""}`}
      initial={{ y: -28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.72, delay: 1.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <a className={styles.logo} href="#top" aria-label="lnsnostylist — на главную">
        <span className={styles.logoStrong}>lns</span>
        <span className={styles.logoLight}>nostylist</span>
      </a>
      <button
        className={styles.menuButton}
        type="button"
        aria-expanded={isMenuOpen}
        aria-controls="primary-navigation"
        onClick={() => setMenuOpen((value) => !value)}
      >
        <span className={styles.menuLine} />
        <span className={styles.menuLine} />
        <span className={styles.menuLine} />
        <span className="sr-only">Открыть меню</span>
      </button>
      <nav id="primary-navigation" className={styles.nav} aria-label="Основная навигация">
        {navItems.map(([label, anchor], index) => (
          <a
            key={label}
            href={`#${anchor}`}
            style={{ "--hover": `var(--hover-${index + 1})` }}
            onClick={() => setMenuOpen(false)}
          >
            {label.toUpperCase()}
          </a>
        ))}
      </nav>
    </motion.header>
  );
}
