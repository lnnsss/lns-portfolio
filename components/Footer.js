import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer id="contact" className={styles.footer}>
      <div className={styles.top}>
        <p>Давайте создадим то, что невозможно не заметить</p>
      </div>
      <strong>
        <span>Design</span>
        <span>that works.</span>
      </strong>
      <div className={styles.bottom}>
        <span>© Все права защищены.</span>
        <span>Открыт к интересным проектам и задачам</span>
      </div>
    </footer>
  );
}
