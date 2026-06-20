"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./Preloader.module.css";

export default function Preloader() {
  const [isVisible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 1650);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          className={styles.preloader}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className={styles.logo}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: [0.96, 1.18, 1], opacity: [0, 1, 1] }}
            transition={{ duration: 1.18, times: [0, 0.56, 1], ease: [0.22, 1, 0.36, 1] }}
          >
            <Image src="/favicon.svg" alt="Логотип lns portfolio" width={192} height={122} priority />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
