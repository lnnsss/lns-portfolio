import styles from "./admin.module.css";

export default function AdminLoading() {
  return (
    <div className={styles.adminApp}>
      <aside className={styles.sidebar}><span className={styles.adminLogo}>LNS</span></aside>
      <main className={styles.adminContent}>
        <div className={styles.sectionPage}>
          <header className={styles.pageHeader}><div><h1>Загрузка</h1><p>Получаю актуальные данные…</p></div></header>
          <div className={styles.emptyState}><p>Подготавливаю админку</p></div>
        </div>
      </main>
    </div>
  );
}
