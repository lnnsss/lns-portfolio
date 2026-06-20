import styles from "./SocialLinks.module.css";

const links = [
  ["EMAIL", "mailto:bezborodnikovtimur@gmail.com"],
  ["VK", "https://vk.com/l1lines"],
  ["MAX", "https://max.ru/u/f9LHodD0cOIh49rvqQYNbhq-jsi0h2Oo_V_FmVt5ZW4K7YYxenIVBbO0b3k"],
  ["TELEGRAM", "https://t.me/lnsnostylist"],
  ["INSTAGRAM", "https://www.instagram.com/lnsnostylist"],
  ["PINTEREST", "https://ru.pinterest.com/lnsnostylist/"],
  ["BEHANCE", "https://www.behance.net/lnsnostylist"],
  ["GITHUB", "https://github.com/lnnsss"]
];

export default function SocialLinks() {
  return (
    <section id="social" className={styles.socials} aria-labelledby="social-title">
      <span className="section-kicker">Соцсети и связь</span>
      <h2 id="social-title" className="sr-only">
        Связаться с lnsnostylist
      </h2>
      <div>
        {links.map(([label, href], index) => (
          <a
            key={label}
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
            style={{ "--hover": `var(--hover-${(index % 5) + 1})` }}
          >
            {label}
          </a>
        ))}
      </div>
    </section>
  );
}
