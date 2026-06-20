"use client";

import { motion } from "framer-motion";
import styles from "./WhyMe.module.css";

const points = [
  {
    title: "Погружение в задачу",
    description: "Изучаем продукт, аудиторию и цели проекта."
  },
  {
    title: "Поиск сильной идеи",
    description: "Находим концепцию, которая выделит проект среди конкурентов."
  },
  {
    title: "Разработка визуального направления",
    description: "Определяем стиль, настроение и систему визуальной коммуникации."
  },
  {
    title: "Проектирование всех материалов",
    description: "Переносим идею на нужные носители: от цифровых до физических."
  },
  {
    title: "Подготовка к запуску",
    description: "Собираем всё в готовую систему для производства, публикации и масштабирования."
  },
  {
    title: "Запуск и реализация",
    description: "Проект выходит в жизнь: на экраны, в печать, в интернет и в руки аудитории."
  }
];

export default function WhyMe() {
  return (
    <section id="advantages" className={styles.why} aria-labelledby="why-title">
      <div className={styles.head}>
        <span className="section-kicker">Почему выбирают меня</span>
        <h2 id="why-title">От первой идеи до готового продукта</h2>
      </div>
      <div className={styles.grid}>
        {points.map((point, index) => (
          <motion.div
            key={point.title}
            className={styles.point}
            style={{ "--hover": `var(--hover-${(index % 5) + 1})` }}
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-70px" }}
            transition={{ duration: 0.52, delay: index * 0.04 }}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div className={styles.pointCopy}>
              <h3>{point.title}</h3>
              <p>{point.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
