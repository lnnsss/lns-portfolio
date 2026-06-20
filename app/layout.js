import "./globals.css";

const siteTitle = "lns portfolio";
const siteDescription =
  "Портфолио lnsnostylist: графический дизайнер, айдентика, визуальные системы, постеры, обложки, дизайн для соцсетей и аккуратная веб-разработка для презентации проектов.";
const siteUrl = "https://lnsnostylist.ru";
const previewImage = "/preview.jpg";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s"
  },
  applicationName: siteTitle,
  description: siteDescription,
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  appleWebApp: {
    capable: true,
    title: siteTitle,
    statusBarStyle: "black-translucent"
  },
  abstract:
    "Авторское портфолио графического дизайнера: айдентика, постеры, обложки, визуальные системы, дизайн для соцсетей и веб-презентации.",
  keywords: [
    "lns portfolio",
    "lnsnostylist",
    "графический дизайнер",
    "графический дизайн",
    "портфолио графического дизайнера",
    "айдентика",
    "визуальная айдентика",
    "брендинг",
    "постеры",
    "дизайн постеров",
    "обложки",
    "дизайн обложек",
    "визуальные системы",
    "дизайн для соцсетей",
    "social media design",
    "портфолио дизайнера",
    "веб-дизайн",
    "портфолио-сайт",
    "креативный дизайнер"
  ],
  authors: [{ name: "lnsnostylist", url: siteUrl }],
  creator: "lnsnostylist",
  publisher: "lnsnostylist",
  category: "graphic design portfolio",
  alternates: {
    canonical: "/"
  },
  icons: {
    icon: [
      { url: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.svg"],
    other: [{ rel: "mask-icon", url: "/favicon.svg", color: "#050505" }]
  },
  manifest: "/site.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "/",
    siteName: siteTitle,
    locale: "ru_RU",
    type: "website",
    images: [
      {
        url: previewImage,
        width: 1200,
        height: 630,
        alt: "lns portfolio — графический дизайн, айдентика и визуальные системы"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [previewImage]
  },
  other: {
    "theme-color": "#050505",
    "color-scheme": "dark",
    "portfolio:type": "graphic design",
    "portfolio:focus": "айдентика, визуальные системы, постеры, обложки, дизайн для соцсетей, веб-презентации"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
