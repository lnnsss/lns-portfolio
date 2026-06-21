export const projects = [
  {
    id: "aurora",
    title: "Айдентика Aurora",
    descriptor: "Спокойная визуальная система для wellness-бренда.",
    year: "2026",
    category: "Айдентика",
    role: "Арт-дирекшн, логика айдентики, носители, кампейн-визуалы",
    technologies: ["Figma", "Illustrator", "Photoshop"],
    liveUrl: "https://behance.net",
    accent: "#ff4d8d",
    image: "/projects/aurora.svg",
    gallery: ["/projects/aurora.svg", "/projects/social.svg", "/projects/motion.svg"],
    summary:
      "Для Aurora собрана тихая, но запоминающаяся айдентика: типографика, цвет, правила композиции и набор носителей для запуска. Главная задача - сделать бренд визуально цельным без лишнего шума."
  },
  {
    id: "creative-studio",
    title: "Портфолио для креативной студии",
    descriptor: "Редакционная подача работ с крупной типографикой и движением.",
    year: "2026",
    category: "Веб-дизайн",
    role: "Визуальная концепция, UX, frontend, motion-система",
    technologies: ["Next.js", "React", "Framer Motion", "CSS Modules"],
    liveUrl: "https://github.com",
    accent: "#77f7c8",
    image: "/projects/studio.svg",
    gallery: ["/projects/studio.svg", "/projects/saas.svg", "/projects/commerce.svg"],
    summary:
      "Сайт построен как витрина визуальных работ: крупные обложки, короткие описания и быстрый просмотр проектов. Разработка здесь поддерживает дизайн, а не перетягивает внимание на себя."
  },
  {
    id: "commerce",
    title: "Лендинг для product drop",
    descriptor: "Запусковая страница с сильной обложкой и чистой сеткой.",
    year: "2025",
    category: "Лендинг",
    role: "Графическая концепция, веб-дизайн, адаптивная верстка",
    technologies: ["Next.js", "React", "CSS Grid"],
    liveUrl: "https://github.com",
    accent: "#7aa7ff",
    image: "/projects/commerce.svg",
    gallery: ["/projects/commerce.svg", "/projects/aurora.svg", "/projects/studio.svg"],
    summary:
      "Лендинг для промо-запуска: выразительный первый экран, ясная структура, мобильная адаптация и легкая анимация. Визуальный образ продукта остается главным, интерфейс только помогает продаже."
  },
  {
    id: "social-system",
    title: "Визуальная система для соцсетей",
    descriptor: "Набор шаблонов для быстрой и узнаваемой кампании.",
    year: "2025",
    category: "Графический дизайн",
    role: "Шаблонная система, сетка, типографика, правила кропа",
    technologies: ["Figma", "Photoshop", "After Effects"],
    liveUrl: "https://behance.net",
    accent: "#ffd166",
    image: "/projects/social.svg",
    gallery: ["/projects/social.svg", "/projects/motion.svg", "/projects/aurora.svg"],
    summary:
      "Модульная система для постов, сторис и кампейн-материалов: сетки, иерархия, правила типографики и заготовки под движение. Такой дизайн легко масштабировать без потери характера."
  },
  {
    id: "motion-posters",
    title: "Серия motion-постеров",
    descriptor: "Анимированные постеры для digital-запусков и соцсетей.",
    year: "2024",
    category: "Motion",
    role: "Графический дизайн, раскадровка, направление анимации",
    technologies: ["After Effects", "Photoshop", "Illustrator"],
    liveUrl: "https://dribbble.com",
    accent: "#b388ff",
    image: "/projects/motion.svg",
    gallery: ["/projects/motion.svg", "/projects/social.svg", "/projects/saas.svg"],
    summary:
      "Плакатная серия для digital-поверхностей: жесткая сетка, большой масштаб, контраст и движение. Формат рассчитан на быстрый взгляд в ленте, но остается собранным как полноценный постер."
  },
  {
    id: "saas-dashboard",
    title: "UI-концепт SaaS-дашборда",
    descriptor: "Сдержанный интерфейс с ясной визуальной иерархией.",
    year: "2024",
    category: "UI/UX",
    role: "Интерфейсная концепция, визуальная система, прототип",
    technologies: ["Figma", "React", "Design Systems"],
    liveUrl: "https://github.com",
    accent: "#55d6ff",
    image: "/projects/saas.svg",
    gallery: ["/projects/saas.svg", "/projects/studio.svg", "/projects/commerce.svg"],
    summary:
      "Концепт интерфейса, где графическая дисциплина помогает данным читаться быстрее: спокойная сетка, понятные акценты и компоненты без визуальной тяжести. Веб-навык здесь используется для проверки логики и поведения."
  }
];

export const aboutContent = {
  kicker: "Обо мне",
  title: "Я Тимур - графический дизайнер и веб-разработчик",
  paragraphs: [
    "Мне 20 лет, живу в Казани. Работаю на стыке дизайна и разработки, создавая визуальные проекты, в которых важны не только внешний вид, но и сильная идея.",
    "Я умею брать ответственность за результат, быстро погружаться в новые задачи и находить решения там, где другие видят сложности. Люблю нестандартно мыслить, экспериментировать и искать свежий взгляд, но всегда довожу идеи до понятного и качественного результата.",
    "Для меня хороший проект - это сочетание сильной идеи, продуманного исполнения и смелых решений, которые остаются актуальными и спустя время."
  ],
  slides: [
    {
      src: "/aboutMe/1.png",
      alt: "Портрет Тимура"
    },
    {
      src: "/aboutMe/2.png",
      alt: "Тимур в рабочей визуальной среде"
    },
    {
      src: "/aboutMe/3.png",
      alt: "Тимур, фото для блока обо мне"
    }
  ]
};

export const designArchive = projects.map((project, index) => ({
  id: project.id,
  title: project.title,
  image: project.image,
  accent: project.accent,
  position: index
}));

export const socialLinks = [
  { label: "EMAIL", href: "mailto:bezborodnikovtimur@gmail.com" },
  { label: "VK", href: "https://vk.com/l1lines" },
  { label: "MAX", href: "https://max.ru/u/f9LHodD0cOIh49rvqQYNbhq-jsi0h2Oo_V_FmVt5ZW4K7YYxenIVBbO0b3k" },
  { label: "TELEGRAM", href: "https://t.me/lnsnostylist" },
  { label: "INSTAGRAM", href: "https://www.instagram.com/lnsnostylist" },
  { label: "PINTEREST", href: "https://ru.pinterest.com/lnsnostylist/" },
  { label: "BEHANCE", href: "https://www.behance.net/lnsnostylist" },
  { label: "GITHUB", href: "https://github.com/lnnsss" }
];
