import "./globals.css";

const siteTitle = "lns portfolio";
const siteName = "lnsnostylist";
const personName = "Тимур Безбородников";
const siteDescription =
  "Портфолио lnsnostylist: графический дизайнер, айдентика, визуальные системы, постеры, обложки, дизайн для соцсетей и аккуратная веб-разработка для презентации проектов.";
const siteUrl = "https://lnsnostylist.ru";
const previewImage = "/preview.jpg";
const previewImageUrl = `${siteUrl}${previewImage}`;
const contactEmail = "bezborodnikovtimur@gmail.com";
const socialProfileUrls = [
  "https://vk.com/l1lines",
  "https://max.ru/u/f9LHodD0cOIh49rvqQYNbhq-jsi0h2Oo_V_FmVt5ZW4K7YYxenIVBbO0b3k",
  "https://t.me/lnsnostylist",
  "https://www.instagram.com/lnsnostylist",
  "https://ru.pinterest.com/lnsnostylist/",
  "https://www.behance.net/lnsnostylist",
  "https://github.com/lnnsss"
];

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s"
  },
  applicationName: siteTitle,
  appleWebApp: {
    capable: true,
    title: siteTitle,
    statusBarStyle: "black-translucent"
  },
  description: siteDescription,
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  manifest: "/site.webmanifest",
  formatDetection: {
    email: false,
    address: false,
    telephone: false
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
  authors: [{ name: personName, url: siteUrl }],
  creator: personName,
  publisher: siteName,
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
    title: `${siteName} — портфолио графического дизайнера`,
    description: siteDescription,
    url: "/",
    siteName,
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
    title: `${siteName} — портфолио графического дизайнера`,
    description: siteDescription,
    images: [previewImage]
  },
  other: {
    "portfolio:type": "graphic design",
    "portfolio:focus": "айдентика, визуальные системы, постеры, обложки, дизайн для соцсетей, веб-презентации"
  }
};

export const viewport = {
  themeColor: "#050505",
  colorScheme: "dark"
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: siteTitle,
      alternateName: siteName,
      inLanguage: "ru-RU",
      description: siteDescription,
      publisher: {
        "@id": `${siteUrl}/#person`
      }
    },
    {
      "@type": "ProfilePage",
      "@id": `${siteUrl}/#profile`,
      url: siteUrl,
      name: `${siteName} — портфолио графического дизайнера`,
      description: siteDescription,
      inLanguage: "ru-RU",
      isPartOf: {
        "@id": `${siteUrl}/#website`
      },
      primaryImageOfPage: {
        "@id": `${siteUrl}/#primaryimage`
      },
      about: {
        "@id": `${siteUrl}/#person`
      }
    },
    {
      "@type": "Person",
      "@id": `${siteUrl}/#person`,
      name: personName,
      alternateName: siteName,
      url: siteUrl,
      email: contactEmail,
      jobTitle: "Графический дизайнер и веб-разработчик",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Казань",
        addressCountry: "RU"
      },
      knowsAbout: [
        "графический дизайн",
        "айдентика",
        "брендинг",
        "постеры",
        "обложки",
        "визуальные системы",
        "дизайн для соцсетей",
        "веб-дизайн"
      ],
      sameAs: socialProfileUrls
    },
    {
      "@type": "ImageObject",
      "@id": `${siteUrl}/#primaryimage`,
      url: previewImageUrl,
      width: 1200,
      height: 630,
      caption: "lns portfolio — графический дизайн, айдентика и визуальные системы"
    },
    {
      "@type": "CreativeWork",
      "@id": `${siteUrl}/#portfolio`,
      name: "Портфолио графического дизайнера lnsnostylist",
      url: siteUrl,
      creator: {
        "@id": `${siteUrl}/#person`
      },
      image: previewImageUrl,
      inLanguage: "ru-RU",
      keywords: metadata.keywords.join(", "),
      description: siteDescription,
      genre: ["graphic design", "identity design", "web design", "portfolio"]
    }
  ]
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c")
          }}
        />
      </body>
    </html>
  );
}
