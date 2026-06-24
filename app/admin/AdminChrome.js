import Link from "next/link";
import styles from "./admin.module.css";

const navItems = [
  { id: "projects", label: "Кейсы", href: "/admin/projects" },
  { id: "photos", label: "Фото", href: "/admin/photos" },
  { id: "archive", label: "Архив", href: "/admin/archive" },
  { id: "social", label: "Соцсети", href: "/admin/social" }
];

export function ArrowIcon({ direction = "left" }) {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path d={direction === "left" ? "M19 12H5m6 6-6-6 6-6" : "M5 12h14m-6-6 6 6-6 6"} />
    </svg>
  );
}

export default function AdminChrome({ activeSection = "projects", email, signOut, children }) {
  return (
    <div className={styles.adminApp}>
      <aside className={styles.sidebar}>
        <Link className={styles.adminLogo} href="/admin/projects">LNS</Link>
        <nav className={styles.sidebarNav} aria-label="Разделы админки">
          {navItems.map((item) => (
            <Link key={item.id} className={activeSection === item.id ? styles.navActive : ""} href={item.href}>
              <span aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={styles.sidebarFoot}>
          <span title={email}>{email}</span>
          <form action={signOut}>
            <button className={styles.signOut} type="submit">Выйти</button>
          </form>
        </div>
      </aside>
      <main className={styles.adminContent}>{children}</main>
    </div>
  );
}
