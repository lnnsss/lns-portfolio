"use client";

import { motion } from "framer-motion";
import styles from "./Services.module.css";

const services = [
  "Графический дизайн",
  "Айдентика",
  "Постеры и обложки",
  "Дизайн для соцсетей",
  "Визуальные системы",
  "Презентации и кейсы",
  "Веб-дизайн",
  "Портфолио-сайты",
  "Frontend под дизайн"
];

export default function Services() {
  return (
    <section id="services" className={styles.services}>
      <div className={styles.head}>
        <span className="section-kicker">Направления</span>
        <p>От первой композиции до готовой визуальной упаковки для запуска.</p>
      </div>
      <div className={styles.list}>
        {services.map((service, index) => (
          <motion.div
            key={service}
            className={styles.service}
            initial={{ opacity: 0, x: index % 2 ? 24 : -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-70px" }}
            transition={{ duration: 0.45, delay: index * 0.025 }}
          >
            <span>{service}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
