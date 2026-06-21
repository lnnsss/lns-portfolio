import styles from "./SocialLinks.module.css";

export default function SocialLinks({ links }) {
  return (
    <section id="social" className={styles.socials} aria-labelledby="social-title">
      <span className="section-kicker">Соцсети и связь</span>
      <h2 id="social-title" className="sr-only">
        Связаться с lnsnostylist
      </h2>
      <div>
        {links.map(({ label, href }, index) => (
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
